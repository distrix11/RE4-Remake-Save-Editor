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
