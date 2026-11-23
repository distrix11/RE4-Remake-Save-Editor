'use strict';
// Inline SVG icons (24x24, stroke based, inherit text colour). No external assets.
const ICONS = {
  leaf: '<path d="M12 22V9"/><path d="M12 9C10.5 7 10.5 4.5 12 2c1.5 2.500 1.500 5 0 7z"/><path d="M12 14C9 14 6.500 12.500 5.500 9.500c3 0 5.500 1.200 6.500 4.500z"/><path d="M12 14c3 0 5.500-1.500 6.500-4.500-3 0-5.500 1.200-6.500 4.500z"/><path d="M12 19c-2.800 0-5-1.300-6-4 2.800 0 5 1 6 4z"/><path d="M12 19c2.800 0 5-1.300 6-4-2.800 0-5 1-6 4z"/>',
  coin: '<circle cx="12" cy="12" r="8"/><path d="M9.5 10c0-1.2 1-2 2.5-2s2.5.8 2.5 2-1 1.8-2.500 2-2.500.8-2.500 2 1 2 2.500 2 2.500-.8 2.500-2M12 5.500V8m0 8v2.500"/>',
  gem: '<path d="M6 4h12l3 5-9 11L3 9z"/><path d="M3 9h18M9 4 7 9l5 11 5-11-2-5"/>',
  case: '<rect x="3" y="7" width="18" height="13" rx="1"/><path d="M9 7V5h6v2M3 13h18M11 12.500v2.500h2v-2.500"/>',
  quest: '<rect x="5" y="4" width="14" height="17" rx="1"/><path d="M9 4h6v3H9zM8 12h8M8 16h5"/>',
  tools: '<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>',
  file: '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 12h6M9 16h6"/>',
  weapon: '<path d="M3 8h15v4h-7l-1 5H7l1-5H3z"/><path d="M18 8l2 1.500"/>',
  throw: '<circle cx="12" cy="14" r="6"/><path d="M10 8V5h4l2 2M9.500 11 15 17"/>',
  ammo: '<path d="M9 21V10c0-3 1.500-5 3-6 1.500 1 3 3 3 6v11z"/><path d="M9 17h6"/>',
  heal: '<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M12 8v8M8 12h8"/>',
  acc: '<circle cx="12" cy="12" r="7"/><path d="M12 3v5M12 16v5M3 12h5M16 12h5"/>',
  key: '<circle cx="8" cy="12" r="4"/><path d="M12 12h9M18 12v3M15 12v2"/>',
  treasure: '<path d="M3 8l4 4 5-7 5 7 4-4-2 11H5z"/>',
  special: '<path d="M12 3l2.700 5.600 6.100.9-4.400 4.300 1 6.100L12 17l-5.400 2.900 1-6.100L3.200 9.500l6.100-.9z"/>',
  charm: '<path d="M12 3v4"/><circle cx="12" cy="14" r="6"/><path d="M12 11v6M9 14h6"/>',
  money: '<circle cx="12" cy="12" r="8"/><path d="M9.500 10c0-1.200 1-2 2.500-2s2.500.8 2.500 2-1 1.800-2.500 2-2.500.8-2.500 2 1 2 2.500 2 2.500-.8 2.500-2"/>',
  box: '<path d="M4 8l8-4 8 4v8l-8 4-8-4z"/><path d="M4 8l8 4 8-4M12 12v8"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  copy: '<rect x="8" y="8" width="12" height="12" rx="1"/><path d="M4 16V4h12"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6"/>',
  check: '<path d="M5 12.500l5 5 9-10"/>',
  circle: '<circle cx="12" cy="12" r="5.500"/>',
  save: '<path d="M5 4h11l3 3v13H5z"/><path d="M8 4v5h7V4M8 20v-6h8v6"/>',
  export: '<path d="M12 3v12M7 8l5-5 5 5M5 15v5h14v-5"/>',
  undo: '<path d="M9 7 4 12l5 5"/><path d="M4 12h10a6 6 0 0 1 0 8h-3"/>',
  restore: '<path d="M4 12a8 8 0 1 0 2.500-5.800"/><path d="M4 4v4.500h4.500M12 8v5l3 2"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  trophy: '<path d="M8 4h8v5a4 4 0 0 1-8 0z"/><path d="M8 6H5v2a3 3 0 0 0 3 3M16 6h3v2a3 3 0 0 1-3 3M12 13v4M9 20h6"/>',
  grid: '<rect x="4" y="4" width="7" height="7"/><rect x="13" y="4" width="7" height="7"/><rect x="4" y="13" width="7" height="7"/><rect x="13" y="13" width="7" height="7"/>',
  list: '<path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01"/>',
  rotate: '<path d="M20 11a8 8 0 1 0-2.300 5.700"/><path d="M20 4v7h-7"/>',
};
function ic(name, extra) {
  const p = ICONS[name] || ICONS.box;
  return '<svg class="ic' + (extra ? ' ' + extra : '') + '" viewBox="0 0 24 24" aria-hidden="true">' + p + '</svg>';
}
const TAB_ICON = { money: 'coin', inv: 'case', quests: 'quest', treasures: 'treasure', achievements: 'trophy', tree: 'tools' };
const INV_ICON = ['case', 'special', 'key', 'treasure'];
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-ic]').forEach((el) => el.insertAdjacentHTML('afterbegin', ic(el.dataset.ic)));
});
