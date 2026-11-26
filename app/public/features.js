'use strict';
// Newer UI features: unsaved-changes indicator + pre-save summary, attaché case map (drag & drop),
// case size, weapon upgrades, slot copy. Shares globals with app.js (loaded after it).

// ---------------------------------------------------------------- unsaved changes
function updateDirty() {
  const el = $('#dirty'); if (el) el.hidden = !(data && data.dirty);
  const u = $('#bUndo'); if (u) u.disabled = !(data && data.undo);
  const b = $('#bGame'); if (b) { b.classList.toggle('pending', !!(data && data.dirty)); b.disabled = !(data && cur && data.dirty); b.title = b.disabled ? 'Nothing to save: no edits yet' : 'Write the edits to the game (a summary is shown first)'; } // "Save to game" asks for attention
  const r = $('#bRevert'); if (r) r.disabled = !(data && cur && data.dirty);
}
window.addEventListener('beforeunload', (e) => { if (data && data.dirty) { e.preventDefault(); e.returnValue = ''; } });

let diffTarget = null;
async function confirmSave(target) {
  try {
    const r = await api('diff', { name: cur });
    const box = $('#diffList'); box.innerHTML = '';
    if (!r.changes.length) box.innerHTML = '<div class="empty">' + (r.dirty ? 'There are edits in the "Advanced" tab; a detailed list is not built for them.' : 'No changes: the written file will be the same as the original.') + '</div>';
    for (const c of r.changes) { const d = document.createElement('div'); d.className = 'dchg'; d.innerHTML = ic(c.icon) + '<span>' + esc(c.text) + '</span>'; box.append(d); }
    // the game would delete items that overlap or stick out: say so at the top
    const bad = target === 'game' ? caseClashes() : [];
    if (bad.length) { const d = document.createElement('div'); d.className = 'dchg warn'; d.innerHTML = ic('close') + '<span><b>The game will delete:</b> ' + esc([...new Set(bad.map((i) => itemName(i) || 'item #' + i.itemId.value))].join(', ')) + ' (they overlap or stick out of the case). Close this and press "Sort the case" first to keep them.</span>'; box.prepend(d); }
    $('#diffNote').textContent = target === 'game' ? 'The original is copied to backup/auto/ before writing.' : 'The file will be saved to the output/ folder; the game is not affected.';
    $('#diffGo').innerHTML = ic('save') + (target === 'game' ? 'Write to game' : 'Export');
    diffTarget = target; $('#diffModal').classList.add('on');
  } catch (e) { toast(e.message, 'err'); }
}
$('#diffClose').onclick = $('#diffCancel').onclick = () => $('#diffModal').classList.remove('on');
$('#diffModal').onclick = (e) => { if (e.target.id === 'diffModal') $('#diffModal').classList.remove('on'); };
$('#diffGo').onclick = () => { $('#diffModal').classList.remove('on'); save(diffTarget); };
$('#bOut').onclick = () => confirmSave('output');
$('#bGame').onclick = () => confirmSave('game');

// ---------------------------------------------------------------- case size + view toggle
function renderCaseBar(root, inv) {
  const cb = document.createElement('div'); cb.className = 'toolbar';
  const lab = document.createElement('span'); lab.className = 'dim'; lab.innerHTML = ic('case') + 'Case size';
  const sel = document.createElement('select');
  sel.innerHTML = inv.sizes.map((s) => `<option value="${s.level}">${s.w}×${s.h} cells${s.level === 0 ? ' (starting)' : ''}</option>`).join('');
  sel.value = inv.size.value;
  sel.onchange = async () => {
    try { const r = await api('case-size', { name: cur, level: sel.value }); applyFresh(r); render(); toast('Case size changed', 'ok'); }
    catch (e) { toast(e.message, 'err'); sel.value = inv.size.value; }
  };
  const seg = document.createElement('span'); seg.className = 'seg';
  for (const [k, icon, t] of [['list', 'list', 'List'], ['3d', 'case', 'Case']]) {
    const b = document.createElement('button'); b.className = ui.view === k ? 'on' : ''; b.innerHTML = ic(icon) + t;
    b.onclick = () => { ui.view = k; render(); }; seg.append(b);
  }
  const skinLab = document.createElement('span'); skinLab.className = 'dim'; skinLab.style.marginLeft = '14px'; skinLab.textContent = 'Case look';
  const skinSel = document.createElement('select'); skinSel.title = 'The skin of your attaché case. A skin you do not own yet is unlocked (added to the recipes, cases and charms inventory).';
  skinSel.innerHTML = [[124176000, 'Silver'], [124177600, 'Black'], [124179200, 'Leather'], [124192000, 'Gold'], [124193600, 'Classic']].map(([id, n]) => `<option value="${id}">${n}</option>`).join('');
  skinSel.value = String((data.overview && data.overview.caseSkin) || 124176000);
  skinSel.onchange = async () => {
    try { const r = await api('case-skin', { name: cur, skin: skinSel.value }); applyFresh(r); setButtons(); render(); toast(r.added ? 'Case look changed (the skin was unlocked too)' : 'Case look changed', 'ok'); }
    catch (e) { toast(e.message, 'err'); skinSel.value = String((data.overview && data.overview.caseSkin) || 124176000); }
  };
  cb.append(lab, sel, skinLab, skinSel, Object.assign(document.createElement('span'), { className: 'sp' }), seg);
  root.append(cb);
  // quick actions on the whole case
  const quick = document.createElement('div'); quick.className = 'toolbar';
  const act = (icon, text, title, op, say) => {
    const b = document.createElement('button'); b.innerHTML = ic(icon) + text; b.title = title;
    b.onclick = async () => { try { const r = await api(op, { name: cur }); applyFresh(r); setButtons(); render(); toast(say(r), r.changed ? 'ok' : ''); } catch (e) { toast(e.message, 'err'); } };
    quick.append(b);
  };
  act('tools', 'Repair knives', 'Full durability for the knives in the case', 'repair-knives', (r) => (r.changed ? 'Knives repaired: ' + r.changed : 'No knife needs repair') + (r.unknown ? '\nLeft as they are (full durability not known): ' + r.unknown : ''));
  act('tools', 'Upgrade all weapons', 'Every normal upgrade of every weapon in the case to the maximum (4); the exclusive upgrades are not touched', 'upgrade-weapons', (r) => (r.changed ? 'Weapons fully upgraded: ' + r.changed : 'Every weapon is already fully upgraded'));
  act('plus', 'Fill ammo stacks', 'Fill the ammunition and gunpowder stacks of the case to their full size', 'fill-stacks', (r) => (r.changed ? 'Stacks filled: ' + r.changed : 'Nothing to fill'));
  root.append(quick);
}

// ---------------------------------------------------------------- weapon upgrades (inline row)
function upgRow(inv, it) {
  const tr = document.createElement('tr'); tr.className = 'upg';
  const td = document.createElement('td'); td.colSpan = 6;
  const g = document.createElement('div'); g.className = 'ugrid';
  for (const u of it.upg) {
    const l = document.createElement('div'); l.className = 'upgl'; l.append(Object.assign(document.createElement('span'), { textContent: u.label }));
    const steps = document.createElement('span'); steps.className = 'pips'; const now = Number(u.level.value), max = u.max || 4;
    const set = async (level) => {
      try {
        const r = await api('upgrade', { name: cur, inv: inv.index, idx: it.idx, key: u.key, level }); applyFresh(r); render();
        if (r.exclReset) toast('The exclusive upgrade was taken away: it needs every upgrade at the maximum.', '');
      } catch (e) { toast(e.message, 'err'); }
    };
    if (u.key === 'excl') {
      const b = document.createElement('button'); b.className = 'sm' + (now ? ' on' : ''); b.textContent = now ? 'Bought' : 'Not bought'; b.title = 'Click to switch. It needs every other upgrade at the maximum.';
      b.onclick = () => set(now ? 0 : 1); steps.append(b);
    } else {
      for (let v = 1; v <= max; v++) { const p = document.createElement('button'); p.className = 'pip' + (v <= now ? ' on' : ''); p.title = 'Level ' + v + ' (click again to go to ' + (v - 1) + ')'; p.onclick = () => set(v === now ? v - 1 : v); steps.append(p); }
      steps.append(Object.assign(document.createElement('span'), { className: 'mono dim', textContent: ' ' + now + '/' + max }));
    }
    l.append(steps); g.append(l);
  }
  const bar = document.createElement('div'); bar.className = 'toolbar'; bar.style.margin = '8px 0 0';
  const full = document.createElement('button'); full.className = 'sm'; full.innerHTML = ic('tools') + 'Full upgrade'; full.title = 'Every normal upgrade of this weapon to the maximum (4); the exclusive upgrade is not touched';
  full.onclick = () => structural('upgrade-all', { inv: inv.index, idx: it.idx, level: 4 }, 'Weapon fully upgraded');
  const reset = document.createElement('button'); reset.className = 'sm ghost'; reset.textContent = 'Reset upgrades'; reset.title = 'Every upgrade back to zero, including the exclusive one';
  reset.onclick = () => structural('upgrade-all', { inv: inv.index, idx: it.idx, level: 0 }, 'Upgrades reset');
  bar.append(full, reset);
  const n = document.createElement('div'); n.className = 'note'; n.textContent = 'Click a step to set the level (4 = fully upgraded, as in real saves; the game resets higher values); click the highest lit step again to go one lower. The exclusive upgrade needs every other upgrade at 4, so lowering one removes it. Some weapons have fewer upgrades.';
  td.append(g, bar, n); tr.append(td); return tr;
}

// ---------------------------------------------------------------- copy slot
$('#bCopy').onclick = async () => {
  $('#copyFor').textContent = 'Source: ' + slotTitle(cur) + ' (' + cur + ')';
  const list = $('#copyList'); list.innerHTML = '<div class="empty">Loading…</div>'; $('#copyModal').classList.add('on');
  try {
    const r = await api('copy-targets', { name: cur });
    list.innerHTML = '';
    if (!r.targets.length) list.innerHTML = '<div class="empty">There are no other slots of this kind.</div>';
    for (const t of r.targets) {
      const d = document.createElement('div'); d.className = 'pick';
      const s = summaries[t.name];
      d.innerHTML = '<span>' + esc(slotTitle(t.name)) + '<br><span class="dim" style="font-size:12px">' + (s ? hours(s.playTime) + ' · ' + fmt(s.ptas) + ' PTAS · ' : '') + new Date(t.mtime).toLocaleString('en-US') + '</span></span>';
      const b = document.createElement('button'); b.className = 'sm'; b.innerHTML = ic('copy') + 'Replace with this';
      b.onclick = async () => { if (await sure('Replace ' + slotTitle(t.name) + '?', 'Replace ' + slotTitle(t.name) + ' with a copy of ' + slotTitle(cur) + '? The current version of ' + slotTitle(t.name) + ' is saved to backup/auto/ first.', 'Replace ' + slotTitle(t.name), { danger: true })) doCopy(t.name); };
      d.append(b); list.append(d);
    }
  } catch (e) { list.innerHTML = '<div class="empty">' + esc(e.message) + '</div>'; }
};
async function doCopy(to, force) {
  try {
    toast('Copying…');
    const r = await api('copy-slot', { name: cur, to, force });
    if (r.running) { if (await sure('The game is running', RUNNING, 'Replace anyway')) return doCopy(to, true); return; }
    $('#copyModal').classList.remove('on');
    delete summaries[to];
    toast('Slot copied.\nThe previous version was saved to: ' + r.backup, 'ok');
    await loadFiles(); loadSummaries();
  } catch (e) { toast(e.message, 'err'); }
}
$('#copyClose').onclick = () => $('#copyModal').classList.remove('on');
$('#copyModal').onclick = (e) => { if (e.target.id === 'copyModal') $('#copyModal').classList.remove('on'); };

// ---------------------------------------------------------------- "game is running" banner
let gameWasRunning = false;
async function pollGame() {
  try {
    const r = await api('status');
    const el = $('#gameBanner');
    if (r.gameRunning) {
      el.innerHTML = ic('close') + 'The game is running (re4.exe). <span>Close it before writing to the game, restoring or copying a slot. If the game saved a slot since it was started, it shows "incompatible save data" for that slot after the editor changes it, until the game is restarted (the slot itself is fine). The game or Steam may also overwrite your changes later.</span>';
      el.hidden = false;
    } else el.hidden = true;
    gameWasRunning = r.gameRunning;
  } catch { /* server is not reachable or has no save folder: keep the previous state */ }
}
// the file of the open slot was changed on disk (the game saved, Steam Cloud, another tool) after it was opened here
async function pollFile() {
  const el = $('#fileBanner');
  if (!cur || !data || !data.isSlot) { el.hidden = true; return; }
  try {
    const r = await api('changed', { name: cur });
    if (!r.changed || ui.ignoreStamp === r.stamp) { el.hidden = true; return; }
    el.innerHTML = ic('restore') + '<span>This slot was changed outside the editor (the game saved it?). What you see here may be out of date' + (r.dirty ? ', and writing now would overwrite that change' : '') + '.</span><span class="sp"></span>';
    const re = document.createElement('button'); re.className = 'pri sm'; re.textContent = 'Reload from disk';
    re.onclick = async () => {
      if (data && data.dirty && !(await sure('Reload from disk?', 'You have unsaved edits in this slot. Reloading drops them.', 'Reload', { danger: true }))) return;
      const keep = tab; await openFile(cur); if (data && data.isSlot) { tab = keep; render(); }
      el.hidden = true;
    };
    const keepB = document.createElement('button'); keepB.className = 'sm'; keepB.textContent = 'Keep my copy';
    keepB.onclick = () => { ui.ignoreStamp = r.stamp; el.hidden = true; };
    el.append(re, keepB); el.hidden = false;
  } catch { /* server not reachable: keep the previous state */ }
}
new EventSource('/api/live'); // tells the server that a window is open; it stops by itself when the last one is closed
pollGame(); setInterval(pollGame, 4000); pollFile(); setInterval(pollFile, 4000);
