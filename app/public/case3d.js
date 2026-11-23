'use strict';
// A pseudo-3D attaché case drawn with CSS 3D transforms only (original artwork, no game assets).
// Items can be selected here; to move them switch back to the flat "Map" view.
const view3d = { rx: 54, rz: -6 };
const clampN = (v, a, b) => Math.max(a, Math.min(b, v));
// a column of stacked shadows gives the slab its thickness
const slab = (n, hue, light0, step) => Array.from({ length: n }, (_, i) => `0 ${i + 1}px 0 hsl(${hue} 22% ${Math.max(6, light0 - i * step)}%)`).join(',');

function drawCase3D(holder, inv) {
  holder.innerHTML = '';
  const [W, H] = inv.grid;
  const cell = clampN(Math.floor(440 / W), 24, 34), pad = 24;
  const w = W * cell + pad * 2, h = H * cell + pad * 2;
  const card = document.createElement('div'); card.className = 'card';
  const scene = document.createElement('div'); scene.className = 'scene3d';
  scene.style.height = Math.round(h * 0.7 + 190) + 'px';
  const box = document.createElement('div'); box.className = 'case3d'; box.style.cssText = `width:${w}px;height:${h}px;--cell:${cell}px`;
  const apply = () => { box.style.transform = `rotateX(${view3d.rx}deg) rotateZ(${view3d.rz}deg)`; };
  apply();

  // open lid, hinged along the back edge
  const lid = document.createElement('div'); lid.className = 'lid3d';
  lid.style.boxShadow = slab(10, 140, 24, 1.4).replace(/0 (\d+)px/g, '0 -$1px');
  lid.innerHTML = '<div class="lidpad"></div><div class="strap" style="top:26%"></div><div class="strap" style="top:50%"></div><div class="strap" style="top:74%"></div>';
  // body of the case
  const shell = document.createElement('div'); shell.className = 'shell3d';
  shell.style.boxShadow = slab(18, 140, 26, 1.1) + ',0 40px 50px rgba(0,0,0,.6)';
  const foam = document.createElement('div'); foam.className = 'foam3d';
  foam.style.cssText = `left:${pad}px;top:${pad}px;width:${W * cell}px;height:${H * cell}px`;
  for (const it of inv.items) {
    if (!it.slot) continue;
    const el = document.createElement('div');
    el.className = 'i3 mi c-' + (it.cat || 'other') + (ui.sel === it.idx ? ' sel' : '');
    el.style.cssText = `left:${it.slot.x * cell}px;top:${it.slot.y * cell}px;width:${it.fp[0] * cell}px;height:${it.fp[1] * cell}px;cursor:pointer`;
    const nm = itemName(it) || '#' + it.itemId.value;
    el.title = `${nm}\nID ${it.itemId.value}\ncell ${it.slot.x},${it.slot.y}`;
    el.innerHTML = ic(it.cat || 'box') + (it.fp[0] * it.fp[1] > 1 ? '<span class="nm">' + esc(nm) + '</span>' : '') + (it.count && Number(it.count.value) > 1 ? '<span class="cn">' + it.count.value + '</span>' : '');
    el.onclick = () => { ui.sel = it.idx; drawCase3D(holder, inv); };
    foam.append(el);
  }
  shell.append(foam);
  const latches = document.createElement('div'); latches.className = 'latches3d';
  latches.innerHTML = '<i style="left:18%"></i><i style="left:50%"></i><i style="left:82%"></i>';
  box.append(lid, shell, latches); scene.append(box);

  // drag the scene to turn the case
  scene.onpointerdown = (e) => {
    if (e.target.closest('.i3')) return;
    scene.setPointerCapture(e.pointerId);
    const sx = e.clientX, sy = e.clientY, rx0 = view3d.rx, rz0 = view3d.rz; scene.classList.add('turning');
    scene.onpointermove = (ev) => { view3d.rz = clampN(rz0 + (ev.clientX - sx) / 5, -45, 45); view3d.rx = clampN(rx0 - (ev.clientY - sy) / 5, 18, 78); apply(); };
    scene.onpointerup = () => { scene.onpointermove = null; scene.onpointerup = null; scene.classList.remove('turning'); };
  };
  const tools = document.createElement('div'); tools.className = 'toolbar'; tools.style.cssText = 'justify-content:space-between;margin:0 0 6px';
  tools.innerHTML = '<span class="dim" style="font-size:12px">Drag the background to turn the case. Click an item to select it. Switch to “Map” to move items.</span>';
  const reset = document.createElement('button'); reset.className = 'sm'; reset.innerHTML = ic('rotate') + 'Reset view';
  reset.onclick = () => { view3d.rx = 54; view3d.rz = -6; apply(); };
  tools.append(reset);
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
