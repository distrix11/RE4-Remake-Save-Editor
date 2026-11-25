'use strict';
// About dialog (author, GitHub, license), the daily update check switch and the "new version" banner.
const REPO_URL = 'https://github.com/distrix11/RE4-Remake-Save-Editor';
const NEXUS_URL = 'https://www.nexusmods.com/residentevil42023/mods/8173?tab=files';

function showUpdate(u) {
  const el = $('#updBanner');
  if (!u || !u.enabled || !u.available || u.dismissed) { el.hidden = true; return; }
  el.innerHTML = '<span>' + ic('export') + 'Version <b>' + esc(u.latest) + '</b>' + (u.prerelease ? ' (pre-release)' : '') + ' is available (you have ' + esc(u.current) + '). Open the download page:</span><span class="sp"></span>';
  const yes = document.createElement('button'); yes.className = 'pri sm'; yes.textContent = 'GitHub';
  yes.onclick = () => { window.open(u.url || REPO_URL + '/releases', '_blank', 'noopener'); };
  const nx = document.createElement('button'); nx.className = 'sm'; nx.textContent = 'Nexus Mods';
  nx.onclick = () => { window.open(NEXUS_URL, '_blank', 'noopener'); };
  const no = document.createElement('button'); no.className = 'sm'; no.textContent = 'Not now';
  no.onclick = async () => { el.hidden = true; try { await api('update-dismiss', { version: u.latest }); } catch { /* ignore */ } };
  el.append(yes, nx, no); el.hidden = false;
}
async function loadUpdate() { try { showUpdate(await api('update', {})); } catch { /* offline or private repo: stay silent */ } }

async function openAbout() {
  $('#aboutModal').classList.add('on');
  $('#abVersion').textContent = 'Version ' + (typeof cfg !== 'undefined' && cfg ? cfg.version : '');
  try {
    const u = await api('update', {});
    $('#abUpd').checked = u.enabled;
    $('#abStatus').textContent = u.available ? 'New version ' + u.latest + ' is available.' : (u.latest ? 'You are up to date.' : 'No release information yet.');
  } catch (e) { $('#abStatus').textContent = ''; }
}
$('#bAbout').onclick = openAbout;
$('#aboutClose').onclick = () => $('#aboutModal').classList.remove('on');
$('#aboutModal').onclick = (e) => { if (e.target.id === 'aboutModal') $('#aboutModal').classList.remove('on'); };
$('#abUpd').onchange = async () => {
  try { const u = await api('update', { enabled: $('#abUpd').checked }); showUpdate(u); toast(u.enabled ? 'Update check is on (once a day).' : 'Update check is off. Nothing is sent to GitHub.', 'ok'); }
  catch (e) { toast(e.message, 'err'); }
};
$('#abCheck').onclick = async () => {
  $('#abStatus').textContent = 'Checking…';
  try {
    const u = await api('update', { check: true });
    $('#abStatus').textContent = u.error ? u.error : u.available ? 'New version ' + u.latest + ' is available.' : (u.latest ? 'You are up to date.' : 'No release has been published yet.');
    showUpdate(u);
  } catch (e) { $('#abStatus').textContent = e.message; }
};
loadUpdate();

// ---------------------------------------------------------------- what's new: once after every new version
let newsShown = null; // the version of the window that is open
function showNews(n) {
  $('#newsVersion').textContent = 'Version ' + n.version;
  // the changelog uses **bold** and `code`
  $('#newsList').innerHTML = n.items.map((t) => '<li>' + esc(t).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/`(.+?)`/g, '<span class="mono">$1</span>') + '</li>').join('');
  newsShown = n.version; $('#newsModal').classList.add('on');
}
function closeNews() {
  $('#newsModal').classList.remove('on');
  api('whatsnew-seen', {}).catch(() => {});
}
$('#newsClose').onclick = closeNews;
$('#newsOk').onclick = closeNews;
$('#newsModal').onclick = (e) => { if (e.target.id === 'newsModal') closeNews(); };
$('#newsMore').onclick = () => { window.open(REPO_URL + '/releases/tag/v' + newsShown, '_blank', 'noopener'); closeNews(); };
$('#abNews').onclick = async () => {
  try {
    const n = await api('whatsnew');
    if (!n.items.length) { window.open(REPO_URL + '/releases', '_blank', 'noopener'); return; }
    $('#aboutModal').classList.remove('on'); showNews(n);
  } catch (e) { toast(e.message, 'err'); }
};
// at start, unless there is no save folder yet (then Settings opens first, and the notes wait for the next start)
(async () => {
  try {
    const n = await api('whatsnew');
    if (n.seen || !n.items.length || (await api('config')).noSaveDir || document.querySelector('.modal.on')) return;
    showNews(n);
  } catch { /* not essential */ }
})();
