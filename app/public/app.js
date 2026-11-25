'use strict';
const $ = (s, r = document) => r.querySelector(s);
const view = $('#view');
let cfg = null, cur = null, data = null, tab = 'money';
const ui = { inv: 0, q: '', cat: 'all', sort: 'game', dir: 1, view: 'list', sel: null, upg: {} };
const DIRTY_ROUTES = new Set(['set', 'add', 'remove', 'dup', 'move', 'sort', 'case-skin', 'case-size', 'upgrade', 'upgrade-all', 'add-weapon', 'quest-complete']);
const LS = 'RE4_item_names';
const userNames = (() => { try { return JSON.parse(localStorage.getItem(LS) || '{}'); } catch { return {}; } })();
const summaries = {};

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const fmt = (n) => Number(n).toLocaleString('en-US');
const fmtSize = (n) => { n = Number(n) || 0; return n < 1024 ? n + ' B' : n < 1048576 ? (n / 1024).toFixed(1) + ' KB' : (n / 1048576).toFixed(2) + ' MB'; };
async function api(path, body) {
  const r = await fetch('/api/' + path, body === undefined ? {} : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const j = await r.json();
  if (j.error) throw new Error(j.error);
  if (DIRTY_ROUTES.has(path) && data) { data.dirty = true; updateDirty(); }
  if (j.undo !== undefined && data) { data.undo = j.undo; updateDirty(); }
  return j;
}
let tt;
function toast(msg, kind) {
  const t = $('#toast'); t.textContent = msg; t.className = (kind || '') + ' show';
  clearTimeout(tt); tt = setTimeout(() => t.classList.remove('show'), kind === 'err' ? 9000 : 4500);
}
const hours = (us) => { const s = Math.floor(Number(us) / 1e6); return `${Math.floor(s / 3600)} h ${Math.floor(s / 60) % 60} min`; };
const slotTitle = (n) => { const m = /^data(\d+)Slot\.bin$/.exec(n); return m ? 'Slot ' + m[1] : n === 'data00-1.bin' ? 'Game settings' : n === 'data000.bin' ? 'Profile (service)' : n; };
const INV_TITLES = ['Case (weapons, ammo, healing)', 'Recipes, cases, charms', 'Key items', 'Treasures'];
const itemName = (it) => userNames[it.itemId.value] || it.name;
const catName = (c) => (c && cfg.categories[c]) || 'Other';

function setButtons() { const on = !!(data && cur); for (const id of ['bRevert', 'bRestore', 'bOut', 'bGame']) $('#' + id).disabled = !on;
  $('#bCopy').disabled = !(on && /^data\d{3}Slot\.bin$/.test(cur)); updateDirty(); }
// ---- undo (button and Ctrl+Z); a text field keeps its own Ctrl+Z
let undoBusy = false;
async function undo() {
  if (undoBusy || !data || !cur || !data.undo) return;
  undoBusy = true;
  try { const r = await api('undo', { name: cur }); applyFresh(r); ui.sel = null; setButtons(); render(); toast(r.nothing ? 'Nothing to undo' : 'Last change taken back' + (r.undo ? ' (' + r.undo + ' more)' : ''), 'ok'); }
  catch (e) { toast(e.message, 'err'); } finally { undoBusy = false; }
}
const typing = (e) => /^(INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName) || e.target.isContentEditable;
const dialogOpen = () => !!document.querySelector('.modal.on');
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.code === 'KeyZ' && !typing(e) && !dialogOpen()) { e.preventDefault(); undo(); }
});
$('#bUndo').onclick = undo;

// ---------------------------------------------------------------- files / slots
async function loadFiles() {
  cfg = await api('config');
  if (cfg.noSaveDir) { $('#slot').disabled = true; return; }
  const sel = $('#slot'); sel.innerHTML = '<option value="">— choose a slot —</option>';
  const slots = cfg.files.filter((f) => /Slot\.bin$/.test(f.name)), tech = cfg.files.filter((f) => !/Slot\.bin$/.test(f.name));
  const og = (label, files) => {
    const g = document.createElement('optgroup'); g.label = label;
    for (const f of files) { const o = document.createElement('option'); o.value = f.name; o.textContent = optLabel(f); g.append(o); }
    sel.append(g);
  };
  og('Saves', slots); og('Technical files', tech);
  sel.value = cur || '';
}
function optLabel(f) {
  const s = summaries[f.name];
  if (!s) return slotTitle(f.name);
  const si = s.slotInfo, diff = s.difficultyName || (si && si.difficultyText);
  const saves = si && si.saves != null ? si.saves : s.saveCount;
  return [slotTitle(f.name), diff, si && si.chapter ? 'Ch. ' + si.chapter : null, si && si.playthrough > 1 ? 'New Game+' : null, saves != null ? saves + ' saves' : null, hours(s.playTime), fmt(s.ptas) + ' PTAS'].filter(Boolean).join(' · ');
}
async function loadSummaries() {
  for (const f of cfg.files.filter((x) => /Slot\.bin$/.test(x.name))) {
    try { summaries[f.name] = await api('summary', { name: f.name }); } catch { /* ignore */ }
    const o = [...$('#slot').options].find((x) => x.value === f.name); if (o) o.textContent = optLabel(f);
  }
}
$('#slot').onchange = (e) => { if (e.target.value) openFile(e.target.value); };
async function openFile(name) {
  view.innerHTML = '<div class="loading"><div class="spin"></div>Decrypting…<div class="skel"></div><div class="skel"></div></div>';
  try {
    data = await api('open', { name }); cur = name; showWarnings(data.warnings); tab = data.isSlot ? 'money' : 'tree'; ui.inv = 0; ui.q = ''; ui.cat = 'all'; treeState.id = null; treeState.q = '';
    $('#slot').value = name; setButtons(); render();
  } catch (e) { toast(e.message, 'err'); view.innerHTML = '<div class="empty">Error: ' + esc(e.message) + '</div>'; }
}
function applyFresh(r) { Object.assign(data, r); treeState.id = null; updateDirty(); }

// ---------------------------------------------------------------- generic numeric field
function field(sc, opts = {}) {
  const i = document.createElement('input');
  i.className = 'mono' + (opts.big ? ' big' : ''); i.value = sc.value;
  if (!sc.editable) i.disabled = true;
  if (opts.width) i.style.width = opts.width;
  i.onchange = async () => {
    try {
      const r = await api('set', { name: cur, id: sc.id, value: i.value });
      const old = sc.value; sc.value = r.value; i.value = r.value; if (opts.big) fx.countTo(i, old, r.value); i.classList.add('ok'); setTimeout(() => i.classList.remove('ok'), 900);
      if (opts.after) opts.after(r.value);
    } catch (e) { toast(e.message, 'err'); i.value = sc.value; i.classList.add('bad'); setTimeout(() => i.classList.remove('bad'), 1200); }
  };
  return i;
}

function render() {
  if (!data) return;
  view.innerHTML = '';
  const list = data.isSlot ? [['money', 'Money'], ['inv', 'Inventory'], ...(data.quests && data.quests.length ? [['quests', 'Merchant requests']] : []), ...(data.treasures ? [['treasures', 'Treasures']] : []), ...(data.isSlot ? [['achievements', 'Achievements']] : []), ['tree', 'Advanced']] : [['tree', 'File data']];
  const tabs = document.createElement('div'); tabs.className = 'tabs';
  for (const [k, t] of list) {
    const b = document.createElement('button'); b.className = 'tab' + (tab === k ? ' on' : ''); b.innerHTML = ic(TAB_ICON[k]) + '<span>' + esc(t) + '</span>';
    b.onclick = () => { tab = k; render(); }; tabs.append(b);
  }
  view.append(tabs);
  const body = document.createElement('div'); view.append(body);
  fx.view(body, [cur, tab, tab === 'inv' ? ui.inv + ui.view : ''].join('|'));
  if (tab === 'money') renderMoney(body); else if (tab === 'inv') renderInventory(body); else if (tab === 'quests') renderQuests(body); else if (tab === 'treasures') renderTreasures(body); else if (tab === 'achievements') renderAchievements(body); else if (!cfg.advancedAccepted) renderAdvancedGate(body); else renderTree(body);
}

// ---------------------------------------------------------------- money
function renderMoney(root) {
  const o = data.overview;
  const card = document.createElement('div'); card.className = 'card';
  card.innerHTML = '<h3>' + ic('coin') + 'Money</h3>';
  const grid = document.createElement('div'); grid.className = 'grid';
  const money = (title, sc, steps) => {
    const l = document.createElement('label'); l.className = 'f'; l.innerHTML = `<span>${ic(title.startsWith('Pesetas') ? 'coin' : 'gem')}${title}</span>`;
    if (!sc) { l.append(Object.assign(document.createElement('input'), { disabled: true, value: '—' })); return l; }
    const inp = field(sc, { big: true }); l.append(inp);
    const q = document.createElement('div'); q.className = 'quick';
    for (const n of steps) {
      const b = document.createElement('button'); b.className = 'sm'; b.type = 'button'; b.textContent = '+' + fmt(n);
      b.onclick = (e) => { e.preventDefault(); inp.value = Number(sc.value) + n; inp.dispatchEvent(new Event('change')); };
      q.append(b);
    }
    l.append(q); return l;
  };
  grid.append(money('Pesetas (PTAS)', o.ptas, [10000, 100000, 1000000]), money('Spinel', o.spinel, [5, 10, 50]));
  card.append(grid);
  const hint = document.createElement('p'); hint.className = 'note';
  hint.textContent = 'Type a number and press Enter or click outside the field: the value changes immediately in the editable copy. To get it into the game, press "Save to game".';
  card.append(hint); root.append(card);
  const info = document.createElement('div'); info.className = 'card';
  const si = o.slotInfo;
  const diffName = o.difficultyName || (si && si.difficultyText) || (o.difficulty ? 'code ' + o.difficulty.value : '—');
  info.innerHTML = `<h3>${ic('file')}About this save</h3><div class="dim">${slotTitle(data.name)} · ${esc(diffName)}${si && si.chapter ? ' · Chapter ' + si.chapter : ''} · play time ${o.playTime ? hours(o.playTime.value) : '—'} · saves: ${si && si.saves != null ? si.saves : (o.saveCount ? o.saveCount.value : '—')}</div>` +
    (si && (si.zone || si.goal) ? `<div class="dim" style="margin-top:6px">As the game shows it: ${esc([si.zone, si.goal].filter(Boolean).join(' · '))}</div>` : '');
  root.append(info);
}

// ---------------------------------------------------------------- inventory
function invTitle(i) { return INV_TITLES[i] || 'Inventory #' + i; }
function renderInventory(root) {
  const invs = data.inventories;
  const visible = invs.filter((v) => v.items.length || v.index < 4);
  if (!visible.find((v) => v.index === ui.inv)) ui.inv = visible[0] ? visible[0].index : 0;
  const inv = invs[ui.inv];

  const top = document.createElement('div'); top.className = 'toolbar';
  const chips = document.createElement('div'); chips.className = 'chips';
  for (const v of visible) {
    const b = document.createElement('button'); b.className = 'chip' + (v.index === ui.inv ? ' on' : ''); b.innerHTML = ic(INV_ICON[v.index] || 'case') + esc(invTitle(v.index)) + '<span class="dim" style="margin-left:5px">(' + v.items.length + ')</span>';
    b.onclick = () => { ui.inv = v.index; ui.cat = 'all'; render(); }; chips.append(b);
  }
  top.append(chips); root.append(top);
  if (inv.index === 0 && inv.sizes && inv.size) renderCaseBar(root, inv);
  const mapMode = ui.view === 'map' && inv.index === 0 && !!inv.grid;
  const view3 = ui.view === '3d' && inv.index === 0 && !!inv.grid;

  const bar = document.createElement('div'); bar.className = 'toolbar';
  const q = document.createElement('input'); q.placeholder = 'Search by name or ID'; q.value = ui.q;
  const cats = [...new Set(inv.items.map((i) => i.cat || 'other'))];
  const sel = document.createElement('select');
  sel.innerHTML = '<option value="all">All categories</option>' + cats.map((c) => `<option value="${c}">${esc(catName(c === 'other' ? null : c))}</option>`).join('');
  sel.value = cats.includes(ui.cat) ? ui.cat : 'all'; ui.cat = sel.value;
  const sortSel = document.createElement('select');
  sortSel.innerHTML = [['game', 'Game order'], ['name', 'By name'], ['cat', 'By category'], ['count', 'By count'], ['id', 'By ID']].map(([v, t]) => `<option value="${v}">${t}</option>`).join('');
  sortSel.value = ui.sort;
  const add = document.createElement('button'); add.className = 'pri'; add.innerHTML = ic('plus') + 'Add item'; add.onclick = openAdd;
  const addW = document.createElement('button'); addW.innerHTML = ic('plus') + 'Add weapon…'; addW.title = 'Add a new weapon, or copy one from your other slots'; addW.onclick = openWeapons;
  bar.append(q, sel, sortSel, Object.assign(document.createElement('span'), { className: 'sp' }), ...(inv.index === 0 ? [addW] : []), add);
  root.append(bar);

  const holder = document.createElement('div'); root.append(holder);
  bar.style.display = mapMode || view3 ? 'none' : '';
  const draw = () => (view3 ? drawCase3D(holder, inv) : mapMode ? drawMap(holder, inv) : drawItems(holder, inv));
  q.oninput = () => { ui.q = q.value; draw(); };
  sel.onchange = () => { ui.cat = sel.value; draw(); };
  sortSel.onchange = () => { ui.sort = sortSel.value; ui.dir = 1; draw(); };
  draw();
}
function sortedItems(items) {
  const ql = ui.q.trim().toLowerCase();
  let list = items.filter((it) => (ui.cat === 'all' || (it.cat || 'other') === ui.cat) &&
    (!ql || String(itemName(it) || '').toLowerCase().includes(ql) || String(it.itemId.value).includes(ql)));
  const key = { game: (a) => a.idx, name: (a) => String(itemName(a) || 'zzz' + a.itemId.value).toLowerCase(), cat: (a) => catName(a.cat) + '|' + String(itemName(a) || '').toLowerCase(),
    count: (a) => (a.count ? Number(a.count.value) : 0), id: (a) => Number(a.itemId.value) }[ui.sort];
  list = list.slice().sort((a, b) => { const x = key(a), y = key(b); return (x > y ? 1 : x < y ? -1 : 0) * ui.dir; });
  return list;
}
// picture of a list row: weapons have their own (the same as in the Case view), other things the category sign. All sit in a column of the same width.
function listIcon(it, name) {
  const art = it.cat === 'weapon' && name ? itemArt(name, 'weapon', [2, 1], it.itemId.value).svg : null;
  return '<span class="licon">' + (art ? '<span class="tile wtile c-weapon">' + art + '</span>' : '<span class="tile c-' + (it.cat || 'other') + '">' + ic(it.cat || 'box') + '</span>') + '</span>';
}
function drawItems(holder, inv) {
  holder.innerHTML = '';
  const list = sortedItems(inv.items);
  const card = document.createElement('div'); card.className = 'card'; card.style.padding = '4px 10px';
  const t = document.createElement('table');
  const th = (label, key, w) => `<th ${key ? `class="s" data-k="${key}"` : ''} style="${w ? 'width:' + w : ''}">${label}${ui.sort === key ? (ui.dir > 0 ? ' ▲' : ' ▼') : ''}</th>`;
  t.innerHTML = `<tr>${th('Item', 'name')}${th('Category', 'cat')}${th('Count', 'count', '110px')}<th class="hide-s" style="width:90px">Ammo</th><th class="hide-s" style="width:90px">Durability</th><th style="width:80px"></th></tr>`;
  t.querySelectorAll('th.s').forEach((h) => (h.onclick = () => { if (ui.sort === h.dataset.k) ui.dir = -ui.dir; else { ui.sort = h.dataset.k; ui.dir = 1; } render(); }));
  for (const it of list) {
    const tr = document.createElement('tr');
    const nm = itemName(it);
    const nameTd = document.createElement('td');
    nameTd.innerHTML = `<div class="irow">${listIcon(it, nm)}<div><div class="iname ${nm ? '' : 'u'}">${esc(nm || 'Item #' + it.itemId.value)}</div><div class="dim mono" style="font-size:11px">ID ${it.itemId.value}${it.slot ? ` · cell ${it.slot.x},${it.slot.y}` : ''}</div></div></div>`;
    nameTd.querySelector('.iname').style.cursor = 'pointer'; nameTd.querySelector('.iname').title = 'Click to label';
    nameTd.querySelector('.iname').onclick = () => {
      const v = prompt('Name for ID ' + it.itemId.value, nm || ''); if (v === null) return;
      if (v.trim()) userNames[it.itemId.value] = v.trim(); else delete userNames[it.itemId.value];
      try { localStorage.setItem(LS, JSON.stringify(userNames)); } catch { /* ignore */ } render();
    };
    tr.append(nameTd);
    const c = document.createElement('td'); c.innerHTML = `<span class="tag c-${it.cat || 'other'}">${ic(it.cat || 'box')}${esc(catName(it.cat))}</span>`; tr.append(c);
    const cell = (sc, cls) => { const td = document.createElement('td'); if (cls) td.className = cls; if (sc) td.append(field(sc, { width: '100%' })); else td.innerHTML = '<span class="dim">—</span>'; return td; };
    tr.append(cell(it.count), cell(it.ammo, 'hide-s'), cell(it.durability, 'hide-s'));
    const a = document.createElement('td'); a.className = 'acts';
    const dup = document.createElement('button'); dup.className = 'sm icon'; dup.innerHTML = ic('copy'); dup.title = 'Create a copy';
    dup.onclick = () => structural('dup', { inv: inv.index, idx: it.idx }, 'Copy created');
    const del = document.createElement('button'); del.className = 'sm icon danger'; del.innerHTML = ic('trash'); del.title = 'Delete';
    del.onclick = () => { if (confirm('Delete "' + (nm || 'item #' + it.itemId.value) + '" from the inventory?')) structural('remove', { inv: inv.index, idx: it.idx }, 'Removed'); };
    if (it.upg) {
      const ub = document.createElement('button'); ub.className = 'sm icon'; ub.title = 'Weapon upgrades'; ub.innerHTML = ic('tools');
      ub.onclick = () => { ui.upg[inv.index + ':' + it.idx] = !ui.upg[inv.index + ':' + it.idx]; render(); };
      a.append(ub, ' ');
    }
    a.append(dup, ' ', del); tr.append(a); t.append(tr);
    if (it.upg && ui.upg[inv.index + ':' + it.idx]) t.append(upgRow(inv, it));
  }
  card.append(t); holder.append(card);
  if (!list.length) holder.innerHTML = '<div class="empty">Nothing found</div>';
  const info = document.createElement('p'); info.className = 'note';
  info.textContent = inv.grid ? `Case size: ${inv.grid[0]}×${inv.grid[1]} cells (estimate). New items go to the first free spot that fits; if they end up overlapping others in game, move them there.` : '';
  holder.append(info);
}
async function structural(op, body, okMsg) {
  try {
    const r = await api(op, { name: cur, ...body });
    applyFresh(r); setButtons(); render();
    toast(okMsg + (r.warn ? '\nWarning: the free spot was found approximately - check the layout in game.' : ''), r.warn ? '' : 'ok');
  } catch (e) { toast(e.message, 'err'); }
}

// ---------------------------------------------------------------- merchant requests
function questState(q) {
  const done = q.subs.filter((s) => s.completed && Number(s.completed.value) === 1).length;
  return done === q.subs.length ? 'done' : done ? 'part' : 'todo';
}
function renderQuests(root) {
  const warn = document.createElement('div'); warn.className = 'card';
  warn.innerHTML = '<h3>' + ic('quest') + 'Merchant requests <span class="tag" style="margin-left:10px">experimental</span></h3><p class="note" style="margin:0">The "Complete" button marks the request goals (kill, find, event) as completed. You then get the reward (Spinel) from the Merchant in game as usual. Requests that need an item handed in are not completed by the editor: add the item to the case on the "Inventory" tab and hand it in yourself. How the game reacts to an early mark has not been verified, so try one request on a spare slot first. Request names are not stored in the file itself: the descriptions come from guides and are matched by number. Only requests with items are identified reliably; the others are marked "probably" or "not determined".</p>';
  root.append(warn);
  const bar = document.createElement('div'); bar.className = 'toolbar';
  const all = document.createElement('button'); all.className = 'pri'; all.innerHTML = ic('check') + 'Complete all (except item hand-ins)';
  all.onclick = () => { if (confirm('Mark the goals of all requests in this slot as completed?')) questDo('all'); };
  bar.append(all); root.append(bar);
  const card = document.createElement('div'); card.className = 'card'; card.style.padding = '4px 10px';
  const t = document.createElement('table');
  t.innerHTML = '<tr><th style="width:60px">#</th><th>Request</th><th style="width:120px">Status</th><th class="hide-s" style="width:70px">Tries</th><th style="width:110px"></th></tr>';
  const label = { done: 'Completed', part: 'Partial', todo: 'Not completed' };
  for (const q of data.quests) {
    const st = questState(q);
    const tr = document.createElement('tr');
    const goals = q.subs.map((s) => {
      const ok = s.completed && Number(s.completed.value) === 1;
      const nm = s.type === 'Item' ? 'Bring: ' + (s.itemName || '#' + s.item) + (s.num ? ' ×' + s.num : '') : s.type === 'Flag' ? 'Goal' : 'Event';
      return `<span class="tag ${ok ? 'st-done' : ''}" style="margin:0 4px 4px 0">${ic(ok ? 'check' : 'circle')}${esc(nm)}</span>`;
    }).join('');
    const doable = q.subs.some((s) => s.type !== 'Item' && s.completed && Number(s.completed.value) !== 1);
    const info = cfg.questInfo && cfg.questInfo[q.id];
    const conf = info ? ({ sure: '', likely: ' <span class="tag" title="The name is inferred from goal types and progress, not read from the file">probably</span>', unknown: ' <span class="tag" title="Several requests match">not determined</span>' }[info.c] || '') : '';
    const head = info ? `<div class="iname">${esc(info.n)}${conf}</div><div class="dim" style="font-size:12px;margin:2px 0 4px">${esc(info.d)}${info.r ? ' Reward: ' + info.r + ' Spinel.' : ''}</div>` : '<div class="iname u">Request without description</div>';
    tr.innerHTML = `<td class="mono">${q.id}</td><td>${head}${goals}</td><td><span class="tag ${st === 'done' ? 'st-done' : st === 'part' ? 'st-part' : ''}">${ic(st === 'done' ? 'check' : 'circle')}${label[st]}</span></td><td class="hide-s mono">${q.retry}</td>`;
    const td = document.createElement('td'); td.className = 'acts';
    const b = document.createElement('button'); b.className = 'sm'; b.innerHTML = ic('check') + 'Complete'; b.disabled = !doable;
    b.onclick = () => questDo(q.idx); td.append(b); tr.append(td); t.append(tr);
  }
  card.append(t); root.append(card);
}
async function questDo(idx) {
  try {
    const r = await api('quest-complete', { name: cur, idx });
    applyFresh(r); setButtons(); render();
    toast(r.changed ? 'Goals marked: ' + r.changed : 'Nothing to mark', r.changed ? 'ok' : '');
  } catch (e) { toast(e.message, 'err'); }
}

// ---------------------------------------------------------------- add dialog
const add = { cat: 'ammo', q: '', sel: null };
function openAdd() { $('#addModal').classList.add('on'); add.sel = null; drawAdd(); $('#addQ').focus(); }
$('#addClose').onclick = () => $('#addModal').classList.remove('on');
$('#addModal').onclick = (e) => { if (e.target.id === 'addModal') $('#addModal').classList.remove('on'); };
$('#addQ').oninput = (e) => { add.q = e.target.value; drawAdd(); };
function drawAdd() {
  const cats = Object.keys(cfg.categories).filter((c) => !['weapon', 'throw', 'money'].includes(c));
  const box = $('#addCats'); box.innerHTML = '';
  const all = document.createElement('button'); all.className = 'chip' + (add.cat === 'all' ? ' on' : ''); all.textContent = 'All'; all.onclick = () => { add.cat = 'all'; drawAdd(); }; box.append(all);
  for (const c of cats) { const b = document.createElement('button'); b.className = 'chip' + (add.cat === c ? ' on' : ''); b.innerHTML = ic(c) + esc(cfg.categories[c]); b.onclick = () => { add.cat = c; drawAdd(); }; box.append(b); }
  const ql = add.q.trim().toLowerCase();
  const rows = Object.entries(cfg.catalog).filter(([id, v]) => !['weapon', 'throw', 'money'].includes(v.c) && (ql || add.cat === 'all' || v.c === add.cat) &&
    (!ql || (userNames[id] || v.n).toLowerCase().includes(ql) || id.includes(ql))).sort((a, b) => a[1].n.localeCompare(b[1].n));
  const list = $('#addList'); list.innerHTML = '';
  for (const [id, v] of rows) {
    const d = document.createElement('div'); d.className = 'pick' + (add.sel === id ? ' on' : '');
    d.innerHTML = `<span class="irow"><span class="tile c-${v.c}">${ic(v.c)}</span><span>${esc(userNames[id] || v.n)}</span></span><span class="dim mono">${id}</span>`;
    d.onclick = () => { add.sel = id; drawAdd(); }; list.append(d);
  }
  if (!rows.length) list.innerHTML = '<div class="empty">Not in the catalog. Type the ID in the search box and press Enter.</div>';
  $('#addSel').textContent = add.sel ? `Selected: ${userNames[add.sel] || cfg.catalog[add.sel].n} (${add.sel})` : 'Nothing selected';
  $('#addGo').disabled = !add.sel;
}
$('#addQ').onkeydown = (e) => { if (e.key === 'Enter' && /^\d{6,}$/.test(e.target.value.trim())) { add.sel = e.target.value.trim(); if (!cfg.catalog[add.sel]) cfg.catalog[add.sel] = { n: 'Item #' + add.sel, c: 'ammo' }; $('#addSel').textContent = 'Selected: ID ' + add.sel; $('#addGo').disabled = false; } };
$('#addGo').onclick = async () => {
  if (!add.sel) return;
  const count = Number($('#addCount').value) || 1;
  $('#addModal').classList.remove('on');
  await structural('add', { itemId: add.sel, count }, 'Item added');
};

// ---------------------------------------------------------------- Advanced: one-time warning (remembered in config.json)
function renderAdvancedGate(root) {
  const card = document.createElement('div'); card.className = 'card'; card.style.borderLeft = '4px solid var(--danger)';
  card.innerHTML = '<h3 style="margin:0 0 8px">' + ic('tools') + ' Advanced: for experienced users only</h3>' +
    '<p style="margin:0 0 8px">This tab shows every field of the save file and lets you change raw numbers directly. The editor cannot check whether a value makes sense: a wrong value can <b>corrupt the slot so that the game fails to load it</b> or behaves in unexpected ways.</p>' +
    '<p class="note" style="margin:0 0 12px">Nothing is written to the game until you press <b>Save to game</b>, and a backup is made before every write, but keep your own copies of your saves too. This warning is shown only once.</p>' +
    '<label style="display:flex;gap:8px;align-items:flex-start;cursor:pointer;margin-bottom:12px"><input type="checkbox" id="advOk" style="width:auto;margin-top:3px"><span>I understand that editing raw fields can damage my save, and I accept this risk.</span></label>' +
    '<button class="pri" id="advGo" disabled>Continue to Advanced</button>';
  root.append(card);
  const ok = card.querySelector('#advOk'), go = card.querySelector('#advGo');
  ok.onchange = () => { go.disabled = !ok.checked; };
  go.onclick = async () => { try { await api('advanced-accept', {}); cfg.advancedAccepted = true; render(); } catch (e) { toast(e.message, 'err'); } };
}
// ---------------------------------------------------------------- add a weapon from another slot
const wpn = { list: [], sel: null };
const slotNo = (f) => { const m = /^data(\d+)Slot\.bin$/.exec(f); return m ? Number(m[1]) : 0; };
const isSW = (f) => slotNo(f) >= 100; // slots 100 and up are Separate Ways
async function openWeapons() {
  $('#wpnModal').classList.add('on'); wpn.sel = null; $('#wpnGo').disabled = true; $('#wpnSel').textContent = 'Nothing selected';
  $('#wpnList').innerHTML = '<div class="empty">Looking through your other slots…</div>';
  try { wpn.lib = (await api('weapon-library', { name: cur })).weapons; wpn.list = (await api('weapon-sources', { name: cur })).weapons; drawWeapons(); }
  catch (e) { $('#wpnList').innerHTML = '<div class="empty">' + esc(e.message) + '</div>'; }
}
const FIT_TEXT = { ok: 'fits', turn: 'fits turned', none: 'no room' };
// one line of the "Add weapon" list: picture, name, whether it fits the case now
function weaponRow(w, name, info) {
  const d = document.createElement('div'); d.className = 'pick wpick' + (wpn.sel === w ? ' on' : '') + (w.fit === 'none' ? ' full' : '');
  const art = w.cells ? itemArt(w.name, 'weapon', [Math.max(...w.cells), Math.min(...w.cells)], w.itemId).svg : null;
  d.innerHTML = '<span class="wpic">' + (art || '') + '</span><span class="wname">' + esc(name) + (w.note ? '<span class="wnote">' + esc(w.note) + '</span>' : '') + '</span>' +
    '<span class="wmeta"><b class="fit-' + w.fit + '">' + FIT_TEXT[w.fit] + ' · ' + esc(w.size) + '</b><span class="dim mono">' + esc(info) + '</span></span>';
  d.onclick = () => {
    if (w.fit === 'none') { toast('No free ' + w.size + ' space in the case for ' + name + '. Free up some room (or press Sort), or choose a bigger case size.', 'err'); return; }
    wpn.sel = w; $('#wpnSel').textContent = 'Selected: ' + name; $('#wpnGo').disabled = false; drawWeapons();
  };
  return d;
}
function drawWeapons() {
  const box = $('#wpnList'); box.innerHTML = '';
  const head = (t) => { const h = document.createElement('div'); h.className = 'dim'; h.style.cssText = 'margin:10px 2px 4px;font-weight:600'; h.textContent = t; box.append(h); };
  if ((wpn.lib || []).length) head('New weapons (no upgrades, empty magazine)');
  for (const w of wpn.lib || []) box.append(weaponRow(w, itemName({ itemId: { value: w.itemId }, name: w.name }) || w.name, 'ID ' + w.itemId));
  if (wpn.list.length) head('Copies from your other slots (with their upgrades)');
  const ABBR = { fire: 'Fire', ammo: 'Cap', reload: 'Rld', rapid: 'Rpd', dura: 'Dur' };
  for (const w of wpn.list) {
    const up = w.upg.filter((u) => u.key !== 'excl').map((u) => (ABBR[u.key] || u.key) + ' ' + u.level).join(' · ') + (w.upg.some((u) => u.key === 'excl' && u.level) ? ' + exclusive' : '');
    box.append(weaponRow(w, w.name || ('Weapon #' + w.itemId), slotTitle(w.slot) + ' · ' + up));
  }
  if (!wpn.list.length && !(wpn.lib || []).length) box.innerHTML = '<div class="empty">No weapons are available for this campaign.</div>';
}
$('#wpnClose').onclick = () => $('#wpnModal').classList.remove('on');
$('#wpnModal').onclick = (e) => { if (e.target.id === 'wpnModal') $('#wpnModal').classList.remove('on'); };
$('#wpnGo').onclick = async () => {
  const w = wpn.sel; if (!w) return;
  if (w.note && !confirm(w.name + '\n\n' + w.note + '\n\nAdd it anyway?')) return;
  $('#wpnModal').classList.remove('on');
  if (!w.slot) { await structural('add-weapon', { lib: w.itemId }, 'Weapon added (new, no upgrades; use Full upgrade if you want)'); return; }
  await structural('add-weapon', { from: w.slot, idx: w.idx }, 'Weapon added (a copy of the one in ' + slotTitle(w.slot) + ', with its upgrades)');
};

// ---------------------------------------------------------------- tree (advanced)
let treeState = { id: null, q: '' };
async function renderTree(root) {
  const bar = document.createElement('div'); bar.className = 'card';
  bar.innerHTML = '<div class="note" style="margin:0 0 8px">For advanced users: any numeric field of the file. Search by field or class name, for example <span class="mono">PTAS</span>.</div><input id="q" placeholder="Search (2+ characters)">';
  root.append(bar);
  const out = document.createElement('div'); root.append(out);
  const q = $('#q', bar); q.value = treeState.q;
  let timer;
  q.oninput = () => { clearTimeout(timer); timer = setTimeout(() => { treeState.q = q.value; q.value.trim().length >= 2 ? showSearch(out, q.value) : showNode(out, treeState.id ?? data.root); }, 250); };
  if (treeState.q.trim().length >= 2) showSearch(out, treeState.q); else showNode(out, treeState.id ?? data.root);
}
async function showSearch(out, q) {
  const r = await api('search', { name: cur, q });
  out.innerHTML = '';
  const t = document.createElement('table');
  t.innerHTML = '<tr><th>Name</th><th>Type</th><th>Value</th></tr>';
  for (const x of r.results) {
    const tr = document.createElement('tr'); tr.className = 'row';
    tr.innerHTML = `<td>${esc(x.name || '')}</td><td class="dim">${esc(x.cls || x.kind)}</td><td class="mono">${x.value !== undefined ? esc(x.value) : ''}</td>`;
    tr.onclick = () => { treeState.q = ''; $('#q').value = ''; showNode(out, x.kind === 'v' ? x.parent : x.id); };
    t.append(tr);
  }
  out.append(t);
  if (!r.results.length) out.innerHTML = '<div class="empty">Nothing found</div>';
}
async function showNode(out, id) {
  treeState.id = id;
  const d = await api('node', { name: cur, id });
  out.innerHTML = '';
  const cr = document.createElement('div'); cr.className = 'crumbs';
  const parts = [{ id: data.root, name: 'root' }, ...d.path.filter((p) => p.id !== data.root)];
  parts.forEach((p, i) => { const a = document.createElement('a'); a.textContent = p.name; a.onclick = () => showNode(out, p.id); cr.append(a); if (i < parts.length - 1) cr.append(document.createTextNode(' › ')); });
  out.append(cr);
  if (d.cls) { const c = document.createElement('p'); c.className = 'dim mono'; c.textContent = d.cls; out.append(c); }
  if (d.info) { const c = document.createElement('p'); c.className = 'dim'; c.textContent = `Array: ${d.info.cnt} items` + (d.info.blob ? ' (binary data, not editable)' : ''); out.append(c); }
  const t = document.createElement('table');
  t.innerHTML = '<tr><th>Field</th><th>Type</th><th>Value</th></tr>';
  for (const c of d.children || []) {
    const tr = document.createElement('tr');
    const nameTd = document.createElement('td'); nameTd.textContent = c.name; tr.append(nameTd);
    const typeTd = document.createElement('td'); typeTd.className = 'dim';
    const valTd = document.createElement('td');
    if (c.kind === 'o') { typeTd.textContent = c.cls || '(empty)'; valTd.innerHTML = `<span class="dim">${c.count} fields ›</span>`; tr.className = 'row'; tr.onclick = () => showNode(out, c.id); }
    else if (c.kind === 'a') { typeTd.textContent = 'array'; valTd.innerHTML = `<span class="dim">${c.count} items ›</span>`; tr.className = 'row'; tr.onclick = () => showNode(out, c.id); }
    else if (c.kind === 'e') {
      typeTd.textContent = c.esz === 1 ? 'byte' : (c.et === 0xb ? 'float' : 'int');
      const i = document.createElement('input'); i.className = 'mono'; i.value = c.value;
      i.onchange = async () => { try { const r = await api('set', { name: cur, off: c.off, esz: c.esz, et: c.et, value: i.value }); i.value = r.value; c.value = r.value; } catch (e) { toast(e.message, 'err'); i.value = c.value; } };
      valTd.append(i);
    } else {
      typeTd.textContent = ({ 1: 'enum', 2: 'bool', 4: 'u8', 7: 'u32', 8: 'int32', 9: 'u64', 10: 'int64', 11: 'float', 15: 'string', 16: 'vec' }[c.tag] || 't' + c.tag) + (c.sz ? ` (${c.sz})` : '');
      if (c.editable) valTd.append(field({ id: c.id, value: c.value, editable: true })); else valTd.innerHTML = `<span class="mono">${esc(c.value)}</span>`;
    }
    tr.append(typeTd, valTd); t.append(tr);
  }
  out.append(t);
  if (!(d.children || []).length) out.insertAdjacentHTML('beforeend', '<div class="empty">Empty</div>');
}

// ---------------------------------------------------------------- header actions
$('#bRevert').onclick = async () => {
  if (!confirm('Discard all unsaved edits in this file?')) return;
  try { const r = await api('revert', { name: cur }); applyFresh(r); render(); toast('Edits discarded', 'ok'); } catch (e) { toast(e.message, 'err'); }
};
async function save(target, force, forceChanged) {
  try {
    toast(target === 'game' ? 'Encrypting and writing…' : 'Encrypting…');
    const r = await api('save', { name: cur, target, force, forceChanged });
    if (r.running) { if (confirm('The game (re4.exe) is running. Your write may be overwritten by the game. Write anyway?')) return save(target, true); return; }
    if (r.changed) { if (confirm('This slot was changed outside the editor since you opened it (the game saved it?). Writing now overwrites that change with what you see here. Write anyway?')) return save(target, force, true); return; }
    toast(target === 'game' ? 'Written to the game.\nBackup of the original: ' + r.backup : 'File saved: ' + r.path, 'ok');
    if (data) data.dirty = false; updateDirty();
    fx.saved($(target === 'game' ? '#bGame' : '#bOut'));
    await loadFiles();
  } catch (e) { toast(e.message, 'err'); }
}
// ---- restore from backup / file
$('#restoreClose').onclick = () => $('#restoreModal').classList.remove('on');
$('#restoreModal').onclick = (e) => { if (e.target.id === 'restoreModal') $('#restoreModal').classList.remove('on'); };
$('#bRestore').onclick = async () => {
  $('#restoreFor').textContent = 'File: ' + slotTitle(cur) + ' (' + cur + ')';
  const list = $('#restoreList'); list.innerHTML = '<div class="empty">Loading…</div>';
  $('#restoreModal').classList.add('on');
  try {
    const r = await api('backups', { name: cur });
    list.innerHTML = '';
    if (!r.backups.length) list.innerHTML = '<div class="empty">There are no backups of this file yet.<br>They are created automatically on every write to the game.</div>';
    for (const b of r.backups) {
      const d = document.createElement('div'); d.className = 'pick';
      d.innerHTML = '<span>' + esc(b.label) + '<br><span class="dim" style="font-size:12px">' + new Date(b.when).toLocaleString('en-US') + ' · ' + fmtSize(b.size) + '</span></span>';
      const btn = document.createElement('button'); btn.className = 'sm'; btn.innerHTML = ic('restore') + 'Restore';
      btn.onclick = () => { if (confirm('Replace the current ' + cur + ' with this backup?')) doRestore('restore', { id: b.id }); };
      d.append(btn); list.append(d);
    }
  } catch (e) { list.innerHTML = '<div class="empty">' + esc(e.message) + '</div>'; }
};
$('#restorePick').onclick = () => $('#restoreFile').click();
$('#restoreFile').onchange = async (e) => {
  const f = e.target.files[0]; e.target.value = ''; if (!f) return;
  if (!confirm('Replace the current ' + cur + ' with the file "' + f.name + '"? It must be a save of the same Steam account.')) return;
  const buf = new Uint8Array(await f.arrayBuffer()); let bin = '';
  for (let i = 0; i < buf.length; i += 32768) bin += String.fromCharCode.apply(null, buf.subarray(i, i + 32768));
  doRestore('restore-upload', { data: btoa(bin) });
};
async function doRestore(route, body, force) {
  try {
    toast('Checking and restoring…');
    const r = await api(route, { name: cur, ...body, force });
    if (r.running) { if (confirm('The game (re4.exe) is running. Replace the file anyway?')) return doRestore(route, body, true); return; }
    $('#restoreModal').classList.remove('on');
    toast('File restored.\nThe current version was saved to: ' + r.backup, 'ok');
    await loadFiles(); await openFile(cur);
  } catch (e) { toast(e.message, 'err'); }
}

loadFiles().finally(() => fx.ready()).then(() => {
  if (cfg.noSaveDir) { view.innerHTML = '<div class="empty">The RE4 Remake save folder was not found.<br>Create <span class="mono">app/config.json</span> and set the path in it:<br><span class="mono">{ "saveDir": "C:/Program Files (x86)/Steam/userdata/&lt;account-id&gt;/2050650/remote/win64_save" }</span></div>'; return; }
  view.innerHTML = '<div class="empty">Choose a save slot in the list above.</div>'; loadSummaries();
}).catch((e) => toast(e.message, 'err'));
