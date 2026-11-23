'use strict';
// "Achievements" tab: unlock status from the local Steam cache + progress hints computed from the open save.

const achUi = { filter: 'locked', hidden: false };

async function renderAchievements(root) {
  const holder = document.createElement('div'); root.append(holder);
  holder.innerHTML = '<div class="empty">Reading Steam data…</div>';
  let r;
  try { r = await api('achievements', { name: cur }); } catch (e) { holder.innerHTML = '<div class="empty">' + esc(e.message) + '</div>'; return; }
  holder.innerHTML = '';
  drawAchievements(holder, r);
}

function drawAchievements(holder, r) {
  const steam = r.steam;
  const head = document.createElement('div'); head.className = 'card';
  if (!steam.available) {
    head.innerHTML = '<h3>' + ic('trophy') + 'Achievements</h3><p class="note" style="margin:0">' + esc(steam.reason) + '</p>';
    holder.append(head); drawStats(holder, r); return;
  }
  const pct = Math.round((100 * steam.unlocked) / steam.total);
  head.innerHTML = '<h3>' + ic('trophy') + 'Achievements: unlocked ' + steam.unlocked + ' of ' + steam.total + '</h3>' +
    '<div class="bar"><i style="width:' + pct + '%"></i></div>' +
    '<p class="note">The status comes from the local Steam cache (<span class="mono">appcache/stats</span>), which was last updated ' + new Date(steam.fileTime).toLocaleString('en-US') +
    '. A just-earned achievement may appear with a delay. The hints below are computed from the open slot and show progress in that slot, not in the game as a whole.</p>';
  holder.append(head);
  drawStats(holder, r);

  const bar = document.createElement('div'); bar.className = 'toolbar';
  const seg = document.createElement('span'); seg.className = 'seg';
  for (const [k, t] of [['locked', 'Locked'], ['all', 'All'], ['got', 'Unlocked']]) {
    const b = document.createElement('button'); b.className = achUi.filter === k ? 'on' : ''; b.textContent = t;
    b.onclick = () => { achUi.filter = k; holder.innerHTML = ''; drawAchievements(holder, r); }; seg.append(b);
  }
  const lab = document.createElement('label'); lab.style.cssText = 'display:flex;align-items:center;gap:6px;font-size:13px;color:var(--dim)';
  const cb = document.createElement('input'); cb.type = 'checkbox'; cb.style.width = 'auto'; cb.checked = achUi.hidden;
  cb.onchange = () => { achUi.hidden = cb.checked; holder.innerHTML = ''; drawAchievements(holder, r); };
  lab.append(cb, document.createTextNode('Show hidden (story spoilers)'));
  bar.append(seg, Object.assign(document.createElement('span'), { className: 'sp' }), lab);
  holder.append(bar);

  const card = document.createElement('div'); card.className = 'card'; card.style.padding = '4px 14px';
  let list = steam.list.filter((a) => achUi.filter === 'all' || (achUi.filter === 'got') === a.unlocked);
  list = list.slice().sort((a, b) => (a.unlocked - b.unlocked) || (r.hints[b.key] ? 1 : 0) - (r.hints[a.key] ? 1 : 0) || a.key.localeCompare(b.key, 'en', { numeric: true }));
  for (const a of list) {
    const row = document.createElement('div'); row.className = 'ach' + (a.unlocked ? ' got' : '');
    const secret = a.hidden && !a.unlocked && !achUi.hidden;
    const hint = r.hints[a.key];
    row.innerHTML = '<span class="tile">' + ic(a.unlocked ? 'trophy' : 'circle') + '</span><div style="min-width:0;flex:1">' +
      '<div class="iname nm">' + esc(secret ? 'Hidden achievement' : a.name) + (a.unlocked ? ' <span class="tag st-done" style="margin-left:6px">' + new Date(a.time).toLocaleDateString('en-US') + '</span>' : '') + '</div>' +
      '<div class="dim" style="font-size:12px">' + esc(secret ? 'The description is hidden to avoid story spoilers.' : a.desc) + '</div>' +
      (hint && !a.unlocked && !secret ? '<div class="hint ' + hint.tone + '">' + esc(hint.text) + '</div>' : '') + '</div>';
    card.append(row);
  }
  if (!list.length) card.innerHTML = '<div class="empty">Nothing here.</div>';
  holder.append(card);
  const note = document.createElement('p'); note.className = 'note';
  note.textContent = 'For achievements without a hint (bosses, Frugalist, Silent Stranger, Minimalist, Revolution Wind-up, S+ ranks, etc.) the save has no suitable data: the game tracks them on the fly.';
  holder.append(note);
}

function drawStats(holder, r) {
  const g = r.stats && r.stats.game; if (!g) return;
  const card = document.createElement('div'); card.className = 'card';
  const acc = g.attempts ? Math.round((100 * g.hit) / g.attempts) + '%' : '—';
  const m = (v, l) => '<div class="metric"><b>' + v + '</b><span>' + l + '</span></div>';
  card.innerHTML = '<h3>' + ic('file') + 'Statistics of this slot</h3><div class="metrics">' +
    m(fmt(g.kills + g.ongoingKills), 'Kills') + m(g.deaths + g.ongoingDeaths, 'Deaths') + m(acc, 'Accuracy') + m(fmt(g.damage), 'Damage taken') + m(g.saves, 'Saves') +
    m(g.chaptersHours.toFixed(1) + ' h', 'Time by chapters') + m(g.clockHours !== null ? g.clockHours.toFixed(1) + ' h' : '—', 'Time by game clock') + m(g.chapters.length, 'Chapters recorded') + '</div>';
  const det = document.createElement('details'); det.style.marginTop = '10px';
  det.innerHTML = '<summary class="dim" style="cursor:pointer;font-size:12px">By chapter</summary>';
  const t = document.createElement('table'); t.style.marginTop = '6px';
  t.innerHTML = '<tr><th>Chapter</th><th>Time</th><th>Kills</th><th>Deaths</th><th>Accuracy</th><th>Damage</th><th>Saves</th></tr>' +
    g.chapters.map((c) => '<tr><td>' + c.num + '</td><td class="mono">' + Math.floor(c.timeSec / 60) + ' min</td><td>' + c.kills + '</td><td>' + c.deaths + '</td><td>' + (c.attempts ? Math.round((100 * c.hit) / c.attempts) + '%' : '—') + '</td><td>' + c.damage + '</td><td>' + c.saves + '</td></tr>').join('');
  det.append(t); card.append(det); holder.append(card);
}
