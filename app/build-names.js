// Builds app/names.json {c:{hash:className}, f:{hash:fieldName}} from ref/rsz/rszre4.json
const fs = require('fs'), path = require('path');
const { hashName } = require('./murmur');
const src = path.join(__dirname, '..', 'ref', 'rsz', 'rszre4.json');
const rsz = JSON.parse(fs.readFileSync(src, 'utf8'));
const c = {}, f = {};
for (const k in rsz) {
  const cl = rsz[k]; if (!cl.name) continue;
  if (!/[`[<]/.test(cl.name)) c[hashName(cl.name)] = cl.name;
  for (const fl of cl.fields) f[hashName(fl.name)] = fl.name;
}
fs.writeFileSync(path.join(__dirname, 'names.json'), JSON.stringify({ c, f }));
console.log('classes', Object.keys(c).length, 'fields', Object.keys(f).length);
