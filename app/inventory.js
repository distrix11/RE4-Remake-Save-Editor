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
  const [id, name, cat, flag] = line.split('|');
  CATALOG[id] = flag === 'noadd' ? { n: name, c: cat, x: 1 } : { n: name, c: cat };
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
  if (!fp) fp = /^27[0-8]/.test(id) && !/^277/.test(id) ? [2, 3] : [1, 1];
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
// pieces per stack in the case (the highest counts seen in real saves, so the editor never goes above what the game made itself); resources do not stack
const STACK_CAP = { 'Handgun Ammo': 50, 'Rifle Ammo': 15, 'Shotgun Ammo': 12, 'Magnum Ammo': 4, 'Submachine Gun Ammo': 30, 'Gunpowder': 10, 'Resources (L)': 1, 'Resources (S)': 1 };
const MAX_UPG = 4; // the highest level seen on fully upgraded weapons in real saves; the game resets higher values

// ---- gems ------------------------------------------------------------------------
// A treasure with sockets keeps _TreasureCombineInfo._Datas: one entry per socket with its shape (0 round, 1 square) and the gem in it
// (-1 = empty). Shapes of the gems as the guides list them; in real saves a Sapphire sits in a shape-0 socket.
const GEM_SHAPE = { 120830400: 0, 120833600: 0, 120835200: 0, 120832000: 1, 120838400: 1, 120857600: 1 }; // Ruby, Sapphire, Yellow Diamond; Emerald, Alexandrite, Red Beryl
// Sockets of every treasure, in the order of the save (crown, necklace and clock seen in real saves; the others from the guides, order not known)
const SOCKETS = {
  122404800: [1, 0, 1, 0, 1], 122412800: [1, 0, 0, 1], 122408000: [0, 1], // Elegant Crown, Ornate Necklace, Extravagant Clock (from saves)
  122406400: [0, 1, 0], 122403200: [0, 0, 0], 122400000: [0, 0, 0], // Golden Lynx, Butterfly Lamp, Elegant Mask (from a save)
  122411200: [1, 1, 1], 122409600: [1, 1], 122416000: [0, 0], 122401600: [0, 0], // Chalice, Splendid Bangle, Elegant Bangle, Flagon (from the guides; order not known)
};
function socketsOf(S, it) {
  const info = F(S, it, '_TreasureCombineInfo'); const datas = info && F(S, info, '_Datas'); if (!datas || !datas.items) return null;
  return datas.items.map((id) => { const d = S.parsed.nodes[id]; const g = F(S, d, '_CombinedItemId');
    return { pos: Number(readValue(S.buf, F(S, d, '_Position'))), shape: Number(readValue(S.buf, F(S, d, '_Shape'))), gem: Number(readValue(S.buf, g)), id: g.id }; });
}

// ---- tree helpers -----------------------------------------------------------
const F = (S, o, name) => { const f = o && o.f && o.f.find((x) => x[0] === name); return f ? S.parsed.nodes[f[1]] : null; };
function sections(S) {
  const nodes = S.parsed.nodes; const root = nodes[S.parsed.root];
  return nodes[root.f[0][1]].items.map((i) => nodes[i]);
}
function invManager(S) { return sections(S).find((o) => o.c.endsWith('InventoryManager.GameSaveData')); }
// The inventories in a fixed order: [0] case, [1] recipes/cases/charms, [2] key items, [3] treasures, then the rest as stored.
// The order inside the save is not the same in every save (some have the treasures first), and the rest of the editor counts on this order.
const INV_KINDS = ['chainsaw.InventorySaveData', 'chainsaw.UniqueInventorySaveData', 'chainsaw.KeyItemInventorySaveData', 'chainsaw.TreasureInventorySaveData'];
function inventories(S) {
  const m = invManager(S); if (!m) return [];
  const list = F(S, m, 'InventorySaveDatas').items.map((i) => S.parsed.nodes[i]);
  const head = INV_KINDS.map((k) => list.find((n) => n.c === k));
  if (head.some((n) => !n)) return list;
  return [...head, ...list.filter((n) => !head.includes(n))];
}
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
      if (catN && readValue(S.buf, catN) === u.cat) { const now = scalar(S, F(S, c, '_NowLevel')); if (now) res.push({ key: u.key, label: u.label, level: now, max: MAX_UPG }); }
    }
  }
  // the exclusive upgrade (bought with Spinel) is a separate block: 0 = not bought, 1 = bought
  const lb = F(S, cl, '_LimitBreakLevelInWeapon');
  if (lb && lb.items && lb.items.length) { const now = scalar(S, F(S, S.parsed.nodes[lb.items[0]], '_NowLevel')); if (now) res.push({ key: 'excl', label: 'Exclusive', level: now, max: 1 }); }
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
  const upg = it.c.endsWith('WeaponItem') ? upgradesOf(S, it) : null;
  let name = cat ? cat.n : null, kind = cat ? cat.c : null;
  if (!cat && upg) {
    // a weapon that is not in the catalogue (for example Ada's weapons of Separate Ways): show it instead of an empty cell
    kind = 'weapon';
    name = upg.some((u) => u.key === 'dura') ? `Knife (not in the catalogue, ID ${id.value})` : `Weapon (not in the catalogue, ID ${id.value})`;
  }
  return {
    idx, nodeId: entry.id, cls: it.c.split('.').pop(), name, cat: kind,
    itemId: id, count: scalar(S, F(S, it, '_CurrentItemCount')), ammo: scalar(S, F(S, it, '_CurrentAmmoCount')),
    durability: scalar(S, F(S, it, '_CurrentDurability')), slot: slotOf(S, entry), dir,
    fp: footprint(id.value, dir % 2 === 1), upg, sockets: it.c.endsWith('CombinableTreasureItem') ? socketsOf(S, it) : null,
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
    return { index, kind: inv.c.split('.').pop(), size: sz, grid, sizes: sz ? Object.entries(CASE_DIMS).map(([level, [w, h]]) => ({ level: Number(level), w, h })) : null, hasSlots: items.some((i) => i.slot), items };
  });
}
// The description the game itself shows for a slot is stored after the data, in the language of the game:
//   "<slot> / <difficulty> / <chapter N>", mode, number of saves, time, chapter, zone, objective, runs, language.
const DIFFICULTY = { 10: 'Assisted', 20: 'Standard', 30: 'Hardcore', 40: 'Professional' }; // 20 and 40 confirmed from real saves
function slotInfo(S) {
  try {
    const text = S.buf.subarray(S.parsed.end).toString('utf16le');
    const parts = text.split(/[\u0000-\u001f\ufffd-\uffff]+/).map((x) => x.trim()).filter((x) => x.length > 2);
    const isTime = (x) => /^\d{1,2}:\d{2}:\d{2}$/.test(x);
    const ti = parts.findIndex((x, i) => x.includes(' / ') && parts.slice(i + 1, i + 5).some(isTime));
    if (ti < 0) return null;
    const clean = (x) => x.replace(/[\u2000-\u2bff\uac00-\ud7ff]+$/, '');
    const seg = parts[ti].split(' / ').map(clean);
    const tIdx = parts.findIndex((x, i) => i > ti && isTime(x));
    const num = (x) => { const m = /(\d+)\s*$/.exec(x || ''); return m ? Number(m[1]) : null; };
    const rest = parts.slice(tIdx + 2).map(clean); // after the chapter line: [zone, objective,] playthroughs, language
    const chapter = num(seg[2]) || num(parts[tIdx + 1]);
    const saves = num(parts[tIdx - 1]);
    const lines = parts.slice(ti + 1, ti + 9).map(clean);
    return { slotText: seg[0], difficultyText: seg[1] && seg[1].replace(/[«»"]/g, ''), chapter, saves, time: parts[tIdx], zone: rest.length >= 4 ? rest[0] : null, goal: rest.length >= 4 ? rest[1] : null, playthrough: num(rest[rest.length - 2]), lines };
  } catch (e) { return null; }
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
  if (o.difficulty) o.difficultyName = DIFFICULTY[o.difficulty.value] || null;
  o.slotInfo = slotInfo(S);
  // look of the attaché case: the skin item selected for the character of this slot in the skin settings (Leon 100000; Ada 380000 in Separate Ways)
  try {
    const host = sections(S).find((x) => F(S, x, 'SkinSettingSaveData'));
    const arr = host && F(S, F(S, host, 'SkinSettingSaveData'), 'Settings');
    if (arr) for (const i of arr.items) {
      const e = S.parsed.nodes[i]; const cid = scalar(S, F(S, e, 'CharacterID')); const it = scalar(S, F(S, e, 'ItemId'));
      if (cid && it && Number(cid.value) === skinCharacter(S)) o.caseSkin = Number(it.value);
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
// Copies a subtree of the tree into S under `parent`. `from` is another open save to copy it from (default: S itself).
function cloneSubtree(S, id, parent, from) {
  const SRC = from || S;
  const nodes = S.parsed.nodes; const src = SRC.parsed.nodes[id];
  if (src.k === 'a' && src.blob) throw new Error('Physics blocks cannot be copied');
  const n = Object.assign({}, src, { p: parent, id: nodes.length });
  nodes.push(n);
  if (src.k === 'o') n.f = src.f.map(([name, cid, fh]) => [name, cloneSubtree(S, cid, n.id, from), fh]);
  else if (src.k === 'a') {
    if (src.et === 0x11) n.items = src.items.map((cid) => cloneSubtree(S, cid, n.id, from));
    else { n.data = Buffer.from(SRC.buf.subarray(src.off, src.off + src.cnt * src.esz)); n.items = []; }
  } else if (src.str === undefined) n.data = Buffer.from(SRC.buf.subarray(src.off, src.off + src.sz));
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

// Grenades are weapon entries without upgrades, one per entry (the heavy and the flash grenade are two cells tall). A save may not hold any, so the entry comes from grenade.json.
// Grenades and eggs are weapon entries of the same kind (a real save: the game writes eggs like grenades, but with _CurrentAmmoCount 1)
const GRENADES = ['277075456', '277077056', '277078656', '277080256', '277081856', '277083456']; // hand, heavy, flash grenade; white, brown, golden egg
const EGGS = ['277080256', '277081856', '277083456'];
let GRENADE_TPL = null;
function addGrenades(S, itemId, count) {
  const m = model(S)[0]; if (!m || !m.grid) throw new Error('There is no attaché case in this slot');
  if (!GRENADE_TPL) GRENADE_TPL = JSON.parse(fs.readFileSync(path.join(__dirname, 'grenade.json'), 'utf8')).tree;
  const src = importTemplate(GRENADE_TPL);
  const want = Math.min(count, 30); let added = 0, last = null;
  try {
    for (; added < want; added++) {
      const dm = model(S)[0]; const place = weaponSpot(dm, itemId); // upright, or lying if only that fits
      if (!place) findSpot(dm, footprint(itemId, false)); // says that there is no room
      const { spot, dir } = place;
      const arrNode = itemList(S, inventories(S)[0]);
      const newId = cloneSubtree(S, src.root, arrNode.id, src);
      arrNode.items.push(newId); arrNode.cnt += 1;
      rebuild(S);
      setEntry(S, lastEntry(S, 0), { itemId, count: 1, slot: spot, newGuid: true });
      if (EGGS.includes(String(itemId))) { const a = F(S, itemObj(S, lastEntry(S, 0)), '_CurrentAmmoCount'); if (a) writeValue(S.buf, a, '1'); }
      const dn = F(S, lastEntry(S, 0), 'CurrDirection'); if (dn) writeValue(S.buf, dn, String(dir));
      last = spot;
    }
  } catch (e) { if (!added) throw e; throw new Error(`Added ${added} of ${want}: ${e.message}`); }
  markObtained(S, itemId);
  return { stacked: false, inv: 0, slot: last, added };
}

function addItem(S, { itemId, count }) {
  const r = addItemRaw(S, { itemId, count }); markObtained(S, itemId); return r;
}
function addItemRaw(S, { itemId, count }) {
  const info = CATALOG[String(itemId)];
  const cat = info ? info.c : null;
  if (GRENADES.includes(String(itemId))) return addGrenades(S, itemId, Math.max(1, Math.floor(Number(count) || 1)));
  if (cat === 'weapon') throw new Error('Weapons are added with "Add weapon…"');
  if (cat === 'money') throw new Error('Money is changed on the "Money" tab');
  const invIdx = cat ? HOME[cat] : 0;
  const m = model(S)[invIdx]; if (!m) throw new Error('There is no suitable inventory in this slot');
  count = Math.max(1, Math.floor(Number(count) || 1));
  // Ammo and treasures stack (one entry with a count). Herbs, sprays and accessories do NOT stack in the game: every piece is its own entry in the case.
  const existing = m.items.find((i) => String(i.itemId.value) === String(itemId));
  const stackable = cat === 'ammo' || cat === 'treasure';
  const separate = cat === 'heal' || cat === 'acc';
  const cap = cat === 'ammo' && info ? STACK_CAP[info.n] : undefined;
  if (stackable && cap) {
    // a stack holds at most "cap" pieces: top up the existing stacks first, the rest goes into new entries
    let left = count;
    for (const e of m.items.filter((i) => String(i.itemId.value) === String(itemId) && i.count && i.count.editable)) {
      const room = cap - Number(e.count.value); if (room <= 0 || left <= 0) continue;
      const put = Math.min(room, left); writeValue(S.buf, S.parsed.nodes[e.count.id], String(Number(e.count.value) + put)); left -= put;
    }
    let added = 0;
    try { while (left > 0 && added < 40) { const put = Math.min(cap, left); addEntry(S, invIdx, itemId, put); left -= put; added++; } }
    catch (e) { throw new Error(added || left < count ? `Added only part: ${e.message}` : e.message); }
    return { stacked: added === 0, inv: invIdx, added };
  }
  if (existing && stackable && existing.count && existing.count.editable) {
    writeValue(S.buf, S.parsed.nodes[existing.count.id], String(Number(existing.count.value) + count));
    return { stacked: true, inv: invIdx };
  }
  if (existing && !stackable && !separate) throw new Error('Such an item is already in the inventory');
  if (!separate) return { ...addEntry(S, invIdx, itemId, count), stacked: false };
  const want = Math.min(count, 30); let added = 0, last = null;
  try { for (; added < want; added++) last = addEntry(S, invIdx, itemId, 1); }
  catch (e) { if (!added) throw e; throw new Error(`Added ${added} of ${want}: ${e.message}`); }
  return { stacked: false, inv: invIdx, slot: last.slot, added };
}
// one new entry in its own free cell (clone of a template entry with a new GUID)
function addEntry(S, invIdx, itemId, count) {
  const m = model(S)[invIdx];
  const tpl = pickTemplate(S, invIdx, itemId);
  const spot = findSpot(m, footprint(itemId, false)); // throws if the case is full
  const arrNode = itemList(S, inventories(S)[invIdx]);
  const newId = cloneSubtree(S, tpl.entryId, arrNode.id);
  arrNode.items.push(newId); arrNode.cnt += 1;
  rebuild(S);
  setEntry(S, lastEntry(S, invIdx), { itemId, count, slot: spot, newGuid: true });
  // the clone may carry a rotation from its template
  const dn = F(S, lastEntry(S, invIdx), 'CurrDirection'); if (dn) writeValue(S.buf, dn, '0');
  if (SOCKETS[String(itemId)]) setSockets(S, lastEntry(S, invIdx), SOCKETS[String(itemId)]);
  return { inv: invIdx, slot: spot };
}
function setSockets(S, entry, shapes) {
  const it = itemObj(S, entry); const info = F(S, it, '_TreasureCombineInfo'); const datas = info && F(S, info, '_Datas'); if (!datas || !datas.items || !datas.items.length) return;
  const first = datas.items[0];
  while (datas.items.length < shapes.length) { datas.items.push(cloneSubtree(S, first, datas.id)); datas.cnt += 1; }
  if (datas.items.length > shapes.length) { datas.items.length = shapes.length; datas.cnt = shapes.length; }
  const entryId = entry.id; rebuild(S);
  const d2 = F(S, F(S, itemObj(S, S.parsed.nodes[entryId]), '_TreasureCombineInfo'), '_Datas');
  d2.items.forEach((id, i) => { const d = S.parsed.nodes[id]; writeValue(S.buf, F(S, d, '_Position'), String(i)); writeValue(S.buf, F(S, d, '_Shape'), String(shapes[i])); writeValue(S.buf, F(S, d, '_CombinedItemId'), '-1'); });
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
// ---- weapons from another slot ---------------------------------------------------
// The weapons of the case of a save, for the "add weapon from another slot" list.
function listWeapons(S) {
  const m = model(S)[0]; if (!m) return [];
  return m.items.filter((i) => i.cls === 'WeaponItem' && i.upg).map((i) => ({
    idx: i.idx, itemId: String(i.itemId.value), name: i.name, fp: i.fp,
    ammo: i.ammo ? Number(i.ammo.value) : null, durability: i.durability ? Number(i.durability.value) : null,
    upg: i.upg.map((u) => ({ key: u.key, level: Number(u.level.value) })),
  }));
}
// Where a weapon would go: lying as it is, or turned if only that fits (null: no room). A weapon that sticks out of the case or covers
// another item is deleted by the game, so there is no other choice.
function weaponSpot(dm, itemId) {
  for (const dir of [0, 1]) { const spot = freeRect(dm, ...footprint(itemId, dir === 1)); if (spot) return { spot, dir }; }
  return null;
}
// For the "Add weapon" list: does it fit this case now ('ok', 'turn' = only turned, 'none'), and how many cells it takes (across × down).
function weaponFit(S, itemId) {
  const dm = model(S)[0]; const fp = footprint(itemId, false);
  const place = dm && dm.grid ? weaponSpot(dm, itemId) : null;
  return { fit: place ? (place.dir ? 'turn' : 'ok') : 'none', size: fp[1] + '×' + fp[0], cells: [fp[1], fp[0]] };
}
// Puts a copy of the weapon entry node `srcNodeId` of `srcS` into the case of `dstS`: same structure (upgrade blocks, ammo, durability), a new GUID and a free cell.
function placeWeapon(dstS, srcS, srcNodeId, itemId, name) {
  const dm = model(dstS)[0]; if (!dm || !dm.grid) throw new Error('There is no attaché case in this slot');
  const place = weaponSpot(dm, itemId);
  if (!place) { const fp = footprint(itemId, false); throw new Error(`No free ${fp[1]}×${fp[0]} space in the case (item sizes are estimates). Increase the case size or free up some room.`); }
  const { spot, dir } = place;
  const arrNode = itemList(dstS, inventories(dstS)[0]);
  const newId = cloneSubtree(dstS, srcNodeId, arrNode.id, srcS);
  arrNode.items.push(newId); arrNode.cnt += 1;
  rebuild(dstS);
  setEntry(dstS, lastEntry(dstS, 0), { slot: spot, newGuid: true });
  const dn = F(dstS, lastEntry(dstS, 0), 'CurrDirection'); if (dn) writeValue(dstS.buf, dn, String(dir));
  // a weapon taken from a slot that was edited wrongly must not spread the mistake: levels above the maximum are cut to it and the exclusive
  // upgrade (which needs every upgrade at the maximum) is taken away when one is lower
  const w = weaponUpgradeNodes(dstS, 0, itemList(dstS, inventories(dstS)[0]).items.length - 1);
  let allMax = true;
  for (const u of upgradesOf(dstS, w.it) || []) {
    if (u.key === 'excl') continue;
    const lv = Number(u.level.value);
    if (lv > MAX_UPG) writeLevel(dstS, w, u.key, MAX_UPG); else if (lv < MAX_UPG) allMax = false;
  }
  if (!allMax) dropExclusiveIfNeeded(dstS, w);
  matchExclusiveState(dstS, w);
  markObtained(dstS, itemId);
  return { slot: spot, name, itemId: String(itemId) };
}
// Real saves: a weapon with the exclusive upgrade has condition 2 and a pattern of 1 or 2; without it both are 0. Kept in step with the switch.
function matchExclusiveState(S, w) {
  const lb = F(S, w.cl, '_LimitBreakLevelInWeapon'); const e = lb && lb.items && lb.items.length ? S.parsed.nodes[lb.items[0]] : null;
  const lv = e && F(S, e, '_NowLevel'); if (!lv) return;
  const on = Number(readValue(S.buf, lv)) > 0;
  for (const name of ['_CurrentCondition', '_LimitBreakCustomPattern']) {
    const n = F(S, w.it, name); if (!n) continue;
    if (!on) writeValue(S.buf, n, '0'); else if (Number(readValue(S.buf, n)) === 0) writeValue(S.buf, n, '2');
  }
}
// The save keeps a list of every item with an "obtained" flag. Every weapon the game itself put into a case has it set.
function markObtained(S, itemId) {
  const mgr = invManager(S); const list = mgr && F(S, mgr, 'ItemGetDataList'); if (!list || !list.items) return;
  for (const i of list.items) {
    const o = S.parsed.nodes[i]; const id = F(S, o, 'ItemID'); const got = F(S, o, 'IsGet');
    if (id && got && String(readValue(S.buf, id)) === String(itemId)) writeValue(S.buf, got, '1');
  }
}
function addWeaponFrom(dstS, srcS, srcIdx) {
  const sm = model(srcS)[0]; const it = sm && sm.items[srcIdx];
  if (!it || it.cls !== 'WeaponItem') throw new Error('That is not a weapon');
  const srcArr = itemList(srcS, inventories(srcS)[0]);
  return placeWeapon(dstS, srcS, srcArr.items[srcIdx], it.itemId.value, it.name);
}

// ---- weapon library ------------------------------------------------------------
// A weapon entry written out as plain JSON (structure + raw bytes), so that it can be kept in a file and put into any save later.
function exportTemplate(S, nodeId) {
  const n = S.parsed.nodes[nodeId]; const hex = (off, len) => S.buf.subarray(off, off + len).toString('hex');
  if (n.k === 'o') return { k: 'o', n: n.n, ch: n.ch, c: n.c, f: n.f.map(([name, cid, fh]) => [name, exportTemplate(S, cid), fh]) };
  if (n.k === 'a') {
    if (n.blob) throw new Error('Physics blocks cannot be exported');
    const o = { k: 'a', n: n.n, fh: n.fh, et: n.et, esz: n.esz, cnt: n.cnt, fl: n.fl };
    if (n.et === 0x11) o.items = n.items.map((cid) => exportTemplate(S, cid)); else o.data = hex(n.off, n.cnt * n.esz);
    return o;
  }
  const o = { k: 'v', n: n.n, fh: n.fh, tag: n.tag, sz: n.sz };
  if (n.str !== undefined) o.str = n.str; else o.data = hex(n.off, n.sz);
  return o;
}
// the reverse: a small "save" (nodes + bytes) that cloneSubtree can copy from
function importTemplate(tpl) {
  const nodes = []; const parts = []; let size = 0;
  const put = (hex) => { const b = Buffer.from(hex, 'hex'); const off = size; parts.push(b); size += b.length; return off; };
  const walk = (t, parent) => {
    const n = { id: nodes.length, p: parent }; nodes.push(n);
    if (t.k === 'o') { Object.assign(n, { k: 'o', n: t.n, ch: t.ch, c: t.c }); n.f = t.f.map(([name, c, fh]) => [name, walk(c, n.id), fh]); }
    else if (t.k === 'a') { Object.assign(n, { k: 'a', n: t.n, fh: t.fh, et: t.et, esz: t.esz, cnt: t.cnt, fl: t.fl }); if (t.et === 0x11) n.items = t.items.map((c) => walk(c, n.id)); else { n.items = []; n.off = put(t.data); } }
    else { Object.assign(n, { k: 'v', n: t.n, fh: t.fh, tag: t.tag, sz: t.sz }); if (t.str !== undefined) n.str = t.str; else n.off = put(t.data); }
    return n.id;
  };
  const root = walk(tpl, -1);
  return { buf: Buffer.concat(parts), parsed: { nodes }, root };
}
// The ready-made weapons of weapons.json: { "<itemId>": { name?, sw: bool, tree } }. sw = a weapon of Separate Ways (the game drops weapons of the other campaign).
let LIB = null;
function weaponLibrary() {
  if (!LIB) { try { LIB = JSON.parse(fs.readFileSync(path.join(__dirname, 'weapons.json'), 'utf8')).weapons || {}; } catch { LIB = {}; } }
  return LIB;
}
function caseEntry(S, idx) { return S.parsed.nodes[itemList(S, inventories(S)[0]).items[idx]]; }
// The game deletes a weapon the profile has no right to; the editor cannot see that right in a save, so it warns.
const LOCKED_NOTE = {
  '275157056': 'Bonus weapon: the game deletes it unless you have unlocked it.',
  '275638656': 'Bonus weapon: the game may delete it unless you have unlocked it.',
  '278035456': 'Extra content (DLC): the game may delete it if you do not own it.',
};
function libraryList(separateWays) {
  return Object.entries(weaponLibrary()).filter(([, w]) => !!w.sw === !!separateWays).map(([id, w]) => {
    const cat = CATALOG[id];
    return { itemId: id, name: cat ? cat.n : (w.name || 'Weapon (ID ' + id + ')'), upg: w.upg || [], note: LOCKED_NOTE[id] || null };
  }).sort((x, y) => x.name.localeCompare(y.name));
}
// A fresh weapon from the library: no upgrades, no exclusive upgrade, nothing loaded.
function addWeaponFromLibrary(dstS, itemId, separateWays) {
  const w = weaponLibrary()[String(itemId)];
  if (!w || !!w.sw !== !!separateWays) throw new Error('This weapon is not available for this campaign');
  const src = importTemplate(w.tree);
  const cat = CATALOG[String(itemId)];
  const r = placeWeapon(dstS, src, src.root, itemId, cat ? cat.n : (w.name || 'Weapon ' + itemId));
  const idx = itemList(dstS, inventories(dstS)[0]).items.length - 1;
  try { setAllUpgrades(dstS, 0, idx, 0); } catch { /* a weapon without upgrades (rocket launcher) */ }
  // the template keeps the durability of the knife it was taken from: a new one gets the durability of an unupgraded knife
  const fresh = model(dstS)[0].items[idx]; const max = fresh && fresh.durability ? knifeMax(fresh) : null;
  if (max) writeValue(dstS.buf, dstS.parsed.nodes[fresh.durability.id], String(max));
  return r;
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
// The look of the attaché case: the skin item chosen in the skin settings for the character of the slot (see skinCharacter). A skin the player does not own yet is added to the
// "recipes, cases, charms" inventory first, so the game lists it as unlocked.
// The skin settings hold one entry per character: Leon 100000, Ashley 110000, Ada 380000. A Separate Ways slot (chapter ids start with 3) is played
// with Ada, every other slot with Leon.
function skinCharacter(S) {
  // (not gameStats(): that calls overview(), which calls this function)
  try {
    const sec = sections(S).find((o) => o.c.endsWith('GameStatsManager.GameSaveData'));
    const hist = sec && F(S, sec, '_CurrentChapterStatsHistorySave');
    const first = hist && hist.items && hist.items.length ? S.parsed.nodes[hist.items[0]] : null;
    const ch = first && F(S, first, '_Chapter');
    return ch && ch.k === 'v' && String(readValue(S.buf, ch))[0] === '3' ? 380000 : 100000;
  } catch (e) { return 100000; }
}
const CASE_SKIN_IDS = [124176000, 124177600, 124179200, 124192000, 124193600];
function skinEntry(S) {
  const host = sections(S).find((x) => F(S, x, 'SkinSettingSaveData'));
  const arr = host && F(S, F(S, host, 'SkinSettingSaveData'), 'Settings');
  if (arr) for (const i of arr.items) {
    const e = S.parsed.nodes[i]; const cid = scalar(S, F(S, e, 'CharacterID'));
    if (cid && Number(cid.value) === skinCharacter(S)) return F(S, e, 'ItemId');
  }
  return null;
}
function setCaseSkin(S, skinId) {
  skinId = Number(skinId);
  if (!CASE_SKIN_IDS.includes(skinId)) throw new Error('Unknown case skin');
  if (!skinEntry(S)) throw new Error('This slot has no skin settings');
  const m = model(S)[HOME.special];
  const owned = !!(m && m.items.some((i) => String(i.itemId.value) === String(skinId)));
  if (!owned) addItem(S, { itemId: skinId, count: 1 }); // rebuilds the tree: look the skin node up again afterwards
  writeValue(S.buf, skinEntry(S), String(skinId));
  return { ok: true, added: !owned };
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
// Tidy up the attaché case: items are packed to the left, grouped by kind (weapons, throwables, healing, ammo, accessories, the rest), big ones first.
// Rotations are kept. Nothing is written unless every item finds a place.
const SORT_ORDER = ['weapon', 'throw', 'heal', 'ammo', 'acc'];
function sortCase(S, invIdx) {
  const m = model(S)[invIdx]; if (!m || !m.grid || invIdx !== 0) throw new Error('Only the attaché case can be sorted');
  const [W, H] = m.grid;
  const items = m.items.filter((i) => i.slot);
  const rank = (c) => { const k = SORT_ORDER.indexOf(c); return k < 0 ? SORT_ORDER.length : k; };
  const area = (i) => i.fp[0] * i.fp[1];
  const byName = (a, b) => String(a.name || '').localeCompare(String(b.name || '')) || String(a.itemId.value).localeCompare(String(b.itemId.value));
  const orders = [
    (a, b) => rank(a.cat) - rank(b.cat) || area(b) - area(a) || byName(a, b),
    (a, b) => area(b) - area(a) || Math.max(...b.fp) - Math.max(...a.fp) || rank(a.cat) - rank(b.cat) || byName(a, b),
  ];
  let plan = null;
  for (const cmp of orders) {
    const used = Array.from({ length: W }, () => new Array(H).fill(false)); const out = [];
    const fits = (x, y, w, h) => { if (x + w > W || y + h > H) return false; for (let a = 0; a < w; a++) for (let b = 0; b < h; b++) if (used[x + a][y + b]) return false; return true; };
    let ok = true;
    for (const it of [...items].sort(cmp)) {
      const [w, h] = it.fp; let spot = null;
      for (let y = 0; y + h <= H && !spot; y++) for (let x = 0; x + w <= W && !spot; x++) if (fits(x, y, w, h)) spot = { x, y };
      if (!spot) { ok = false; break; }
      for (let a = 0; a < w; a++) for (let b = 0; b < h; b++) used[spot.x + a][spot.y + b] = true;
      out.push([it, spot]);
    }
    if (ok) { plan = out; break; }
  }
  if (!plan) throw new Error('Cannot sort: the items do not all fit when packed (item sizes are estimates). Nothing was changed.');
  const arr = itemList(S, inventories(S)[invIdx]); let moved = 0;
  for (const [it, spot] of plan) {
    if (it.slot.x === spot.x && it.slot.y === spot.y) continue;
    setEntry(S, S.parsed.nodes[arr.items[it.idx]], { slot: spot }); moved++;
  }
  return { moved };
}
// Weapon upgrade levels. Every normal upgrade category entry holds a _NowLevel plus the effect fields it drives (which fields differ by weapon:
// e.g. the Handcannon and the SR M1903 reload through _ReloadNumLevel, other guns through _ReloadSpeedRateLevel). The fields that are non-zero now are
// the effect fields of that entry, so they are all written together with _NowLevel; only an entry that is all zero falls back to the defaults.
const RELOAD_NUM = new Set(['275638656', '275475456']); // Handcannon, SR M1903
const PUMP_RAPID = new Set(['275475456']);               // SR M1903 also has a bolt-action fire rate
function effectFields(S, c) {
  return c.f.filter(([name, id]) => /Level$/.test(name) && name !== '_NowLevel' && S.parsed.nodes[id] && S.parsed.nodes[id].k === 'v' && Number(readValue(S.buf, S.parsed.nodes[id])) !== 0).map(([name]) => name);
}
function weaponUpgradeNodes(S, invIdx, idx) {
  // invIdx 'storage': a weapon in the storage of the Merchant (the same weapon object as in the case)
  const arrN = invIdx === 'storage' ? storageArr(S) : itemList(S, inventories(S)[invIdx]); const entry = arrN && S.parsed.nodes[arrN.items[idx]];
  if (!entry) throw new Error('No such item');
  const it = itemObj(S, entry); const cl = F(S, it, '_CustomLevelInWeapon');
  if (!cl) throw new Error('This item has no upgrades');
  return { it, cl, wid: String(readValue(S.buf, F(S, it, '_ItemId'))) };
}
function writeLevel(S, w, key, level) {
  if (key === 'excl') {
    const lb = F(S, w.cl, '_LimitBreakLevelInWeapon'); const e = lb && lb.items && lb.items.length ? S.parsed.nodes[lb.items[0]] : null;
    const n = e && F(S, e, '_NowLevel'); if (!n) throw new Error('This weapon has no exclusive upgrade');
    writeValue(S.buf, n, String(level)); matchExclusiveState(S, w); return 1;
  }
  const u = UPG.find((x) => x.key === key); if (!u) throw new Error('Unknown upgrade');
  const list = F(S, w.cl, u.arr); let done = 0;
  for (const cid of (list && list.items) || []) {
    const c = S.parsed.nodes[cid]; const catN = F(S, c, u.catField);
    if (!catN || readValue(S.buf, catN) !== u.cat) continue;
    let fields = effectFields(S, c);
    if (!fields.length) {
      fields = [...u.fields];
      if (key === 'reload' && RELOAD_NUM.has(w.wid)) fields = ['_ReloadNumLevel'];
      if (key === 'rapid' && PUMP_RAPID.has(w.wid)) fields.push('_PumpActionRapidSpeedLevel');
    }
    for (const fld of [...fields, '_NowLevel']) { const n = F(S, c, fld); if (n) writeValue(S.buf, n, String(level)); }
    done++;
  }
  if (!done) throw new Error('This weapon has no such upgrade');
  return done;
}
// the exclusive upgrade needs every normal upgrade at the maximum: if one is lowered, it is taken away too
function dropExclusiveIfNeeded(S, w) {
  const lb = F(S, w.cl, '_LimitBreakLevelInWeapon'); const e = lb && lb.items && lb.items.length ? S.parsed.nodes[lb.items[0]] : null;
  const n = e && F(S, e, '_NowLevel');
  if (n && Number(readValue(S.buf, n)) > 0) { writeValue(S.buf, n, '0'); matchExclusiveState(S, w); return true; }
  return false;
}
function setGem(S, invIdx, idx, pos, gemId) {
  const it = model(S)[invIdx] && model(S)[invIdx].items[idx]; if (!it || !it.sockets) throw new Error('This treasure has no sockets');
  const sock = it.sockets.find((x) => x.pos === Number(pos)); if (!sock) throw new Error('No such socket');
  gemId = Number(gemId);
  if (gemId !== -1) { if (!(gemId in GEM_SHAPE)) throw new Error('That is not a gem'); if (GEM_SHAPE[gemId] !== sock.shape) throw new Error(sock.shape ? 'This socket takes a square gem (Emerald, Alexandrite, Red Beryl)' : 'This socket takes a round gem (Ruby, Sapphire, Yellow Diamond)'); }
  writeValue(S.buf, S.parsed.nodes[sock.id], String(gemId));
  return { ok: true };
}
function setUpgrade(S, invIdx, idx, key, level) {
  level = Number(level);
  const max = key === 'excl' ? 1 : MAX_UPG;
  if (!Number.isInteger(level) || level < 0 || level > max) throw new Error(`Level must be between 0 and ${max}`);
  const w = weaponUpgradeNodes(S, invIdx, idx);
  writeLevel(S, w, key, level);
  const exclReset = key !== 'excl' && level < MAX_UPG && dropExclusiveIfNeeded(S, w);
  return { ok: true, exclReset };
}
// every normal upgrade the weapon has to the maximum (level = 4) or back to zero (level = 0, also takes the exclusive upgrade away)
function setAllUpgrades(S, invIdx, idx, level) {
  level = Number(level);
  if (level !== 0 && level !== MAX_UPG) throw new Error('Unsupported level');
  const w = weaponUpgradeNodes(S, invIdx, idx); let n = 0;
  for (const u of UPG) { try { writeLevel(S, w, u.key, level); n++; } catch (e) { /* this weapon has no such upgrade */ } }
  if (!n) throw new Error('This weapon has no upgrades');
  const exclReset = level === 0 && dropExclusiveIfNeeded(S, w);
  return { ok: true, changed: n, exclReset };
}

// ---- storage -----------------------------------------------------------------------
// The storage the game opens at the Merchant keeps ArmouryManager.ArmouryItems: one ArmouryItemSaveData per item, with the item itself
// (the same object as in the case) and two counters (1 and 1 for weapons in real saves). The editor moves weapons only.
function storageArr(S) { const h = sections(S).find((o) => o.c.endsWith('ArmouryManager.GameSaveData')); return h ? F(S, h, 'ArmouryItems') : null; }
function storage(S) { const a = storageArr(S); return a ? a.items.map((id, i) => entryModel(S, S.parsed.nodes[id], i)).filter(Boolean) : null; }
let ARMOURY_TPL = null;
// a new storage entry that holds a copy of the item node itemNodeId of srcS
function putInStorage(S, srcS, itemNodeId) {
  const arr = storageArr(S); if (!arr) throw new Error('This slot has no storage');
  if (!ARMOURY_TPL) ARMOURY_TPL = JSON.parse(fs.readFileSync(path.join(__dirname, 'armoury.json'), 'utf8')).tree;
  const src = importTemplate(ARMOURY_TPL);
  const wrapId = cloneSubtree(S, src.root, arr.id, src); const wrap = S.parsed.nodes[wrapId];
  const fi = wrap.f.findIndex((x) => x[0] === 'Item'); wrap.f[fi] = [wrap.f[fi][0], cloneSubtree(S, itemNodeId, wrapId, srcS), wrap.f[fi][2]];
  arr.items.push(wrapId); arr.cnt += 1;
  rebuild(S);
}
// The case keeps the equipped weapon (EquipInfos) and the quick slots (ShortcutInfos) by the GUID of the item. When the game stores a
// weapon it empties its quick slots (ID 0, ItemId -1, ItemCount 0xFFFFFFFF, seen in a real save); an equipped weapon must be changed in the game.
function freeQuickSlots(S, guid) {
  const inv = inventories(S)[0]; const same = (n) => n && n.sz === 16 && S.buf.subarray(n.off, n.off + 16).equals(guid);
  const eq = F(S, inv, 'EquipInfos'); if (eq && eq.items && eq.items.some((id) => same(F(S, S.parsed.nodes[id], 'ID')))) throw new Error('This weapon is equipped - equip another weapon in the game first');
  const sc = F(S, inv, 'ShortcutInfos'); if (!sc || !sc.items) return;
  for (const id of sc.items) {
    const o = S.parsed.nodes[id]; const g = F(S, o, 'ID'); if (!same(g)) continue;
    S.buf.fill(0, g.off, g.off + 16); writeValue(S.buf, F(S, o, 'ItemId'), '-1'); writeValue(S.buf, F(S, o, 'ItemCount'), '4294967295');
  }
}
// a weapon of the case goes into the storage (the same item: upgrades, ammo, its GUID)
function caseToStorage(S, idx) {
  const it = model(S)[0] && model(S)[0].items[idx]; if (!it) throw new Error('No such item');
  if (it.cls !== 'WeaponItem' || it.cat === 'throw') throw new Error('Only weapons can be put into the storage');
  const entry = caseEntry(S, idx); const guid = guidOf(S, entry);
  if (guid) freeQuickSlots(S, guid); // as the game does when it stores a weapon: its quick slots are emptied; an equipped weapon is refused
  const itemId = itemObj(S, entry).id;
  // out of the case first (the GUID check of removeItem would see the copy in the storage), then into the storage in the same rebuild
  const arr = itemList(S, inventories(S)[0]); arr.items.splice(idx, 1); arr.cnt -= 1;
  putInStorage(S, S, itemId);
  return { ok: true, name: it.name };
}
// a weapon of the storage goes into the case, to a free place (lying or turned)
function storageToCase(S, sIdx) {
  const st = storage(S); const it = st && st[sIdx]; if (!it) throw new Error('No such item in the storage');
  const dm = model(S)[0]; if (!dm || !dm.grid) throw new Error('There is no attaché case in this slot');
  const place = weaponSpot(dm, it.itemId.value);
  if (!place) { const fp = footprint(it.itemId.value, false); throw new Error(`No free ${fp[1]}×${fp[0]} space in the case. Free up some room (or press Sort) first.`); }
  const tpl = pickTemplate(S, 0, it.itemId.value); // an entry of the case with a weapon: its frame (cell, direction) is used
  const arr = itemList(S, inventories(S)[0]);
  const newId = cloneSubtree(S, tpl.entryId, arr.id); const entry = S.parsed.nodes[newId];
  const fi = entry.f.findIndex((x) => x[0] === 'Item'); const wrapItem = F(S, S.parsed.nodes[storageArr(S).items[sIdx]], 'Item');
  entry.f[fi] = [entry.f[fi][0], cloneSubtree(S, wrapItem.id, newId), entry.f[fi][2]];
  arr.items.push(newId); arr.cnt += 1;
  const sa = storageArr(S); sa.items.splice(sIdx, 1); sa.cnt -= 1;
  rebuild(S);
  setEntry(S, lastEntry(S, 0), { slot: place.spot });
  const dn = F(S, lastEntry(S, 0), 'CurrDirection'); if (dn) writeValue(S.buf, dn, String(place.dir));
  return { ok: true, name: it.name, slot: place.spot };
}
// a new weapon of the library straight into the storage (when the case is full)
function libraryToStorage(S, itemId, separateWays) {
  const w = weaponLibrary()[String(itemId)];
  if (!w || !!w.sw !== !!separateWays) throw new Error('This weapon is not available for this campaign');
  const src = importTemplate(w.tree); const item = F(src, src.parsed.nodes[src.root], 'Item');
  putInStorage(S, src, item.id);
  const sa = storageArr(S); const wrap = S.parsed.nodes[sa.items[sa.items.length - 1]]; const it = F(S, wrap, 'Item');
  const g = F(S, it, '_ID'); if (g && g.sz === 16) crypto.randomBytes(16).copy(S.buf, g.off);
  // no upgrades, as a new weapon of the case
  const cl = F(S, it, '_CustomLevelInWeapon');
  if (cl) for (const u of UPG) { const a = F(S, cl, u.arr); if (a && a.items) for (const cid of a.items) { const c = S.parsed.nodes[cid]; const cat = F(S, c, u.catField); if (cat && readValue(S.buf, cat) === u.cat) for (const fld of [...u.fields, '_NowLevel']) { const n = F(S, c, fld); if (n) writeValue(S.buf, n, '0'); } } }
  markObtained(S, itemId);
  const cat = CATALOG[String(itemId)]; return { ok: true, name: cat ? cat.n : (w.name || 'Weapon ' + itemId) };
}

// ---- quick actions --------------------------------------------------------------
// Full durability of a knife by its durability upgrade level (0-4). Combat 2200, Fighting 1500-1800 and Boot 500 agree with real saves, the other
// levels with the public upgrade tables. Knives that are not listed (and levels that are not known) are left alone.
const KNIFE_MAX = {
  '276435456': [1000, 1200, 1500, 1800, 2200], // Combat
  '276437056': [1400, 1500, 1600, 1700, 1800], // Fighting
  '276445056': [1600, 1800, 2000, 2200, 2400], // Primal
  '276440256': [500], // Boot (no upgrades)
  '278206656': { 4: 2200 }, // Tactical (Separate Ways): only the top level has been seen
};
function knifeMax(it) {
  const t = KNIFE_MAX[String(it.itemId.value)]; if (!t) return null;
  const u = (it.upg || []).find((x) => x.key === 'dura');
  return t[u ? Number(u.level.value) : 0] || null;
}
function repairKnives(S) {
  const m = model(S)[0]; let changed = 0, unknown = 0;
  for (const it of m ? m.items : []) {
    if (!it.durability || !it.durability.editable) continue;
    const max = knifeMax(it);
    if (max === null) { if (/Knife/.test(it.name || '')) unknown++; continue; }
    if (Number(it.durability.value) < max) { writeValue(S.buf, S.parsed.nodes[it.durability.id], String(max)); changed++; }
  }
  return { changed, unknown };
}
// every weapon of the case to the maximum level of every normal upgrade (the exclusive upgrades are left as they are)
function upgradeAllWeapons(S) {
  const m = model(S)[0]; let changed = 0;
  for (const it of m ? m.items : []) {
    if (it.cls !== 'WeaponItem' || !it.upg) continue;
    if (it.upg.filter((u) => u.key !== 'excl').every((u) => Number(u.level.value) >= MAX_UPG)) continue;
    setAllUpgrades(S, 0, it.idx, MAX_UPG); changed++;
  }
  return { changed };
}
// every ammunition and gunpowder stack of the case up to its full size (the sizes of STACK_CAP; other kinds are left alone)
function fillStacks(S) {
  const m = model(S)[0]; let changed = 0;
  for (const it of m ? m.items : []) {
    const cap = it.cat === 'ammo' ? STACK_CAP[it.name] : undefined;
    if (!cap || !it.count || !it.count.editable || Number(it.count.value) >= cap) continue;
    writeValue(S.buf, S.parsed.nodes[it.count.id], String(cap)); changed++;
  }
  return { changed };
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
// Mark the flag objectives of a request as completed. Item hand-ins and the medallion counters (GameOccurrence: the game counts the
// medallions really destroyed and ignores a mark, checked in the game) are left alone.
const EDITABLE_GOAL = (sub) => sub.type === 'Flag';
function completeQuest(S, idx) {
  const list = quests(S); const targets = idx === 'all' ? list : [list[idx]];
  let changed = 0;
  for (const q of targets) {
    if (!q) throw new Error('No such request');
    for (const sub of q.subs) if (EDITABLE_GOAL(sub) && sub.completed && Number(sub.completed.value) !== 1) {
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
      const up = upgradesOf(S, it); if (up && up.some((u) => u.key !== 'excl' && Number(u.level.value) > 0)) upgraded++;
      const cl = F(S, it, '_CustomLevelInWeapon'); const lb = cl && F(S, cl, '_LimitBreakLevelInWeapon');
      if (lb && lb.items.some((cid) => { const n = F(S, S.parsed.nodes[cid], '_NowLevel'); return n && Number(readValue(S.buf, n)) > 0; })) exclusive++;
    }
  }
  return { obtained, missing, total: obtained.length + missing.length, upgraded, exclusive };
}

module.exports = {
  gameStats, rangeStats, weaponStatus,
  treasures,
  CASE_DIMS, MAX_UPG, sortCase, weaponFit, listWeapons, addWeaponFrom, addWeaponFromLibrary, libraryList, exportTemplate, importTemplate, weaponLibrary, caseEntry, itemObj, writeLevel, weaponUpgradeNodes, setCaseSkin, setAllUpgrades, quests, completeQuest, CATALOG, CATEGORIES, model, overview, addItem, removeItem, duplicateItem,
  moveItem, setCaseSize, storage, caseToStorage, storageToCase, libraryToStorage, setGem, GEM_SHAPE, repairKnives, fillStacks, upgradeAllWeapons, setUpgrade, describeChanges, scalar, sections,
};
