'use strict';
// Inventory model + structural edits (add / remove / move / upgrade) for RE4 Remake slot files.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { parse, readValue, writeValue, isEditable } = require('./parser');
const { serialize } = require('./serializer');

// ---- catalog --------------------------------------------------------------
const CATEGORIES = {
  weapon: 'Weapons', throw: 'Throwables', ammo: 'Ammo and crafting', heal: 'Healing', acc: 'Accessories',
  key: 'Key items', treasure: 'Treasures', special: 'Special (recipes, cases)', charm: 'Charms', money: 'Money',
};
const CATALOG = {};
for (const line of fs.readFileSync(path.join(__dirname, 'catalog.txt'), 'utf8').split(/\r?\n/)) {
  if (!line || line.startsWith('#')) continue;
  const [id, name, cat] = line.split('|');
  CATALOG[id] = { n: name, c: cat };
}
// which inventory (index in InventorySaveDatas) holds which category in the Steam version of RE4R
const HOME = { ammo: 0, heal: 0, acc: 0, throw: 0, weapon: 0, key: 2, treasure: 3, special: 1, charm: 1 };
// attaché case size level -> columns x rows (levels verified against the layouts of real slots)
const CASE_DIMS = { 0: [7, 10], 1: [7, 12], 2: [8, 12], 3: [8, 13], 4: [9, 13] };
// Item footprints in cells [width, height]. ESTIMATES derived from layouts in real saves (see analysis/footprint.js).
const FOOT = JSON.parse(fs.readFileSync(path.join(__dirname, 'footprints.json'), 'utf8'));
function footprint(itemId, rotated) {
  const id = String(itemId);
  let fp = FOOT[id];
  if (!fp) fp = /^27[0-8]/.test(id) && !/^277/.test(id) ? [3, 2] : [1, 1];
  return rotated ? [fp[1], fp[0]] : [fp[0], fp[1]];
}
// weapon upgrade categories seen in saves: which fields carry the level
const UPG = [
  { key: 'fire', label: 'Firepower', arr: '_CommonLevelInWeapon', catField: '_CommonCustomCategory', cat: 0, fields: ['_DamageRateLevel', '_WinceRateLevel', '_BreakRateLevel', '_StoppingRateLevel'] },
  { key: 'ammo', label: 'Capacity', arr: '_CommonLevelInWeapon', catField: '_CommonCustomCategory', cat: 2, fields: ['_AmmoMaxLevel'] },
  { key: 'reload', label: 'Reload speed', arr: '_IndividualLevelInWeapon', catField: '_IndividualCustomCategory', cat: 7, fields: ['_ReloadSpeedRateLevel'] },
  { key: 'rapid', label: 'Rapid fire', arr: '_IndividualLevelInWeapon', catField: '_IndividualCustomCategory', cat: 8, fields: ['_RapidSpeedLevel'] },
  { key: 'dura', label: 'Durability', arr: '_IndividualLevelInWeapon', catField: '_IndividualCustomCategory', cat: 6, fields: ['_DurabilityMaxLevel'] },
];
const MAX_UPG = 7;

// ---- tree helpers -----------------------------------------------------------
const F = (S, o, name) => { const f = o && o.f && o.f.find((x) => x[0] === name); return f ? S.parsed.nodes[f[1]] : null; };
function sections(S) {
  const nodes = S.parsed.nodes; const root = nodes[S.parsed.root];
  return nodes[root.f[0][1]].items.map((i) => nodes[i]);
}
function invManager(S) { return sections(S).find((o) => o.c.endsWith('InventoryManager.GameSaveData')); }
function inventories(S) { const m = invManager(S); return m ? F(S, m, 'InventorySaveDatas').items.map((i) => S.parsed.nodes[i]) : []; }
function itemList(S, inv) { return F(S, inv, 'InventoryItems') || F(S, inv, 'Items'); }
function itemObj(S, entry) { const item = F(S, entry, 'Item'); return item && item.k === 'o' ? item : entry; }
function guidOf(S, entry) {
  const g = F(S, itemObj(S, entry), '_ID'); return g && g.sz === 16 ? S.buf.subarray(g.off, g.off + 16) : null;
}
function scalar(S, n) {
  return n && n.k === 'v' ? { id: n.id, value: readValue(S.buf, n), editable: isEditable(n) } : null;
}
function slotOf(S, entry) {
  const si = F(S, entry, 'SlotIndex');
  return si && si.k === 'v' && si.sz === 8 ? { x: S.buf.readInt32LE(si.off), y: S.buf.readInt32LE(si.off + 4) } : null;
}
function upgradesOf(S, it) {
  const cl = F(S, it, '_CustomLevelInWeapon'); if (!cl) return null;
  const res = [];
  for (const u of UPG) {
    const arr = F(S, cl, u.arr); if (!arr || !arr.items) continue;
    for (const cid of arr.items) {
      const c = S.parsed.nodes[cid]; const catN = F(S, c, u.catField);
      if (catN && readValue(S.buf, catN) === u.cat) { const now = scalar(S, F(S, c, '_NowLevel')); if (now) res.push({ key: u.key, label: u.label, level: now }); }
    }
  }
  return res.length ? res : null;
}
function entryModel(S, entry, idx) {
  const it = itemObj(S, entry);
  const id = scalar(S, F(S, it, '_ItemId'));
  if (!id) return null;
  const cat = CATALOG[id.value];
  const dirN = F(S, entry, 'CurrDirection');
  const dir = dirN ? Number(readValue(S.buf, dirN)) : 0;
  const g = guidOf(S, entry);
  return {
    idx, nodeId: entry.id, cls: it.c.split('.').pop(), name: cat ? cat.n : null, cat: cat ? cat.c : null,
    itemId: id, count: scalar(S, F(S, it, '_CurrentItemCount')), ammo: scalar(S, F(S, it, '_CurrentAmmoCount')),
    durability: scalar(S, F(S, it, '_CurrentDurability')), slot: slotOf(S, entry), dir,
    fp: footprint(id.value, dir % 2 === 1), upg: it.c.endsWith('WeaponItem') ? upgradesOf(S, it) : null,
    guid: g ? g.toString('hex') : null,
  };
}
function model(S) {
  const invs = inventories(S);
  return invs.map((inv, index) => {
    const arr = itemList(S, inv);
    const items = arr ? arr.items.map((id, i) => entryModel(S, S.parsed.nodes[id], i)).filter(Boolean) : [];
    const size = F(S, inv, 'InventorySize');
    const sz = size ? scalar(S, F(S, size, 'CurrInventorySize')) : null;
    const grid = sz ? CASE_DIMS[sz.value] || null : null;
    return { index, size: sz, grid, sizes: sz ? Object.entries(CASE_DIMS).map(([level, [w, h]]) => ({ level: Number(level), w, h })) : null, hasSlots: items.some((i) => i.slot), items };
  });
}
function overview(S) {
  const sec = (s) => sections(S).find((o) => o.c.endsWith(s));
  const clock = sec('GameClock.GameSaveData'), inv = sec('InventoryManager.GameSaveData'),
    shop = sec('InGameShopManager.GameSaveData'), camp = sec('CampaignManager.GameData');
  const o = {};
  if (clock) o.playTime = scalar(S, F(S, clock, '_GameElapsedTime'));
  if (inv) o.ptas = scalar(S, F(S, inv, 'PTAS'));
  if (shop) o.spinel = scalar(S, F(S, shop, 'SpinelCount'));
  if (camp) { o.difficulty = scalar(S, F(S, camp, '_CurrentDifficulty')); o.saveCount = scalar(S, F(S, camp, '_SaveCount')); }
  // look of the attaché case: the skin item selected for the main character (100000) in the skin settings
  try {
    const host = sections(S).find((x) => F(S, x, 'SkinSettingSaveData'));
    const arr = host && F(S, F(S, host, 'SkinSettingSaveData'), 'Settings');
    if (arr) for (const i of arr.items) {
      const e = S.parsed.nodes[i]; const cid = scalar(S, F(S, e, 'CharacterID')); const it = scalar(S, F(S, e, 'ItemId'));
      if (cid && it && Number(cid.value) === 100000) o.caseSkin = Number(it.value);
    }
  } catch (e) { /* optional */ }
  return o;
}

// ---- grid placement ------------------------------------------------------------
const overlap = (ax, ay, aw, ah, bx, by, bw, bh) => ax < bx + bw && bx < ax + aw && ay < by + bh && by < ay + ah;
function canPlace(m, x, y, w, h, exceptIdx) {
  if (!m.grid) return true;
  const [W, H] = m.grid;
  if (x < 0 || y < 0 || x + w > W || y + h > H) return false;
  return !m.items.some((o) => o.slot && o.idx !== exceptIdx && overlap(x, y, w, h, o.slot.x, o.slot.y, o.fp[0], o.fp[1]));
}
function freeRect(m, w, h) {
  const [W, H] = m.grid;
  for (let y = 0; y + h <= H; y++) for (let x = 0; x + w <= W; x++) if (canPlace(m, x, y, w, h, -1)) return { x, y };
  return null;
}
// list-like inventories (keys, treasures, ...) have a tiny grid without real limits
function nextListCell(m) {
  const used = new Set(m.items.filter((i) => i.slot).map((i) => i.slot.x + ',' + i.slot.y));
  const width = Math.max(1, ...m.items.filter((i) => i.slot).map((i) => i.slot.x + 1));
  for (let y = 0; ; y++) for (let x = 0; x < width; x++) if (!used.has(x + ',' + y)) return { x, y };
}
function findSpot(m, fp) {
  if (m.index === 0 && m.grid) {
    const spot = freeRect(m, fp[0], fp[1]);
    if (!spot) throw new Error(`No free ${fp[0]}×${fp[1]} space in the case (item sizes are estimates). Increase the case size or free up some room.`);
    return spot;
  }
  return nextListCell(m);
}

// ---- structural edits -------------------------------------------------------
function cloneSubtree(S, id, parent) {
  const nodes = S.parsed.nodes; const src = nodes[id];
  if (src.k === 'a' && src.blob) throw new Error('Physics blocks cannot be copied');
  const n = Object.assign({}, src, { p: parent, id: nodes.length });
  nodes.push(n);
  if (src.k === 'o') n.f = src.f.map(([name, cid, fh]) => [name, cloneSubtree(S, cid, n.id), fh]);
  else if (src.k === 'a') {
    if (src.et === 0x11) n.items = src.items.map((cid) => cloneSubtree(S, cid, n.id));
    else { n.data = Buffer.from(S.buf.subarray(src.off, src.off + src.cnt * src.esz)); n.items = []; }
  } else if (src.str === undefined) n.data = Buffer.from(S.buf.subarray(src.off, src.off + src.sz));
  return n.id;
}
// Re-emit the (modified) tree, then re-parse so every offset is valid again.
function rebuild(S) {
  const out = serialize(S.parsed, S.buf);
  const parsed = parse(out.buf);
  if (parsed.trailer !== S.parsed.trailer) throw new Error('Internal error: the file tail changed');
  S.buf = out.buf; S.parsed = parsed;
}
function pickTemplate(S, invIdx, wantedId) {
  const invs = inventories(S);
  const wantClass = (() => {
    // reuse the class of an existing item with the same ID anywhere in the save
    for (const inv of invs) { const arr = itemList(S, inv); if (!arr) continue;
      for (const id of arr.items) { const e = S.parsed.nodes[id]; const m = entryModel(S, e, 0); if (m && String(m.itemId.value) === String(wantedId)) return m.cls; } }
    const p = String(wantedId).slice(0, 3);
    if (p === '122') return 'CombinableTreasureItem';
    if (p === '124' || p === '127') return 'UniqueItem';
    return 'Item';
  })();
  const search = [invIdx, ...invs.map((_, i) => i).filter((i) => i !== invIdx)];
  for (const i of search) {
    const arr = itemList(S, invs[i]); if (!arr) continue;
    for (const id of arr.items) { const m = entryModel(S, S.parsed.nodes[id], 0); if (m && m.cls === wantClass) return { entryId: id, cls: wantClass, inv: i }; }
  }
  throw new Error(`No template entry of type ${wantClass} - this item cannot be added`);
}
function lastEntry(S, invIdx) {
  const arr = itemList(S, inventories(S)[invIdx]); return S.parsed.nodes[arr.items[arr.items.length - 1]];
}
function setEntry(S, entry, { itemId, count, slot, newGuid }) {
  const it = itemObj(S, entry);
  if (itemId !== undefined) writeValue(S.buf, F(S, it, '_ItemId'), String(itemId));
  if (count !== undefined) { const c = F(S, it, '_CurrentItemCount'); if (c) writeValue(S.buf, c, String(count)); }
  if (newGuid) { const g = F(S, it, '_ID'); if (g && g.sz === 16) crypto.randomBytes(16).copy(S.buf, g.off); }
  if (slot) { const si = F(S, entry, 'SlotIndex'); if (si && si.sz === 8) { S.buf.writeInt32LE(slot.x, si.off); S.buf.writeInt32LE(slot.y, si.off + 4); } }
}

function addItem(S, { itemId, count }) {
  const info = CATALOG[String(itemId)];
  const cat = info ? info.c : null;
  if (cat === 'weapon' || cat === 'throw') throw new Error('Weapons and throwables cannot be added yet - only items, ammo, healing, keys, treasures and charms');
  if (cat === 'money') throw new Error('Money is changed on the "Money" tab');
  const invIdx = cat ? HOME[cat] : 0;
  const m = model(S)[invIdx]; if (!m) throw new Error('There is no suitable inventory in this slot');
  count = Math.max(1, Math.floor(Number(count) || 1));
  // stackable: just increase the count of an existing entry
  const existing = m.items.find((i) => String(i.itemId.value) === String(itemId));
  const stackable = cat === 'ammo' || cat === 'heal' || cat === 'treasure' || cat === 'acc';
  if (existing && stackable && existing.count && existing.count.editable) {
    writeValue(S.buf, S.parsed.nodes[existing.count.id], String(Number(existing.count.value) + count));
    return { stacked: true, inv: invIdx };
  }
  if (existing && !stackable) throw new Error('Such an item is already in the inventory');
  const tpl = pickTemplate(S, invIdx, itemId);
  const spot = findSpot(m, footprint(itemId, false)); // throws if the case is full
  const arrNode = itemList(S, inventories(S)[invIdx]);
  const newId = cloneSubtree(S, tpl.entryId, arrNode.id);
  arrNode.items.push(newId); arrNode.cnt += 1;
  rebuild(S);
  setEntry(S, lastEntry(S, invIdx), { itemId, count, slot: spot, newGuid: true });
  // the clone may carry a rotation from its template
  const dn = F(S, lastEntry(S, invIdx), 'CurrDirection'); if (dn) writeValue(S.buf, dn, '0');
  return { stacked: false, inv: invIdx, slot: spot };
}
function removeItem(S, invIdx, idx) {
  const inv = inventories(S)[invIdx]; if (!inv) throw new Error('No such inventory');
  const arr = itemList(S, inv); const id = arr.items[idx]; if (id === undefined) throw new Error('No such item');
  const entry = S.parsed.nodes[id];
  const guid = guidOf(S, entry);
  if (guid) { // refuse to delete something that is equipped / on a shortcut: other places reference its GUID
    let refs = 0; let at = -1;
    while ((at = S.buf.indexOf(guid, at + 1)) >= 0) refs++;
    if (refs > 1) throw new Error('This item is in use (equipped or on a quick slot) - unequip it in the game first');
  }
  arr.items.splice(idx, 1); arr.cnt -= 1;
  rebuild(S);
  return { ok: true };
}
function duplicateItem(S, invIdx, idx) {
  const m = model(S)[invIdx]; const it = m.items[idx]; if (!it) throw new Error('No such item');
  const spot = findSpot(m, it.fp);
  const arr = itemList(S, inventories(S)[invIdx]);
  const newId = cloneSubtree(S, arr.items[idx], arr.id);
  arr.items.push(newId); arr.cnt += 1;
  rebuild(S);
  setEntry(S, lastEntry(S, invIdx), { slot: spot, newGuid: true });
  return { slot: spot };
}
// Move / rotate an item inside the attaché case (position written in place).
function moveItem(S, invIdx, idx, x, y, dir) {
  const m = model(S)[invIdx]; const it = m && m.items[idx]; if (!it) throw new Error('No such item');
  if (!it.slot) throw new Error('This item has no cell');
  x = Math.trunc(Number(x)); y = Math.trunc(Number(y));
  const rot = dir === undefined ? it.dir : Number(dir);
  const fp = footprint(it.itemId.value, rot % 2 === 1);
  if (m.grid && !canPlace(m, x, y, fp[0], fp[1], idx)) throw new Error('The item does not fit here or overlaps another one (sizes are estimates)');
  const entry = S.parsed.nodes[itemList(S, inventories(S)[invIdx]).items[idx]];
  setEntry(S, entry, { slot: { x, y } });
  if (dir !== undefined) { const dn = F(S, entry, 'CurrDirection'); if (dn) writeValue(S.buf, dn, String(rot)); }
  return { ok: true };
}
// Change the attaché case size level; every item must still fit.
function setCaseSize(S, level) {
  level = Number(level);
  if (!CASE_DIMS[level]) throw new Error('Unknown case size');
  const m = model(S)[0]; if (!m || !m.size) throw new Error('There is no case in this slot');
  const [W, H] = CASE_DIMS[level];
  for (const it of m.items) if (it.slot && (it.slot.x + it.fp[0] > W || it.slot.y + it.fp[1] > H)) {
    throw new Error(`Cannot shrink the case to ${W}×${H}: the item "${it.name || '#' + it.itemId.value}" does not fit. Move or remove items first.`);
  }
  writeValue(S.buf, S.parsed.nodes[m.size.id], String(level));
  return { ok: true };
}
// Weapon upgrade level (0..MAX_UPG) for one upgrade category.
function setUpgrade(S, invIdx, idx, key, level) {
  level = Number(level);
  if (!Number.isInteger(level) || level < 0 || level > MAX_UPG) throw new Error(`Level must be between 0 and ${MAX_UPG}`);
  const u = UPG.find((x) => x.key === key); if (!u) throw new Error('Unknown upgrade');
  const arrN = itemList(S, inventories(S)[invIdx]); const entry = S.parsed.nodes[arrN.items[idx]];
  const it = itemObj(S, entry); const cl = F(S, it, '_CustomLevelInWeapon');
  const list = cl && F(S, cl, u.arr);
  if (!list) throw new Error('This item has no upgrades');
  let done = 0;
  for (const cid of list.items) {
    const c = S.parsed.nodes[cid]; const catN = F(S, c, u.catField);
    if (!catN || readValue(S.buf, catN) !== u.cat) continue;
    for (const fld of [...u.fields, '_NowLevel']) { const n = F(S, c, fld); if (n) { writeValue(S.buf, n, String(level)); } }
    done++;
  }
  if (!done) throw new Error('This weapon has no such upgrade');
  return { ok: true };
}

// ---- change summary (before writing) ------------------------------------------
function describeChanges(S, origBuf, questName) {
  const O = { buf: origBuf, parsed: parse(origBuf) };
  const out = [];
  const num = (n) => Number(n).toLocaleString('en-US');
  const ovO = overview(O), ovN = overview(S);
  for (const [k, label] of [['ptas', 'Pesetas'], ['spinel', 'Spinel']]) {
    if (ovO[k] && ovN[k] && String(ovO[k].value) !== String(ovN[k].value)) out.push({ icon: 'coin', text: `${label}: ${num(ovO[k].value)} → ${num(ovN[k].value)}` });
  }
  const mO = model(O), mN = model(S);
  const label = (it) => it.name || '#' + it.itemId.value;
  mN.forEach((invN, i) => {
    const invO = mO[i]; if (!invO) return;
    if (invN.size && invO.size && invN.size.value !== invO.size.value) {
      const a = CASE_DIMS[invO.size.value], b = CASE_DIMS[invN.size.value];
      out.push({ icon: 'case', text: `Case size: ${a ? a.join('×') : invO.size.value} → ${b ? b.join('×') : invN.size.value}` });
    }
    const key = (it, i2, arr) => it.guid || `id${it.itemId.value}#${arr.slice(0, i2).filter((x) => x.itemId.value === it.itemId.value).length}`;
    const mapO = new Map(invO.items.map((it, i2, a) => [key(it, i2, a), it])), mapN = new Map(invN.items.map((it, i2, a) => [key(it, i2, a), it]));
    for (const [k, it] of mapN) if (!mapO.has(k)) out.push({ icon: 'plus', text: `Added: ${label(it)}${it.count ? ' ×' + it.count.value : ''}${it.slot ? ` (cell ${it.slot.x},${it.slot.y})` : ''}` });
    for (const [k, it] of mapO) if (!mapN.has(k)) out.push({ icon: 'trash', text: `Removed: ${label(it)}${it.count ? ' ×' + it.count.value : ''}` });
    for (const [k, n] of mapN) {
      const o = mapO.get(k); if (!o) continue;
      const parts = [];
      if (String(o.itemId.value) !== String(n.itemId.value)) parts.push(`ID ${o.itemId.value} → ${n.itemId.value}`);
      for (const [f, lb] of [['count', 'count'], ['ammo', 'ammo'], ['durability', 'durability']]) {
        if (o[f] && n[f] && String(o[f].value) !== String(n[f].value)) parts.push(`${lb} ${o[f].value} → ${n[f].value}`);
      }
      if (o.slot && n.slot && (o.slot.x !== n.slot.x || o.slot.y !== n.slot.y)) parts.push(`cell ${o.slot.x},${o.slot.y} → ${n.slot.x},${n.slot.y}`);
      if (o.dir !== n.dir) parts.push('rotated');
      if (o.upg && n.upg) for (const u of n.upg) { const ou = o.upg.find((x) => x.key === u.key); if (ou && String(ou.level.value) !== String(u.level.value)) parts.push(`${u.label.toLowerCase()} ${ou.level.value} → ${u.level.value}`); }
      if (parts.length) out.push({ icon: 'save', text: `${label(n)}: ${parts.join(', ')}` });
    }
  });
  const qO = quests(O), qN = quests(S);
  for (const q of qN) {
    const o = qO.find((x) => x.id === q.id); if (!o) continue;
    const d = (qq) => qq.subs.filter((s) => s.completed && Number(s.completed.value) === 1).length;
    if (d(q) !== d(o)) out.push({ icon: 'quest', text: `Request ${q.id}${questName ? ' · ' + questName(q.id) : ''}: goals completed ${d(o)} → ${d(q)} of ${q.subs.length}` });
  }
  return out;
}

// ---- merchant requests (QuestManager) ---------------------------------------
function questManager(S) { return sections(S).find((o) => o.c.endsWith('QuestManager.GameSaveData')); }
function quests(S) {
  const qm = questManager(S); if (!qm) return [];
  const arr = F(S, qm, 'QuestOrderSaves'); if (!arr) return [];
  return arr.items.map((id, idx) => {
    const o = S.parsed.nodes[id];
    const subs = F(S, o, '_SubTaskSaves').items.map((sid) => {
      const sub = S.parsed.nodes[sid]; const cond = F(S, sub, '_Condition');
      const type = cond.c.split('.').pop().replace('Save', '');
      const comp = F(S, cond, '_Completed');
      const item = F(S, cond, '_Item'), num = F(S, cond, '_Num');
      const itemId = item ? readValue(S.buf, item) : null;
      return { type, completed: scalar(S, comp), item: itemId, itemName: itemId !== null && CATALOG[itemId] ? CATALOG[itemId].n : null, num: num ? readValue(S.buf, num) : null };
    });
    return { idx, id: readValue(S.buf, F(S, o, '_ID')), retry: readValue(S.buf, F(S, o, '_RemainRetryCount')), subs };
  });
}
// Mark the flag/event objectives of a request as completed (item hand-ins are left alone).
function completeQuest(S, idx) {
  const list = quests(S); const targets = idx === 'all' ? list : [list[idx]];
  let changed = 0;
  for (const q of targets) {
    if (!q) throw new Error('No such request');
    for (const sub of q.subs) if (sub.type !== 'Item' && sub.completed && Number(sub.completed.value) !== 1) {
      writeValue(S.buf, S.parsed.nodes[sub.completed.id], '1'); changed++;
    }
  }
  return { changed };
}

// ---- treasure statistics ---------------------------------------------------------
const REGIONS = JSON.parse(fs.readFileSync(path.join(__dirname, 'regions.json'), 'utf8'));
// What the save really contains: (a) DropItemManager.Diffs = world items already picked up, with an unlabeled area group
// number; (b) InventoryManager.ItemGetDataList = which item types were ever obtained. There is no per-area total.
function treasures(S) {
  const nodes = S.parsed.nodes; const out = { groups: [], total: 0, types: { got: [], missing: [] } };
  const dm = sections(S).find((o) => o.c.endsWith('DropItemManager.SaveData'));
  const diffs = dm && F(S, dm, 'Diffs');
  const groups = new Map();
  if (diffs) for (const id of diffs.items) {
    const o = nodes[id]; const itemN = F(S, o, 'ItemID'); if (!itemN) continue;
    const itemId = readValue(S.buf, itemN); const info = CATALOG[itemId];
    if (!info || info.c !== 'treasure') continue;
    const idO = F(S, o, 'ID'); const g = idO ? readValue(S.buf, F(S, idO, '_Group')) : -1;
    if (!groups.has(g)) groups.set(g, { group: g, items: [] });
    groups.get(g).items.push({ itemId, name: info.n });
  }
  for (const g of [...groups.values()].sort((a, b) => a.group - b.group)) {
    const names = {}; for (const it of g.items) names[it.name] = (names[it.name] || 0) + 1;
    const reg = REGIONS[g.group] || null;
    const row = { group: g.group, count: g.items.length, names, label: reg ? reg.label : null, confidence: reg ? reg.confidence : null };
    if (reg && reg.guide) {
      const missing = [], extra = [];
      for (const k of new Set([...Object.keys(reg.guide), ...Object.keys(names)])) {
        const want = reg.guide[k] || 0, have = names[k] || 0;
        if (have < want) missing.push({ name: k, n: want - have }); else if (have > want) extra.push({ name: k, n: have - want });
      }
      row.guide = { total: reg.guideTotal, note: reg.guideNote, missing, extra };
    }
    out.groups.push(row); out.total += row.count;
  }
  const mgr = invManager(S); const list = mgr && F(S, mgr, 'ItemGetDataList');
  const got = new Set();
  if (list) for (const id of list.items) {
    const o = nodes[id]; const itemId = readValue(S.buf, F(S, o, 'ItemID')); const flag = readValue(S.buf, F(S, o, 'IsGet'));
    if (CATALOG[itemId] && CATALOG[itemId].c === 'treasure' && Number(flag) === 1) got.add(String(itemId));
  }
  for (const [id, v] of Object.entries(CATALOG)) if (v.c === 'treasure') (got.has(id) ? out.types.got : out.types.missing).push(v.n);
  return out;
}

// ---- achievement helpers: statistics derived from the save ---------------------------------
function gameStats(S) {
  const sec = sections(S).find((o) => o.c.endsWith('GameStatsManager.GameSaveData')); if (!sec) return null;
  const hist = F(S, sec, '_CurrentChapterStatsHistorySave'), on = F(S, sec, '_OngoingSave');
  const g = (o, k) => { const n = F(S, o, k); return n && n.k === 'v' ? Number(readValue(S.buf, n)) : 0; };
  const u32 = (v) => (v > 1000000 ? 0 : v);
  const chapters = hist.items.map((id, i) => {
    const o = S.parsed.nodes[id]; const cid = g(o, '_Chapter'); const main = String(cid)[0] === '2';
    return {
      id: cid, num: main ? (Math.floor(cid / 1000) % 10 - 1) * 3 + (Math.floor(cid / 100) % 10) : i + 1,
      kills: g(o, '_KillCount'), deaths: g(o, '_Death'), hit: g(o, '_HitSuccess'), attempts: g(o, '_HitAttempt'),
      damage: g(o, '_DamageCount'), saves: u32(g(o, '_SaveCount')), timeSec: g(o, '_ChapterLapTime') / 1e6,
    };
  });
  const sum = (k) => chapters.reduce((a, c) => a + c[k], 0);
  const ov = overview(S);
  const camp = sections(S).find((o) => o.c.endsWith('CampaignManager.GameData'));
  const diff = camp ? Number(readValue(S.buf, F(S, camp, '_CurrentDifficulty'))) : null;
  return {
    mode: chapters.length && String(chapters[0].id)[0] === '3' ? 'separateWays' : 'main',
    difficulty: diff, chapters, ongoingKills: on ? g(on, '_KillCount') : 0, ongoingDeaths: on ? g(on, '_Death') : 0,
    kills: sum('kills'), deaths: sum('deaths'), hit: sum('hit'), attempts: sum('attempts'), damage: sum('damage'), saves: sum('saves'),
    chaptersHours: sum('timeSec') / 3600, clockHours: ov.playTime ? Number(ov.playTime.value) / 3.6e9 : null,
  };
}
function rangeStats(S) {
  const sec = sections(S).find((o) => o.c.endsWith('ShootingGalleryManager.GameSaveData')); if (!sec) return null;
  const list = F(S, sec, '_RecordDataList'); const g = (o, k) => { const n = F(S, o, k); return n ? Number(readValue(S.buf, n)) : 0; };
  const stages = list.items.map((id, i) => { const o = S.parsed.nodes[id]; return { stage: i + 1, unlocked: !!g(o, '_IsUnlock'), cleared: !!g(o, '_IsClearStage'), score: g(o, '_HighScore'), allMedals: !!g(o, '_IsMedalAllDefeat'), rank: g(o, '_ClearRank') }; });
  return { stages, cleared: stages.filter((x) => x.cleared).length, total: stages.length };
}
function weaponStatus(S) {
  const mgr = invManager(S); const list = mgr && F(S, mgr, 'ItemGetDataList');
  const got = new Set();
  if (list) for (const id of list.items) {
    const o = S.parsed.nodes[id]; const itemId = readValue(S.buf, F(S, o, 'ItemID'));
    if (Number(readValue(S.buf, F(S, o, 'IsGet'))) === 1) got.add(String(itemId));
  }
  const obtained = [], missing = [];
  for (const [id, v] of Object.entries(CATALOG)) if (v.c === 'weapon') (got.has(id) ? obtained : missing).push(v.n);
  // upgrades / exclusive upgrades on weapons currently in the cases
  let upgraded = 0, exclusive = 0;
  for (const inv of inventories(S)) {
    const arr = itemList(S, inv); if (!arr) continue;
    for (const id of arr.items) {
      const it = itemObj(S, S.parsed.nodes[id]); if (!it.c.endsWith('WeaponItem')) continue;
      const up = upgradesOf(S, it); if (up && up.some((u) => Number(u.level.value) > 0)) upgraded++;
      const cl = F(S, it, '_CustomLevelInWeapon'); const lb = cl && F(S, cl, '_LimitBreakLevelInWeapon');
      if (lb && lb.items.some((cid) => { const n = F(S, S.parsed.nodes[cid], '_NowLevel'); return n && Number(readValue(S.buf, n)) > 0; })) exclusive++;
    }
  }
  return { obtained, missing, total: obtained.length + missing.length, upgraded, exclusive };
}

module.exports = {
  gameStats, rangeStats, weaponStatus,
  treasures,
  CASE_DIMS, MAX_UPG, quests, completeQuest, CATALOG, CATEGORIES, model, overview, addItem, removeItem, duplicateItem,
  moveItem, setCaseSize, setUpgrade, describeChanges, scalar, sections,
};
