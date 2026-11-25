'use strict';
// Renders docs/banner.png and docs/icon-gallery.png for the README from icons/items with headless Edge/Chrome. Dev tool.
// Usage: node scripts/make-readme-art.js
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const EDGE = ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Google/Chrome/Application/chrome.exe'].find(fs.existsSync);
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 're4art-'));
fs.cpSync(path.join(ROOT, 'icons', 'items'), path.join(tmp, 'items'), { recursive: true });
fs.cpSync(path.join(ROOT, 'icons', 'weapons'), path.join(tmp, 'weapons'), { recursive: true });
const guns = ['sg09r', 'red9', 'matilda', 'handcannon', 'butterfly', 'riot_gun', 'w870', 'sawed_off', 'skull', 'striker', 'm1903', 'stingray', 'cqbr', 'le5', 'tmp', 'chicago', 'crossbow', 'bolt_thrower', 'knife_combat', 'knife_primal', 'rocket'];

const css = `*{box-sizing:border-box}body{margin:0;font-family:'Segoe UI',Arial,sans-serif;color:#e4ecd8;background:radial-gradient(900px 400px at 15% 0%,#2b3a22 0,#161d12 70%)}
img{display:block}.mono{font-family:Consolas,monospace}`;
const img = (n, s) => `<img src="items/${n}.png" width="${s}" height="${s}">`;

const banner = `<!doctype html><meta charset="utf-8"><style>${css}
body{width:1280px;height:320px;display:flex;align-items:center;padding:0 48px;gap:40px;border-bottom:4px solid #c9a24a}
.t{flex:1}.t h1{margin:0;font-size:64px;letter-spacing:6px;color:#a9c58a;font-weight:800;line-height:1}.t h1 span{color:#c9a24a}
.t p{margin:16px 0 0;font-size:24px;color:#cfd9c1}.t .s{margin-top:18px;display:flex;gap:12px}
.pill{padding:6px 16px;border-radius:20px;font-size:18px;font-weight:700;border:2px solid}
.g{color:#a9c58a;border-color:#a9c58a}.y{color:#f0d472;border-color:#f0d472}.r{color:#e0746a;border-color:#e0746a}
.icons{display:grid;grid-template-columns:repeat(4,120px);gap:6px}.icons div{background:rgba(169,197,138,.1);border:1px solid rgba(169,197,138,.3);border-radius:8px;padding:4px}
</style><body>${img('herb_green', 150)}<div class="t"><h1>RE4 <span>SAVE EDITOR</span></h1><p>Unofficial local save editor for Resident Evil 4 (2023), Steam, Windows</p>
<div class="s"><span class="pill g">Case view</span><span class="pill y">Drag &amp; sort</span><span class="pill r">Safe backups</span></div></div>
<div class="icons">${['first_aid_spray', 'ammo_handgun', 'crown', 'gem_ruby', 'chalice', 'mask', 'key_gold', 'case_gold'].map((n) => `<div>${img(n, 110)}</div>`).join('')}</div>`;

const groups = [
  ['Healing', '#7fb35a', ['herb_green', 'herb_red', 'herb_yellow', 'herb_gry', 'first_aid_spray', 'bass']],
  ['Ammo and crafting', '#c9a24a', ['ammo_handgun', 'ammo_shotgun', 'ammo_rifle', 'ammo_magnum', 'gunpowder', 'mine']],
  ['Throwables', '#9aa86a', ['grenade_hand', 'grenade_heavy', 'grenade_flash', 'egg_white', 'egg_brown', 'egg_gold']],
  ['Treasures', '#f0d472', ['gem_ruby', 'gem_emerald', 'gem_sapphire', 'crown', 'chalice', 'mask', 'pocket_watch', 'hourglass', 'lynx', 'mirror', 'chessboard', 'perfume']],
  ['Key items', '#8cb4d8', ['key_gold', 'head_lion', 'sword_gold', 'keycard_1', 'emblem_hex', 'lantern', 'litho_a', 'token_gold', 'halo_wheel', 'cubic_device', 'dynamite', 'unicorn_horn']],
  ['Case skins, accessories, more', '#d8dde0', ['case_silver', 'case_black', 'case_leather', 'case_gold', 'case_classic', 'scope', 'scope_bio', 'laser', 'stock_tmp', 'recipe', 'map', 'armor']],
];
const gallery = `<!doctype html><meta charset="utf-8"><style>${css}
body{width:1280px;padding:28px 32px 32px}h2{margin:0 0 4px;font-size:26px;color:#a9c58a;letter-spacing:3px}.sub{color:#cfd9c1;margin:0 0 20px;font-size:17px}
.grid{display:grid;grid-template-columns:repeat(2,1fr);gap:18px}.card{border:2px solid;border-radius:10px;padding:12px 14px;background:rgba(0,0,0,.22)}
.card h3{margin:0 0 8px;font-size:18px;letter-spacing:1px}.row{display:flex;flex-wrap:wrap;gap:4px}.row div{width:84px;height:84px;background:rgba(255,255,255,.05);border-radius:6px;padding:2px}
</style><body><h2>ITEM ICONS</h2><p class="sub">Original 3D-rendered icons, one for every item and weapon of the catalogue (shown in the Case view).</p>
<div class="card" style="border-color:#c9a24a;margin-bottom:18px"><h3 style="color:#c9a24a">Weapons</h3><div style="display:flex;flex-wrap:wrap;gap:6px;align-items:center">${guns.map((n) => `<div style="width:162px;height:74px;background:rgba(255,255,255,.05);border-radius:6px;padding:4px"><img src="weapons/own_${n}.png" style="width:100%;height:100%;object-fit:contain"></div>`).join('')}</div></div>
<div class="grid">${groups.map(([t, c, l]) => `<div class="card" style="border-color:${c}"><h3 style="color:${c}">${t}</h3><div class="row">${l.map((n) => `<div>${img(n, 80)}</div>`).join('')}</div></div>`).join('')}</div>`;

const shot = (name, html, w, h) => {
  const f = path.join(tmp, name + '.html'); fs.writeFileSync(f, html);
  const out = path.join(ROOT, 'docs', name + '.png');
  spawnSync(EDGE, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=1.5', `--window-size=${w},${h}`, `--screenshot=${out}`, 'file:///' + f.split(path.sep).join('/')], { stdio: 'ignore' });
  console.log(fs.existsSync(out) ? 'wrote ' + out : 'FAILED ' + name);
};
// download buttons (solid background so they look the same on light and dark GitHub themes)
const button = (label, sub, color, bg, icon) => `<!doctype html><meta charset="utf-8"><style>${css}
body{width:360px;height:76px;display:flex;align-items:center;gap:14px;padding:0 20px;background:${bg};border:3px solid ${color}}
.l{font-size:25px;font-weight:800;color:${color};letter-spacing:1px;line-height:1.1}.s{font-size:14px;color:#cfd9c1;margin-top:3px}</style><body>${icon}<div><div class="l">${label}</div><div class="s">${sub}</div></div>`;
shot('btn-github', button('DOWNLOAD', 'from GitHub Releases (Windows)', '#a9c58a', '#1d2a17', img('herb_green', 46)), 360, 76);
shot('btn-nexus', button('DOWNLOAD', 'from Nexus Mods', '#e8a24a', '#2a2114', img('case_gold', 46)), 360, 76);
// minimal header and cover for the Nexus Mods page: one icon, the name and one line
const nexusHeader = `<!doctype html><meta charset="utf-8"><style>${css}
body{width:1600px;height:400px;display:flex;align-items:center;justify-content:center;gap:56px;border-bottom:5px solid #c9a24a}
h1{margin:0;font-size:104px;letter-spacing:12px;color:#a9c58a;font-weight:800;line-height:1}h1 span{color:#c9a24a}p{margin:18px 0 0;font-size:34px;color:#cfd9c1;letter-spacing:1px}</style><body>${img('herb_green', 250)}<div><h1>RE4 <span>SAVE EDITOR</span></h1><p>Unofficial save editor for Resident Evil 4 (2023)</p></div>`;
const nexusCover = `<!doctype html><meta charset="utf-8"><style>${css}
body{width:1920px;height:1080px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:44px;text-align:center}
h1{margin:0;font-size:150px;letter-spacing:18px;color:#a9c58a;font-weight:800;line-height:1}h1 span{color:#c9a24a}p{margin:0;font-size:44px;color:#cfd9c1;letter-spacing:2px}.bar{width:520px;height:5px;background:#c9a24a;margin:30px auto 0}</style><body>${img('herb_green', 420)}<div><h1>RE4 <span>SAVE EDITOR</span></h1><div class="bar"></div></div><p>Unofficial save editor for Resident Evil 4 (2023)</p>`;
shot('nexus-header', nexusHeader, 1600, 400);
shot('nexus-cover', nexusCover, 1920, 1080);
shot('banner', banner, 1280, 320);
shot('icon-gallery', gallery, 1280, 1095);
fs.rmSync(tmp, { recursive: true, force: true });
