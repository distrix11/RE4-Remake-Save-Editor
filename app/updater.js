'use strict';
// Looks for a newer release on GitHub at most once every 24 hours (and only if the user has not turned it off).
// The only request is a plain GET to api.github.com for the releases of this project (pre-releases count too). It sends no personal data
// (just a generic user agent) and never downloads or installs anything: the user is pointed to the release page.
const fs = require('fs');
const path = require('path');

const REPO = 'distrix11/RE4-Remake-Save-Editor';
// the list, not /releases/latest: GitHub never reports a pre-release as "latest" (that URL answers 404 while only pre-releases exist)
const API = `https://api.github.com/repos/${REPO}/releases?per_page=10`;
const PAGE_PREFIX = `https://github.com/${REPO}/`;
const DAY = 24 * 3600 * 1000;
const STATE = path.join(__dirname, 'update-state.json');

const readState = () => { try { return JSON.parse(fs.readFileSync(STATE, 'utf8')); } catch { return {}; } };
const writeState = (s) => { try { fs.writeFileSync(STATE, JSON.stringify(s, null, 2)); } catch { /* read-only folder: just check again next time */ } };
const parts = (v) => String(v).replace(/^v/i, '').split('-')[0].split('.').map((n) => parseInt(n, 10) || 0);
function isNewer(a, b) { const x = parts(a), y = parts(b); for (let i = 0; i < 3; i++) { if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) > (y[i] || 0); } return false; }

async function fetchLatest() {
  const r = await fetch(API, { headers: { 'User-Agent': 'RE4-Save-Editor-update-check', Accept: 'application/vnd.github+json' }, signal: AbortSignal.timeout(6000) });
  if (r.status === 404) return { none: true }; // no such repository or no release published (yet)
  if (!r.ok) throw new Error('HTTP ' + r.status);
  const list = await r.json();
  let best = null; // the highest version among the published (not draft) releases
  for (const j of Array.isArray(list) ? list : []) {
    if (!j || j.draft) continue;
    const version = String(j.tag_name || '').replace(/^v/i, '');
    if (!/^\d+\.\d+/.test(version)) continue;
    if (!best || isNewer(version, best.version)) {
      const url = typeof j.html_url === 'string' && j.html_url.startsWith(PAGE_PREFIX) ? j.html_url : PAGE_PREFIX + 'releases';
      best = { version, url, name: j.name || '', prerelease: !!j.prerelease };
    }
  }
  return best || { none: true };
}

// force: ignore the 24 h gap (manual "Check now"); the on/off switch is honoured by the caller
async function check(current, force) {
  const st = readState();
  if (force || !st.checkedAt || Date.now() - st.checkedAt >= DAY) {
    try {
      const l = await fetchLatest();
      Object.assign(st, { checkedAt: Date.now(), error: null }, l.none ? { latest: null, url: null, prerelease: false } : { latest: l.version, url: l.url, prerelease: !!l.prerelease });
      writeState(st);
    } catch (e) { if (force) st.error = 'Could not reach GitHub (' + e.message + ')'; return summary(current, st); }
  }
  return summary(current, st);
}
function summary(current, st) {
  const available = !!(st.latest && isNewer(st.latest, current));
  return { current, latest: st.latest || null, url: st.url || null, prerelease: !!st.prerelease, available, dismissed: available && st.dismissed === st.latest, checkedAt: st.checkedAt || null, error: st.error || null };
}
function dismiss(version) { const st = readState(); st.dismissed = String(version); writeState(st); }
function cached(current) { return summary(current, readState()); }

module.exports = { check, cached, dismiss, isNewer, REPO, PAGE_PREFIX };
