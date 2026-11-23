'use strict';
// Newer UI features: unsaved-changes indicator + pre-save summary, attaché case map (drag & drop),
// case size, weapon upgrades, slot copy. Shares globals with app.js (loaded after it).

// ---------------------------------------------------------------- unsaved changes
function updateDirty() { const el = $('#dirty'); if (el) el.hidden = !(data && data.dirty); }
window.addEventListener('beforeunload', (e) => { if (data && data.dirty) { e.preventDefault(); e.returnValue = ''; } });

let diffTarget = null;
async function confirmSave(target) {
  try {
    const r = await api('diff', { name: cur });
    const box = $('#diffList'); box.innerHTML = '';
    if (!r.changes.length) box.innerHTML = '<div class="empty">' + (r.dirty ? 'There are edits in the "Advanced" tab; a detailed list is not built for them.' : 'No changes: the written file will be the same as the original.') + '</div>';
    for (const c of r.changes) { const d = document.createElement('div'); d.className = 'dchg'; d.innerHTML = ic(c.icon) + '<span>' + esc(c.text) + '</span>'; box.append(d); }
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
  for (const [k, icon, t] of [['list', 'list', 'List'], ['map', 'grid', 'Map'], ['3d', 'case', '3D']]) {
    const b = document.createElement('button'); b.className = ui.view === k ? 'on' : ''; b.innerHTML = ic(icon) + t;
    b.onclick = () => { ui.view = k; render(); }; seg.append(b);
  }
  cb.append(lab, sel, Object.assign(document.createElement('span'), { className: 'sp' }), seg);
  root.append(cb);
}

// ---------------------------------------------------------------- weapon upgrades (inline row)
function upgRow(inv, it) {
  const tr = document.createElement('tr'); tr.className = 'upg';
  const td = document.createElement('td'); td.colSpan = 6;
  const g = document.createElement('div'); g.className = 'ugrid';
  for (const u of it.upg) {
    const l = document.createElement('label'); l.append(document.createTextNode(u.label));
    const i = document.createElement('input'); i.type = 'number'; i.min = 0; i.max = 7; i.className = 'mono'; i.value = u.level.value;
    i.onchange = async () => {
      try { const r = await api('upgrade', { name: cur, inv: inv.index, idx: it.idx, key: u.key, level: i.value }); applyFresh(r); render(); }
      catch (e) { toast(e.message, 'err'); i.value = u.level.value; }
    };
    l.append(i); g.append(l);
  }
  const n = document.createElement('div'); n.className = 'note'; n.textContent = 'Levels 0-7. The maximum depends on the weapon: going above the limit may make the game behave unpredictably. Exclusive upgrades are not affected.';
  td.append(g, n); tr.append(td); return tr;
}

// ---------------------------------------------------------------- attaché case map
const CELL = 42;
const ovl = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
function drawMap(holder, inv) {
  holder.innerHTML = '';
  const [W, H] = inv.grid;
  const card = document.createElement('div'); card.className = 'card';
  const box = document.createElement('div'); box.className = 'cmap';
  box.style.cssText = `width:${W * CELL}px;height:${H * CELL}px;--cell:${CELL}px`;
  const ghost = document.createElement('div'); ghost.className = 'ghost'; ghost.hidden = true; box.append(ghost);
  const fits = (it, x, y, fp) => x >= 0 && y >= 0 && x + fp[0] <= W && y + fp[1] <= H &&
    !inv.items.some((o) => o !== it && o.slot && ovl({ x, y, w: fp[0], h: fp[1] }, { x: o.slot.x, y: o.slot.y, w: o.fp[0], h: o.fp[1] }));

  for (const it of inv.items) {
    if (!it.slot) continue;
    const el = document.createElement('div');
    el.className = 'mi c-' + (it.cat || 'other') + (ui.sel === it.idx ? ' sel' : '');
    el.style.cssText = `left:${it.slot.x * CELL}px;top:${it.slot.y * CELL}px;width:${it.fp[0] * CELL}px;height:${it.fp[1] * CELL}px`;
    const nm = itemName(it) || '#' + it.itemId.value;
    el.title = `${nm}\nID ${it.itemId.value}\ncell ${it.slot.x},${it.slot.y} · ${it.fp[0]}×${it.fp[1]} (estimate)`;
    el.innerHTML = ic(it.cat || 'box') + (it.fp[0] * it.fp[1] > 1 ? '<span class="nm">' + esc(nm) + '</span>' : '') + (it.count && Number(it.count.value) > 1 ? '<span class="cn">' + it.count.value + '</span>' : '');
    el.onpointerdown = (e) => {
      e.preventDefault(); el.setPointerCapture(e.pointerId);
      const sx = e.clientX, sy = e.clientY; let moved = false;
      const target = (ev) => [Math.round(it.slot.x + (ev.clientX - sx) / CELL), Math.round(it.slot.y + (ev.clientY - sy) / CELL)];
      el.onpointermove = (ev) => {
        const dx = ev.clientX - sx, dy = ev.clientY - sy;
        if (!moved && Math.hypot(dx, dy) < 5) return;
        moved = true; el.classList.add('drag'); el.style.transform = `translate(${dx}px,${dy}px)`;
        const [gx, gy] = target(ev);
        ghost.hidden = false; ghost.className = 'ghost ' + (fits(it, gx, gy, it.fp) ? 'ok' : 'bad');
        ghost.style.cssText = `left:${gx * CELL}px;top:${gy * CELL}px;width:${it.fp[0] * CELL}px;height:${it.fp[1] * CELL}px`;
      };
      el.onpointerup = async (ev) => {
        el.onpointermove = null; el.onpointerup = null; el.classList.remove('drag'); el.style.transform = ''; ghost.hidden = true;
        if (!moved) { ui.sel = it.idx; drawMap(holder, inv); return; }
        const [gx, gy] = target(ev);
        if (gx === it.slot.x && gy === it.slot.y) return;
        if (!fits(it, gx, gy, it.fp)) { toast('The item does not fit here or overlaps another one (sizes are estimates)', 'err'); return; }
        ui.sel = it.idx;
        await structural('move', { inv: inv.index, idx: it.idx, x: gx, y: gy }, 'Item moved');
      };
    };
    box.append(el);
  }
  card.append(box);

  const sel = inv.items.find((i) => i.idx === ui.sel && i.slot);
  const bar = document.createElement('div'); bar.className = 'selbar';
  if (sel) {
    const nm = itemName(sel) || 'Item #' + sel.itemId.value;
    const info = document.createElement('div');
    info.innerHTML = `<div class="iname">${esc(nm)}</div><div class="dim mono" style="font-size:11px">ID ${sel.itemId.value} · cell ${sel.slot.x},${sel.slot.y} · ${sel.fp[0]}×${sel.fp[1]} (estimate)</div>`;
    bar.append(info);
    if (sel.count) { const l = document.createElement('label'); l.className = 'f'; l.style.width = '110px'; l.innerHTML = '<span>Count</span>'; l.append(field(sel.count, { width: '100%' })); bar.append(l); }
    const rot = document.createElement('button'); rot.className = 'sm'; rot.innerHTML = ic('rotate') + 'Rotate';
    rot.onclick = () => {
      const nd = sel.dir % 2 === 1 ? 0 : 1; const nfp = [sel.fp[1], sel.fp[0]];
      if (!fits(sel, sel.slot.x, sel.slot.y, nfp)) { toast('The rotated item does not fit here', 'err'); return; }
      structural('move', { inv: inv.index, idx: sel.idx, x: sel.slot.x, y: sel.slot.y, dir: nd }, 'Item rotated');
    };
    const dup = document.createElement('button'); dup.className = 'sm'; dup.innerHTML = ic('copy') + 'Copy';
    dup.onclick = () => structural('dup', { inv: inv.index, idx: sel.idx }, 'Copy created');
    const del = document.createElement('button'); del.className = 'sm danger'; del.innerHTML = ic('trash') + 'Delete';
    del.onclick = () => { if (confirm('Delete "' + nm + '" from the case?')) { ui.sel = null; structural('remove', { inv: inv.index, idx: sel.idx }, 'Removed'); } };
    bar.append(Object.assign(document.createElement('span'), { className: 'sp' }), rot, dup, del);
  } else {
    bar.innerHTML = '<span class="dim">Click an item to select it; drag it to move it. Green outline: can be placed; red: cannot.</span>';
  }
  card.append(bar);
  holder.append(card);
  const note = document.createElement('p'); note.className = 'note';
  note.textContent = 'Item sizes on the map are estimates: they are inferred from item positions in saves and may differ from the real ones. If items overlap in game, move them there.';
  holder.append(note);
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
      b.onclick = () => { if (confirm('Replace ' + slotTitle(t.name) + ' with a copy of ' + slotTitle(cur) + '?\nThe current version of ' + slotTitle(t.name) + ' will be saved to backup/auto/.')) doCopy(t.name); };
      d.append(b); list.append(d);
    }
  } catch (e) { list.innerHTML = '<div class="empty">' + esc(e.message) + '</div>'; }
};
async function doCopy(to, force) {
  try {
    toast('Copying…');
    const r = await api('copy-slot', { name: cur, to, force });
    if (r.running) { if (confirm('The game (re4.exe) is running. Replace the file anyway?')) return doCopy(to, true); return; }
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
      el.innerHTML = ic('close') + 'The game is running (re4.exe). <span>Close it before writing to the game, restoring or copying a slot: otherwise the game or Steam may overwrite your changes.</span>';
      el.hidden = false;
    } else el.hidden = true;
    gameWasRunning = r.gameRunning;
  } catch { /* server is not reachable or has no save folder: keep the previous state */ }
}
pollGame(); setInterval(pollGame, 4000);
