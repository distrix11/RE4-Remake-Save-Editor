'use strict';
// Motion that needs code: the attaché case (opening, items sliding to their new cells, arriving and leaving), counting numbers,
// the flash after a write and the start-up screen. Nothing here changes data; without it the editor works the same.
const fx = (() => {
  // Settings > Animations: 'auto' follows Windows (animation effects), 'on' and 'off' decide here. Kept in this browser profile.
  const KEY = 'RE4_animations';
  const system = window.matchMedia('(prefers-reduced-motion: reduce)');
  let mode = 'auto';
  try { mode = localStorage.getItem(KEY) || 'auto'; } catch { /* storage not available */ }
  const on = () => mode === 'on' || (mode !== 'off' && !system.matches);
  const apply = () => document.documentElement.classList.toggle('calm', !on()); // fx.css switches everything off for .calm
  apply(); system.addEventListener('change', apply);
  function setMode(v) { mode = v; try { localStorage.setItem(KEY, v); } catch { /* ignore */ } apply(); }
  const EASE = 'cubic-bezier(.2,.75,.25,1)';

  // ---- views -------------------------------------------------------------------
  let viewKey = null, fresh = false, viewTimer = null;
  // called for every redraw; only a different view (slot, tab, inventory, list/case) is animated
  function view(body, key) {
    apply(); // in case the Windows setting changed meanwhile
    fresh = key !== viewKey; viewKey = key;
    if (!fresh || !on()) return;
    body.classList.add('fx-in'); clearTimeout(viewTimer); viewTimer = setTimeout(() => body.classList.remove('fx-in'), 600);
  }

  // ---- the attaché case --------------------------------------------------------
  // where every item was drawn last time (by its id), to move it from there instead of jumping
  let last = { ctx: null, items: new Map() };
  const rect = (el) => ({ x: el.offsetLeft, y: el.offsetTop, w: el.offsetWidth, h: el.offsetHeight });
  const boxOf = (el) => ({ x: parseFloat(el.style.left), y: parseFloat(el.style.top), w: parseFloat(el.style.width), h: parseFloat(el.style.height) });
  // ctx: slot and inventory; list: [{ key, el }] of the items just drawn into `foam`
  function caseDrawn(ctx, foam, lid, list) {
    const opening = fresh; fresh = false;
    const same = last.ctx === ctx, before = last.items;
    last = { ctx, items: new Map(list.map(({ key, el }) => [key, { ...boxOf(el), html: el.outerHTML }])) };
    if (!on()) return;
    if (opening) { // the lid swings up, then the things appear from the left to the right
      lid.animate([{ transform: 'rotateX(-165deg)' }, { transform: 'rotateX(-58deg)' }], { duration: 560, easing: 'cubic-bezier(.25,.8,.3,1.08)' });
      for (const { el } of list) {
        el.animate([{ opacity: 0, transform: 'translateY(-14px) scale(1.12)' }, { opacity: 1, transform: 'none' }],
          { duration: 260, delay: 230 + boxOf(el).x * 0.35, easing: EASE, fill: 'backwards' });
      }
      return;
    }
    if (!same) return;
    let moved = 0;
    for (const { key, el } of list) {
      const was = before.get(key), now = boxOf(el);
      if (!was) { // a new thing is laid into the case and shines for a moment
        el.animate([{ opacity: 0, transform: 'translateY(-34px) scale(1.25)' }, { opacity: 1, transform: 'translateY(2px) scale(.98)', offset: 0.75 }, { opacity: 1, transform: 'none' }], { duration: 430, easing: EASE });
        el.firstElementChild.animate([{ boxShadow: '0 0 0 3px #f1dc9a, 0 0 26px 8px rgba(241,220,154,.85)' }, { boxShadow: '0 0 0 0 rgba(241,220,154,0), 0 0 0 0 rgba(241,220,154,0)' }], { duration: 900, delay: 260, easing: 'ease-out' });
      } else if (was.x !== now.x || was.y !== now.y || was.w !== now.w || was.h !== now.h) { // slide (and turn) from the old place
        el.style.transformOrigin = '0 0';
        el.animate([{ transform: `translate(${was.x - now.x}px,${was.y - now.y}px) scale(${was.w / now.w},${was.h / now.h})`, zIndex: 6 }, { transform: 'none', zIndex: 6 }],
          { duration: 330, delay: Math.min(moved++ * 14, 180), easing: EASE, fill: 'backwards' });
      }
    }
    for (const [key, was] of before) { // what is gone fades out where it was
      if (last.items.has(key)) continue;
      const t = document.createElement('template'); t.innerHTML = was.html; const ghost = t.content.firstElementChild;
      ghost.classList.remove('sel'); ghost.style.pointerEvents = 'none'; foam.append(ghost);
      ghost.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(-26px) scale(.8)' }], { duration: 260, easing: 'ease-in' }).onfinish = () => ghost.remove();
      setTimeout(() => ghost.remove(), 600);
    }
  }
  // a dragged item is already where it was dropped: remember that place, so it does not fly back first
  function caseDropped(key, x, y) { const it = last.items.get(key); if (it) { it.x = x; it.y = y; } }

  // ---- numbers -----------------------------------------------------------------
  const counting = new WeakMap();
  function countTo(input, from, to) {
    from = Number(from); to = Number(to);
    cancelAnimationFrame(counting.get(input));
    if (!on() || !Number.isFinite(from) || !Number.isFinite(to) || from === to) return;
    const start = performance.now(), ms = 420;
    let shown = String(from);
    input.value = shown;
    const step = (t) => {
      if (input.value !== shown) return; // the user is typing: leave the field alone
      const p = Math.min(1, (t - start) / ms);
      shown = String(p < 1 ? Math.round(from + (to - from) * (1 - (1 - p) ** 3)) : to);
      input.value = shown;
      if (p < 1) counting.set(input, requestAnimationFrame(step));
    };
    counting.set(input, requestAnimationFrame(step));
    setTimeout(() => { if (input.value === shown) input.value = String(to); }, ms + 200); // frames stop in a hidden window
  }

  // ---- after a write -----------------------------------------------------------
  const labels = new WeakMap();
  function saved(button) {
    if (!labels.has(button)) labels.set(button, button.innerHTML);
    button.innerHTML = ic('check') + 'Saved';
    button.classList.remove('saved'); void button.offsetWidth; button.classList.add('saved');
    clearTimeout(button.fxTimer); button.fxTimer = setTimeout(() => { button.innerHTML = labels.get(button); button.classList.remove('saved'); }, 1800);
  }

  // ---- the leaf in the header --------------------------------------------------
  const brand = document.querySelector('h1 .brand');
  if (brand) {
    brand.onclick = () => { brand.classList.remove('shake'); void brand.offsetWidth; brand.classList.add('shake'); };
    brand.addEventListener('animationend', (e) => { if (e.animationName === 'fx-shake') brand.classList.remove('shake'); });
  }

  // ---- a stable release: leaves and brass sparks fall over the What's new window ----------
  // Drawn on a canvas over the page for about four seconds; the colours are the editor's own (herb green, brass).
  function celebrate(box) {
    if (!on() || !box) return;
    const r = box.getBoundingClientRect();
    const cv = document.createElement('canvas'); cv.className = 'fx-party';
    const W = innerWidth, H = innerHeight, dpr = devicePixelRatio || 1;
    cv.width = W * dpr; cv.height = H * dpr; document.body.append(cv);
    const g = cv.getContext('2d'); g.scale(dpr, dpr);
    const GREENS = ['#a9c58a', '#7f9d63', '#5f7f45', '#c4dba6'], BRASS = ['#c9ad6a', '#e3c98a', '#a8883a'];
    const bits = [];
    // two bursts from the bottom corners of the window up over it, then a gentle fall
    for (let i = 0; i < 150; i++) {
      const left = i % 2 === 0, leaf = i % 3 !== 0;
      bits.push({ x: left ? r.left + 10 : r.right - 10, y: r.bottom - 10, vx: (left ? 1 : -1) * (1.5 + Math.random() * 5), vy: -9 - Math.random() * 7,
        a: Math.random() * 6.3, va: (Math.random() - 0.5) * 0.3, s: leaf ? 7 + Math.random() * 7 : 2 + Math.random() * 3, leaf,
        c: leaf ? GREENS[i % GREENS.length] : BRASS[i % BRASS.length], sway: Math.random() * 6.3, delay: Math.floor(Math.random() * 25) });
    }
    for (let i = 0; i < 60; i++) {
      bits.push({ x: r.left + Math.random() * r.width, y: -20 - Math.random() * 200, vx: 0, vy: 1 + Math.random() * 1.5, a: Math.random() * 6.3, va: (Math.random() - 0.5) * 0.12,
        s: 6 + Math.random() * 6, leaf: true, c: GREENS[i % GREENS.length], sway: Math.random() * 6.3, delay: 20 + Math.floor(Math.random() * 90) });
    }
    const leafPath = (s) => { g.beginPath(); g.moveTo(-s, 0); g.quadraticCurveTo(0, -s * 0.55, s, 0); g.quadraticCurveTo(0, s * 0.55, -s, 0); };
    let frame = 0; const END = 240;
    const step = () => {
      frame++; g.clearRect(0, 0, W, H);
      const fade = frame > END - 50 ? (END - frame) / 50 : 1;
      for (const b of bits) {
        if (frame < b.delay) continue;
        b.vy = Math.min(b.vy + 0.16, b.leaf ? 2.2 : 4); b.vx *= 0.985; b.sway += 0.05;
        b.x += b.vx + (b.leaf ? Math.sin(b.sway) * 0.8 : 0); b.y += b.vy; b.a += b.va;
        g.save(); g.globalAlpha = fade; g.translate(b.x, b.y); g.rotate(b.a); g.fillStyle = b.c;
        if (b.leaf) { leafPath(b.s); g.fill(); g.strokeStyle = 'rgba(30,40,20,.35)'; g.lineWidth = 0.8; g.beginPath(); g.moveTo(-b.s * 0.8, 0); g.lineTo(b.s * 0.8, 0); g.stroke(); }
        else { g.shadowColor = b.c; g.shadowBlur = 6; g.fillRect(-b.s / 2, -b.s / 2, b.s, b.s); }
        g.restore();
      }
      if (frame < END) requestAnimationFrame(step); else cv.remove();
    };
    requestAnimationFrame(step);
  }

  // ---- start-up screen ---------------------------------------------------------
  const splash = document.getElementById('splash');
  const hide = () => { if (!splash) return; splash.classList.add('out'); setTimeout(() => splash.remove(), 400); };
  if (splash) splash.onclick = hide;
  // the editor is ready: let the picture play to its end (about 1.2 s after the page opened), then open
  const ready = () => setTimeout(hide, on() ? Math.max(0, 1200 - performance.now()) : 0);

  return { view, caseDrawn, caseDropped, countTo, saved, ready, celebrate, setMode, mode: () => mode, systemOff: () => system.matches };
})();
