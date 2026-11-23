'use strict';
// Static pseudo-3D attaché case drawn with CSS only (original artwork, no game assets). The case takes the look of the
// skin selected in the save. Items are vector pictograms; click to select. To move items use the flat "Map" view.
const CASE_SKINS = {
  124176000: { name: 'Silver', c1: '#c3cacf', c2: '#7b858c', edge: '#4f585e', trim: '#e9edf0', latch: '#d5dadd' },
  124177600: { name: 'Black', c1: '#3a3e42', c2: '#15171a', edge: '#0b0c0e', trim: '#5a6066', latch: '#8c949a' },
  124179200: { name: 'Leather', c1: '#8a5430', c2: '#4a2a14', edge: '#2e1809', trim: '#c58a55', latch: '#c9ad6a' },
  124192000: { name: 'Gold', c1: '#f0d472', c2: '#a97d1f', edge: '#6b4e0f', trim: '#fff3b8', latch: '#fff0a8' },
  124193600: { name: 'Classic', c1: '#8b8559', c2: '#4b472c', edge: '#2c2917', trim: '#bdb685', latch: '#c9ad6a' },
};
const clampN = (v, a, b) => Math.max(a, Math.min(b, v));

function drawCase3D(holder, inv) {
  holder.innerHTML = '';
  const [W, H] = inv.grid;
  const skin = CASE_SKINS[data && data.overview && data.overview.caseSkin] || CASE_SKINS[124176000];
  const cell = clampN(Math.floor(500 / W), 28, 46), pad = 22;
  const w = W * cell + pad * 2, h = H * cell + pad * 2;
  const tilt = 40;
  const card = document.createElement('div'); card.className = 'card';
  const scene = document.createElement('div'); scene.className = 'scene3d';
  scene.style.height = Math.round(h * Math.cos(tilt * Math.PI / 180) + h * 0.55 + 60) + 'px';
  const box = document.createElement('div'); box.className = 'case3d';
  box.style.cssText = `width:${w}px;height:${h}px;--cell:${cell}px;--c1:${skin.c1};--c2:${skin.c2};--ce:${skin.edge};--ct:${skin.trim};transform:rotateX(${tilt}deg)`;

  const lid = document.createElement('div'); lid.className = 'lid3d';
  lid.innerHTML = '<div class="lidpad"></div><div class="strap" style="top:30%"></div><div class="strap" style="top:60%"></div>';
  const shell = document.createElement('div'); shell.className = 'shell3d';
  const foam = document.createElement('div'); foam.className = 'foam3d';
  foam.style.cssText = `left:${pad}px;top:${pad}px;width:${W * cell}px;height:${H * cell}px`;
  for (const it of inv.items) {
    if (!it.slot) continue;
    const nm = itemName(it) || '#' + it.itemId.value;
    const el = document.createElement('div');
    el.className = 'i3 c-' + (it.cat || 'other') + (ui.sel === it.idx ? ' sel' : '');
    const bw = it.fp[0] * cell, bh = it.fp[1] * cell;
    el.style.cssText = `left:${it.slot.x * cell}px;top:${it.slot.y * cell}px;width:${bw}px;height:${bh}px`;
    el.title = `${nm}\nID ${it.itemId.value}\ncell ${it.slot.x},${it.slot.y}`;
    const art = typeof itemArt === 'function' ? itemArt(nm, it.cat, it.fp) : { svg: null };
    let inner;
    if (art.svg && art.turn) inner = `<div class="turned" style="width:${bh - 4}px;height:${bw - 4}px">${art.svg}</div>`;
    else if (art.svg) inner = art.svg;
    else inner = `<span class="fallback">${ic(it.cat || 'box')}</span>`;
    el.innerHTML = inner + (it.count && Number(it.count.value) > 1 ? '<span class="cn">' + it.count.value + '</span>' : '');
    el.onclick = () => { ui.sel = it.idx; drawCase3D(holder, inv); };
    foam.append(el);
  }
  shell.append(foam);
  const latches = document.createElement('div'); latches.className = 'latches3d'; latches.style.setProperty('--cl', skin.latch);
  latches.innerHTML = '<i style="left:18%"></i><i style="left:50%"></i><i style="left:82%"></i>';
  box.append(lid, shell, latches); scene.append(box);
  const tools = document.createElement('div'); tools.className = 'toolbar'; tools.style.cssText = 'margin:0 0 6px';
  tools.innerHTML = `<span class="dim" style="font-size:12px">Your case: <b>${esc(skin.name)}</b> (taken from the save). Click an item to select it. Switch to “Map” to move items.</span>`;
  card.append(tools, scene);

  const sel = inv.items.find((i) => i.idx === ui.sel && i.slot);
  const bar = document.createElement('div'); bar.className = 'selbar';
  if (sel) {
    const nm = itemName(sel) || 'Item #' + sel.itemId.value;
    const info = document.createElement('div');
    info.innerHTML = `<div class="iname">${esc(nm)}</div><div class="dim mono" style="font-size:11px">ID ${sel.itemId.value} · cell ${sel.slot.x},${sel.slot.y} · ${sel.fp[0]}×${sel.fp[1]} (estimate)</div>`;
    bar.append(info);
    if (sel.count) { const l = document.createElement('label'); l.className = 'f'; l.style.width = '110px'; l.innerHTML = '<span>Count</span>'; l.append(field(sel.count, { width: '100%' })); bar.append(l); }
    const dup = document.createElement('button'); dup.className = 'sm'; dup.innerHTML = ic('copy') + 'Copy';
    dup.onclick = () => structural('dup', { inv: inv.index, idx: sel.idx }, 'Copy created');
    const del = document.createElement('button'); del.className = 'sm danger'; del.innerHTML = ic('trash') + 'Delete';
    del.onclick = () => { if (confirm('Delete "' + nm + '" from the case?')) { ui.sel = null; structural('remove', { inv: inv.index, idx: sel.idx }, 'Removed'); } };
    bar.append(Object.assign(document.createElement('span'), { className: 'sp' }), dup, del);
  } else bar.innerHTML = '<span class="dim">Click an item to select it.</span>';
  card.append(bar);
  holder.append(card);
}
