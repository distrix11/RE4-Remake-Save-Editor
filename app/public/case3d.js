'use strict';
// Static pseudo-3D attaché case drawn with CSS only (original artwork, no game assets). The case takes the look of the
// skin selected in the save. Items are vector pictograms; click to select. To move items use the flat "Map" view.
const CASE_SKINS = {
  124176000: { name: 'Silver', c1: '#c3cacf', c2: '#7b858c', edge: '#4f585e', trim: '#e9edf0', latch: '#d5dadd' },
  124177600: { name: 'Black', c1: '#3a3e42', c2: '#15171a', edge: '#0b0c0e', trim: '#5a6066', latch: '#8c949a' },
  124179200: { name: 'Leather', c1: '#8e2c26', c2: '#4c1311', edge: '#2e0b0a', trim: '#bd5a48', latch: '#c9ad6a', lining: '#3d1012' }, // red, as in the game
  124192000: { name: 'Gold', c1: '#f0d472', c2: '#a97d1f', edge: '#6b4e0f', trim: '#fff3b8', latch: '#fff0a8' },
  124193600: { name: 'Classic', c1: '#8b8559', c2: '#4b472c', edge: '#2c2917', trim: '#bdb685', latch: '#c9ad6a' },
};
const clampN = (v, a, b) => Math.max(a, Math.min(b, v));

// ---- keys for the selected item of the Case view --------------------------------
// Save coordinates: x = row on screen, y = column on screen.
const caseKeys = { cur: null, busy: false };
const KEY_STEP = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] };
document.addEventListener('keydown', async (e) => {
  const c = caseKeys.cur;
  if (!c || tab !== 'inv' || ui.view !== '3d' || !document.querySelector('.foam3d') || typing(e) || dialogOpen() || e.ctrlKey || e.metaKey || e.altKey) return;
  const it = c.inv.items.find((i) => i.idx === ui.sel && i.slot);
  if (!it) return;
  const step = KEY_STEP[e.key];
  if (!step && e.code !== 'KeyR' && e.key !== 'Delete' && e.key !== 'Escape') return;
  e.preventDefault();
  if (caseKeys.busy) return;
  caseKeys.busy = true;
  try {
    if (e.key === 'Escape') { ui.sel = null; render(); }
    else if (e.code === 'KeyR') await c.rotate();
    else if (e.key === 'Delete') await c.remove();
    else { // the next free place in that direction
      const [dx, dy] = step; const [GW, GH] = c.inv.grid;
      for (let k = 1; k <= Math.max(GW, GH); k++) {
        const x = it.slot.x + dx * k, y = it.slot.y + dy * k;
        if (x < 0 || y < 0 || x + it.fp[0] > GW || y + it.fp[1] > GH) break;
        if (!c.fits(it, x, y, it.fp)) continue;
        await structural('move', { inv: c.inv.index, idx: it.idx, x, y }, 'Item moved');
        break;
      }
    }
  } finally { caseKeys.busy = false; }
});

// An item picture lies or stands by its own shape. In a box of the other shape (the item was turned) it is turned by 90 degrees,
// as in the game. The shape of a picture is known when it has loaded.
function turnToFit(inside, bw, bh) {
  const art = inside.firstElementChild; const img = art && (art.matches('img') ? art : art.querySelector('img.art'));
  if (!img || Math.max(bw, bh) < Math.min(bw, bh) * 1.2) return; // a square box: nothing to turn
  const apply = () => {
    const w = img.naturalWidth, h = img.naturalHeight; if (!w || !h) return;
    if (!((w > h * 1.15 && bh > bw) || (h > w * 1.15 && bw > bh))) return;
    const turned = document.createElement('div'); turned.className = 'turned'; turned.style.width = (bh - 4) + 'px'; turned.style.height = (bw - 4) + 'px';
    art.replaceWith(turned); turned.append(art);
  };
  if (img.complete) apply(); else img.addEventListener('load', apply, { once: true });
}

function drawCase3D(holder, inv) {
  const keepY = window.scrollY; holder.style.minHeight = holder.offsetHeight + 'px'; // drawn again in place: the page does not jump
  holder.innerHTML = '';
  // the game shows the case lying down: the save's rows run across the screen, its columns run down
  const [GW, GH] = inv.grid; const W = GH, H = GW;
  const skin = CASE_SKINS[data && data.overview && data.overview.caseSkin] || CASE_SKINS[124176000];
  const room = Math.min(860, (holder.clientWidth || 990) / 1.2 - 48); // the near edge looks about 1.2 times wider than the case
  const clash = new Set(caseClashes().map((i) => i.idx));
  const cell = clampN(Math.floor(room / W), 22, 58), pad = 24;
  const w = W * cell + pad * 2, h = H * cell + pad * 2;
  const tilt = 34;
  const card = document.createElement('div'); card.className = 'card';
  const scene = document.createElement('div'); scene.className = 'scene3d';
  scene.style.height = Math.round(h * Math.cos(tilt * Math.PI / 180) + h * 0.3 + 60) + 'px';
  const box = document.createElement('div'); box.className = 'case3d';
  box.style.cssText = `width:${w}px;height:${h}px;--cell:${cell}px;--c1:${skin.c1};--c2:${skin.c2};--ce:${skin.edge};--ct:${skin.trim};--lining:${skin.lining || '#0c0f09'};transform:rotateX(${tilt}deg)`;

  const lid = document.createElement('div'); lid.className = 'lid3d';
  lid.innerHTML = '<div class="lidpad"></div><div class="strap" style="top:30%"></div><div class="strap" style="top:60%"></div>';
  const shell = document.createElement('div'); shell.className = 'shell3d';
  const foam = document.createElement('div'); foam.className = 'foam3d';
  foam.style.cssText = `left:${pad}px;top:${pad}px;width:${W * cell}px;height:${H * cell}px`;
  // invisible cells under the items: they tell which grid cell is under the mouse, whatever the perspective
  for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) {
    const hit = document.createElement('div'); hit.className = 'cellhit'; hit.dataset.c = c; hit.dataset.r = r;
    hit.style.cssText = `left:${c * cell}px;top:${r * cell}px;width:${cell}px;height:${cell}px`; foam.append(hit);
  }
  const ghost = document.createElement('div'); ghost.className = 'ghost3'; ghost.hidden = true; foam.append(ghost);
  // right click on an empty cell: add an item or a weapon right there
  if (inv.index === 0) foam.oncontextmenu = (e) => {
    if (e.target.closest('.i3')) return;
    const c = cellAt(e); if (!c) return;
    e.preventDefault();
    const at = { x: c[1], y: c[0] }; // save x = row on screen, y = column
    const bi = document.createElement('button'); bi.innerHTML = ic('plus') + 'Add item here…'; bi.onclick = () => openAdd(at);
    const bw = document.createElement('button'); bw.innerHTML = ic('plus') + 'Add weapon here…'; bw.onclick = () => openWeapons(at);
    caseMenu(e.clientX, e.clientY, 'Empty place', [bi, bw]);
  };
  const cellAt = (ev) => { const e = document.elementsFromPoint(ev.clientX, ev.clientY).find((n) => n.classList && n.classList.contains('cellhit')); return e ? [Number(e.dataset.c), Number(e.dataset.r)] : null; };
  // moves are done in the save's own coordinates: x = row on screen, y = column on screen
  const ovl3 = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
  const fits3 = (it, x, y, fp) => x >= 0 && y >= 0 && x + fp[0] <= GW && y + fp[1] <= GH &&
    !inv.items.some((o) => o !== it && o.slot && ovl3({ x, y, w: fp[0], h: fp[1] }, { x: o.slot.x, y: o.slot.y, w: o.fp[0], h: o.fp[1] }));
  // what the keys act on (see the keydown handler below)
  caseKeys.cur = { inv, fits: fits3, rotate: null, remove: null };
  const drawn = []; // for the animations (fx.js)
  for (const it of inv.items) {
    if (!it.slot) continue;
    const key = it.guid || it.itemId.value + ':' + it.idx;
    const nm = itemName(it) || '#' + it.itemId.value;
    const el = document.createElement('div');
    el.className = 'i3 c-' + (it.cat || 'other') + (ui.sel === it.idx ? ' sel' : '') + (clash.has(it.idx) ? ' clash' : '');
    const sfp = [it.fp[1], it.fp[0]]; // size on screen
    const bw = sfp[0] * cell, bh = sfp[1] * cell;
    el.style.cssText = `left:${it.slot.y * cell}px;top:${it.slot.x * cell}px;width:${bw}px;height:${bh}px`;
    el.title = `${nm}\nID ${it.itemId.value}\ncell ${it.slot.x},${it.slot.y}`;
    const art = typeof itemArt === 'function' ? itemArt(nm, it.cat, sfp, it.itemId.value) : { svg: null };
    let inner;
    if (art.svg && art.turn) inner = `<div class="turned" style="width:${bh - 4}px;height:${bw - 4}px">${art.svg}</div>`;
    else if (art.svg) inner = art.svg;
    else inner = `<span class="fallback">${ic(it.cat || 'box')}</span>`;
    el.innerHTML = '<div class="in">' + inner + (it.count && Number(it.count.value) > 1 ? '<span class="cn">' + it.count.value + '</span>' : '') + '</div>';
    if (it.cat !== 'weapon' && art.svg) turnToFit(el.querySelector('.in'), bw, bh); // weapons are handled above (art.turn)
    // right click: select the item and show its actions next to the mouse
    el.oncontextmenu = (e) => {
      e.preventDefault(); ui.sel = it.idx; drawCase3D(holder, inv);
      caseMenu(e.clientX, e.clientY, itemName(it) || 'Item #' + it.itemId.value, (caseKeys.cur && caseKeys.cur.menu) || []);
    };
    el.onpointerdown = (e) => {
      if (e.button !== 0) return;
      e.preventDefault(); el.setPointerCapture(e.pointerId);
      const sx = e.clientX, sy = e.clientY; let moved = false, fly = null;
      const grab = cellAt(e) || [it.slot.y, it.slot.x];
      const off = [grab[0] - it.slot.y, grab[1] - it.slot.x]; // which cell of the item was grabbed (screen column, row)
      const target = (ev) => { const c = cellAt(ev); return c ? [c[1] - off[1], c[0] - off[0]] : null; }; // save x (row), y (column)
      el.onpointermove = (ev) => {
        if (!moved && Math.hypot(ev.clientX - sx, ev.clientY - sy) < 5) return;
        if (!moved) {
          moved = true; el.classList.add('drag');
          fly = el.cloneNode(true); fly.className = 'i3 flying'; const rc = el.getBoundingClientRect();
          fly.style.cssText = `position:fixed;left:0;top:0;width:${rc.width}px;height:${rc.height}px;pointer-events:none;z-index:50;margin:0`;
          document.body.append(fly);
        }
        const rc = el.getBoundingClientRect();
        fly.style.transform = `translate(${ev.clientX - sx + rc.left}px,${ev.clientY - sy + rc.top}px)`;
        const t = target(ev);
        if (!t) { ghost.hidden = true; return; }
        ghost.hidden = false; ghost.className = 'ghost3 ' + (fits3(it, t[0], t[1], it.fp) ? 'ok' : 'bad');
        ghost.style.cssText = `left:${t[1] * cell}px;top:${t[0] * cell}px;width:${it.fp[1] * cell}px;height:${it.fp[0] * cell}px`;
      };
      el.onpointerup = async (ev) => {
        el.onpointermove = null; el.onpointerup = null; el.classList.remove('drag'); ghost.hidden = true; if (fly) fly.remove();
        if (!moved) { ui.sel = it.idx; drawCase3D(holder, inv); return; }
        const t = target(ev);
        if (!t || (t[0] === it.slot.x && t[1] === it.slot.y)) return;
        if (!fits3(it, t[0], t[1], it.fp)) { toast('The item does not fit here or overlaps another one (sizes are estimates)', 'err'); return; }
        ui.sel = it.idx;
        fx.caseDropped(key, t[1] * cell, t[0] * cell);
        await structural('move', { inv: inv.index, idx: it.idx, x: t[0], y: t[1] }, 'Item moved');
      };
    };
    foam.append(el);
    drawn.push({ key, el });
  }
  shell.append(foam);
  const latches = document.createElement('div'); latches.className = 'latches3d'; latches.style.setProperty('--cl', skin.latch);
  latches.innerHTML = '<i style="left:18%"></i><i style="left:50%"></i><i style="left:82%"></i>';
  box.append(lid, shell, latches); scene.append(box);
  const tools = document.createElement('div'); tools.className = 'toolbar'; tools.style.cssText = 'margin:0 0 6px';
  tools.innerHTML = `<span class="dim" style="font-size:12px">Your case: <b>${esc(skin.name)}</b> (taken from the save). Click an item to select it and drag it to move it. Green outline: it fits, red: it does not.</span>`;
  const sortBtn = document.createElement('button'); sortBtn.className = 'sm'; sortBtn.style.marginLeft = 'auto'; sortBtn.innerHTML = ic('sort') + 'Sort';
  sortBtn.title = 'Pack the items to the left, grouped: weapons, throwables, healing, ammo, accessories, the rest. Undo with Ctrl+Z or "Undo".';
  sortBtn.onclick = () => structural('sort', { inv: inv.index }, 'Case sorted');
  if (inv.index === 0) tools.append(sortBtn);
  card.append(tools, scene);

  const sel = inv.items.find((i) => i.idx === ui.sel && i.slot);
  const bar = document.createElement('div'); bar.className = 'selbar';
  if (sel) {
    const nm = itemName(sel) || 'Item #' + sel.itemId.value;
    const info = document.createElement('div');
    info.innerHTML = `<div class="iname">${esc(nm)}</div><div class="dim mono" style="font-size:11px">ID ${sel.itemId.value} · cell ${sel.slot.x},${sel.slot.y} · ${sel.fp[0]}×${sel.fp[1]} (estimate)</div>`;
    bar.append(info);
    // the same numbers as in the list: count, ammo, durability
    const show = fieldsOf(sel);
    for (const [k, label] of [['count', 'Count'], ['ammo', 'Ammo'], ['durability', 'Durability']]) {
      if (!show[k] || !sel[k]) continue;
      const l = document.createElement('label'); l.className = 'f'; l.style.width = '110px'; l.innerHTML = '<span>' + label + '</span>'; l.append(field(sel[k], { width: '100%' })); bar.append(l);
    }
    const rot = document.createElement('button'); rot.className = 'sm'; rot.innerHTML = ic('rotate') + 'Rotate';
    rot.onclick = () => {
      const nd = sel.dir % 2 === 1 ? 0 : 1; const nfp = [sel.fp[1], sel.fp[0]];
      if (!fits3(sel, sel.slot.x, sel.slot.y, nfp)) { toast('The rotated item does not fit here', 'err'); return; }
      return structural('move', { inv: inv.index, idx: sel.idx, x: sel.slot.x, y: sel.slot.y, dir: nd }, 'Item rotated');
    };
    let fu = null;
    if (sel.upg) {
      fu = document.createElement('button'); fu.className = 'sm'; fu.innerHTML = ic('tools') + 'Full upgrade'; fu.title = 'Every normal upgrade of this weapon to the maximum (4)';
      fu.onclick = () => structural('upgrade-all', { inv: inv.index, idx: sel.idx, level: 4 }, 'Weapon fully upgraded');
      bar.append(fu);
    }
    const key = inv.index + ':' + sel.idx;
    const ub = sel.upg ? document.createElement('button') : null;
    if (ub) { ub.className = 'sm' + (ui.upg[key] ? ' on' : ''); ub.innerHTML = ic('tools') + 'Upgrades'; ub.title = 'Set every upgrade of this weapon'; ub.onclick = () => { ui.upg[key] = !ui.upg[key]; render(); }; }
    const sb = inv.index === 0 && sel.cls === 'WeaponItem' && sel.cat !== 'throw' && data.storage ? document.createElement('button') : null;
    if (sb) { sb.className = 'sm'; sb.innerHTML = ic('export') + 'To storage'; sb.title = 'Put this weapon into the storage'; sb.onclick = () => { ui.sel = null; return structural('to-storage', { idx: sel.idx }, nm + ' is in the storage now'); }; }
    const dup = document.createElement('button'); dup.className = 'sm'; dup.innerHTML = ic('copy') + 'Copy';
    dup.onclick = () => structural('dup', { inv: inv.index, idx: sel.idx }, 'Copy created');
    if (UNIQUE.includes(sel.cat)) { dup.disabled = true; dup.title = 'There is only one of these in the game: it cannot be copied'; }
    const del = document.createElement('button'); del.className = 'sm danger'; del.innerHTML = ic('trash') + 'Delete';
    del.onclick = async () => { if (await confirmDelete(sel, nm)) { ui.sel = null; return structural('remove', { inv: inv.index, idx: sel.idx }, 'Removed'); } };
    bar.append(Object.assign(document.createElement('span'), { className: 'sp' }), rot, ...(ub ? [ub] : []), ...(sb ? [sb] : []), dup, del);
    caseKeys.cur.rotate = rot.onclick; caseKeys.cur.remove = del.onclick;
    caseKeys.cur.menu = [rot, fu, ub, sb, dup, del].filter(Boolean); // the right-click menu offers the same buttons
    rot.title = 'Key: R'; del.title = 'Key: Delete';
    bar.append(Object.assign(document.createElement('div'), { className: 'dim', textContent: 'Keys: R rotate · Delete remove · arrows move (past items in the way) · Esc deselect · Ctrl+Z undo', style: 'flex-basis:100%;font-size:12px' }));
  } else bar.innerHTML = '<span class="dim">Click an item to select it; drag it to move it.</span>';
  card.append(bar);
  // upgrade levels and gem sockets of the selected item, as in the list
  if (sel && ((sel.upg && ui.upg[inv.index + ':' + sel.idx]) || (sel.sockets && sel.sockets.length))) {
    const t = document.createElement('table'); t.className = 'selmore';
    if (sel.upg && ui.upg[inv.index + ':' + sel.idx]) t.append(upgRow(inv, sel));
    if (sel.sockets && sel.sockets.length) t.append(gemRow(inv, sel));
    card.append(t);
  }
  holder.append(card);
  holder.style.minHeight = ''; window.scrollTo(0, keepY);
  fx.caseDrawn(cur + '|' + inv.index, foam, lid, drawn);
}

// a small menu at the mouse with the buttons of the selected item (they keep their own actions and disabled state)
function caseMenu(x, y, title, buttons) {
  closeCaseMenu();
  const m = document.createElement('div'); m.className = 'ctxmenu'; m.id = 'ctxmenu';
  m.innerHTML = '<div class="ctxt">' + esc(title) + '</div>';
  for (const b of buttons) {
    const i = document.createElement('button'); i.innerHTML = b.innerHTML; i.disabled = b.disabled; i.title = b.title || '';
    if (b.classList.contains('danger')) i.className = 'danger';
    i.onclick = () => { closeCaseMenu(); b.click(); }; m.append(i);
  }
  document.body.append(m);
  const r = m.getBoundingClientRect();
  m.style.left = Math.max(4, Math.min(x, innerWidth - r.width - 4)) + 'px'; m.style.top = Math.max(4, Math.min(y, innerHeight - r.height - 4)) + 'px';
  setTimeout(() => { addEventListener('pointerdown', ctxAway, true); addEventListener('keydown', ctxKey, true); addEventListener('scroll', closeCaseMenu, true); addEventListener('blur', closeCaseMenu); });
}
function ctxAway(e) { if (!e.target.closest('#ctxmenu')) closeCaseMenu(); }
function ctxKey(e) { if (e.key === 'Escape') { e.stopPropagation(); closeCaseMenu(); } }
function closeCaseMenu() {
  const m = document.getElementById('ctxmenu'); if (m) m.remove();
  removeEventListener('pointerdown', ctxAway, true); removeEventListener('keydown', ctxKey, true); removeEventListener('scroll', closeCaseMenu, true); removeEventListener('blur', closeCaseMenu);
}
