'use strict';
// "Treasures" tab: what the save really records about treasures (see README / analysis/treasure*.js).

function renderTreasures(root) {
  const t = data.treasures;
  const warn = document.createElement('div'); warn.className = 'card';
  warn.innerHTML = '<h3>' + ic('treasure') + 'Treasures <span class="tag" style="margin-left:10px">approximate statistics</span></h3>' +
    '<p class="note" style="margin:0">The save has no "collected N of M in this area" counter. This tab shows what it does contain: which treasure types you have obtained (reliable) and how many world treasures are recorded as picked up per area number (approximate: the file has neither area names nor totals). ' +
    'The editor can neither grant an achievement nor bring back a missed treasure: for that you need an earlier manual save.</p>';
  root.append(warn);

  // --- reliable: item types ever obtained
  const ty = document.createElement('div'); ty.className = 'card';
  const total = t.types.got.length + t.types.missing.length;
  ty.innerHTML = '<h3>' + ic('check') + 'Treasure types you have obtained: ' + t.types.got.length + ' of ' + total + '</h3>';
  if (t.types.missing.length) {
    const p = document.createElement('div'); p.innerHTML = '<div class="dim" style="font-size:12px;margin-bottom:6px">Never obtained:</div>';
    for (const n of t.types.missing.slice().sort()) p.insertAdjacentHTML('beforeend', '<span class="tag" style="margin:0 4px 4px 0">' + esc(n) + '</span>');
    ty.append(p);
  } else ty.insertAdjacentHTML('beforeend', '<div class="dim">All treasure types from the catalog have been obtained.</div>');
  ty.insertAdjacentHTML('beforeend', '<p class="note">This is the item "encyclopedia": it shows the type, but not where it was picked up or how many.</p>');
  root.append(ty);

  // --- approximate: pickups per area group
  const card = document.createElement('div'); card.className = 'card';
  card.innerHTML = '<h3>' + ic('grid') + 'Picked up in the world by area: ' + t.total + '</h3>';
  if (!t.groups.length) card.insertAdjacentHTML('beforeend', '<div class="dim">This slot has no records of picked-up treasures.</div>');
  for (const g of t.groups) {
    const box = document.createElement('div'); box.style.cssText = 'padding:10px 0;border-top:1px solid var(--line)';
    const title = g.label ? esc(g.label) + (g.confidence === 'likely' ? ' <span class="tag" title="The area name is inferred, not read from the file">probably</span>' : '') : 'Area #' + g.group;
    box.innerHTML = '<div class="iname">' + title + ' <span class="dim mono" style="font-weight:400">· group ' + g.group + '</span> <span class="tag st-done" style="margin-left:6px">' + g.count + ' pcs.</span></div>';
    const names = document.createElement('div'); names.style.marginTop = '6px';
    for (const [n, c] of Object.entries(g.names).sort((a, b) => a[0].localeCompare(b[0]))) names.insertAdjacentHTML('beforeend', '<span class="tag" style="margin:0 4px 4px 0">' + esc(n) + (c > 1 ? ' ×' + c : '') + '</span>');
    box.append(names);
    if (g.guide) {
      const det = document.createElement('details'); det.style.marginTop = '6px';
      det.innerHTML = '<summary class="dim" style="cursor:pointer;font-size:12px">Comparison with the guide (' + g.guide.total + ' treasures)</summary>';
      const body = document.createElement('div'); body.style.cssText = 'font-size:12px;margin-top:6px';
      const list = (arr) => arr.map((x) => '<span class="tag" style="margin:0 4px 4px 0">' + esc(x.name) + (x.n > 1 ? ' ×' + x.n : '') + '</span>').join('');
      body.innerHTML = '<div class="dim">In the guide list but missing (or fewer) in the records:</div>' + (g.guide.missing.length ? list(g.guide.missing) : '<div>—</div>') +
        '<div class="dim" style="margin-top:6px">More in the records than in the guide:</div>' + (g.guide.extra.length ? list(g.guide.extra) : '<div>—</div>') +
        '<p class="note">The comparison is approximate: the records also include treasures from other sources (enemy drops, crates), so differences do not mean that something was missed. ' + esc(g.guide.note || '') + '</p>';
      det.append(body); box.append(det);
    }
    card.append(box);
  }
  root.append(card);
}
