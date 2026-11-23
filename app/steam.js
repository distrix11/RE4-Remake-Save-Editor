'use strict';
// Read-only access to the local Steam achievement cache (appcache/stats):
//   UserGameStatsSchema_<app>.bin        achievement names / descriptions (all languages)
//   UserGameStats_<account>_<app>.bin    which achievements are unlocked, with unix timestamps
const fs = require('fs');
const path = require('path');

// minimal binary KeyValues (VDF) reader
function parseKV(buf) {
  let p = 0;
  const cstr = () => { const e = buf.indexOf(0, p); const s = buf.toString('utf8', p, e); p = e + 1; return s; };
  function obj() {
    const o = {};
    while (p < buf.length) {
      const t = buf[p++];
      if (t === 8 || t === 0x0b) return o;
      const k = cstr();
      if (t === 0) o[k] = obj();
      else if (t === 1) o[k] = cstr();
      else if (t === 2) { o[k] = buf.readInt32LE(p); p += 4; }
      else if (t === 3) { o[k] = buf.readFloatLE(p); p += 4; }
      else if (t === 4 || t === 6) { o[k] = buf.readUInt32LE(p); p += 4; }
      else if (t === 5) { let e = p; while (buf.readUInt16LE(e) !== 0) e += 2; o[k] = buf.toString('utf16le', p, e); p = e + 2; }
      else if (t === 7) { o[k] = buf.readBigUInt64LE(p).toString(); p += 8; }
      else throw new Error('Unknown Steam data type: ' + t);
    }
    return o;
  }
  return obj();
}

// saveDir = <Steam>/userdata/<account>/<appid>/remote/win64_save
function steamPaths(saveDir) {
  const r = (n) => path.resolve(saveDir, ...Array(n).fill('..'));
  return { appId: path.basename(r(2)), accountId: path.basename(r(3)), root: r(5), statsDir: path.join(r(5), 'appcache', 'stats') };
}

function readAchievements(saveDir, lang = 'english') {
  const { appId, accountId, statsDir } = steamPaths(saveDir);
  const schemaFile = path.join(statsDir, `UserGameStatsSchema_${appId}.bin`);
  const userFile = path.join(statsDir, `UserGameStats_${accountId}_${appId}.bin`);
  if (!fs.existsSync(schemaFile) || !fs.existsSync(userFile)) return { available: false, reason: 'Steam statistics files not found in ' + statsDir };
  try {
    const schema = parseKV(fs.readFileSync(schemaFile))[appId];
    const user = parseKV(fs.readFileSync(userFile)).cache || {};
    const list = [];
    for (const sid of Object.keys(schema.stats)) {
      const bits = schema.stats[sid].bits; if (!bits) continue;
      for (const bit of Object.keys(bits)) {
        const b = bits[bit]; const d = b.display || {};
        const t = user[sid] && user[sid].AchievementTimes && user[sid].AchievementTimes[bit];
        list.push({
          key: sid + ':' + bit, name: (d.name && (d.name[lang] || d.name.english)) || b.name, en: d.name && d.name.english,
          desc: (d.desc && (d.desc[lang] || d.desc.english)) || '', hidden: !!d.hidden, unlocked: !!t, time: t ? Number(t) * 1000 : null,
        });
      }
    }
    return { available: true, list, unlocked: list.filter((x) => x.unlocked).length, total: list.length, fileTime: fs.statSync(userFile).mtimeMs };
  } catch (e) {
    return { available: false, reason: 'Could not read the Steam files: ' + e.message };
  }
}

module.exports = { readAchievements, steamPaths, parseKV };
