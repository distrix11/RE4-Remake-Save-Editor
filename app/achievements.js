'use strict';
// Per-achievement hints computed from the open save. Keys are Steam stat:bit ids (see steam.js / schema).
const INV = require('./inventory');

const DIFF = { 20: 'Standard', 40: 'Professional' };

function buildHints(S, st) {
  const h = {}; const g = st.game;
  const put = (key, text, tone) => { h[key] = { text, tone: tone || 'info' }; };
  const chapters = g ? g.chapters.length : 0;
  const diffLabel = g && g.difficulty !== null ? (DIFF[g.difficulty] || 'difficulty code ' + g.difficulty) : '';

  if (g && g.mode === 'main') {
    const best = Math.min(g.chaptersHours, g.clockHours || Infinity);
    const pace = chapters ? (g.chaptersHours / chapters) * 16 : null;
    put('2:0', `In this slot: by chapters ${g.chaptersHours.toFixed(1)} h, by game clock ${g.clockHours !== null ? g.clockHours.toFixed(1) : '?'} h (limit 8 h; it is unknown which clock the game uses). Chapters recorded: ${chapters} of 16` +
      (pace && chapters < 16 ? `; at this pace the whole game would take about ${pace.toFixed(1)} h (a rough estimate: the chapters differ in length)` : '') + '.',
      // already over the limit: bad; on course by the time so far but a pace above 8 h: only a neutral note, not a green "ok"
      best > 8 ? 'bad' : (pace && chapters < 16 && pace > 8 ? 'info' : 'ok'));
    for (const key of ['1:27', '1:28', '1:29', '1:30', '1:31']) put(key, `In this slot: difficulty "${diffLabel}", chapters recorded: ${chapters} of 16. The final rank (S+) is not stored in the save.`);
  }
  if (g && g.mode === 'separateWays') for (const key of ['2:10', '2:11', '2:12', '2:13']) put(key, `In this slot (Separate Ways): difficulty "${diffLabel}", chapters recorded: ${chapters}.`);

  const quests = INV.quests(S).filter((q) => q.id < 11000);
  if (quests.length) {
    const done = quests.filter((q) => q.subs.every((s) => s.completed && Number(s.completed.value) === 1)).length;
    put('1:25', `In this slot the goals are completed for ${done} of ${quests.length} merchant requests. Whether a request was handed in to the Merchant is not visible in the save; see the "Merchant requests" tab.`, done === quests.length ? 'ok' : 'info');
    put('1:3', done ? `In this slot at least one request has completed goals (${done}).` : 'In this slot no request is completed.', done ? 'ok' : 'info');
  }

  const w = st.weapons;
  if (w) {
    put('1:24', `By the catalog you have obtained ${w.obtained.length} of ${w.total} kinds of weapons. Still missing: ${w.missing.join(', ') || '—'}. Some weapons may only be available in New Game+ or DLC.`, w.missing.length ? 'info' : 'ok');
    put('1:2', w.exclusive ? `This slot has a weapon with the exclusive upgrade (${w.exclusive}).` : 'This slot has no weapon with the exclusive upgrade.', w.exclusive ? 'ok' : 'info');
    put('1:1', w.upgraded ? `Upgraded weapons in this slot: ${w.upgraded}.` : 'This slot has no upgraded weapons.', w.upgraded ? 'ok' : 'info');
  }

  const r = st.range;
  if (r && r.total) {
    const medals = r.stages.filter((x) => x.allMedals).length;
    put('2:4', `Shooting range stages cleared: ${r.cleared} of ${r.total}.`, r.cleared ? 'ok' : 'info');
    put('2:5', `Cleared ${r.cleared} of ${r.total} stages, all targets hit on ${medals}. The rank code is not decoded, so an S rank cannot be checked from the save.`);
  }

  const t = INV.treasures(S);
  const village = t.groups.find((x) => x.group === 12);
  put('1:21', village ? `Village treasure pickups recorded in this slot: ${village.count} (the guide lists 39). This is approximate, see the "Treasures" tab.` : 'See the "Treasures" tab for details.');
  put('1:22', 'Castle treasures: see the "Treasures" tab (the save has no area names).');
  put('1:23', 'Island treasures: see the "Treasures" tab (the save has no area names).');
  return h;
}

module.exports = { buildHints };
