'use strict';
// Settings (save folder / Steam account), backup manager, diagnostics and the "unrecognised format" banner.

// ---------------------------------------------------------------- format warning banner
function showWarnings(list) {
  const el = $('#fmtBanner');
  if (!list || !list.length) { el.hidden = true; return; }
  el.innerHTML = ic('close') + 'Unrecognised save format. <span>' + esc(list[0]) + (list.length > 1 ? ' (+' + (list.length - 1) + ' more)' : '') +
    '. The game may have been updated: adding, moving and removing items is disabled to protect your file. Money and simple values can still be edited.</span>';
  el.hidden = false;
}

// ---------------------------------------------------------------- settings
async function openSettings() {
  $('#settingsModal').classList.add('on');
  try {
    const s = await api('settings');
    $('#setDir').value = s.saveDir || '';
    $('#setVersion').textContent = 'RE4 Save Editor ' + s.version + ' · config file: app/config.json';
    const box = $('#setCands'); box.innerHTML = '';
    if (!s.candidates.length) box.innerHTML = '<div class="dim" style="font-size:12px">No save folders were found automatically. Use Browse or paste the path.</div>';
    for (const c of s.candidates) {
      const d = document.createElement('div'); d.className = 'pick' + (c.dir.toLowerCase() === String(s.saveDir || '').toLowerCase() ? ' on' : '');
      d.innerHTML = '<span><b>Steam account ' + esc(c.account) + '</b><br><span class="dim mono" style="font-size:11px">' + esc(c.dir) + '</span><br><span class="dim" style="font-size:12px">last save ' + new Date(c.mtime).toLocaleString('en-US') + '</span></span>';
      const b = document.createElement('button'); b.className = 'sm'; b.textContent = 'Use'; b.onclick = () => applyFolder(c.dir);
      d.append(b); box.append(d);
    }
  } catch (e) { toast(e.message, 'err'); }
}
async function applyFolder(dir) {
  try {
    await api('settings', { saveDir: dir });
    $('#settingsModal').classList.remove('on');
    data = null; cur = null; setButtons(); showWarnings([]);
    await loadFiles(); loadSummaries();
    showStart(); loadSummaries().then(() => { if (!cur) showStart(); });
    toast('Save folder set.', 'ok');
  } catch (e) { toast(e.message, 'err'); }
}
$('#bSettings').onclick = openSettings;
$('#settingsClose').onclick = () => $('#settingsModal').classList.remove('on');
$('#settingsModal').onclick = (e) => { if (e.target.id === 'settingsModal') $('#settingsModal').classList.remove('on'); };
$('#setApply').onclick = () => applyFolder($('#setDir').value.trim());
$('#setBrowse').onclick = async () => {
  try { const r = await api('browse'); if (r.dir) $('#setDir').value = r.dir; } catch (e) { toast(e.message, 'err'); }
};
$('#setOpenSave').onclick = () => api('open-folder', { which: 'save' }).catch((e) => toast(e.message, 'err'));
$('#setDiag').onclick = async () => {
  try {
    const r = await api('diagnostics');
    try { await navigator.clipboard.writeText(r.text); toast('Diagnostics copied. It contains no save data, account numbers or user names.', 'ok'); }
    catch { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([r.text], { type: 'text/plain' })); a.download = 're4-editor-diagnostics.txt'; a.click(); toast('Diagnostics saved as a file.', 'ok'); }
  } catch (e) { toast(e.message, 'err'); }
};
// no save folder yet (first run on an unusual setup): ask for it right away
(function waitForConfig(n) { if (typeof cfg !== 'undefined' && cfg) { if (cfg.noSaveDir) openSettings(); } else if (n < 40) setTimeout(() => waitForConfig(n + 1), 250); })(0);

// ---------------------------------------------------------------- backup manager
async function openBackups() {
  $('#bkModal').classList.add('on');
  const list = $('#bkList'); list.innerHTML = '<div class="empty">Loading…</div>';
  try {
    const r = await api('backups-all');
    $('#bkInfo').textContent = r.backups.length + ' backup files, ' + fmtSize(r.total) + ' in total. Backups are made before every write to the game; the first-run copy is protected.';
    list.innerHTML = '';
    if (!r.backups.length) { list.innerHTML = '<div class="empty">No backups yet.</div>'; return; }
    for (const b of r.backups) {
      const d = document.createElement('div'); d.className = 'pick';
      d.innerHTML = '<span><b>' + esc(slotTitle(b.file)) + '</b> <span class="dim mono" style="font-size:11px">' + esc(b.file) + '</span><br><span class="dim" style="font-size:12px">' + esc(b.label) + ' · ' + new Date(b.when).toLocaleString('en-US') + ' · ' + fmtSize(b.size) + '</span></span>';
      const acts = document.createElement('span'); acts.style.whiteSpace = 'nowrap';
      const rs = document.createElement('button'); rs.className = 'sm'; rs.innerHTML = ic('restore') + 'Restore';
      rs.onclick = async () => { if (await sure('Restore this backup?', 'Replace the current ' + slotTitle(b.file) + ' with this backup? The current file is saved to backup/auto/ first.', 'Restore')) restoreFromManager(b); };
      acts.append(rs);
      if (!b.protected) {
        const del = document.createElement('button'); del.className = 'sm icon danger'; del.title = 'Delete this backup'; del.innerHTML = ic('trash'); del.style.marginLeft = '6px';
        del.onclick = async () => { try { await api('backup-delete', { id: b.id, file: b.file }); openBackups(); } catch (e) { toast(e.message, 'err'); } };
        acts.append(del);
      }
      d.append(acts); list.append(d);
    }
  } catch (e) { list.innerHTML = '<div class="empty">' + esc(e.message) + '</div>'; }
}
async function restoreFromManager(b, force) {
  try {
    const r = await api('restore', { name: b.file, id: b.id, force });
    if (r.running) { if (await sure('The game is running', RUNNING, 'Replace anyway')) return restoreFromManager(b, true); return; }
    toast('Restored ' + b.file + '.\nThe previous version was saved to: ' + r.backup, 'ok');
    $('#bkModal').classList.remove('on');
    await loadFiles(); if (cur === b.file) await openFile(cur);
  } catch (e) { toast(e.message, 'err'); }
}
$('#setBackups').onclick = () => { $('#settingsModal').classList.remove('on'); openBackups(); };
$('#bkClose').onclick = () => $('#bkModal').classList.remove('on');
$('#bkModal').onclick = (e) => { if (e.target.id === 'bkModal') $('#bkModal').classList.remove('on'); };
$('#bkOpen').onclick = () => api('open-folder', { which: 'backups' }).catch((e) => toast(e.message, 'err'));
$('#bkClean').onclick = async () => {
  const keep = Number($('#bkKeep').value) || 5;
  if (!(await sure('Delete old backups?', 'Delete all automatic backups except the newest ' + keep + ' of each file? The first-run copy is kept.', 'Delete old backups', { danger: true }))) return;
  try { const r = await api('backup-cleanup', { keep }); toast('Removed ' + r.removed + ' old backup files.', 'ok'); openBackups(); } catch (e) { toast(e.message, 'err'); }
};

// ---------------------------------------------------------------- animations
const animNote = () => { $('#setAnimNote').hidden = !(fx.mode() === 'auto' && fx.systemOff()); };
$('#setAnim').value = fx.mode(); animNote();
$('#setAnim').onchange = (e) => { fx.setMode(e.target.value); animNote(); };

// ---------------------------------------------------------------- desktop shortcut
$('#setShortcut').onclick = async () => {
  try { await api('shortcut', {}); toast('Shortcut "RE4 Save Editor" created on the desktop', 'ok'); } catch (e) { toast(e.message, 'err'); }
};
