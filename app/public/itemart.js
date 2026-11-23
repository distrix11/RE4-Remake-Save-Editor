'use strict';
// Hand-drawn vector pictograms for the case view (original artwork in the spirit of the game's inventory; no game assets).
// itemArt(name, cat, fp) returns an <svg> string that fills its cell block. Unknown items fall back to the category icon.
(function () {
  const defs = `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
  <linearGradient id="gMetal" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c9ced2"/><stop offset=".45" stop-color="#7d858c"/><stop offset="1" stop-color="#3b4147"/></linearGradient>
  <linearGradient id="gDark" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5b6168"/><stop offset="1" stop-color="#1f2326"/></linearGradient>
  <linearGradient id="gGold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff0a8"/><stop offset=".5" stop-color="#d8a936"/><stop offset="1" stop-color="#8a6417"/></linearGradient>
  <linearGradient id="gBrass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f1d48a"/><stop offset="1" stop-color="#9a7228"/></linearGradient>
  <linearGradient id="gWood" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b57a45"/><stop offset="1" stop-color="#5e3a1e"/></linearGradient>
  <linearGradient id="gPaper" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#efe3bb"/><stop offset="1" stop-color="#bba978"/></linearGradient>
  <linearGradient id="gRed" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e0584a"/><stop offset="1" stop-color="#7d1f18"/></linearGradient>
  <linearGradient id="gBox" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6f7a55"/><stop offset="1" stop-color="#3b432c"/></linearGradient>
  <linearGradient id="gGlass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff" stop-opacity=".9"/><stop offset="1" stop-color="#ffffff" stop-opacity=".1"/></linearGradient>
  </defs></svg>`;
  if (typeof document !== 'undefined') document.body.insertAdjacentHTML('afterbegin', defs);

  const O = 'stroke="#0c0f0a" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"'; // dark outline
  const wrap = (vb, body, rot) => `<svg class="art" viewBox="${vb}" preserveAspectRatio="xMidYMid meet" ${rot ? 'data-rot="1"' : ''}>${body}</svg>`;
  const gem = (c1, c2) => wrap('0 0 60 60', `<path d="M14 22l8-10h16l8 10-16 28z" fill="${c1}" ${O}/><path d="M14 22h32M22 12l8 38M38 12l-8 38M14 22l16 28 16-28" fill="none" stroke="${c2}" stroke-width="1.2"/><path d="M22 12l-4 10 12-4z" fill="url(#gGlass)"/>`);

  // ---- weapons, drawn horizontally in a 120 x 60 box
  const W = {
    pistol: `<path d="M12 18h82v12H56l-6 6-2 16H34l4-22H12z" fill="url(#gMetal)" ${O}/><rect x="14" y="20" width="72" height="5" fill="#d9dde0" opacity=".5"/><path d="M42 40h14l-3 14H40z" fill="url(#gDark)" ${O}/><path d="M56 30v6" ${O}/><circle cx="90" cy="24" r="2" fill="#111"/>`,
    revolver: `<path d="M4 20h72v9H4z" fill="url(#gMetal)" ${O}/><rect x="5" y="21" width="70" height="3" fill="#e6e9eb" opacity=".5"/><circle cx="84" cy="26" r="13" fill="url(#gMetal)" ${O}/><circle cx="84" cy="26" r="4" fill="#1f2326"/><path d="M92 36l14 6-6 16H88z" fill="url(#gWood)" ${O}/><path d="M70 32h14l-4 10H64z" fill="url(#gDark)" ${O}/>`,
    shotgun: `<rect x="4" y="22" width="78" height="6" fill="url(#gMetal)" ${O}/><rect x="4" y="29" width="70" height="5" fill="url(#gDark)" ${O}/><rect x="36" y="31" width="22" height="9" rx="3" fill="url(#gWood)" ${O}/><path d="M80 20h22l14 8-2 14-18 2-4 8H80l2-20z" fill="url(#gWood)" ${O}/><rect x="74" y="20" width="12" height="14" fill="url(#gDark)" ${O}/>`,
    rifle: `<rect x="6" y="28" width="76" height="5" fill="url(#gDark)" ${O}/><rect x="30" y="15" width="30" height="8" rx="3" fill="url(#gMetal)" ${O}/><path d="M34 23v5M56 23v5" ${O}/><path d="M78 24h20l16 8-2 12-16 2-8 8H80l-2-12z" fill="url(#gWood)" ${O}/><rect x="70" y="24" width="14" height="10" fill="url(#gMetal)" ${O}/>`,
    smg: `<path d="M8 22h60v11H8z" fill="url(#gMetal)" ${O}/><rect x="68" y="20" width="28" height="15" rx="3" fill="url(#gDark)" ${O}/><path d="M96 24h18v6H96z" fill="url(#gDark)" ${O}/><path d="M52 33h10l-1 20H49z" fill="url(#gDark)" ${O}/><path d="M72 35h12l-3 16H70z" fill="url(#gDark)" ${O}/>`,
    rocket: `<rect x="6" y="18" width="84" height="22" rx="6" fill="#5d6b3f" ${O}/><rect x="6" y="18" width="84" height="7" rx="4" fill="#8da064" opacity=".55"/><path d="M90 14l22 4-4 22-18 4z" fill="url(#gDark)" ${O}/><path d="M34 40l-4 14h12l4-14z" fill="url(#gDark)" ${O}/><circle cx="14" cy="29" r="6" fill="#1f2326"/>`,
    bow: `<path d="M30 8c-14 10-14 40 0 50" fill="none" stroke="#7a5430" stroke-width="5" stroke-linecap="round"/><path d="M30 8l62 26-62 26" fill="none" stroke="#d8d2b8" stroke-width="1.5"/><rect x="28" y="28" width="76" height="7" rx="2" fill="url(#gDark)" ${O}/><path d="M104 31h10l-6 5z" fill="url(#gMetal)" ${O}/>`,
    knife: `<path d="M8 36L84 24l18 4-4 8-16 2z" fill="url(#gMetal)" ${O}/><path d="M12 35l68-10" stroke="#fff" stroke-width="1.4" opacity=".7"/><rect x="82" y="20" width="6" height="20" rx="2" fill="url(#gBrass)" ${O}/><rect x="88" y="23" width="26" height="13" rx="5" fill="url(#gDark)" ${O}/>`,
  };
  // rendered pictures (icons/weapons/*.png, from the CC0 Ultimate Gun Pack by Quaternius); knives, rocket launchers and the bow stay vector
  const GUN_PNG = [
    [/sg-09|handgun/, 'pistol_1'], [/punisher/, 'pistol_2'], [/minecart|red9/, 'pistol_3'], [/blacktail/, 'pistol_4'], [/sentinel/, 'pistol_5'], [/matilda/, 'pistol_6'],
    [/handcannon/, 'revolver_1'], [/killer7/, 'revolver_2'], [/butterfly/, 'revolver_3'],
    [/riot/, 'shotgun_1'], [/w-870|shotgun/, 'shotgun_2'], [/striker/, 'shotgun_4'], [/sweeper/, 'shotgun_shortstock'],
    [/m1903|sr /, 'sniperrifle_6'], [/stingray|semi/, 'assaultrifle_5'], [/cqbr/, 'assaultrifle2_1'],
    [/tmp/, 'submachinegun_4'], [/le 5/, 'submachinegun_2'],
  ];
  const gunPng = (n) => { const t = n.toLowerCase(); const m = GUN_PNG.find(([re]) => re.test(t)); return m ? '<img class="art" alt="" src="icons/weapons/' + m[1] + '.png">' : null; };
  const weapon = (n) => {
    n = n.toLowerCase();
    if (/knife|kunai/.test(n)) return W.knife;
    if (/rocket/.test(n)) return W.rocket;
    if (/bolt thrower|bow/.test(n)) return W.bow;
    if (/handcannon|butterfly|killer7|magnum/.test(n)) return W.revolver;
    if (/shotgun|riot|striker|sweeper/.test(n)) return W.shotgun;
    if (/rifle|stingray|cqbr|m1903/.test(n)) return W.rifle;
    if (/tmp|le 5|submachine/.test(n)) return W.smg;
    return W.pistol; // SG-09 R, Punisher, Red9, Blacktail, Matilda, Sentinel Nine
  };

  // ---- herbs and healing
  const leaf = (x, y, rot, c) => `<g transform="translate(${x} ${y}) rotate(${rot})"><path d="M0 0C-10-10-10-26 0-38 10-26 10-10 0 0z" fill="${c}" ${O}/><path d="M0 0V-32" stroke="#0c0f0a" stroke-width="1" opacity=".5"/></g>`;
  const HC = { G: '#4fae3f', R: '#d23b32', Y: '#e0c63a' };
  function herb(name) {
    const m = /\(([GRY+]+)\)/.exec(name); const cols = m ? m[1].split('+').map((k) => HC[k]) : [/red/i.test(name) ? HC.R : /yellow/i.test(name) ? HC.Y : HC.G];
    const rots = cols.length === 1 ? [0] : cols.length === 2 ? [-24, 24] : [-34, 0, 34];
    return wrap('6 4 48 54', cols.map((c, i) => leaf(30, 54, rots[i], c)).join('') + `<rect x="25" y="48" width="10" height="8" rx="2" fill="#6b5a3a" ${O}/>`);
  }
  const spray = wrap('0 0 60 60', `<rect x="20" y="16" width="20" height="40" rx="5" fill="#f2f4f0" ${O}/><rect x="24" y="8" width="12" height="9" rx="2" fill="url(#gMetal)" ${O}/><rect x="36" y="9" width="7" height="4" fill="#333" ${O}/><path d="M30 26v14M23 33h14" stroke="#cc2f26" stroke-width="5"/>`);
  const fish = wrap('0 0 60 60', `<path d="M8 30C18 14 38 14 48 30 38 46 18 46 8 30z" fill="#4c6a52" ${O}/><path d="M48 30l8-9v18z" fill="#3a5340" ${O}/><circle cx="18" cy="27" r="2.2" fill="#fff"/>`);
  const viper = wrap('0 0 60 60', `<path d="M10 44c10-6 8-16 18-16s6 12 18 8" fill="none" stroke="#5f7d3b" stroke-width="9" stroke-linecap="round"/><circle cx="48" cy="36" r="4" fill="#5f7d3b" ${O}/>`);
  const beetle = wrap('0 0 60 60', `<ellipse cx="30" cy="34" rx="14" ry="17" fill="#3a2a1e" ${O}/><path d="M30 17v34" stroke="#8a6a3f"/><path d="M30 16c-4-8-8-9-10-8M30 16c4-8 8-9 10-8" fill="none" stroke="#3a2a1e" stroke-width="3" stroke-linecap="round"/>`);

  // ---- ammo
  function ammoBox(kind) {
    const shells = kind === 'shotgun';
    const bullets = shells
      ? [0, 1, 2].map((i) => `<rect x="${13 + i * 11}" y="22" width="8" height="22" rx="2" fill="url(#gRed)" ${O}/><rect x="${13 + i * 11}" y="38" width="8" height="6" fill="url(#gBrass)" ${O}/>`).join('')
      : [0, 1, 2, 3].map((i) => `<path d="M${13 + i * 9} 44V28q3.5-8 7 0v16z" fill="url(#gBrass)" ${O}/><path d="M${13 + i * 9} 30q3.5-6 7 0z" fill="#b87333"/>`).join('');
    return wrap('0 0 60 60', `<path d="M6 20l24-8 24 8v30l-24 6-24-6z" fill="url(#gBox)" ${O}/><path d="M6 20l24 8 24-8" fill="none" ${O}/>` + `<g transform="translate(0 4) scale(1)">${bullets}</g>`);
  }
  const bolts = wrap('0 0 60 60', `<path d="M8 50L48 10M16 54L54 16" stroke="#8b633a" stroke-width="3" stroke-linecap="round"/><path d="M48 10l8-2-2 8zM54 16l8-2-2 8z" fill="url(#gMetal)" ${O}/>`);
  const arrows = wrap('0 0 60 60', `<path d="M8 50L46 12" stroke="#8b633a" stroke-width="3" stroke-linecap="round"/><path d="M46 12l9-3-3 9z" fill="url(#gMetal)" ${O}/><circle cx="52" cy="22" r="7" fill="#c24b22" ${O}/><rect x="49" y="16" width="6" height="4" fill="#e0b84a"/>`);
  const powder = wrap('0 0 60 60', `<path d="M8 50c4-14 12-22 22-22s18 8 22 22z" fill="#6b6f72" ${O}/><circle cx="26" cy="40" r="2" fill="#2c2f31"/><circle cx="36" cy="44" r="2" fill="#2c2f31"/><circle cx="31" cy="34" r="2" fill="#2c2f31"/>`);
  const resource = (big) => wrap('0 0 60 60', `<circle cx="22" cy="34" r="${big ? 14 : 11}" fill="url(#gMetal)" ${O}/><circle cx="22" cy="34" r="4" fill="#2a2e31"/><rect x="${big ? 30 : 32}" y="22" width="${big ? 22 : 18}" height="${big ? 26 : 22}" rx="3" fill="url(#gBox)" ${O}/><path d="M34 30h14M34 36h14" stroke="#c9ad6a" stroke-width="2"/>`);
  const mine = wrap('0 0 60 60', `<ellipse cx="30" cy="38" rx="21" ry="9" fill="url(#gDark)" ${O}/><ellipse cx="30" cy="34" rx="21" ry="9" fill="url(#gBox)" ${O}/><path d="M30 25v-8M26 17h8" stroke="#c9ad6a" stroke-width="3"/><circle cx="30" cy="34" r="3" fill="#d23b32"/>`);

  // ---- throwables
  const grenade = (heavy) => wrap('0 0 60 60', `<ellipse cx="30" cy="36" rx="${heavy ? 16 : 14}" ry="${heavy ? 19 : 17}" fill="${heavy ? '#4d5a35' : '#5c6a3e'}" ${O}/><path d="M16 30h28M16 38h28M18 45h24" stroke="#1f2a14" stroke-width="1.4" opacity=".7"/><rect x="25" y="12" width="10" height="8" rx="2" fill="url(#gMetal)" ${O}/><path d="M36 15c8 0 10 5 8 9" fill="none" stroke="#d8dde0" stroke-width="2"/>`);
  const flash = wrap('0 0 60 60', `<rect x="19" y="14" width="22" height="38" rx="5" fill="#d9dde0" ${O}/><rect x="19" y="22" width="22" height="8" fill="#e5c14a"/><rect x="25" y="8" width="10" height="7" rx="2" fill="url(#gMetal)" ${O}/><path d="M30 34l-3 8h6z" fill="#e5c14a"/>`);
  const egg = (c) => wrap('0 0 60 60', `<path d="M30 8C18 8 12 26 12 36c0 11 8 18 18 18s18-7 18-18C48 26 42 8 30 8z" fill="${c}" ${O}/><ellipse cx="24" cy="26" rx="4" ry="8" fill="url(#gGlass)"/>`);

  // ---- treasure
  function treasure(n) {
    const t = n.toLowerCase();
    if (/ruby|red gemstone|red beryl/.test(t) && !/ring|mirror/.test(t)) return gem('#d22d3c', '#ffb0b8');
    if (/emerald/.test(t)) return gem('#2ea36a', '#b6f0d0');
    if (/sapphire|velvet blue/.test(t)) return gem('#2e5fd0', '#b6ccff');
    if (/yellow diamond/.test(t)) return gem('#e8cf33', '#fff6b0');
    if (/alexandrite/.test(t)) return gem('#8a3fc9', '#e0b9ff');
    if (/gold bar|ingot/.test(t)) return wrap('0 0 60 60', `<path d="M6 38l8-14h32l8 14z" fill="url(#gGold)" ${O}/><path d="M6 38h48v10H6z" fill="#b88a25" ${O}/><path d="M16 28h26" stroke="#fff3b0" stroke-width="2" opacity=".8"/>`);
    if (/ring|bangle|bracelet/.test(t)) return wrap('0 0 60 60', `<circle cx="30" cy="36" r="15" fill="none" stroke="url(#gGold)" stroke-width="7"/><circle cx="30" cy="36" r="15" fill="none" stroke="#0c0f0a" stroke-width=".8"/><path d="M24 14l6-6 6 6-6 8z" fill="#d22d3c" ${O}/>`);
    if (/pendant|necklace|pearl/.test(t)) return wrap('0 0 60 60', `<path d="M10 8c4 22 36 22 40 0" fill="none" stroke="url(#gGold)" stroke-width="3"/><circle cx="30" cy="34" r="9" fill="#f4f1ea" ${O}/><circle cx="27" cy="31" r="3" fill="url(#gGlass)"/>`);
    if (/crown|headdress/.test(t)) return wrap('0 0 60 60', `<path d="M8 44V20l11 12 11-18 11 18 11-12v24z" fill="url(#gGold)" ${O}/><circle cx="19" cy="38" r="3" fill="#d22d3c"/><circle cx="30" cy="38" r="3" fill="#2e5fd0"/><circle cx="41" cy="38" r="3" fill="#2ea36a"/>`);
    if (/chalice|flagon|goblet|perfume|bottle/.test(t)) return wrap('0 0 60 60', `<path d="M14 10h32c0 16-6 22-16 22S14 26 14 10z" fill="url(#gGold)" ${O}/><rect x="27" y="32" width="6" height="14" fill="url(#gGold)" ${O}/><path d="M16 50h28l-4-6H20z" fill="url(#gGold)" ${O}/>`);
    if (/watch|clock|hourglass|compass/.test(t)) return wrap('0 0 60 60', `<circle cx="30" cy="34" r="20" fill="url(#gGold)" ${O}/><circle cx="30" cy="34" r="15" fill="#f1ead2" ${O}/><path d="M30 34V23M30 34l8 4" stroke="#222" stroke-width="2"/><rect x="26" y="8" width="8" height="6" fill="url(#gGold)" ${O}/>`);
    if (/mask|eye|monocle|statue|idol|lynx|beetle|staff|camera|chess|mirror|lamp|lip/.test(t)) return wrap('0 0 60 60', `<path d="M14 50l4-24 12-14 12 14 4 24z" fill="url(#gGold)" ${O}/><circle cx="30" cy="30" r="5" fill="#2e5fd0" ${O}/><circle cx="22" cy="42" r="2" fill="#d22d3c"/><circle cx="38" cy="42" r="2" fill="#d22d3c"/>`);
    return gem('#d8a936', '#fff0a8');
  }

  // ---- key items
  function keyItem(n) {
    const t = n.toLowerCase();
    if (/keycard/.test(t)) return wrap('0 0 60 60', `<rect x="8" y="14" width="44" height="32" rx="4" fill="#d8dde0" ${O}/><rect x="8" y="20" width="44" height="7" fill="#222"/><rect x="14" y="34" width="14" height="8" fill="${/3/.test(t) ? '#d23b32' : /2/.test(t) ? '#e0c63a' : '#4fae3f'}" ${O}/>`);
    if (/sword/.test(t)) return wrap('0 0 60 60', `<path d="M46 8l6 6-26 28-8-2-2-8z" fill="url(#gMetal)" ${O}/><rect x="16" y="38" width="14" height="5" transform="rotate(45 23 40)" fill="url(#gBrass)" ${O}/><path d="M16 46l-6 6" stroke="#5e3a1e" stroke-width="5" stroke-linecap="round"/>`);
    if (/head|horn/.test(t)) return wrap('0 0 60 60', `<path d="M14 48V26c0-12 8-18 16-18s16 6 16 18v22z" fill="url(#gMetal)" ${O}/><circle cx="24" cy="26" r="3" fill="#111"/><circle cx="36" cy="26" r="3" fill="#111"/><path d="M24 38h12" stroke="#111" stroke-width="2"/>`);
    if (/cog|wheel|dial|crank|device/.test(t)) return wrap('0 0 60 60', `<circle cx="30" cy="30" r="17" fill="url(#gBrass)" ${O}/><circle cx="30" cy="30" r="6" fill="#222"/>${[0, 45, 90, 135].map((a) => `<rect x="26" y="5" width="8" height="10" fill="url(#gBrass)" ${O} transform="rotate(${a} 30 30)"/><rect x="26" y="45" width="8" height="10" fill="url(#gBrass)" ${O} transform="rotate(${a} 30 30)"/>`).join('')}`);
    if (/dynamite/.test(t)) return wrap('0 0 60 60', `<rect x="20" y="16" width="20" height="38" rx="3" fill="#c0392b" ${O}/><path d="M30 16V8c4-3 8 0 8-4" stroke="#222" fill="none" stroke-width="2"/>`);
    if (/lantern|fuel|marble|stone|token|emblem|insignia|piece/.test(t)) return wrap('0 0 60 60', `<circle cx="30" cy="30" r="18" fill="${/gold/.test(t) ? 'url(#gGold)' : 'url(#gMetal)'}" ${O}/><path d="M30 16l5 10 11 1-8 8 2 11-10-5-10 5 2-11-8-8 11-1z" fill="#0c0f0a" opacity=".45"/>`);
    if (/wrench/.test(t)) return wrap('0 0 60 60', `<path d="M14 48l22-22a10 10 0 1 1 6-6l-6 6" fill="none" stroke="url(#gMetal)" stroke-width="7" stroke-linecap="round"/>`);
    return wrap('0 0 60 60', `<circle cx="20" cy="22" r="11" fill="none" stroke="url(#gGold)" stroke-width="6"/><path d="M28 30l22 22M40 42l6-6M46 48l6-6" stroke="url(#gGold)" stroke-width="5" stroke-linecap="round"/>`);
  }

  // ---- accessories, charms, recipes
  function acc(n) {
    const t = n.toLowerCase();
    if (/scope/.test(t)) return wrap('0 0 60 60', `<rect x="6" y="22" width="48" height="16" rx="6" fill="url(#gDark)" ${O}/><rect x="6" y="20" width="12" height="20" rx="3" fill="url(#gMetal)" ${O}/><rect x="42" y="20" width="12" height="20" rx="3" fill="url(#gMetal)" ${O}/><circle cx="12" cy="30" r="4" fill="#9fd0e8"/>`);
    if (/laser/.test(t)) return wrap('0 0 60 60', `<rect x="12" y="20" width="30" height="18" rx="3" fill="url(#gDark)" ${O}/><circle cx="46" cy="29" r="4" fill="#ff3b2e"/><path d="M50 29h8" stroke="#ff3b2e" stroke-width="2"/>`);
    return wrap('0 0 60 60', `<path d="M8 20h30l14 6v12l-14 6H8z" fill="url(#gWood)" ${O}/><rect x="8" y="24" width="10" height="16" fill="url(#gDark)" ${O}/>`); // stocks
  }
  const charm = (c) => wrap('0 0 60 60', `<path d="M30 4v10" stroke="#aaa" stroke-width="2"/><circle cx="30" cy="34" r="19" fill="${c}" ${O}/><circle cx="30" cy="34" r="13" fill="rgba(255,255,255,.25)"/><circle cx="25" cy="29" r="4" fill="url(#gGlass)"/>`);
  const recipe = wrap('0 0 60 60', `<path d="M12 12h30l8 8v30H12z" fill="url(#gPaper)" ${O}/><path d="M42 12v8h8" fill="#cdbf92" ${O}/><path d="M18 28h26M18 35h26M18 42h18" stroke="#6b5a3a" stroke-width="1.8"/>`);
  const map = wrap('0 0 60 60', `<path d="M8 14l14-4 16 6 14-4v32l-14 4-16-6-14 4z" fill="url(#gPaper)" ${O}/><path d="M22 10v36M38 16v36" stroke="#b8a674"/><path d="M30 28l8 8M38 28l-8 8" stroke="#c0392b" stroke-width="3"/>`);
  const armor = wrap('0 0 60 60', `<path d="M10 14l12-6h16l12 6v18c0 12-10 18-20 22C20 50 10 44 10 32z" fill="url(#gDark)" ${O}/><path d="M30 12v38" stroke="#aaa" opacity=".4"/>`);
  const caseIcon = (c1, c2) => wrap('0 0 60 60', `<rect x="6" y="18" width="48" height="32" rx="4" fill="url(#${c1})" ${O}/><path d="M22 18v-5h16v5" fill="none" ${O}/><rect x="6" y="30" width="48" height="4" fill="${c2}" opacity=".8"/><rect x="26" y="28" width="8" height="8" rx="1" fill="url(#gBrass)" ${O}/>`);
  const caseUp = wrap('0 0 60 60', `<rect x="6" y="22" width="48" height="30" rx="4" fill="url(#gMetal)" ${O}/><path d="M30 6v14M23 13l7-7 7 7" fill="none" stroke="#a9c58a" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`);

  // returns { svg, wide }: wide art is drawn horizontally and is turned when the item box is taller than wide
  const baseArt = function (name, cat, fp) {
    const n = String(name || ''); const t = n.toLowerCase();
    let svg = null, horizontal = false;
    try {
      if (cat === 'weapon') { svg = (!/knife|rocket|bolt thrower|bow/i.test(n) && gunPng(n)) || wrap('0 0 120 60', weapon(n)); horizontal = true; }
      else if (cat === 'heal') {
        svg = /spray/.test(t) ? spray : /bass/.test(t) ? fish : /viper/.test(t) ? viper : /beetle/.test(t) ? beetle : herb(n);
      } else if (cat === 'ammo') {
        svg = /handgun|magnum|rifle|submachine/.test(t) ? ammoBox('bullet') : /shotgun/.test(t) ? ammoBox('shotgun') : /explosive/.test(t) ? arrows : /bolt/.test(t) ? bolts
          : /gunpowder/.test(t) ? powder : /resources \(l\)/.test(t) ? resource(true) : /resources/.test(t) ? resource(false) : /mine/.test(t) ? mine : null;
      } else if (cat === 'throw') {
        svg = /flash/.test(t) ? flash : /heavy/.test(t) ? grenade(true) : /grenade/.test(t) ? grenade(false) : /golden/.test(t) ? egg('#e5c14a') : /brown/.test(t) ? egg('#a8743f') : egg('#f1ece0');
      } else if (cat === 'treasure') svg = treasure(n);
      else if (cat === 'key') svg = keyItem(n);
      else if (cat === 'acc') svg = acc(n);
      else if (cat === 'charm') svg = charm(/herb/.test(t) ? '#4fae3f' : /gold|ill?uminados|emblem/.test(t) ? '#c9a24a' : /ada|ashley|isabel|maria|bella/.test(t) ? '#a24a6a' : '#5e7ea6');
      else if (cat === 'special') {
        svg = /recipe/.test(t) ? recipe : /map/.test(t) ? map : /armor/.test(t) ? armor : /upgrade/.test(t) ? caseUp
          : /silver/.test(t) ? caseIcon('gMetal', '#e6e9eb') : /black/.test(t) ? caseIcon('gDark', '#999') : /leather/.test(t) ? caseIcon('gWood', '#e3b27a') : /gold/.test(t) ? caseIcon('gGold', '#fff0a8') : /classic/.test(t) ? caseIcon('gBox', '#c9ad6a') : null;
      }
    } catch (e) { svg = null; }
    if (!svg) return { svg: null, horizontal: false };
    // a horizontally drawn weapon in a tall box is turned by 90 degrees
    const turn = horizontal && fp && fp[1] > fp[0];
    return { svg, horizontal, turn };
  };
  window.itemArt = function (name, cat, fp, id) {
    const a = baseArt(name, cat, fp);
    if (id === undefined || id === null) return a;
    const own = '<img class="art own" alt="" src="icons/user/' + id + '.png" onerror="this.remove()">';
    return { ...a, svg: '<div class="stk">' + (a.svg || '') + own + '</div>' };
  };
})();
