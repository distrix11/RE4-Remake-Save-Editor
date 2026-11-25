// Procedural 3D builders for the rest of the item catalog (original geometry, no third-party assets).
// makeExtra(THREE) returns { key: () => Group }. A group may set userData.view = [tiltX, turnY, tiltZ] for the camera angle.
export function makeExtra(THREE) {
  const M = (c, m, r, e = {}) => new THREE.MeshStandardMaterial({ color: c, metalness: m, roughness: r, ...e });
  const gold = M(0xf3c84a, 0.7, 0.28, { emissive: 0x3d2a00, emissiveIntensity: 0.6 }), silver = M(0xd3d9de, 0.8, 0.28), steel = M(0xaab2b9, 0.9, 0.3), dark = M(0x30353a, 0.7, 0.4),
    black = M(0x16181b, 0.5, 0.4), wood = M(0x9a6a3c, 0, 0.6), dwood = M(0x4e2f18, 0, 0.6), brass = M(0xe0b24e, 0.7, 0.3, { emissive: 0x2e2000, emissiveIntensity: 0.5 }),
    leather = M(0x6b4a2a, 0, 0.7), cream = M(0xece1c2, 0, 0.5), paper = M(0xe8d9aa, 0, 0.7), olive = M(0x66783b, 0.15, 0.55), red = M(0xc72f27, 0.1, 0.4), rust = M(0x7a4a2c, 0.5, 0.7),
    stone = M(0x3c3f44, 0, 0.95), white = M(0xf2f2ec, 0, 0.35);
  const glassy = (c, o = 1) => M(c, 0.15, 0.06, { flatShading: true, emissive: c, emissiveIntensity: 0.18, transparent: o < 1, opacity: o });
  const add = (g, geo, m, x = 0, y = 0, z = 0) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); g.add(o); return o; };
  const lathe = (pts, seg = 40) => new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), seg);
  const cyl = (g, r, h, m, x, y, z, seg = 24) => add(g, new THREE.CylinderGeometry(r, r, h, seg), m, x, y, z);
  const box = (g, w, h, d, m, x = 0, y = 0, z = 0) => add(g, new THREE.BoxGeometry(w, h, d), m, x, y, z);
  const torus = (g, R, r, m, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, arc = Math.PI * 2) => { const o = add(g, new THREE.TorusGeometry(R, r, 12, 48, arc), m, x, y, z); o.rotation.set(rx, ry, rz); return o; };
  const sph = (g, r, m, x = 0, y = 0, z = 0, sx = 1, sy = 1, sz = 1) => { const o = add(g, new THREE.SphereGeometry(r, 24, 18), m, x, y, z); o.scale.set(sx, sy, sz); return o; };
  const extrude = (pts, depth, m, bevel = 0.03) => {
    const s = new THREE.Shape(); pts.forEach(([x, y], i) => (i ? s.lineTo(x, y) : s.moveTo(x, y))); s.closePath();
    const geo = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 2 }); geo.translate(0, 0, -depth / 2); return new THREE.Mesh(geo, m);
  };
  const gem = (c, sides = 8, s = 1) => { const g = new THREE.Group(); const o = add(g, lathe([[0, -1], [0.98, 0.05], [1, 0.18], [0.62, 0.62], [0, 0.62]], sides), glassy(c)); o.geometry.computeVertexNormals(); g.scale.setScalar(s); return g; };
  const place = (parent, child, x, y, z, rx = 0, ry = 0, rz = 0) => { child.position.set(x, y, z); child.rotation.set(rx, ry, rz); parent.add(child); return child; };
  const flat = (g) => { g.userData.view = [0.95, -0.3]; return g; };
  const diag = (g, a = 0.7) => { const w = new THREE.Group(); w.add(g); w.rotation.z = a; w.userData.view = [0.35, -0.5]; return w; };
  const B = {};

  // ---------- weapons
  B.knife = () => { const g = new THREE.Group(); place(g, extrude([[0, 0.2], [1.7, 0.2], [2.35, -0.02], [1.7, -0.2], [0, -0.2]], 0.05, steel, 0.025), 0, 0, 0);
    box(g, 0.14, 0.7, 0.22, brass, -0.05, 0, 0); box(g, 1.1, 0.3, 0.24, M(0x2a2d2f, 0.2, 0.6), -0.65, 0, 0); for (let i = 0; i < 3; i++) box(g, 0.05, 0.32, 0.26, brass, -0.35 - i * 0.3, 0, 0); return diag(g, 0.45); };
  B.rocket_launcher = () => { const g = new THREE.Group(); cyl(g, 0.4, 3, olive, 0, 0, 0, 32).rotation.z = Math.PI / 2;
    [-1.3, 1.3].forEach((x) => { const o = cyl(g, 0.46, 0.35, dark, x, 0, 0, 32); o.rotation.z = Math.PI / 2; });
    const cone = add(g, new THREE.ConeGeometry(0.5, 0.7, 32), dark, 1.75, 0, 0); cone.rotation.z = -Math.PI / 2;
    box(g, 0.22, 0.75, 0.22, dark, 0.2, -0.65, 0); box(g, 0.2, 0.55, 0.2, dark, -0.5, -0.55, 0); cyl(g, 0.1, 0.9, steel, 0.3, 0.55, 0).rotation.z = Math.PI / 2; box(g, 0.1, 0.18, 0.1, dark, 0.7, 0.45, 0); return diag(g, 0.25); };
  B.bolt_thrower = () => { const g = new THREE.Group(); box(g, 2.2, 0.28, 0.3, dwood, 0, 0, 0); box(g, 0.5, 0.5, 0.3, dwood, -1.2, -0.12, 0);
    torus(g, 1.1, 0.07, dark, 0.95, 0, 0, 0, 0, Math.PI / 2 + 0.6, Math.PI * 0.8).rotation.z = -Math.PI * 0.9 + 0.0;
    const s = cyl(g, 0.012, 1.9, cream, 0.95, 0, 0, 6); s.rotation.x = 0; s.scale.set(1, 1, 1);
    const b = cyl(g, 0.04, 2, steel, 0.2, 0.18, 0, 12); b.rotation.z = Math.PI / 2; add(g, new THREE.ConeGeometry(0.07, 0.2, 12), steel, 1.3, 0.18, 0).rotation.z = -Math.PI / 2; return diag(g, 0.2); };
  B.krauser_bow = () => { const g = new THREE.Group(); torus(g, 1.3, 0.08, dark, 0, 0, 0, 0, 0, Math.PI / 2 - 1.1, 2.2); const w = cyl(g, 0.012, 2.4, cream, -0.3, 0, 0, 6); box(g, 0.1, 0.5, 0.12, leather, 1.28, 0, 0); return diag(g, 0.3); };

  // ---------- heal & creatures
  B.bass = () => { const g = new THREE.Group(); sph(g, 1, M(0x5d7a45, 0.1, 0.4), 0, 0, 0, 1.5, 0.55, 0.38); sph(g, 0.8, M(0xd9dcb8, 0.1, 0.45), 0.05, -0.28, 0, 1.2, 0.3, 0.33);
    add(g, new THREE.ConeGeometry(0.55, 0.9, 4), M(0x46603a, 0, 0.5), -1.7, 0, 0).rotation.z = Math.PI / 2; sph(g, 0.07, black, 1.05, 0.12, 0.34); sph(g, 0.07, black, 1.05, 0.12, -0.34);
    add(g, new THREE.ConeGeometry(0.28, 0.7, 4), M(0x46603a, 0, 0.5), -0.1, 0.62, 0).rotation.z = 0.2; box(g, 1.8, 0.05, 0.3, M(0x2e3d27, 0, 0.6), 0, 0.12, 0); g.userData.view = [0.6, -0.9]; return g; };
  B.viper = () => { const g = new THREE.Group(); const pts = [[-1.4, 0, 0], [-0.8, 0.4, 0.2], [-0.2, -0.2, 0.2], [0.4, 0.35, -0.1], [0.9, 0, 0], [1.3, 0.25, 0.2]].map((p) => new THREE.Vector3(...p));
    add(g, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 80, 0.16, 12), M(0x6a8a3a, 0.1, 0.45)); const h = sph(g, 0.22, M(0x5a7a30, 0.1, 0.45), 1.4, 0.3, 0.2, 1.4, 0.7, 0.9);
    sph(g, 0.05, M(0xe8c020, 0, 0.3), 1.45, 0.38, 0.3); for (let i = 0; i < 8; i++) { const p = new THREE.CatmullRomCurve3(pts).getPoint(i / 8 * 0.9 + 0.05); sph(g, 0.1, M(0x2a3a18, 0, 0.5), p.x, p.y + 0.12, p.z, 1, 0.5, 1); } g.userData.view = [0.9, -0.3]; return g; };
  const beetleF = (c = 0x3a2a1e, hornC = 0x2a1c12) => () => { const g = new THREE.Group(); sph(g, 1, M(c, 0.5, 0.25), 0, 0, 0, 0.85, 0.55, 1.15); sph(g, 0.45, M(hornC, 0.4, 0.3), 0, 0.05, 1.2, 1, 0.8, 0.9);
    add(g, new THREE.ConeGeometry(0.1, 0.9, 12), M(hornC, 0.4, 0.3), 0, 0.25, 1.55).rotation.x = 1.0; box(g, 0.02, 0.02, 2, black, 0, 0.55, 0);
    for (let i = -1; i <= 1; i++) [-1, 1].forEach((s) => { const l = cyl(g, 0.045, 0.9, black, s * 0.85, -0.3, i * 0.5, 8); l.rotation.z = s * 1.0; }); g.userData.view = [0.9, 0.5]; return g; };

  B.beetle = beetleF();
  // ---------- ammo & resources
  B.bolts = () => { const g = new THREE.Group(); [-0.3, 0, 0.3].forEach((z, i) => { const s = cyl(g, 0.045, 2.1, wood, 0, i * 0.02, z, 10); s.rotation.z = Math.PI / 2; add(g, new THREE.ConeGeometry(0.09, 0.3, 10), steel, 1.2, i * 0.02, z).rotation.z = -Math.PI / 2; box(g, 0.28, 0.02, 0.2, red, -0.95, 0, z); box(g, 0.28, 0.2, 0.02, red, -0.95, 0, z); }); torus(g, 0.12, 0.025, leather, 0.2, 0, 0, 0, Math.PI / 2, 0).scale.set(1, 1, 2.2); return diag(g, 0.4); };
  B.arrows_explosive = () => { const g = new THREE.Group(); [-0.25, 0.25].forEach((z) => { const s = cyl(g, 0.04, 2, wood, 0, 0, z, 10); s.rotation.z = Math.PI / 2; const b = cyl(g, 0.14, 0.5, red, 0.95, 0, z, 16); b.rotation.z = Math.PI / 2; add(g, new THREE.ConeGeometry(0.1, 0.25, 10), steel, 1.35, 0, z).rotation.z = -Math.PI / 2; cyl(g, 0.035, 0.18, black, 0.75, 0.15, z, 8); box(g, 0.25, 0.02, 0.2, red, -0.9, 0, z); }); return diag(g, 0.4); };
  B.gunpowder = () => { const g = new THREE.Group(); sph(g, 1, M(0x9a8660, 0, 0.9), 0, 0, 0, 1, 0.85, 0.9); torus(g, 0.38, 0.07, leather, 0, 0.78, 0, Math.PI / 2); add(g, new THREE.ConeGeometry(0.35, 0.5, 16), M(0x9a8660, 0, 0.9), 0, 1.05, 0);
    add(g, new THREE.CylinderGeometry(0.4, 0.4, 0.04, 20), black, 0, 0, 0.78).rotation.x = Math.PI / 2; for (let i = 0; i < 14; i++) sph(g, 0.06, black, -1.2 + Math.random() * 0.01 + (i % 7) * 0.12, -0.8, 0.9 + (i % 2) * 0.12); return g; };
  B.resources_s = () => { const g = new THREE.Group(); const gear = new THREE.Group(); cyl(gear, 0.6, 0.18, steel, 0, 0, 0, 32).rotation.x = Math.PI / 2; for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; box(gear, 0.2, 0.22, 0.2, steel, Math.cos(a) * 0.68, Math.sin(a) * 0.68, 0).rotation.z = a; } cyl(gear, 0.2, 0.3, dark, 0, 0, 0, 16).rotation.x = Math.PI / 2; place(g, gear, -0.4, 0.2, 0, 0.5, 0, 0);
    box(g, 1.1, 0.12, 0.8, M(0x808890, 0.8, 0.4), 0.5, -0.3, 0.2).rotation.y = 0.5; cyl(g, 0.12, 1.1, rust, 0.5, -0.05, -0.5, 12).rotation.z = 1.4; return g; };
  B.resources_l = () => { const g = new THREE.Group(); box(g, 2.2, 1.2, 1.4, M(0x8a6a3a, 0, 0.7), 0, -0.2, 0); [-0.7, 0.7].forEach((x) => box(g, 0.18, 1.26, 1.46, M(0x3a3f44, 0.8, 0.4), x, -0.2, 0)); box(g, 2.24, 0.1, 1.44, M(0x3a3f44, 0.8, 0.4), 0, 0.42, 0);
    const gear = new THREE.Group(); cyl(gear, 0.5, 0.16, steel, 0, 0, 0, 28).rotation.x = Math.PI / 2; for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2; box(gear, 0.18, 0.2, 0.18, steel, Math.cos(a) * 0.57, Math.sin(a) * 0.57, 0).rotation.z = a; } place(g, gear, 0.3, 0.95, 0.1, 1.3, 0.3, 0); cyl(g, 0.1, 0.9, rust, -0.6, 0.6, 0.2, 10).rotation.z = 1.3; return g; };
  B.mine = () => { const g = new THREE.Group(); cyl(g, 1, 0.45, olive, 0, 0, 0, 40); cyl(g, 0.72, 0.1, dark, 0, 0.27, 0, 32); cyl(g, 0.22, 0.2, M(0xd23b32, 0.1, 0.3), 0, 0.37, 0, 20);
    [0, 1, 2].forEach((i) => { const a = i * 2.1 + 0.5; cyl(g, 0.04, 0.6, steel, Math.cos(a) * 0.55, 0.45, Math.sin(a) * 0.55, 8); }); box(g, 0.5, 0.25, 0.3, black, 0, -0.3, 0.9); return g; };

  // ---------- accessories
  const scope = (len, rad, lens, extra) => () => { const g = new THREE.Group(); add(g, lathe([[0, -len / 2], [rad * 0.8, -len / 2], [rad * 0.8, -len * 0.38], [rad * 0.5, -len * 0.3], [rad * 0.5, len * 0.2], [rad, len * 0.32], [rad, len / 2], [0, len / 2]], 32), dark).rotation.z = Math.PI / 2;
    cyl(g, rad * 0.85, 0.04, glassy(lens), len / 2 + 0.01, 0, 0, 24).rotation.z = Math.PI / 2; cyl(g, rad * 0.75, 0.04, glassy(lens), -len / 2 - 0.01, 0, 0, 24).rotation.z = Math.PI / 2;
    [-0.3, 0.3].forEach((x) => box(g, 0.2, 0.3, rad * 1.6, steel, x * len * 0.7, -rad - 0.1, 0)); cyl(g, 0.12, 0.12, steel, 0.1, rad, 0, 16); if (extra) extra(g, rad, len); return diag(g, 0.3); };
  B.scope = scope(2.4, 0.3, 0x7fb6d8); B.scope_hp = scope(3, 0.38, 0x8cc7a0); B.scope_bio = scope(2.6, 0.34, 0x4ff08a, (g, r) => box(g, 0.7, 0.3, 0.5, black, 0, r + 0.15, 0));
  const stockF = (c = wood) => () => { const g = new THREE.Group(); place(g, extrude([[0, 0.5], [1.6, 0.35], [2.2, -0.35], [2.2, -0.55], [1.4, -0.45], [0, -0.1]], 0.3, c, 0.04), 0, 0, 0); box(g, 0.1, 1.0, 0.36, steel, 2.28, -0.1, 0); box(g, 0.5, 0.3, 0.3, dark, -0.1, 0.2, 0); return diag(g, 0.25); };
  B.stock_red9 = stockF(wood); B.stock_matilda = stockF(M(0x6a3a22, 0, 0.5));
  B.stock_tmp = () => { const g = new THREE.Group(); [[0, 0.3, 0, 2.1, 0.08], [0, -0.3, 0, 2.1, 0.08]].forEach(([x, y, z, l, t]) => { const r = box(g, l, t, 0.12, black, x + 0.9, y, z); r.rotation.z = y > 0 ? -0.14 : 0.14; }); box(g, 0.12, 0.8, 0.14, black, 2.0, 0, 0); box(g, 0.45, 0.45, 0.2, dark, -0.15, 0, 0); box(g, 0.1, 0.9, 0.3, M(0x222629, 0.3, 0.6), 2.06, 0, 0); return diag(g, 0.2); };
  B.laser = () => { const g = new THREE.Group(); box(g, 1.5, 0.7, 0.8, dark, 0, 0, 0); cyl(g, 0.22, 0.3, black, 0.9, 0, 0, 20).rotation.z = Math.PI / 2; cyl(g, 0.12, 0.05, glassy(0xff3020), 1.06, 0, 0, 16).rotation.z = Math.PI / 2; cyl(g, 0.02, 1.2, M(0xff3a2a, 0, 0.3, { emissive: 0xff2010, emissiveIntensity: 1.2 }), 1.7, 0, 0, 6).rotation.z = Math.PI / 2; box(g, 0.5, 0.3, 0.6, steel, -0.1, -0.5, 0); return diag(g, 0.2); };

  // ---------- treasure
  const ringGem = (c) => () => { const g = new THREE.Group(); torus(g, 0.8, 0.14, gold, 0, -0.1, 0, 0, 0, 0); place(g, gem(c, 8, 0.4), 0, 0.85, 0); box(g, 0.0, 0, 0, gold); g.userData.view = [0.4, -0.5]; return g; };
  B.ring_ruby = ringGem(0xd0213a);
  const bangle = (gems, tube = 0.18, gm = gold) => () => { const g = new THREE.Group(); torus(g, 1, tube, gm, 0, 0, 0, Math.PI / 2 - 0.5, 0, 0); gems.forEach((c, i) => { const a = (i / gems.length) * Math.PI * 2; const p = new THREE.Vector3(Math.cos(a), 0, Math.sin(a)); const s = sph(g, 0.17, M(c, 0.1, 0.15, { emissive: c, emissiveIntensity: 0.15 }), p.x, 0, p.z); }); const w = new THREE.Group(); w.add(g); g.rotation.x = 0.55; w.userData.view = [0.7, -0.4]; return w; };
  B.bangle_pearl = bangle([0xf4f1ea, 0xf4f1ea, 0xf4f1ea, 0xf4f1ea, 0xf4f1ea, 0xf4f1ea, 0xf4f1ea, 0xf4f1ea]); B.bangle_gold = bangle([], 0.22); B.bangle_splendid = bangle([0xd0213a, 0x2ea36a, 0x2a56d0, 0xd0213a, 0x2ea36a, 0x2a56d0]); B.bangle_elegant = bangle([0x2a56d0, 0x2a56d0, 0x2a56d0, 0x2a56d0, 0x2a56d0, 0x2a56d0], 0.2);
  const pendant = (stone, dirty) => () => { const g = new THREE.Group(); const ch = torus(g, 1.0, 0.045, gold, 0, 0, 0); ch.scale.set(0.8, 1.15, 1);
    torus(g, 0.38, 0.07, gold, 0, -1.28, 0); sph(g, 0.31, M(stone, 0.1, dirty ? 0.8 : 0.2), 0, -1.28, 0.03); return flat(g); };
  B.pendant_pearl = pendant(0xf4f1ea, false); B.pendant_dirty = pendant(0x8a7f6a, true); B.pendant_illum = pendant(0x2a56d0, false); B.necklace = () => { const g = pendant(0xd0213a, false)(); [-0.7, 0.7].forEach((x) => sph(g, 0.1, M(0x2ea36a, 0.1, 0.15), x, -0.4 - Math.abs(x) * 0.2, 0)); return g; };
  B.headdress = () => { const g = new THREE.Group(); cyl(g, 1.0, 0.5, gold, 0, -0.3, 0, 40); [-0.9, -0.45, 0, 0.45, 0.9].forEach((x, i) => { const o = sph(g, 0.3, gold, x * 0.95, 0.35 + (2 - Math.abs(i - 2)) * 0.25, 0.0 + (Math.abs(x)) * -0.0, 0.6, 1.6, 0.4); const j = sph(g, 0.1, M(i % 2 ? 0x2a56d0 : 0xd0213a, 0.1, 0.15), x * 0.95, 0.35 + (2 - Math.abs(i - 2)) * 0.25, 0.14); }); return g; };
  B.pipe = () => { const g = new THREE.Group(); add(g, lathe([[0, -0.8], [0.5, -0.7], [0.65, 0.2], [0.7, 0.9], [0.55, 0.9], [0.5, 0.7], [0, 0.7]], 32), dwood); cyl(g, 0.12, 1.8, dwood, 1.0, -0.4, 0, 12).rotation.z = 1.2; cyl(g, 0.17, 0.25, black, 1.9, -0.7, 0, 12).rotation.z = 1.2; return g; };
  B.mirror = () => { const g = new THREE.Group(); const fr = torus(g, 0.95, 0.1, gold, 0, 0.3, 0); fr.scale.set(0.8, 1, 1); cyl(g, 0.9, 0.05, M(0xc8d6de, 0.5, 0.1), 0, 0.3, 0, 40).rotation.x = Math.PI / 2; g.children[1].scale.set(0.8, 1, 1);
    for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; sph(g, 0.1, i % 2 ? M(0xf4f1ea, 0.1, 0.2) : M(0xd0213a, 0.1, 0.15), Math.cos(a) * 0.76, 0.3 + Math.sin(a) * 0.95, 0.04); } cyl(g, 0.1, 1, gold, 0, -1.0, 0, 12); sph(g, 0.16, gold, 0, -1.5, 0); g.userData.view = [0.25, -0.4]; return g; };
  B.perfume = () => { const g = new THREE.Group(); add(g, lathe([[0, -1], [0.8, -1], [0.95, -0.6], [0.7, 0.2], [0.25, 0.5], [0.25, 0.75], [0, 0.75]], 32), glassy(0xf2a8c0, 0.7)); cyl(g, 0.3, 0.5, gold, 0, 0.95, 0, 20); add(g, new THREE.SphereGeometry(0.28, 16, 12), gold, 0, 1.35, 0); torus(g, 0.82, 0.05, gold, 0, -0.55, 0, Math.PI / 2); sph(g, 0.5, M(0xf29ab8, 0, 0.3), 0, -0.4, 0, 1, 0.8, 1); return g; };
  B.chessboard = () => { const g = new THREE.Group(); box(g, 2.4, 0.2, 2.4, dwood, 0, -1, 0); for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) if ((i + j) % 2) box(g, 0.55, 0.03, 0.55, cream, -0.82 + i * 0.55, -0.88, -0.82 + j * 0.55);
    add(g, lathe([[0, -0.9], [0.6, -0.9], [0.5, -0.7], [0.2, -0.2], [0.35, 0.0], [0.15, 0.1], [0.45, 0.45], [0.3, 0.75], [0, 0.78]], 32), gold); box(g, 0.1, 0.5, 0.1, gold, 0, 1.0, 0); box(g, 0.4, 0.1, 0.1, gold, 0, 1.05, 0); g.userData.view = [0.45, -0.5]; return g; };
  B.staff = () => { const g = new THREE.Group(); cyl(g, 0.07, 3.2, gold, 0, 0, 0, 12); sph(g, 0.3, glassy(0xd0213a), 0, 1.75, 0); [0, 1, 2, 3].forEach((i) => { const a = i * Math.PI / 2; box(g, 0.05, 0.4, 0.05, gold, Math.cos(a) * 0.32, 1.75, Math.sin(a) * 0.32); }); cyl(g, 0.12, 0.2, gold, 0, 1.35, 0, 16); cyl(g, 0.11, 0.2, gold, 0, -1.3, 0, 16); return diag(g, 0.7); };
  B.idol = () => { const g = new THREE.Group(); const sm = M(0x5c5348, 0, 0.8); add(g, lathe([[0, -1.1], [0.7, -1.1], [0.55, -0.4], [0.7, 0.3], [0.4, 0.6], [0, 0.62]], 24), sm); sph(g, 0.42, sm, 0, 0.95, 0); sph(g, 0.08, glassy(0xff2a1a), -0.17, 1.0, 0.36); sph(g, 0.08, glassy(0xff2a1a), 0.17, 1.0, 0.36); box(g, 0.14, 0.4, 0.1, sm, -0.5, 0.6, 0.2); box(g, 0.14, 0.4, 0.1, sm, 0.5, 0.6, 0.2); cyl(g, 0.9, 0.2, gold, 0, -1.2, 0, 24); return g; };
  B.compass = () => { const g = new THREE.Group(); cyl(g, 1, 0.35, gold, 0, 0, 0, 40).rotation.x = Math.PI / 2; cyl(g, 0.86, 0.05, cream, 0, 0, 0.19, 40).rotation.x = Math.PI / 2; torus(g, 0.93, 0.06, gold, 0, 0, 0.19);
    const n = add(g, new THREE.ConeGeometry(0.12, 0.8, 4), M(0xd23b32, 0.2, 0.4), 0, 0.3, 0.24); const s = add(g, new THREE.ConeGeometry(0.12, 0.8, 4), dark, 0, -0.3, 0.24); s.rotation.z = Math.PI; torus(g, 0.25, 0.05, gold, 0, 1.3, 0); g.userData.view = [0.15, -0.4]; return g; };
  B.ore = () => { const g = new THREE.Group(); add(g, new THREE.DodecahedronGeometry(0.9, 0), stone, 0, -0.6, 0).scale.set(1.3, 0.6, 1); [[0, 0, 0, 1.6, 0.18, 0.1], [0.5, 0, 0.2, 1.1, 0.14, 0.5], [-0.5, 0, -0.1, 1.2, 0.15, -0.5], [0.1, 0, -0.4, 0.9, 0.12, 0.2]].forEach(([x, y, z, h, r, t]) => { const c = add(g, new THREE.CylinderGeometry(r * 0.3, r, h, 6), glassy(0x7a58e0, 0.92), x, y + h / 2 - 0.4, z); c.rotation.z = t; }); return g; };
  B.ornate_beetle = () => { const g = beetleF(0xe2b13c, 0xc59a2a)(); g.children.forEach((c) => { if (c.material && c.material.color && c.material.color.getHex() === 0x3a2a1e) c.material = gold; }); sph(g, 0.22, glassy(0x1f9a5a), 0, 0.5, 0, 1, 0.5, 1.3); return g; };
  B.eye = () => { const g = new THREE.Group(); sph(g, 1, M(0xf1ece2, 0, 0.25), 0, 0, 0); sph(g, 0.55, M(0x3b7bc8, 0.1, 0.2), 0, 0, 0.86, 1, 1, 0.35); sph(g, 0.24, black, 0, 0, 1.0, 1, 1, 0.3); g.userData.view = [0.2, -0.5]; return g; };
  B.monocle = () => { const g = new THREE.Group(); torus(g, 0.8, 0.12, gold); cyl(g, 0.78, 0.04, glassy(0xbfe4f2, 0.45), 0, 0, 0, 32).rotation.x = Math.PI / 2; cyl(g, 0.04, 1.6, gold, 0.1, -1.6, 0, 6); torus(g, 0.12, 0.035, gold, 0.05, -2.4, 0); const w = new THREE.Group(); w.add(g); w.userData.view = [0.3, -0.5]; return w; };
  B.lip_rouge = () => { const g = new THREE.Group(); cyl(g, 0.4, 1.3, gold, 0, -0.5, 0, 24); cyl(g, 0.34, 0.3, gold, 0, 0.3, 0, 24); const s = cyl(g, 0.28, 0.9, M(0xc01838, 0.1, 0.4), 0, 0.9, 0, 20); s.rotation.z = -0.08; add(g, new THREE.ConeGeometry(0.28, 0.35, 20), M(0xc01838, 0.1, 0.4), 0.05, 1.5, 0).rotation.z = -0.3; return g; };
  B.camera = () => { const g = new THREE.Group(); box(g, 1.7, 1.3, 1.2, leather, 0, 0, 0); cyl(g, 0.45, 0.8, brass, 0, 0, 0.95, 24).rotation.x = Math.PI / 2; cyl(g, 0.35, 0.1, glassy(0x3a5a78), 0, 0, 1.38, 24).rotation.x = Math.PI / 2; box(g, 0.3, 0.2, 0.3, brass, -0.5, 0.75, 0); box(g, 0.5, 0.2, 0.3, black, 0.4, 0.75, 0); return g; };
  B.mask = () => { const g = new THREE.Group(); sph(g, 1, gold, 0, 0, 0, 0.85, 1.15, 0.45); add(g, new THREE.ConeGeometry(0.14, 0.7, 4), gold, 0, -0.1, 0.42).rotation.x = Math.PI / 2 - 0.5; [-0.38, 0.38].forEach((x) => { sph(g, 0.17, black, x, 0.25, 0.4, 1.3, 0.6, 0.4); sph(g, 0.09, M(0xd0213a, 0.1, 0.15), x, 0.62, 0.38); }); torus(g, 0.3, 0.05, black, 0, -0.55, 0.3, 0, 0, Math.PI, Math.PI); g.userData.view = [0.15, -0.45]; return g; };
  B.flagon = () => { const g = new THREE.Group(); add(g, lathe([[0, -1.1], [0.7, -1.1], [0.85, -0.2], [0.6, 0.6], [0.45, 0.95], [0.6, 1.2], [0.45, 1.2], [0, 1.0]], 36), gold); torus(g, 0.5, 0.09, gold, 0.95, 0.1, 0, 0, 0, 0, Math.PI * 1.0).rotation.z = -Math.PI / 2; sph(g, 0.12, M(0xd0213a, 0.1, 0.15), 0, -0.1, 0.85); return g; };
  B.butterfly_lamp = () => { const g = new THREE.Group(); add(g, lathe([[0, -1.2], [0.7, -1.2], [0.3, -0.8], [0.12, -0.2], [0.12, 0.3], [0, 0.3]], 24), gold); sph(g, 0.5, glassy(0xfff0b0, 0.7), 0, 0.7, 0); [-1, 1].forEach((s) => { sph(g, 0.55, glassy(s > 0 ? 0x2a56d0 : 0x2ea36a, 0.8), s * 0.65, 0.2, 0, 1, 1.3, 0.12).rotation.z = s * 0.4; }); return g; };
  B.clock = () => { const g = new THREE.Group(); box(g, 1.8, 0.4, 0.9, gold, 0, -1.0, 0); cyl(g, 0.95, 0.5, gold, 0, 0, 0, 40).rotation.x = Math.PI / 2; cyl(g, 0.8, 0.05, cream, 0, 0, 0.27, 40).rotation.x = Math.PI / 2; box(g, 0.05, 0.5, 0.02, black, 0, 0.2, 0.3); box(g, 0.4, 0.05, 0.02, black, 0.18, 0, 0.3); sph(g, 0.4, gold, 0, 1.0, 0, 1.2, 0.7, 0.6); [-1, 1].forEach((s) => sph(g, 0.13, gold, s * 0.85, -0.7, 0.0)); g.userData.view = [0.25, -0.4]; return g; };
  B.lynx = () => { const g = new THREE.Group(); box(g, 1.8, 0.2, 0.9, dwood, 0, -1.1, 0); sph(g, 0.6, gold, -0.2, -0.45, 0, 1.4, 0.9, 0.7); sph(g, 0.42, gold, 0.75, 0.1, 0, 1, 1, 0.9); [-0.1, 0.1].forEach((z) => add(g, new THREE.ConeGeometry(0.12, 0.35, 4), gold, 0.78, 0.55, z * 3)); sph(g, 0.05, black, 1.12, 0.18, 0.2); sph(g, 0.05, black, 1.12, 0.18, -0.2); torus(g, 0.5, 0.09, gold, -1.1, -0.35, 0, 0, 0, 0.3, Math.PI * 1.1); g.userData.view = [0.3, -0.7]; return g; };
  B.ticket = () => { const g = new THREE.Group(); box(g, 2.2, 0.06, 1.4, M(0x2a2e33, 0.3, 0.5)); box(g, 2.0, 0.07, 1.2, gold, 0, 0, 0); box(g, 1.8, 0.08, 1.0, cream, 0, 0, 0); box(g, 1.2, 0.09, 0.12, dark, -0.1, 0, -0.2); box(g, 0.9, 0.09, 0.1, dark, -0.25, 0, 0.0); const s = add(g, new THREE.OctahedronGeometry(0.22, 0), gold, 0.55, 0.1, 0.25); return flat(g); };
  B.bar_l = () => { const g = new THREE.Group(); const one = () => { const gg = new THREE.Group(); const geo = new THREE.CylinderGeometry(0.4, 0.55, 0.38, 4); geo.rotateY(Math.PI / 4); const o = add(gg, geo, gold); o.scale.set(1.8, 1, 0.8); return gg; };
    place(g, one(), -0.55, -0.4, 0); place(g, one(), 0.55, -0.4, 0); place(g, one(), 0, 0.0, 0); return g; };
  B.ingot = () => { const g = new THREE.Group(); const geo = new THREE.CylinderGeometry(0.7, 1.0, 0.7, 4); geo.rotateY(Math.PI / 4); const o = add(g, geo, M(0xe9cf70, 0.7, 0.3, { emissive: 0x4a3600, emissiveIntensity: 0.5 })); o.scale.set(1.5, 1, 0.8); sph(g, 0.15, gold, 0.6, 0.45, 0, 1.4, 0.5, 1); return g; };
  B.justitia = () => { const g = new THREE.Group(); box(g, 1.4, 0.25, 1.0, dwood, 0, -1.3, 0); add(g, lathe([[0, -1.15], [0.45, -1.15], [0.3, -0.3], [0.38, 0.3], [0.22, 0.55], [0, 0.55]], 24), gold); sph(g, 0.24, gold, 0, 0.8, 0); box(g, 2.0, 0.07, 0.07, gold, 0, 0.55, 0); [-1, 1].forEach((s) => { cyl(g, 0.01, 0.6, gold, s * 0.95, 0.25, 0, 4); const d = add(g, lathe([[0, -0.06], [0.4, 0.04], [0.4, 0.07], [0, 0]], 20), gold, s * 0.95, -0.08, 0); }); g.userData.view = [0.25, -0.4]; return g; };
  B.gem_red_beryl = () => gem(0xb8284a, 6); B.gem_velvet = () => gem(0x1d3a9a, 8); B.gem_scratched = () => { const g = gem(0x2a7a54, 6); g.children[0].material = M(0x2a7a54, 0.1, 0.5, { flatShading: true }); return g; };

  // ---------- key items
  const keyItem = (mk, bowKind, tag) => () => { const g = new THREE.Group(); cyl(g, 0.09, 2.2, mk, 0.35, 0, 0, 14).rotation.z = Math.PI / 2;
    if (bowKind === 'ring') torus(g, 0.45, 0.1, mk, -1.0, 0, 0); else { torus(g, 0.35, 0.1, mk, -1.1, 0, 0); [0, 1, 2].forEach((i) => sph(g, 0.1, mk, -1.1 + Math.cos(i * 2.1) * 0.5, Math.sin(i * 2.1) * 0.5, 0)); }
    [[1.1, 0.28, 0.3], [0.8, 0.22, 0.25], [1.4, 0.2, 0.2]].forEach(([x, h, w]) => box(g, w * 0.5, h * 2, 0.12, mk, x, -h * 0.9, 0)); if (tag) box(g, 0.5, 0.35, 0.05, tag, -1.0, -0.8, 0); return diag(g, 0.5); };
  B.key_gold = keyItem(gold, 'ring'); B.key_brass = keyItem(brass, 'orn'); B.key_steel = keyItem(steel, 'ring'); B.key_iron = keyItem(M(0x4a4038, 0.6, 0.6), 'ring'); B.key_rust = keyItem(rust, 'orn');
  B.key_lodge = keyItem(brass, 'ring', leather);
  B.key_bunch = () => { const g = new THREE.Group(); torus(g, 0.5, 0.05, steel, 0, 0.8, 0, Math.PI / 2 - 0.3); [[-0.6, brass, 0.2], [0, gold, 0], [0.6, steel, -0.25]].forEach(([x, m, r]) => { const k = keyItem(m, 'ring')(); k.children[0].rotation.z = 0; place(g, k, x * 0.9, -0.1, 0, 0, 0, Math.PI / 2 + r); k.scale.setScalar(0.45); }); return flat(g); };
  const keycard = (c) => () => { const g = new THREE.Group(); box(g, 2.2, 0.06, 1.4, M(0xdadfe2, 0.3, 0.4)); box(g, 2.2, 0.07, 0.3, black, 0, 0, -0.35); box(g, 0.5, 0.08, 0.3, M(c, 0.1, 0.3), -0.7, 0, 0.3); box(g, 0.9, 0.07, 0.07, dark, 0.35, 0, 0.3); box(g, 0.9, 0.07, 0.07, dark, 0.35, 0, 0.45); return flat(g); };
  B.keycard_1 = keycard(0x4fae3f); B.keycard_2 = keycard(0xe0c63a); B.keycard_3 = keycard(0xd23b32);
  const head = (m, kind) => () => { const g = new THREE.Group(); box(g, 1.2, 0.2, 1.0, dwood, 0, -1.2, 0); cyl(g, 0.35, 0.5, m, 0, -0.85, 0, 20); sph(g, 0.7, m, 0, 0, 0, 1, 1.1, 1);
    if (kind === 'lion') { torus(g, 0.78, 0.22, m, 0, 0, -0.1); sph(g, 0.1, black, -0.25, 0.1, 0.65); sph(g, 0.1, black, 0.25, 0.1, 0.65); box(g, 0.3, 0.2, 0.3, M(0x2a2a2a, 0, 0.5), 0, -0.2, 0.65); }
    if (kind === 'goat') { [-1, 1].forEach((s) => { torus(g, 0.45, 0.09, m, s * 0.5, 0.85, 0, 0, 0, s > 0 ? 0.3 : 2.9, Math.PI * 1.1); sph(g, 0.09, black, s * 0.27, 0.1, 0.65); }); sph(g, 0.3, m, 0, -0.55, 0.45, 0.8, 1.1, 0.8); }
    if (kind === 'serpent') { sph(g, 0.1, glassy(0xe8c020), -0.28, 0.2, 0.6); sph(g, 0.1, glassy(0xe8c020), 0.28, 0.2, 0.6); add(g, new THREE.ConeGeometry(0.22, 0.5, 3), m, 0, 0.8, 0.0); box(g, 0.02, 0.4, 0.05, black, 0, -0.4, 0.68); }
    if (kind === 'blasph' || kind === 'apost') { sph(g, 0.1, black, -0.25, 0.1, 0.65); sph(g, 0.1, black, 0.25, 0.1, 0.65); [-1, 1].forEach((s) => add(g, new THREE.ConeGeometry(0.12, 0.7, 6), m, s * 0.55, 0.7, 0).rotation.z = -s * 0.5); if (kind === 'apost') torus(g, 0.72, 0.06, M(0xd8d0b0, 0, 0.5), 0, 0.5, 0, Math.PI / 2); }
    g.userData.view = [0.2, -0.45]; return g; };
  B.head_lion = head(gold, 'lion'); B.head_goat = head(M(0xcfd5da, 0.8, 0.3), 'goat'); B.head_serpent = head(M(0x3f7a4a, 0.6, 0.3), 'serpent'); B.head_blasph = head(M(0x6a2a28, 0.6, 0.4), 'blasph'); B.head_apost = head(M(0xa8b0b8, 0.8, 0.3), 'apost');
  const sword = (bm, gm, blood) => () => { const g = new THREE.Group(); place(g, extrude([[0, 0.17], [2.2, 0.15], [2.75, 0], [2.2, -0.15], [0, -0.17]], 0.05, bm, 0.02), 0.1, 0, 0); box(g, 0.2, 0.18, 0.18, gm, -0.05, 0, 0); box(g, 0.14, 0.95, 0.2, gm, 0.05, 0, 0); cyl(g, 0.09, 0.8, M(0x3a2a1a, 0, 0.7), -0.5, 0, 0, 12).rotation.z = Math.PI / 2; sph(g, 0.16, gm, -0.95, 0, 0);
    if (blood) [0.7, 1.2, 1.9].forEach((x, i) => sph(g, 0.12, M(0x7a1810, 0, 0.4), x, (i - 1) * 0.04, 0.05, 2, 0.6, 0.3)); return diag(g, 0.7); };
  B.sword_gold = sword(gold, gold); B.sword_iron = sword(steel, dark); B.sword_blood = sword(steel, dark, true); B.sword_rust = sword(rust, M(0x4a3020, 0.4, 0.7));
  const litho = (n) => () => { const g = new THREE.Group(); box(g, 1.8, 0.35, 2.2, stone, 0, 0, 0); for (let i = 0; i < n + 2; i++) box(g, 1.2 - (i % 2) * 0.5, 0.05, 0.1, M(0x4a4d52, 0, 0.9), (i % 2) * 0.15 - 0.1, 0.19, -0.85 + i * (1.6 / (n + 1))); cyl(g, 0.22 + n * 0.02, 0.06, M(0x4a4d52, 0, 0.9), 0.2, 0.19, 0.6, 20); return flat(g); };
  B.litho_a = litho(0); B.litho_b = litho(1); B.litho_c = litho(2); B.litho_d = litho(3);
  B.emblem_hex = () => { const g = new THREE.Group(); const hx = add(g, new THREE.CylinderGeometry(1, 1, 0.3, 6), gold); hx.rotation.x = Math.PI / 2; const inner = add(g, new THREE.CylinderGeometry(0.7, 0.7, 0.32, 6), M(0x8a6a1c, 0.6, 0.4)); inner.rotation.x = Math.PI / 2; add(g, new THREE.OctahedronGeometry(0.3, 0), glassy(0xd0213a), 0, 0, 0.2); g.userData.view = [0.15, -0.45]; return g; };
  const insig = (m) => () => { const g = new THREE.Group(); cyl(g, 1, 0.25, m, 0, 0, 0, 40).rotation.x = Math.PI / 2; torus(g, 0.85, 0.06, M(0x8a6a1c, 0.6, 0.4), 0, 0, 0.14); box(g, 0.2, 1.0, 0.1, M(0x8a6a1c, 0.6, 0.4), 0, 0, 0.14); box(g, 0.8, 0.2, 0.1, M(0x8a6a1c, 0.6, 0.4), 0, 0.15, 0.14); g.userData.view = [0.15, -0.45]; return g; };
  B.insignia_gold = insig(gold); B.insignia_silver = insig(silver);
  B.halo_wheel = () => { const g = new THREE.Group(); torus(g, 1, 0.11, gold); torus(g, 0.35, 0.09, gold); for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI; box(g, 1.3, 0.08, 0.1, gold).rotation.z = a; } g.userData.view = [0.3, -0.45]; return g; };
  B.lantern = () => { const g = new THREE.Group(); cyl(g, 0.55, 1.1, glassy(0xd0302a, 0.85), 0, 0, 0, 24); cyl(g, 0.62, 0.15, gold, 0, 0.6, 0, 24); cyl(g, 0.62, 0.15, gold, 0, -0.6, 0, 24); add(g, new THREE.ConeGeometry(0.62, 0.4, 24), gold, 0, 0.85, 0); torus(g, 0.4, 0.04, gold, 0, 1.15, 0, 0, 0, 0, Math.PI); sph(g, 0.22, M(0xffd060, 0, 0.3, { emissive: 0xffa020, emissiveIntensity: 1 }), 0, 0, 0); return g; };
  B.marble = () => { const g = new THREE.Group(); sph(g, 0.9, glassy(0x9fd8ff, 0.7), 0, 0.2, 0); sph(g, 0.3, glassy(0xffffff, 0.9), 0.1, 0.2, 0); cyl(g, 0.4, 0.15, gold, 0, -0.75, 0, 20); add(g, lathe([[0.7, -0.6], [0.4, -0.35], [0.25, -0.2]], 20), gold); return g; };
  B.wrench = () => { const g = new THREE.Group(); cyl(g, 0.12, 2.2, steel, 0, 0, 0, 12).rotation.z = Math.PI / 2; const jaw = torus(g, 0.4, 0.17, steel, 1.3, 0, 0, 0, 0, 0.5, Math.PI * 1.6); sph(g, 0.2, steel, -1.1, 0, 0); return diag(g, 0.6); };
  B.cog = () => { const g = new THREE.Group(); cyl(g, 0.8, 0.3, wood, 0, 0, 0, 36).rotation.x = Math.PI / 2; for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; box(g, 0.32, 0.32, 0.3, wood, Math.cos(a) * 0.92, Math.sin(a) * 0.92, 0).rotation.z = a; } cyl(g, 0.22, 0.34, dwood, 0, 0, 0, 16).rotation.x = Math.PI / 2; g.userData.view = [0.4, -0.5]; return g; };
  B.dynamite = () => { const g = new THREE.Group(); [[-0.4, 0], [0.4, 0], [0, 0.0]].forEach(([x, z], i) => cyl(g, 0.32, 1.9, M(0xc2362c, 0, 0.6), x, 0, i === 2 ? -0.5 : 0, 20)); [[-0.4, 0.5], [0.4, 0.5]].forEach(([x]) => 0); cyl(g, 0.47, 0.3, cream, 0, 0, 0, 12); torus(g, 0.58, 0.1, M(0x3a2a1a, 0, 0.8), 0, 0.3, 0, Math.PI / 2); torus(g, 0.58, 0.1, M(0x3a2a1a, 0, 0.8), 0, -0.4, 0, Math.PI / 2); cyl(g, 0.03, 0.8, black, 0, 1.3, 0, 6).rotation.z = 0.5; return g; };
  B.crank = () => { const g = new THREE.Group(); cyl(g, 0.12, 1.8, steel, 0, 0, 0, 12); cyl(g, 0.12, 1.1, steel, 0.55, 0.9, 0, 12).rotation.z = Math.PI / 2; cyl(g, 0.2, 0.7, dwood, 1.1, 0.9, 0, 16); cyl(g, 0.3, 0.2, steel, 0, -0.9, 0, 16); return diag(g, 0.4); };
  const hexp = (n) => () => { const g = new THREE.Group(); const o = add(g, new THREE.CylinderGeometry(1, 1, 0.3, 6), M(0x8a6a1c, 0.6, 0.4)); o.rotation.x = Math.PI / 2; const t = add(g, new THREE.CylinderGeometry(0.85, 0.85, 0.34, 6), gold); t.rotation.x = Math.PI / 2; for (let i = 0; i < n; i++) sph(g, 0.17, glassy(0xd0213a), (i - (n - 1) / 2) * 0.5, 0, 0.2); g.userData.view = [0.3, -0.5]; return g; };
  B.hex_a = hexp(1); B.hex_b = hexp(2); B.hex_c = hexp(3);
  B.boat_fuel = () => { const g = new THREE.Group(); box(g, 1.5, 1.8, 0.7, M(0xc43a2a, 0.2, 0.5), 0, 0, 0); box(g, 1.3, 0.1, 0.5, M(0xa02c20, 0.2, 0.5), 0, 0, 0.36); torus(g, 0.35, 0.07, M(0xc43a2a, 0.2, 0.5), 0.4, 1.0, 0, 0, 0, 0, Math.PI); cyl(g, 0.15, 0.4, steel, -0.5, 1.0, 0, 12); box(g, 0.9, 0.5, 0.02, cream, 0, 0, 0.36); g.userData.view = [0.3, -0.5]; return g; };
  B.cubic_device = () => { const g = new THREE.Group(); box(g, 1.5, 1.5, 1.5, dark, 0, 0, 0); [[0, 0, 0.77], [0.77, 0, 0]].forEach(([x, y, z], i) => { cyl(g, 0.4, 0.1, brass, x, y, z, 20).rotation.set(z ? Math.PI / 2 : 0, 0, z ? 0 : Math.PI / 2); }); sph(g, 0.15, glassy(0x4ff08a), 0, 0.77, 0, 1, 0.4, 1); [[-1, -1], [1, 1], [-1, 1], [1, -1]].forEach(([a, b]) => box(g, 0.16, 1.6, 0.16, brass, a * 0.75, 0, b * 0.75)); return g; };
  B.unicorn_horn = () => { const g = new THREE.Group(); add(g, new THREE.ConeGeometry(0.4, 2.6, 24), M(0xf4efe0, 0.1, 0.35), 0, 0.2, 0); for (let i = 0; i < 6; i++) torus(g, 0.38 - i * 0.055, 0.03, M(0xd8cfb0, 0, 0.5), 0, -0.9 + i * 0.4, 0, Math.PI / 2); cyl(g, 0.46, 0.25, gold, 0, -1.2, 0, 24); return diag(g, 0.6); };
  B.blue_dial = () => { const g = new THREE.Group(); cyl(g, 1, 0.3, M(0x2a56d0, 0.5, 0.3), 0, 0, 0, 36).rotation.x = Math.PI / 2; torus(g, 1, 0.07, brass, 0, 0, 0.15); box(g, 0.1, 0.7, 0.06, brass, 0, 0.3, 0.2); for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; box(g, 0.05, 0.12, 0.04, brass, Math.sin(a) * 0.8, Math.cos(a) * 0.8, 0.17).rotation.z = -a; } g.userData.view = [0.2, -0.45]; return g; };
  const token = (m) => () => { const g = new THREE.Group(); cyl(g, 1, 0.18, m, 0, 0, 0, 40).rotation.x = Math.PI / 2; torus(g, 0.82, 0.05, m, 0, 0, 0.1); const s = add(g, new THREE.OctahedronGeometry(0.4, 0), m, 0, 0, 0.16); g.userData.view = [0.25, -0.45]; return g; };
  B.token_silver = token(silver); B.token_gold = token(gold);
  B.planks = () => { const g = new THREE.Group(); [[0, 0, 0.0], [0.15, 0.22, 0.12], [-0.1, -0.22, -0.1]].forEach(([x, y, r], i) => { const p = box(g, 2.2, 0.22, 0.6, i % 2 ? M(0x8a5a30, 0, 0.8) : wood, x, y, 0); p.rotation.z = r; }); [-0.8, 0.8].forEach((x) => box(g, 0.14, 0.9, 0.04, steel, x, 0, 0.32)); return g; };
  B.key_scooter = () => { const g = keyItem(steel, 'ring')(); const f = box(g, 0.9, 0.5, 0.5, M(0xf08a20, 0, 0.6), -1.5, 0.4, 0); return g; };

  // ---------- special
  B.recipe = () => { const g = new THREE.Group(); box(g, 1.8, 0.05, 2.3, paper, 0, 0, 0); for (let i = 0; i < 6; i++) box(g, 1.3 - (i % 3) * 0.3, 0.06, 0.07, M(0x6b5a3a, 0, 0.8), -0.1, 0.01, -0.8 + i * 0.3); box(g, 0.12, 0.07, 2.35, M(0xb02a24, 0, 0.5), 0.6, 0.02, 0); return flat(g); };
  B.map = () => { const g = new THREE.Group(); [[-0.9, 0.0], [0, 0.0], [0.9, 0.0]].forEach(([x], i) => { const p = box(g, 0.9, 0.04, 1.8, i % 2 ? M(0xd9c58a, 0, 0.8) : paper, x, i % 2 ? -0.05 : 0, 0); p.rotation.z = i % 2 ? 0.12 : -0.12; }); box(g, 0.5, 0.06, 0.1, M(0xc0392b, 0, 0.5), 0.1, 0.06, 0.2).rotation.y = 0.8; box(g, 0.5, 0.06, 0.1, M(0xc0392b, 0, 0.5), 0.1, 0.06, 0.2).rotation.y = -0.8; return flat(g); };
  B.armor = () => { const g = new THREE.Group(); box(g, 1.6, 1.9, 0.6, M(0x4a5350, 0.3, 0.6), 0, 0, 0); [-1, 1].forEach((s) => { box(g, 0.45, 0.9, 0.5, M(0x4a5350, 0.3, 0.6), s * 0.75, 0.75, 0).rotation.z = s * -0.1; }); box(g, 1.3, 0.7, 0.04, dark, 0, 0.3, 0.32); box(g, 1.0, 0.5, 0.04, M(0x5d6b3a, 0.1, 0.6), 0, -0.5, 0.32); [-0.5, 0.5].forEach((x) => box(g, 0.14, 0.14, 0.05, steel, x, 0.3, 0.35)); g.userData.view = [0.2, -0.4]; return g; };
  const caseBox = (c, trim, arrow) => () => { const g = new THREE.Group(); const body = M(c, 0.5, 0.4); box(g, 2.4, 1.2, 1.6, body, 0, 0, 0); box(g, 2.46, 0.05, 1.66, M(trim, 0.7, 0.3), 0, 0.1, 0); [-0.7, 0.7].forEach((x) => box(g, 0.28, 0.18, 0.06, M(trim, 0.7, 0.3), x, 0.1, 0.84)); torus(g, 0.4, 0.06, M(trim, 0.7, 0.3), 0, 0.62, 0, 0, 0, 0, Math.PI); box(g, 2.5, 1.26, 0.06, M(trim, 0.7, 0.3), 0, 0, 0.5).scale.set(0.0, 0.0, 0.0);
    if (arrow) { const a = add(g, new THREE.ConeGeometry(0.4, 0.55, 4), M(0x7fd05a, 0.2, 0.4, { emissive: 0x2a6a10, emissiveIntensity: 0.5 }), 0, 1.45, 0); cyl(g, 0.14, 0.5, M(0x7fd05a, 0.2, 0.4), 0, 0.95, 0, 12); } g.userData.view = [0.45, -0.5]; return g; };
  B.case_silver = caseBox(0xc3cacf, 0xe9edf0); B.case_black = caseBox(0x2a2d31, 0x8c949a); B.case_leather = caseBox(0x8e2c26, 0xc9ad6a); B.case_gold = caseBox(0xe8c24a, 0xfff0a8); B.case_classic = caseBox(0x7a7550, 0xc9ad6a); B.case_upgrade = caseBox(0xc3cacf, 0xe9edf0, true);

  // ---------- charms (keychain figures): 12 colour variants, chosen by name in itemart.js
  const CH = [0xc9a24a, 0x4fae3f, 0xd23b32, 0x2a56d0, 0x8a3fc9, 0xe08a20, 0x3fb8c8, 0xe0e0e0, 0x8a5a33, 0xd860a0, 0x6a7a3a, 0x1d1d22];
  CH.forEach((c, i) => { B['charm_' + i] = () => { const g = new THREE.Group(); torus(g, 0.35, 0.06, steel, 0, 1.15, 0, 0, 0, 0); torus(g, 0.2, 0.04, steel, 0, 0.78, 0, 0, Math.PI / 2, 0);
    const base = M(c, 0.35, 0.3); cyl(g, 0.8, 0.22, base, 0, 0, 0, 36).rotation.x = Math.PI / 2; torus(g, 0.8, 0.06, gold, 0, 0, 0.11);
    const f = i % 3; if (f === 0) sph(g, 0.4, M(0xf0d8b8, 0, 0.5), 0, 0.05, 0.25, 1, 1.1, 0.7); else if (f === 1) { add(g, new THREE.OctahedronGeometry(0.45, 0), M(0xf0f0f0, 0.3, 0.3), 0, 0, 0.25); } else { add(g, new THREE.ConeGeometry(0.4, 0.9, 5), M(0xf0f0f0, 0.3, 0.3), 0, 0, 0.25).rotation.x = Math.PI / 2 * 0.0; }
    g.userData.view = [0.2, -0.45]; return g; }; });
  // ---------- ammunition boxes, gunpowder and resources: colours and shapes as in the game, labels and pictograms of our own
  const canvasTex = (w, h, draw) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; };
  const printed = (tex) => new THREE.MeshStandardMaterial({ map: tex, metalness: 0, roughness: 0.55 });
  const label = (x, text, px, py, size, color, o = {}) => { x.font = (o.style || '900') + ' ' + size + 'px "Arial Narrow", Impact, sans-serif'; x.fillStyle = color; x.textAlign = o.align || 'left'; x.textBaseline = 'middle'; if (o.stroke) { x.lineWidth = size / 10; x.strokeStyle = o.stroke; x.strokeText(text, px, py, o.max); } x.fillText(text, px, py, o.max); };
  // a standing round seen from the side: type 'pistol' | 'rifle' | 'shell' | 'magnum'
  const round = (x, cx, bottom, w, h, type) => {
    const brassG = x.createLinearGradient(cx - w / 2, 0, cx + w / 2, 0); brassG.addColorStop(0, '#7a5a1c'); brassG.addColorStop(0.4, '#f4d98a'); brassG.addColorStop(1, '#8a671f');
    if (type === 'shell') {
      x.fillStyle = '#c2362b'; x.fillRect(cx - w / 2, bottom - h, w, h * 0.76); x.fillStyle = brassG; x.fillRect(cx - w / 2 - 3, bottom - h * 0.26, w + 6, h * 0.26); return;
    }
    const neck = type === 'rifle' ? 0.42 : 0.3;
    x.fillStyle = brassG; x.fillRect(cx - w / 2, bottom - h * (1 - neck), w, h * (1 - neck)); x.fillRect(cx - w / 2 - 3, bottom - 8, w + 6, 8);
    if (type === 'rifle') { x.beginPath(); x.moveTo(cx - w / 2, bottom - h * 0.58); x.lineTo(cx - w * 0.3, bottom - h * 0.7); x.lineTo(cx + w * 0.3, bottom - h * 0.7); x.lineTo(cx + w / 2, bottom - h * 0.58); x.fill(); }
    const tipW = type === 'rifle' ? w * 0.6 : w; x.fillStyle = type === 'magnum' ? '#d4d9de' : '#c07a3e';
    x.beginPath(); x.moveTo(cx - tipW / 2, bottom - h * (1 - neck)); x.quadraticCurveTo(cx - tipW / 2, bottom - h * 0.9, cx, bottom - h); x.quadraticCurveTo(cx + tipW / 2, bottom - h * 0.9, cx + tipW / 2, bottom - h * (1 - neck)); x.fill();
  };
  const boxArt = {
    handgun: { side: 0x6d1214, draw: (x) => { x.fillStyle = '#8e161a'; x.fillRect(0, 0, 768, 512); x.fillStyle = '#17100f'; x.beginPath(); x.moveTo(0, 40); x.lineTo(768, 40); x.lineTo(690, 190); x.lineTo(0, 190); x.fill();
      label(x, 'HANDGUN', 40, 118, 132, '#f4efe6', { max: 620 }); [90, 180, 270].forEach((cx) => round(x, cx, 470, 62, 210, 'pistol')); label(x, '9 mm', 720, 330, 96, '#f4efe6', { align: 'right' }); label(x, 'PISTOL AMMO', 720, 430, 62, '#f4efe6', { align: 'right' }); } },
    shotgun: { side: 0xa8b41e, draw: (x) => { x.fillStyle = '#14703f'; x.fillRect(0, 0, 768, 512); x.fillStyle = '#c9cf2a'; x.fillRect(0, 400, 768, 112);
      label(x, 'SHOTGUN', 384, 90, 140, '#f6f1da', { align: 'center', max: 700 }); x.strokeStyle = '#d9d437'; x.lineWidth = 12; for (const r of [110, 62, 18]) { x.beginPath(); x.arc(210, 270, r, 0, 7); x.stroke(); } [470, 560, 650].forEach((cx) => round(x, cx, 372, 66, 190, 'shell')); label(x, '12 GAUGE SLUGS', 384, 456, 74, '#14381f', { align: 'center', max: 720 }); } },
    smg: { side: 0x1d3a7c, draw: (x) => { const g = x.createLinearGradient(0, 0, 768, 512); g.addColorStop(0, '#dfe5ee'); g.addColorStop(0.55, '#5b78b4'); g.addColorStop(1, '#1d3a7c'); x.fillStyle = g; x.fillRect(0, 0, 768, 512);
      x.fillStyle = '#f4f6fa'; x.beginPath(); x.moveTo(0, 0); x.lineTo(250, 0); x.lineTo(0, 190); x.fill(); label(x, 'SMG', 40, 290, 190, '#1a2f78', { stroke: '#eef2f8', max: 330 }); [470, 540, 610, 680].forEach((cx) => round(x, cx, 330, 50, 200, 'pistol')); label(x, '9 mm  ·  50', 40, 430, 88, '#f4f6fa'); } },
    magnum: { side: 0x14100f, draw: (x) => { x.fillStyle = '#141011'; x.fillRect(0, 0, 768, 512); x.fillStyle = '#c4231f'; x.fillRect(0, 360, 768, 152);
      const g = x.createLinearGradient(0, 50, 0, 190); g.addColorStop(0, '#f2433a'); g.addColorStop(1, '#8e1713'); label(x, 'MAGNUM', 384, 125, 168, g, { align: 'center', max: 720, stroke: '#e9e3dc' }); [300, 384, 468].forEach((cx) => round(x, cx, 340, 56, 140, 'magnum')); label(x, '.45  CENTERFIRE', 384, 436, 84, '#141011', { align: 'center', max: 700 }); } },
    rifle: { side: 0xc9cdd2, draw: (x) => { x.fillStyle = '#eceeef'; x.fillRect(0, 0, 768, 512); x.fillStyle = '#8b929b'; x.fillRect(0, 0, 768, 76); label(x, 'T A C T I C A L', 384, 40, 52, '#f4f5f6', { align: 'center' });
      for (const [y, len] of [[130, 300], [200, 340], [270, 300]]) { x.save(); x.translate(748, y); x.rotate(-Math.PI / 2); round(x, 0, 0, 44, len, 'rifle'); x.restore(); }
      label(x, 'RIFLE', 36, 220, 180, '#b3202a', { max: 400 }); label(x, 'RIFLE CARTRIDGES', 36, 400, 66, '#b3202a'); label(x, '.223  ·  50', 36, 465, 56, '#4a4f56'); } },
  };
  const ammoBoxModel = (kind) => () => {
    const g = new THREE.Group(); const a = boxArt[kind]; const face = printed(canvasTex(768, 512, a.draw));
    const side = M(a.side, 0, 0.6); add(g, new THREE.BoxGeometry(2.4, 1.6, 0.8), [side, side, side, side, face, side], 0, 0, 0);
    add(g, new THREE.BoxGeometry(2.42, 0.05, 0.82), M(0xd9d4c8, 0, 0.7), 0, 0.805, 0);
    g.userData.view = [0.42, -0.3]; return g;
  };
  for (const k of ['handgun', 'shotgun', 'smg', 'magnum', 'rifle']) B['ammo_' + k] = ammoBoxModel(k);

  B.gunpowder = () => {
    const g = new THREE.Group(); const tin = M(0x33363a, 0.65, 0.5);
    const top = canvasTex(512, 512, (x) => {
      x.fillStyle = '#2b2d30'; x.beginPath(); x.arc(256, 256, 256, 0, 7); x.fill(); x.strokeStyle = '#26406e'; x.lineWidth = 14; x.beginPath(); x.arc(256, 256, 232, 0, 7); x.stroke();
      const text = 'GUNPOWDER'; x.fillStyle = '#e9e4d2'; x.font = '900 66px Impact, "Arial Narrow", sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
      [...text].forEach((ch, i) => { const a = -1.05 + (i * 2.1) / (text.length - 1); x.save(); x.translate(256 + Math.sin(a) * 180, 256 - Math.cos(a) * 180); x.rotate(a); x.fillText(ch, 0, 0); x.restore(); });
      const gold = x.createLinearGradient(0, 200, 0, 380); gold.addColorStop(0, '#ffe27a'); gold.addColorStop(1, '#b9801a'); x.fillStyle = gold;
      x.beginPath(); x.moveTo(90, 370); x.quadraticCurveTo(190, 330, 270, 220); x.quadraticCurveTo(350, 300, 430, 370); x.quadraticCurveTo(260, 400, 90, 370); x.fill();
      let r = 7; const rnd = () => (r = (r * 16807) % 2147483647) / 2147483647; for (let i = 0; i < 520; i++) { const px = 100 + rnd() * 320, py = 372 - rnd() * Math.max(4, 150 - Math.abs(px - 270) * 0.95); x.fillStyle = rnd() < 0.5 ? '#fff0a0' : '#9a6a14'; x.fillRect(px, py, 4, 4); }
      round(x, 165, 372, 62, 220, 'pistol'); label(x, 'DANGER · FLAMMABLE', 256, 412, 28, '#d8d3c2', { align: 'center', max: 260 });
    });
    top.center.set(0.5, 0.5); top.rotation = Math.PI / 2; // the cap of a cylinder is mapped turned by a quarter
    add(g, new THREE.CylinderGeometry(1.2, 1.2, 0.55, 64), [tin, new THREE.MeshStandardMaterial({ map: top, color: 0xa9a9a9, metalness: 0, roughness: 0.85 }), tin], 0, 0, 0);
    const ring = (y, r, t, m) => { add(g, new THREE.TorusGeometry(r, t, 12, 64), m, 0, y, 0).rotation.x = Math.PI / 2; };
    ring(0.275, 1.19, 0.045, M(0x787d83, 0.8, 0.35)); ring(-0.03, 1.215, 0.03, M(0x17191c, 0.5, 0.6)); ring(-0.275, 1.19, 0.045, M(0x55595e, 0.7, 0.4));
    g.userData.view = [0.9, 0]; return g;
  };

  // a sack lying on its side with scrap spilling out of the mouth
  const bag = (cloth, stuff, seed) => () => {
    const g = new THREE.Group(); let r = seed; const rnd = () => (r = (r * 16807) % 2147483647) / 2147483647;
    const weave = canvasTex(256, 256, (x) => { x.fillStyle = cloth; x.fillRect(0, 0, 256, 256); for (let i = 0; i < 5200; i++) { x.fillStyle = rnd() < 0.5 ? 'rgba(0,0,0,.22)' : 'rgba(255,255,255,.09)'; x.fillRect(rnd() * 256, rnd() * 256, 2 + rnd() * 3, 1.5); } });
    const geo = new THREE.SphereGeometry(1, 120, 80); const pos = geo.attributes.position; const v = new THREE.Vector3();
    // profile along the sack: x position, half height, half width (mouth -> body -> gathered part -> flat flaring end)
    const prof = [[-1.15, 0.6, 0.72], [-0.7, 0.72, 0.9], [0.0, 0.62, 0.85], [0.55, 0.4, 0.55], [0.9, 0.2, 0.42], [1.3, 0.14, 0.72], [1.75, 0.05, 0.9]];
    const at = (x, i) => { let k = 1; while (k < prof.length - 1 && x > prof[k][0]) k++; const p0 = prof[k - 1], p1 = prof[k]; const f = Math.min(1, Math.max(0, (x - p0[0]) / (p1[0] - p0[0]))); return p0[i] + (p1[i] - p0[i]) * f; };
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      const t = (v.x + 1) / 2; const x = -1.15 + t * 2.9; const ang = Math.atan2(v.y, v.z);
      const fold = 1 + 0.11 * Math.sin(ang * 5 + x * 4) * Math.sin(x * 3 + 1) + 0.07 * Math.sin(x * 9 + ang * 3) + 0.04 * Math.sin(x * 17 - ang * 7);
      const y = Math.sin(ang) * at(x, 1) * fold, z = Math.cos(ang) * at(x, 2) * (2 - fold) + (x > 0.9 ? 0.12 * Math.sin(x * 7) : 0);
      pos.setXYZ(i, x, Math.max(-0.5, y), z);
    }
    geo.computeVertexNormals();
    add(g, geo, new THREE.MeshStandardMaterial({ map: weave, roughness: 0.95, metalness: 0 }), 0, 0, 0);
    const hole = add(g, new THREE.CircleGeometry(0.62, 40), M(0x0d0b0a, 0, 1), -1.16, 0.02, 0); hole.rotation.y = -Math.PI / 2; hole.scale.set(1.08, 0.88, 1);
    const lip = add(g, new THREE.TorusGeometry(0.64, 0.085, 12, 48), new THREE.MeshStandardMaterial({ map: weave, roughness: 0.95 }), -1.09, 0, 0); lip.rotation.y = Math.PI / 2; lip.scale.set(1.08, 0.9, 1); lip.position.x = -1.14;
    const mats = stuff.map((c) => M(c, 0.75, 0.42));
    const m = () => mats[Math.floor(rnd() * mats.length)];
    for (let i = 0; i < 70; i++) {
      const piece = new THREE.Group(); const kind = Math.floor(rnd() * 4); const mm = m();
      if (kind === 0) add(piece, new THREE.CylinderGeometry(0.09 + rnd() * 0.08, 0.09 + rnd() * 0.08, 0.22 + rnd() * 0.3, 14), mm);
      else if (kind === 1) { const R = 0.1 + rnd() * 0.13; add(piece, new THREE.CylinderGeometry(R, R, 0.07, 20), mm); for (let t = 0; t < 8; t++) { const a = t * Math.PI / 4; add(piece, new THREE.BoxGeometry(0.06, 0.07, 0.06), mm, Math.cos(a) * (R + 0.02), 0, Math.sin(a) * (R + 0.02)).rotation.y = -a; } add(piece, new THREE.CylinderGeometry(R * 0.3, R * 0.3, 0.09, 12), M(0x15120f, 0.3, 0.8)); }
      else if (kind === 2) add(piece, new THREE.TorusGeometry(0.07 + rnd() * 0.07, 0.03, 8, 18), mm);
      else add(piece, new THREE.BoxGeometry(0.1 + rnd() * 0.3, 0.05 + rnd() * 0.08, 0.06 + rnd() * 0.1), mm);
      const out = rnd(); piece.position.set(-1.15 - out * 1.05, -0.46 + rnd() * (0.8 * (1 - out) * (1 - out)), (rnd() - 0.5) * (1.05 + out * 0.9)); piece.scale.setScalar(1 - out * 0.35);
      piece.rotation.set(rnd() * 3, rnd() * 3, rnd() * 3); g.add(piece);
    }
    g.userData.view = [0.72, 0.42, -0.36]; return g;
  };
  B.resources_s = bag('#2c3c63', [0x8a4a28, 0x6f3a22, 0xa0603a, 0x4a3024], 11); // blue sack, rusty scrap
  B.resources_l = bag('#7d5a3a', [0xaeb4ba, 0x787f86, 0xc9a24e, 0x55595e], 29); // brown sack, gears and brass
  // ---------- single herbs: a bunch of feathery sprigs on a thin stem (mixes are vials, further below)
  const herbModel = (colors) => () => {
    const g = new THREE.Group(); let r = 5; const rnd = () => (r = (r * 16807) % 2147483647) / 2147483647;
    const stemM = M(0x6e5a34, 0, 0.8);
    const tube = (pts, rad, m, into) => { const c = new THREE.CatmullRomCurve3(pts.map((q) => new THREE.Vector3(...q))); add(into, new THREE.TubeGeometry(c, 24, rad, 7, false), m); return c; };
    const leafShape = new THREE.Shape(); leafShape.moveTo(0, 0); leafShape.quadraticCurveTo(0.075, 0.1, 0, 0.3); leafShape.quadraticCurveTo(-0.075, 0.1, 0, 0);
    const leafGeo = new THREE.ShapeGeometry(leafShape);
    // one frond: a curved midrib with leaflets in pairs, smaller towards the tip
    const frond = (into, from, dir, len, mats) => {
      const d = new THREE.Vector3(...dir).normalize(), o = new THREE.Vector3(...from);
      const mid = o.clone().addScaledVector(d, len * 0.5).add(new THREE.Vector3((rnd() - 0.5) * 0.25, 0.06, (rnd() - 0.5) * 0.25));
      const end = o.clone().addScaledVector(d, len).add(new THREE.Vector3(d.x * 0.12, -0.12 * rnd(), 0));
      const c = new THREE.CatmullRomCurve3([o, mid, end]); add(into, new THREE.TubeGeometry(c, 16, 0.014, 5, false), mats[0]);
      const n = Math.round(len * 15);
      for (let i = 1; i <= n; i++) {
        const t = i / (n + 1), at = c.getPoint(t), tan = c.getTangent(t), size = (1 - t * 0.65) * (0.85 + rnd() * 0.3);
        for (const side of [-1, 1]) {
          const leaf = new THREE.Mesh(leafGeo, mats[1 + Math.floor(rnd() * (mats.length - 1))]);
          const out = new THREE.Vector3(-tan.y, tan.x, 0).normalize().multiplyScalar(side).addScaledVector(tan, 0.75).add(new THREE.Vector3(0, 0, (rnd() - 0.5) * 0.7)).normalize();
          leaf.position.copy(at); leaf.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), out); leaf.scale.setScalar(size); into.add(leaf);
        }
      }
    };
    const shades = (hex) => [stemM, ...[1, 0.78, 1.2].map((k) => new THREE.MeshStandardMaterial({ color: new THREE.Color(hex).multiplyScalar(k), roughness: 0.75, metalness: 0, side: THREE.DoubleSide, emissive: new THREE.Color(hex).multiplyScalar(0.12) }))];
    colors.forEach((hex, ci) => {
      const bunch = new THREE.Group(); const lean = colors.length === 1 ? 0 : (ci - (colors.length - 1) / 2) * 0.62; const mats = shades(hex);
      tube([[0, 0, 0], [0.03, 0.55, 0], [-0.02, 1.15, 0.02], [0.05, 1.75, 0]], 0.035, stemM, bunch);
      frond(bunch, [0.05, 1.7, 0], [0.12, 1, 0], 0.95, mats);
      for (let i = 0; i < 9; i++) { const y = 0.25 + i * 0.17, side = i % 2 ? 1 : -1; frond(bunch, [0, y, 0], [side * (0.5 + rnd() * 0.35), 0.75 + rnd() * 0.35, (rnd() - 0.5) * 0.6], 0.8 + rnd() * 0.5 - i * 0.02, mats); }
      bunch.rotation.z = -lean; bunch.position.set(lean * 0.12, 0, ci * 0.08); g.add(bunch);
    });
    tube([[0, 0.02, 0], [0.1, -0.35, 0], [-0.08, -0.62, 0.03], [-0.34, -0.95, 0]], 0.028, M(0x7a5a38, 0, 0.9), g);
    g.userData.view = [0.12, -0.15, -0.3]; return g;
  };
  const HG = 0x5f9448, HR = 0xb0392c, HY = 0xc9ae35;
  Object.assign(B, { herb_green: herbModel([HG]), herb_red: herbModel([HR]), herb_yellow: herbModel([HY]) });

  // ---------- first aid spray: pale olive can with a white shoulder and nozzle, our own lettering
  B.first_aid_spray = () => {
    const g = new THREE.Group();
    const wrap = canvasTex(1024, 640, (x) => {
      x.fillStyle = '#9a9d80'; x.fillRect(0, 0, 1024, 640); x.fillStyle = '#b9bc9c'; x.fillRect(0, 96, 1024, 448);
      x.fillStyle = '#4f6b2c'; x.fillRect(0, 96, 1024, 16); x.fillRect(0, 528, 1024, 16);
      x.fillStyle = '#5d7a34'; x.fillRect(487, 140, 50, 150); x.fillRect(437, 190, 150, 50);
      label(x, 'FIRST AID', 512, 368, 76, '#20241a', { align: 'center', max: 360 }); label(x, 'SPRAY', 512, 444, 60, '#20241a', { align: 'center' });
      x.fillStyle = '#8c3b26'; x.beginPath(); x.arc(512, 496, 20, 0, 7); x.fill(); x.fillStyle = '#e8e4d0'; x.fillRect(508, 484, 8, 24); x.fillRect(500, 492, 24, 8);
    });
    const white = M(0xdedbcd, 0.15, 0.4), rim = M(0x9aa0a4, 0.85, 0.3);
    add(g, new THREE.CylinderGeometry(0.62, 0.62, 2.3, 64, 1, true, Math.PI), printed(wrap), 0, 0, 0);
    add(g, lathe([[0.63, 1.15], [0.66, 1.2], [0.6, 1.26], [0.55, 1.46], [0.36, 1.62], [0.14, 1.68], [0, 1.68]], 48), white);
    add(g, new THREE.TorusGeometry(0.625, 0.045, 12, 64), rim, 0, 1.16, 0).rotation.x = Math.PI / 2;
    add(g, new THREE.TorusGeometry(0.625, 0.06, 12, 64), rim, 0, -1.16, 0).rotation.x = Math.PI / 2;
    cyl(g, 0.6, 0.1, rim, 0, -1.18, 0, 48); cyl(g, 0.1, 0.22, rim, 0, 1.76, 0); box(g, 0.34, 0.24, 0.24, M(0x6d7378, 0.7, 0.4), 0.03, 1.96, 0); cyl(g, 0.05, 0.14, dark, 0.23, 1.98, 0, 10).rotation.z = Math.PI / 2;
    g.userData.view = [0.16, -0.12, 0.62]; return g;
  };

  // ---------- grenades: one shape, the colour tells the kind
  const grenadeModel = (body, ink, lines) => () => {
    const g = new THREE.Group(); const bodyM = M(body, 0.35, 0.55);
    const print = canvasTex(1024, 512, (x) => {
      x.fillStyle = '#' + body.toString(16).padStart(6, '0'); x.fillRect(0, 0, 1024, 512);
      for (let i = 0, r = 3; i < 2600; i++) { r = (r * 16807) % 2147483647; const a = r / 2147483647; r = (r * 16807) % 2147483647; x.fillStyle = i % 2 ? 'rgba(0,0,0,.16)' : 'rgba(255,255,255,.06)'; x.fillRect(a * 1024, (r / 2147483647) * 512, 4, 4); }
      lines.forEach((t, i) => label(x, t, 512, 120 + i * 78, i ? 48 : 54, ink, { align: 'center', max: 340 }));
    });
    add(g, new THREE.CylinderGeometry(0.72, 0.76, 1.5, 64, 1, true, Math.PI), printed(print), 0, 0, 0);
    add(g, lathe([[0.76, -0.75], [0.72, -0.92], [0.55, -1.02], [0, -1.04]], 48), bodyM);
    add(g, lathe([[0.72, 0.75], [0.62, 0.92], [0.42, 1.02], [0.34, 1.06], [0, 1.06]], 48), bodyM);
    add(g, new THREE.TorusGeometry(0.765, 0.055, 12, 64), bodyM, 0, -0.5, 0).rotation.x = Math.PI / 2;
    const metal = M(0xa9a58f, 0.75, 0.42);
    cyl(g, 0.3, 0.2, metal, 0, 1.12, 0); box(g, 0.46, 0.34, 0.4, metal, 0, 1.38, 0); cyl(g, 0.09, 0.5, metal, 0, 1.38, 0, 12).rotation.x = Math.PI / 2;
    const lever = new THREE.CatmullRomCurve3([[0.1, 1.56, 0], [0.55, 1.45, 0], [0.82, 0.8, 0], [0.86, -0.35, 0]].map((q) => new THREE.Vector3(...q)));
    const strip = add(g, new THREE.TubeGeometry(lever, 30, 0.075, 8, false), metal); strip.scale.z = 2.2;
    torus(g, 0.36, 0.035, M(0xc9ccd0, 0.9, 0.3), -0.22, 1.14, 0.42, 1.15, 0.2, 0);
    sph(g, 0.09, metal, -0.34, 1.42, 0.1);
    g.userData.view = [0.28, -0.04, 0.22]; return g;
  };
  B.grenade_hand = grenadeModel(0x3c4724, '#c9c7a6', ['HAND GRENADE', 'MK 2  LOT 30-32', 'FRAGMENTATION']);
  B.grenade_flash = grenadeModel(0x243a6b, '#d3dcec', ['FLASH GRENADE', 'MK 1  LOT 30-32', 'ILLUMINATING']);
  B.grenade_heavy = grenadeModel(0x6e2019, '#ecd6c8', ['HEAVY GRENADE', 'MK 3  LOT 30-32', 'HIGH EXPLOSIVE']);

  // ---------- mines: a cardboard tray with two rows of cups
  B.mine = () => {
    const g = new THREE.Group(); const shell = M(0x3f5566, 0.55, 0.45), glow = M(0xd87a14, 0.25, 0.35, { emissive: 0x5a2c00 }), card = M(0x6b4526, 0, 0.85);
    box(g, 4.6, 0.08, 2.0, card, 0, 0, 0); box(g, 4.62, 0.025, 2.02, M(0x8a5e36, 0, 0.85), 0, 0.045, 0);
    for (let i = 0; i < 5; i++) for (let j = 0; j < 2; j++) {
      const x = -1.76 + i * 0.88, z = -0.48 + j * 0.96;
      add(g, lathe([[0, -0.72], [0.26, -0.72], [0.34, -0.55], [0.3, -0.4], [0.34, -0.2], [0.34, 0]], 32), shell, x, 0, z);
      add(g, new THREE.CylinderGeometry(0.34, 0.37, 0.4, 32, 1, true), shell, x, 0.24, z);
      cyl(g, 0.27, 0.06, glow, x, 0.34, z, 32);
      add(g, new THREE.TorusGeometry(0.3, 0.05, 8, 32), shell, x, 0.4, z).rotation.x = Math.PI / 2;
      for (let t = 0; t < 4; t++) { const a = t * Math.PI / 2 + Math.PI / 4; box(g, 0.22, 0.22, 0.11, shell, x + Math.cos(a) * 0.31, 0.47, z + Math.sin(a) * 0.31).rotation.y = -a + Math.PI / 2; }
    }
    g.userData.view = [0.62, -0.45, 0.14]; return g;
  };

  // ---------- bolts: blue shafts, black points and vanes; explosive arrows: red-vaned arrows in a black quiver
  const arrow = (shaft, vane, len) => {
    const a = new THREE.Group();
    cyl(a, 0.07, len, shaft, 0, 0, 0, 20).rotation.z = Math.PI / 2;
    add(a, new THREE.ConeGeometry(0.085, 0.32, 20), M(0x2a2d31, 0.85, 0.3), len / 2 + 0.16, 0, 0).rotation.z = -Math.PI / 2;
    cyl(a, 0.082, 0.12, M(0xb9c0c6, 0.9, 0.25), len / 2 - 0.06, 0, 0, 20).rotation.z = Math.PI / 2;
    for (let i = 0; i < 3; i++) { const fin = extrude([[0, 0.05], [0.12, 0.3], [0.62, 0.27], [0.85, 0.05]], 0.012, vane, 0.004); fin.position.x = -len / 2 + 0.06; const holder = new THREE.Group(); holder.add(fin); holder.rotation.x = i * Math.PI * 2 / 3 + 0.3; a.add(holder); }
    cyl(a, 0.085, 0.1, black, -len / 2, 0, 0, 20).rotation.z = Math.PI / 2;
    return a;
  };
  B.bolts = () => {
    const g = new THREE.Group(); const blue = M(0x24497a, 0.7, 0.34), vane = M(0x25272b, 0.2, 0.6, { side: THREE.DoubleSide });
    [[0.2, 0.2, 0], [0, 0, 0.02], [-0.2, -0.2, 0.04], [0.08, 0.2, 0.34], [-0.12, 0, 0.36], [-0.32, -0.2, 0.38]].forEach(([y, x, z], i) => place(g, arrow(blue, vane, 3.2), x * 0.8 + (i % 2) * 0.05, y, z));
    box(g, 0.2, 0.7, 0.58, black, -0.55, -0.02, 0.2);
    g.userData.view = [0.42, -0.3, -0.55]; return g;
  };
  B.arrows_explosive = () => {
    const g = new THREE.Group(); const case_ = M(0x2b2d2e, 0.25, 0.6), red = M(0xa51f1a, 0.15, 0.5, { side: THREE.DoubleSide }), shaft = M(0x1d1f22, 0.7, 0.4);
    cyl(g, 0.34, 2.7, case_, -0.35, 0, 0, 40).rotation.z = Math.PI / 2;
    [-1.68, -0.55, 0.45, 0.98].forEach((x) => cyl(g, 0.37, 0.09, M(0x3b3e40, 0.35, 0.55), x, 0, 0, 40).rotation.z = Math.PI / 2);
    [-0.12, 0.12].forEach((y) => sph(g, 0.055, brass, 0.78, y, 0.34));
    torus(g, 0.17, 0.035, M(0x1a1c1e, 0.7, 0.4), 0.35, -0.46, 0);
    [[0.14, 0.1, 0], [-0.12, -0.08, 0.12], [0.02, 0.3, -0.12]].forEach(([y, dx, z]) => { const a = arrow(shaft, red, 1.7); a.rotation.y = Math.PI; place(g, a, 1.35 + dx, y, z, 0, Math.PI, y * 0.35); });
    g.userData.view = [0.3, -0.3, 2.42]; return g;
  };
  // ---------- black bass: lofted body with painted back, side stripe and belly; head to the right
  B.bass = () => {
    const g = new THREE.Group(); let r = 17; const rnd = () => (r = (r * 16807) % 2147483647) / 2147483647;
    // x along the fish, top and bottom outline, half width
    const prof = [[-1.9, 0.14, -0.12, 0.05], [-1.6, 0.17, -0.15, 0.08], [-1.0, 0.45, -0.36, 0.2], [-0.3, 0.68, -0.52, 0.3], [0.4, 0.66, -0.55, 0.32], [1.0, 0.47, -0.45, 0.27], [1.45, 0.3, -0.3, 0.2], [1.8, 0.13, -0.14, 0.1], [1.98, 0.02, -0.04, 0.02]];
    const at = (x, i) => { let k = 1; while (k < prof.length - 1 && x > prof[k][0]) k++; const a = prof[k - 1], b = prof[k]; const f = Math.min(1, Math.max(0, (x - a[0]) / (b[0] - a[0]))); const e = f * f * (3 - 2 * f); return a[i] + (b[i] - a[i]) * (0.5 * f + 0.5 * e); };
    const skin = canvasTex(1024, 512, (x) => {
      const gr = x.createLinearGradient(0, 0, 0, 512); gr.addColorStop(0, '#2f3a1c'); gr.addColorStop(0.3, '#6d7434'); gr.addColorStop(0.55, '#a9a55c'); gr.addColorStop(0.72, '#d9d3a4'); gr.addColorStop(1, '#efeac8'); x.fillStyle = gr; x.fillRect(0, 0, 1024, 512);
      for (let i = 0; i < 2600; i++) { x.fillStyle = rnd() < 0.5 ? 'rgba(40,48,20,.28)' : 'rgba(235,232,180,.2)'; const px = rnd() * 1024, py = rnd() * 400; x.beginPath(); x.arc(px, py, 3 + rnd() * 3, 0, 7); x.fill(); }
      for (let i = 0; i < 70; i++) { x.fillStyle = 'rgba(33,40,16,.72)'; x.beginPath(); x.ellipse(60 + rnd() * 880, 250 + (rnd() - 0.5) * 62, 10 + rnd() * 22, 8 + rnd() * 16, rnd(), 0, 7); x.fill(); }
    });
    const geo = new THREE.SphereGeometry(1, 96, 64); const pos = geo.attributes.position, uv = geo.attributes.uv; const v = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      const x = v.x * 1.94 + 0.04; const ang = Math.atan2(v.y, v.z); const top = at(x, 1), bot = at(x, 2), w = at(x, 3);
      const y = Math.sin(ang) >= 0 ? Math.sin(ang) * top : -Math.sin(ang) * bot;
      pos.setXYZ(i, x, y, Math.cos(ang) * w);
      uv.setXY(i, (x + 1.9) / 3.9, 0.5 + y / 1.28);
    }
    geo.computeVertexNormals();
    add(g, geo, new THREE.MeshStandardMaterial({ map: skin, roughness: 0.42, metalness: 0.15 }), 0, 0, 0);
    const fin = M(0x6a6c35, 0.05, 0.6, { side: THREE.DoubleSide }), finDark = M(0x3e4620, 0.05, 0.6, { side: THREE.DoubleSide });
    const flatShape = (pts, m, z = 0) => { const sh = new THREE.Shape(); pts.forEach(([x, y], i) => (i ? sh.lineTo(x, y) : sh.moveTo(x, y))); add(g, new THREE.ShapeGeometry(sh), m, 0, 0, z); };
    flatShape([[-1.85, 0.12], [-2.55, 0.55], [-2.42, 0.1], [-2.3, 0.0], [-2.42, -0.1], [-2.55, -0.52], [-1.85, -0.1]], fin);            // tail
    flatShape([[-0.35, 0.64], [-0.05, 0.98], [0.05, 0.8], [0.2, 1.0], [0.3, 0.8], [0.48, 0.96], [0.55, 0.77], [0.74, 0.86], [0.8, 0.52]], finDark); // spiny back fin
    flatShape([[-1.2, 0.33], [-1.1, 0.86], [-0.75, 0.86], [-0.35, 0.63]], fin);                                                            // soft back fin
    flatShape([[-1.15, -0.3], [-1.12, -0.68], [-0.75, -0.62], [-0.55, -0.45]], fin);                                                         // anal fin
    flatShape([[0.45, -0.5], [0.2, -0.82], [0.62, -0.72], [0.75, -0.46]], fin, 0.16);
    flatShape([[0.8, -0.1], [0.28, -0.2], [0.32, -0.42], [0.78, -0.26]], finDark, 0.34);                                                   // pectoral fin
    sph(g, 0.115, M(0xd8b23c, 0.4, 0.25), 1.38, 0.1, 0.205); sph(g, 0.062, black, 1.4, 0.1, 0.3);
    const line = (pts, m, rad) => add(g, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map((q) => new THREE.Vector3(...q))), 20, rad, 6, false), m);
    line([[1.97, -0.02, 0.02], [1.62, -0.12, 0.19], [1.22, -0.2, 0.26]], M(0x2a2a14, 0, 0.8), 0.02);                                        // mouth
    line([[0.92, 0.36, 0.27], [0.8, 0.02, 0.31], [0.92, -0.34, 0.27]], M(0x4a4e24, 0, 0.8), 0.018);                                          // gill cover
    g.userData.view = [0.12, -0.22, 0.06]; return g;
  };

  // ---------- viper: a coiled body with a yellow and black pattern
  B.viper = () => {
    const g = new THREE.Group(); let r = 23; const rnd = () => (r = (r * 16807) % 2147483647) / 2147483647;
    const skin = canvasTex(2048, 256, (x) => {
      x.fillStyle = '#4a4418'; x.fillRect(0, 0, 2048, 256);
      for (let i = 0; i < 5200; i++) { x.fillStyle = ['#b9a82e', '#8d8524', '#252009', '#d6c448'][Math.floor(rnd() * 4)]; const px = rnd() * 2048, py = rnd() * 256; x.beginPath(); x.ellipse(px, py, 7, 4, 0, 0, 7); x.fill(); }
      for (let i = 0; i < 26; i++) { const cx = i * 80 + 30; for (const cy of [60, 196]) { x.fillStyle = 'rgba(12,10,3,.85)'; x.beginPath(); x.moveTo(cx - 34, cy); x.lineTo(cx, cy - 46); x.lineTo(cx + 34, cy); x.lineTo(cx, cy + 46); x.fill(); } }
    });
    skin.wrapS = skin.wrapT = THREE.RepeatWrapping;
    const path = new THREE.CatmullRomCurve3([[-0.95, -0.85, 0.34], [-0.72, -0.3, 0.3], [-0.2, 0.55, 0.38], [0.75, 0.85, 0.3], [1.5, 0.35, 0.15], [1.15, -0.4, 0.05], [0.1, -0.55, 0], [-1.0, -0.3, 0], [-1.55, 0.2, 0.05], [-1.05, 0.62, 0.02], [0.0, 0.2, 0], [0.9, 0.05, 0], [1.75, 0.55, 0.02], [1.7, 1.05, 0.05], [2.0, 1.35, 0.08]].map((q) => new THREE.Vector3(...q)));
    const SEG = 320, RAD = 28; const geo = new THREE.TubeGeometry(path, SEG, 1, RAD, false); const pos = geo.attributes.position;
    for (let i = 0; i <= SEG; i++) {
      const t = i / SEG; const c = path.getPointAt(t);
      const rad = t < 0.03 ? 0.19 : t < 0.1 ? 0.17 + (t - 0.03) * 1.2 : t < 0.62 ? 0.255 : 0.255 * Math.max(0.08, 1 - Math.pow((t - 0.62) / 0.38, 1.4));
      for (let j = 0; j <= RAD; j++) { const k = i * (RAD + 1) + j; const v = new THREE.Vector3().fromBufferAttribute(pos, k).sub(c).multiplyScalar(rad).add(c); pos.setXYZ(k, v.x, v.y, v.z); }
    }
    geo.computeVertexNormals();
    add(g, geo, new THREE.MeshStandardMaterial({ map: skin, roughness: 0.55, metalness: 0.12 }), 0, 0, 0);
    const headM = M(0x7a6a1e, 0.15, 0.5), dir = path.getTangentAt(0).negate(); const head = new THREE.Group();
    sph(head, 0.25, headM, 0.14, 0, 0, 1.45, 1.05, 0.68); sph(head, 0.16, M(0x5c501a, 0.15, 0.55), 0.38, 0, 0.0, 1.2, 0.85, 0.6);
    for (const side of [-1, 1]) { sph(head, 0.055, M(0xd8a82a, 0.4, 0.25), 0.24, side * 0.17, 0.12); sph(head, 0.026, black, 0.27, side * 0.185, 0.155); }
    head.position.copy(path.getPointAt(0)); head.rotation.z = Math.atan2(dir.y, dir.x); g.add(head);
    g.userData.view = [-0.55, 0.12]; return g;
  };

  // ---------- ornate beetle: blue enamel with gold ornament
  B.ornate_beetle = () => {
    const g = new THREE.Group(); const bronze = M(0x9a7a32, 0.85, 0.32, { emissive: 0x1c1300 });
    const ornament = (w, h, draw) => canvasTex(w, h, (x) => {
      x.fillStyle = '#162452'; x.fillRect(0, 0, w, h); let r = 9; for (let i = 0; i < 1400; i++) { r = (r * 16807) % 2147483647; const a = r / 2147483647; r = (r * 16807) % 2147483647; x.fillStyle = 'rgba(120,150,220,.22)'; x.fillRect(a * w, (r / 2147483647) * h, 2, 2); }
      x.strokeStyle = '#d6a83e'; x.fillStyle = '#e8bd52'; x.lineWidth = 11; x.lineCap = 'round';
      const curl = (cx, cy, R, from, dir) => { x.beginPath(); for (let t = 0; t <= 1.001; t += 0.03) { const a = from + dir * t * 8, rr = R * (1 - t * 0.8); const px = cx + Math.cos(a) * rr, py = cy + Math.sin(a) * rr; t ? x.lineTo(px, py) : x.moveTo(px, py); } x.stroke(); };
      const flower = (cx, cy, R) => { for (let i = 0; i < 7; i++) { const a = i * Math.PI * 2 / 7; x.beginPath(); x.ellipse(cx + Math.cos(a) * R * 0.62, cy + Math.sin(a) * R * 0.62, R * 0.46, R * 0.22, a, 0, 7); x.fill(); } x.fillStyle = '#fbe49a'; x.beginPath(); x.arc(cx, cy, R * 0.3, 0, 7); x.fill(); x.fillStyle = '#e8bd52'; };
      draw(x, curl, flower);
    });
    const wings = ornament(512, 700, (x, curl, flower) => {
      x.beginPath(); x.moveTo(256, 20); x.lineTo(256, 690); x.stroke();
      for (const m of [-1, 1]) { const X = (v) => 256 + m * v;
        x.beginPath(); x.moveTo(X(14), 150); x.bezierCurveTo(X(90), 60, X(210), 130, X(190), 260); x.bezierCurveTo(X(175), 360, X(60), 330, X(60), 420); x.bezierCurveTo(X(60), 530, X(200), 480, X(160), 590); x.stroke();
        curl(X(150), 190, 52, m > 0 ? 3 : 0, m); curl(X(95), 330, 46, m > 0 ? 0 : 3, -m); curl(X(170), 440, 48, 1, m); curl(X(80), 560, 52, m > 0 ? 4 : 5, -m); curl(X(70), 100, 40, 2, m);
        flower(X(150), 290, 42); flower(X(70), 485, 36); }
      flower(256, 130, 30);
    });
    const collar = ornament(512, 300, (x, curl) => { for (const m of [-1, 1]) { const X = (v) => 256 + m * v; curl(X(80), 150, 70, m > 0 ? 3 : 0, m); curl(X(170), 190, 54, m > 0 ? 0 : 3, -m); x.beginPath(); x.moveTo(X(0), 40); x.bezierCurveTo(X(60), 120, X(170), 40, X(230), 150); x.stroke(); } x.beginPath(); x.moveTo(256, 30); x.lineTo(256, 270); x.stroke(); });
    const dome = (rx, ry, rz, y, tex) => {
      const geo = new THREE.SphereGeometry(1, 80, 56); const pos = geo.attributes.position, uv = geo.attributes.uv;
      for (let i = 0; i < pos.count; i++) { const px = pos.getX(i), py = pos.getY(i); uv.setXY(i, 0.5 + px * 0.5, 0.5 + py * 0.5); }
      const o = add(g, geo, new THREE.MeshStandardMaterial({ map: tex, metalness: 0.45, roughness: 0.2 }), 0, y, 0); o.scale.set(rx, ry, rz);
      const rim = add(g, new THREE.TorusGeometry(1, 0.035, 10, 80), bronze, 0, y, 0); rim.scale.set(rx, ry, 1);
    };
    dome(0.98, 1.32, 0.52, -0.35, wings); dome(0.74, 0.46, 0.42, 1.12, collar);
    sph(g, 0.3, bronze, 0, 1.68, 0.05, 1.25, 0.8, 0.8); for (const m of [-1, 1]) sph(g, 0.09, M(0x3a2c0c, 0.8, 0.25), m * 0.24, 1.78, 0.24);
    const leg = (pts, rad) => { add(g, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map((q) => new THREE.Vector3(...q)), false, 'catmullrom', 0.1), 40, rad, 10, false), bronze); pts.slice(1).forEach((q) => sph(g, rad * 1.35, bronze, ...q)); };
    for (const m of [-1, 1]) {
      leg([[m * 0.45, 1.2, -0.1], [m * 1.05, 1.3, -0.1], [m * 1.12, 1.8, -0.1], [m * 1.45, 2.0, -0.1]], 0.07);
      leg([[m * 0.75, 0.25, -0.12], [m * 1.28, 0.3, -0.12], [m * 1.35, -0.22, -0.12], [m * 1.62, -0.55, -0.12]], 0.075);
      leg([[m * 0.7, -0.75, -0.12], [m * 1.15, -1.05, -0.12], [m * 1.12, -1.6, -0.12], [m * 1.38, -2.05, -0.12]], 0.075);
    }
    g.userData.view = [-0.25, 0.12]; return g;
  };
  // ---------- mixed herbs: a corked glass vial with one layer of powder per herb (the first herb at the bottom), as in the game
  const vialModel = (letters) => () => {
    const g = new THREE.Group(); const colors = { g: '#8fbf3a', r: '#d9737c', y: '#e6cf3e' };
    const total = 2.5, h = total / letters.length;
    letters.split('').forEach((l, i) => {
      let r = 31 + i * 7; const rnd = () => (r = (r * 16807) % 2147483647) / 2147483647;
      const grain = canvasTex(512, 256, (x) => {
        x.fillStyle = colors[l]; x.fillRect(0, 0, 512, 256);
        for (let k = 0; k < 4200; k++) { x.fillStyle = rnd() < 0.5 ? 'rgba(0,0,0,.26)' : 'rgba(255,255,255,.34)'; x.beginPath(); x.arc(rnd() * 512, rnd() * 256, 1.5 + rnd() * 3, 0, 7); x.fill(); }
      });
      // two layers of the same herb next to each other stay apart by their shade
      const shade = letters.indexOf(l) < i && letters[i - 1] === l ? ((i % 2) ? 0xc4c4c4 : 0xffffff) : 0xffffff;
      const m = new THREE.MeshStandardMaterial({ map: grain, color: shade, roughness: 0.9, metalness: 0, emissive: new THREE.Color(colors[l]).multiplyScalar(0.18) });
      add(g, new THREE.CylinderGeometry(0.43, 0.43, h - 0.035, 48), m, 0, -total / 2 + h * i + h / 2, 0);
    });
    const glass = new THREE.MeshStandardMaterial({ color: 0xd9ecee, metalness: 0.2, roughness: 0.05, transparent: true, opacity: 0.2, depthWrite: false });
    add(g, new THREE.CylinderGeometry(0.5, 0.5, total + 0.34, 48, 1, true), glass, 0, 0.14, 0);
    add(g, lathe([[0.5, -total / 2 - 0.03], [0.46, -total / 2 - 0.14], [0.3, -total / 2 - 0.18], [0, -total / 2 - 0.19]], 48), glass);
    add(g, lathe([[0.5, total / 2 + 0.3], [0.36, total / 2 + 0.44], [0.34, total / 2 + 0.56], [0.4, total / 2 + 0.62]], 48), glass);
    const rim = new THREE.MeshStandardMaterial({ color: 0xcfe4e6, metalness: 0.5, roughness: 0.12, transparent: true, opacity: 0.75 });
    for (const [y, rad] of [[total / 2 + 0.62, 0.4], [-total / 2 - 0.02, 0.5]]) add(g, new THREE.TorusGeometry(rad, 0.028, 10, 48), rim, 0, y, 0).rotation.x = Math.PI / 2;
    box(g, 0.055, total - 0.1, 0.02, new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.5, transparent: true, opacity: 0.35 }), -0.27, 0, 0.43);
    const cork = M(0x9a6b3c, 0, 0.9);
    cyl(g, 0.32, 0.3, cork, 0, total / 2 + 0.68, 0, 32); cyl(g, 0.37, 0.14, M(0x7d5430, 0, 0.9), 0, total / 2 + 0.86, 0, 32);
    g.userData.view = [0.22, -0.25, -0.12]; return g;
  };
  for (const k of ['gg', 'ggg', 'gr', 'gy', 'ry', 'ggy', 'gry']) B['herb_' + k] = vialModel(k);
  const extrude2 = (g, pts, depth, m, bevel = 0.05) => { const sh = new THREE.Shape(); pts.forEach(([x, y], i) => (i ? sh.lineTo(x, y) : sh.moveTo(x, y))); sh.closePath(); const geo = new THREE.ExtrudeGeometry(sh, { depth, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelOffset: -bevel, bevelSegments: 3 }); geo.translate(0, 0, -depth / 2); return add(g, geo, m); };
  // ---------- accessories: scopes, laser sight and the three stocks
  const gun1 = M(0x4b5258, 0.72, 0.38), gun2 = M(0x2c3136, 0.65, 0.45), edge = M(0x9aa2a9, 0.9, 0.3), lens = M(0x1d3f63, 0.9, 0.08, { emissive: 0x0a1c30 });
  const xcyl = (g, r1, r2, len, m, x, y = 0, z = 0) => { const o = add(g, new THREE.CylinderGeometry(r2, r1, len, 40), m, x, y, z); o.rotation.z = -Math.PI / 2; return o; }; // r1 left, r2 right
  const xring = (g, r, t, m, x, y = 0) => { add(g, new THREE.TorusGeometry(r, t, 10, 48), m, x, y, 0).rotation.y = Math.PI / 2; };
  const knob = (g, x, y, z, r, h, toViewer) => { const o = cyl(g, r, h, gun2, x, y, z, 24); if (toViewer) o.rotation.x = Math.PI / 2; for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; const rib = box(g, toViewer ? 0.03 : 0.035, toViewer ? 0.035 : h * 0.9, toViewer ? h * 0.9 : 0.03, edge, x + Math.cos(a) * r, toViewer ? y + Math.sin(a) * r : y, toViewer ? z : z + Math.sin(a) * r); if (toViewer) rib.rotation.z = a; else rib.rotation.y = -a; } };

  // compact combat optic: short body, wide front, mount on a rail
  B.scope = () => {
    const g = new THREE.Group();
    xcyl(g, 0.3, 0.3, 0.55, gun2, -1.15); xring(g, 0.31, 0.04, edge, -1.4); xcyl(g, 0.22, 0.22, 0.3, gun1, -0.75);
    extrude2(g, [[-0.62, -0.28], [0.45, -0.32], [0.62, -0.1], [0.62, 0.22], [-0.3, 0.34], [-0.62, 0.22]], 0.55, gun1);
    xcyl(g, 0.34, 0.46, 0.55, gun1, 0.85); xcyl(g, 0.46, 0.46, 0.35, gun2, 1.3); xring(g, 0.46, 0.045, edge, 1.47); const l = add(g, new THREE.CircleGeometry(0.38, 40), lens, 1.485, 0, 0); l.rotation.y = Math.PI / 2;
    knob(g, -0.05, 0.46, 0, 0.19, 0.24); knob(g, 0.2, 0.02, 0.34, 0.2, 0.14, true);
    box(g, 1.5, 0.2, 0.5, gun2, -0.05, -0.45); box(g, 1.9, 0.12, 0.34, edge, 0.0, -0.62);
    for (let i = 0; i < 8; i++) box(g, 0.1, 0.12, 0.36, gun2, -0.8 + i * 0.23, -0.72);
    xcyl(g, 0.035, 0.035, 1.5, edge, 0.55, -0.34, 0.26);
    g.userData.view = [0.3, -0.4, 0]; return g;
  };
  // long sniper scope with two mounting rings and a turret
  B.scope_hp = () => {
    const g = new THREE.Group();
    xcyl(g, 0.3, 0.3, 0.55, gun2, -2.05); xring(g, 0.31, 0.035, edge, -2.3); xcyl(g, 0.17, 0.27, 0.35, gun1, -1.62);
    xcyl(g, 0.17, 0.17, 2.1, gun1, -0.4); xcyl(g, 0.17, 0.4, 0.9, gun1, 1.1); xcyl(g, 0.4, 0.4, 0.55, gun2, 1.8); xring(g, 0.4, 0.035, edge, 2.07);
    const l = add(g, new THREE.CircleGeometry(0.34, 40), lens, 2.082, 0, 0); l.rotation.y = Math.PI / 2;
    xcyl(g, 0.23, 0.23, 0.36, gun2, -0.35); knob(g, -0.35, 0.34, 0, 0.16, 0.26); knob(g, -0.35, 0, 0.32, 0.15, 0.2, true);
    for (const x of [-1.05, 0.45]) { xring(g, 0.2, 0.06, edge, x); box(g, 0.2, 0.3, 0.2, gun2, x, -0.3); box(g, 0.42, 0.1, 0.32, edge, x, -0.47); }
    xring(g, 0.2, 0.03, edge, -1.4);
    g.userData.view = [0.32, -0.35, -0.06]; return g;
  };
  // thick thermal sight with its front cap flipped up
  B.scope_bio = () => {
    const g = new THREE.Group();
    xcyl(g, 0.52, 0.52, 0.7, gun1, -0.15); xcyl(g, 0.4, 0.4, 0.4, gun2, -0.65); xring(g, 0.41, 0.045, edge, -0.84);
    xcyl(g, 0.6, 0.6, 0.55, gun2, 0.45); xring(g, 0.6, 0.05, edge, 0.2); xring(g, 0.6, 0.05, edge, 0.72);
    const l = add(g, new THREE.CircleGeometry(0.5, 40), M(0x5a1512, 0.7, 0.15, { emissive: 0x2a0503 }), 0.735, 0, 0); l.rotation.y = Math.PI / 2;
    const cap = new THREE.Group(); xcyl(cap, 0.6, 0.6, 0.12, gun2, 0); xring(cap, 0.5, 0.04, edge, 0.07); cap.position.set(1.12, 0.82, 0); cap.rotation.z = 0.9; g.add(cap); box(g, 0.28, 0.14, 0.3, gun2, 0.84, 0.62);
    box(g, 0.5, 0.2, 0.4, gun2, -0.1, 0.56); knob(g, -0.1, 0.72, 0, 0.14, 0.16); knob(g, -0.15, 0.0, 0.55, 0.2, 0.14, true);
    box(g, 1.1, 0.28, 0.62, gun2, 0.0, -0.66); box(g, 1.4, 0.14, 0.44, edge, 0.05, -0.86);
    g.userData.view = [0.32, -0.48, 0]; return g;
  };
  // small laser module with a rail clamp and the lens in front
  B.laser = () => {
    const g = new THREE.Group();
    extrude2(g, [[-1.0, -0.3], [0.65, -0.34], [0.75, 0.26], [-0.75, 0.34], [-1.0, 0.12]], 0.8, gun1);
    box(g, 1.35, 0.16, 0.56, gun2, -0.2, 0.42); box(g, 1.35, 0.1, 0.18, edge, -0.2, 0.54, 0.22); box(g, 1.35, 0.1, 0.18, edge, -0.2, 0.54, -0.22);
    xcyl(g, 0.27, 0.27, 0.4, gun2, 0.9, -0.04); xring(g, 0.27, 0.04, edge, 1.1, -0.04); const l = add(g, new THREE.CircleGeometry(0.14, 30), M(0xd8281c, 0.2, 0.2, { emissive: 0xb01408 }), 1.12, -0.04, 0); l.rotation.y = Math.PI / 2;
    knob(g, -0.55, -0.02, 0.42, 0.13, 0.1, true); box(g, 0.5, 0.2, 0.04, gun2, 0.1, -0.04, 0.42); sph(g, 0.05, edge, 0.28, -0.04, 0.45);
    g.userData.view = [0.38, -0.6, 0]; return g;
  };
  // wooden holster stock of the broom-handle pistol: narrow neck on the left, broad butt on the right
  B.stock_red9 = () => {
    const g = new THREE.Group(); const w1 = M(0x7d4a26, 0.05, 0.5), w2 = M(0x5c3419, 0.05, 0.55);
    extrude2(g, [[-2.0, 0.18], [-1.3, 0.34], [1.2, 0.62], [1.95, 0.5], [2.05, -0.42], [1.3, -0.62], [-1.35, -0.24], [-2.0, -0.12]], 0.55, w1, 0.09);
    extrude2(g, [[-1.15, 0.12], [1.75, 0.3], [1.75, -0.3], [-1.15, -0.06]], 0.06, w2, 0.02).position.z = 0.34;
    box(g, 0.22, 0.46, 0.64, gun1, -2.02, 0.03); box(g, 0.14, 1.0, 0.62, gun2, 2.08, 0.04);
    sph(g, 0.09, edge, -1.55, 0.12, 0.36); sph(g, 0.08, brass, 1.55, 0.12, 0.38);
    g.userData.view = [0.3, -0.3, -0.12]; return g;
  };
  // flat polymer stock of the machine pistol: it widens towards the butt and has a hook for the grip
  B.stock_matilda = () => {
    const g = new THREE.Group(); const body = M(0x3b4248, 0.35, 0.5), dim = M(0x272c31, 0.3, 0.55);
    extrude2(g, [[-1.75, 0.46], [-0.95, 0.62], [-0.55, 0.28], [0.55, 0.2], [1.15, 0.3], [1.75, 0.18], [1.78, -0.22], [1.45, -0.38], [1.12, -0.2], [0.95, -0.52], [0.5, -0.62], [0.62, -0.28], [-0.6, -0.38], [-1.55, -0.55], [-1.85, -0.3]], 0.34, body, 0.07);
    extrude2(g, [[-1.62, 0.28], [-1.05, 0.36], [-0.72, 0.04], [-1.5, -0.3], [-1.68, -0.18]], 0.05, dim, 0.015).position.z = 0.23;
    box(g, 0.14, 0.95, 0.44, dim, -1.86, 0.06); box(g, 1.2, 0.06, 0.06, edge, 0.0, -0.06, 0.24);
    sph(g, 0.08, edge, -1.28, 0.2, 0.28); sph(g, 0.07, edge, 1.42, 0.0, 0.24);
    g.userData.view = [0.32, -0.35, 0.1]; return g;
  };
  // skeleton stock of the TMP: butt plate on the left, two struts and the connector on the right
  B.stock_tmp = () => {
    const g = new THREE.Group(); const body = M(0x3a4046, 0.5, 0.45);
    extrude2(g, [[-1.75, 0.95], [-1.3, 0.98], [-1.12, 0.6], [0.35, 0.38], [0.75, 0.05], [1.5, 0.02], [1.5, -0.38], [0.62, -0.4], [0.28, -0.05], [-0.85, 0.05], [-0.5, -0.42], [1.35, -0.72], [1.3, -1.02], [-0.75, -0.7], [-1.35, -0.12], [-1.75, -0.2]], 0.3, body, 0.06);
    box(g, 0.2, 1.3, 0.46, gun2, -1.74, 0.36); box(g, 0.55, 0.55, 0.42, gun2, 1.55, -0.18); box(g, 0.2, 0.2, 0.46, edge, 1.62, 0.16);
    sph(g, 0.09, edge, 1.42, -0.18, 0.24); sph(g, 0.07, edge, 1.72, -0.24, 0.24);
    g.userData.view = [0.28, -0.35, 0.05]; return g;
  };
  // ---------- treasures -------------------------------------------------------------------------------------------------
  const au = M(0xd9ac48, 0.9, 0.28, { emissive: 0x241700 }), auDim = M(0xa8822f, 0.85, 0.4, { emissive: 0x140d00 }), ag = M(0xc9cdd2, 0.9, 0.28);
  const enamel = M(0x2b47a0, 0.55, 0.2), teal = M(0x2c8f8a, 0.45, 0.25), pearl = M(0xe9e2d4, 0.25, 0.2, { emissive: 0x2a2620 }), ivory = M(0xe7dcc2, 0.05, 0.5);
  const rubyM = M(0xb81f3a, 0.4, 0.12, { emissive: 0x3a0610, flatShading: true }), amber = M(0xc7461a, 0.35, 0.12, { emissive: 0x4a1200 }), jade = M(0x2fa98c, 0.4, 0.15, { emissive: 0x07352a, flatShading: true });
  const rosy = M(0xd66a86, 0.4, 0.15, { emissive: 0x35101c, flatShading: true }), amethyst = M(0xa06fd0, 0.45, 0.12, { emissive: 0x2a1145, flatShading: true, transparent: true, opacity: 0.92 });
  const jewel = (g, r, m, x, y, z, sy = 1) => { const o = add(g, new THREE.OctahedronGeometry(r, 1), m, x, y, z); o.scale.set(1, sy, 0.75); return o; };
  const path3 = (pts, closed = false) => new THREE.CatmullRomCurve3(pts.map((q) => new THREE.Vector3(...q)), closed);
  const pipeTube = (g, pts, r, m, seg = 60, closed = false) => add(g, new THREE.TubeGeometry(path3(pts, closed), seg, r, 12, closed), m);
  const beads = (g, pts, n, r, m, closed = false) => { const c = path3(pts, closed); for (let i = 0; i < n; i++) sph(g, r, Array.isArray(m) ? m[i % m.length] : m, ...c.getPoint(i / (closed ? n : n - 1)).toArray()); };
  const ringOf = (n, R, f, y = 0) => { for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; f(Math.cos(a) * R, y, Math.sin(a) * R, a, i); } };
  const hoop = (g, R, r, m, y = 0) => { add(g, new THREE.TorusGeometry(R, r, 12, 80), m, 0, y, 0).rotation.x = Math.PI / 2; };
  const tilt = (g, x, y, z = 0) => { g.userData.view = [x, y, z]; return g; };
  const turned = (g, profile, m, seg = 48, x = 0, y = 0, z = 0) => add(g, lathe(profile, seg), m, x, y, z);
  const band = (g, R, h, m, y = 0, open = 0) => add(g, new THREE.CylinderGeometry(R, R, h, 80, 1, true, open / 2, Math.PI * 2 - open), m.clone ? Object.assign(m.clone(), { side: THREE.DoubleSide }) : m, 0, y, 0);

  // bangles: a band seen from above and in front
  // a solid flat ring lying down: radius, thickness, height, opening (centred on +z before turning)
  const flatRing = (g, R, t, h, m, open = 0, turn = 0) => { const w = new THREE.Group(); const o = add(w, new THREE.TorusGeometry(R, t, 16, 100, Math.PI * 2 - open), m); o.rotation.x = Math.PI / 2; o.rotation.z = Math.PI / 2 + open / 2; o.scale.z = h / (2 * t); w.rotation.y = turn; g.add(w); return w; };
  const onRing = (R, a, y = 0) => [Math.sin(a) * R, y, Math.cos(a) * R];
  const blue = M(0x3a63c8, 0.4, 0.2, { emissive: 0x0e1c4a });
  B.bangle_gold = () => { const g = new THREE.Group(); const open = 0.85; flatRing(g, 1.2, 0.09, 0.52, au, open); flatRing(g, 1.25, 0.07, 0.3, blue, open + 0.16);
    for (let i = 0; i < 15; i++) { const a = open / 2 + 0.28 + i / 14 * (Math.PI * 2 - open - 0.56); const [x, y, z] = onRing(1.33, a, i % 2 ? 0.05 : -0.05); sph(g, 0.07, ivory, x, y, z); sph(g, 0.03, au, ...onRing(1.39, a, y)); }
    for (const a of [open / 2, -open / 2]) { const e = box(g, 0.22, 0.6, 0.22, au, ...onRing(1.2, a)); e.rotation.y = a; } return tilt(g, 0.55, -0.45); };
  B.bangle_elegant = () => { const g = new THREE.Group(); flatRing(g, 1.2, 0.09, 0.56, au); flatRing(g, 1.25, 0.065, 0.24, blue);
    ringOf(12, 1.31, (x, y, z, a) => { if (z < 1.1) { const d = box(g, 0.09, 0.4, 0.09, au, x, y, z); d.rotation.y = -a; } });
    const medal = new THREE.Group(); add(medal, new THREE.CylinderGeometry(0.46, 0.46, 0.14, 40), au).rotation.x = Math.PI / 2; torus(medal, 0.37, 0.05, au, 0, 0, 0.09); sph(medal, 0.2, blue, 0, 0, 0.08, 1, 1, 0.5); ringOf(8, 0.28, (x, y) => sph(medal, 0.05, ivory, x, 0, 0.1)); for (let i = 0; i < 8; i++) sph(medal, 0.045, ivory, Math.cos(i / 8 * Math.PI * 2) * 0.28, Math.sin(i / 8 * Math.PI * 2) * 0.28, 0.1); medal.position.set(0, 0, 1.34); g.add(medal); return tilt(g, 0.45, -0.35); };
  B.bangle_pearl = () => { const g = new THREE.Group(); flatRing(g, 1.25, 0.11, 0.22, au, 1.25, Math.PI);
    for (let i = 0; i < 5; i++) sph(g, 0.23, pearl, ...onRing(1.29, -0.7 + i * 0.35, 0.03)); for (const a of [Math.PI - 0.625, Math.PI + 0.625]) sph(g, 0.17, au, ...onRing(1.25, a)); return tilt(g, 0.55, 0.15); };
  B.bangle_splendid = () => { const g = new THREE.Group(); ringOf(10, 1.18, (x, y, z, a, i) => { const seg = new THREE.Group(); box(seg, 0.66, 0.6, 0.12, au); if (i % 2) { box(seg, 0.54, 0.26, 0.16, blue); for (const d of [-0.2, 0.2]) box(seg, 0.54, 0.05, 0.17, ivory, 0, d, 0); } else { box(seg, 0.44, 0.74, 0.14, au); box(seg, 0.26, 0.5, 0.18, blue); sph(seg, 0.09, au, 0, 0, 0.1); } seg.position.set(x, 0, z); seg.rotation.y = -a + Math.PI / 2; g.add(seg); }); return tilt(g, 0.45, -0.25); };

  B.ring_ruby = () => { const g = new THREE.Group(); add(g, new THREE.TorusGeometry(1, 0.17, 20, 80), au); const seat = new THREE.Group(); add(seat, new THREE.CylinderGeometry(0.42, 0.3, 0.3, 32), au); sph(seat, 0.33, amber, 0, 0.17, 0, 1, 0.55, 1); add(seat, new THREE.TorusGeometry(0.37, 0.05, 10, 40), au, 0, 0.17, 0).rotation.x = Math.PI / 2; seat.position.set(0, -1.08, 0.12); seat.rotation.x = Math.PI * 0.72; g.add(seat);
    for (const m of [-1, 1]) for (let i = 0; i < 4; i++) { const a = -Math.PI / 2 + m * (0.38 + i * 0.16); sph(g, 0.05, auDim, Math.cos(a), Math.sin(a), 0.19); } return tilt(g, -0.55, -0.35, 0.25); };

  const pendant2 = (stoneM, cord) => () => { const g = new THREE.Group(); const pts = [[-0.05, -1.15, 0], [-0.95, -0.4, 0], [-1.15, 0.6, 0], [-0.55, 1.45, 0], [0.3, 1.5, 0], [0.75, 0.75, 0], [0.72, -0.2, 0], [0.12, -1.15, 0]];
    beads(g, pts, 34, 0.12, cord); const med = new THREE.Group(); sph(med, 0.42, au, 0, 0, 0, 1, 1.05, 0.3); sph(med, 0.28, stoneM, 0, 0, 0.12, 1, 1.1, 0.4); torus(med, 0.36, 0.05, au, 0, 0, 0.1); med.position.set(0.03, -1.58, 0); g.add(med); return tilt(g, 0.12, -0.2, -0.12); };
  B.pendant_pearl = pendant2(ivory, [pearl, pearl, M(0xd8a03c, 0.5, 0.25)]);
  B.pendant_dirty = pendant2(M(0x6d6248, 0.2, 0.7), [M(0xa59a82, 0.15, 0.65), M(0x8a8069, 0.15, 0.7), M(0x7a6330, 0.4, 0.6)]);
  B.pendant_illum = () => { const g = new THREE.Group(); sph(g, 0.82, auDim, 0, 0, 0, 1, 1.35, 0.3); sph(g, 0.66, amber, 0, 0, 0.14, 1, 1.38, 0.45); const f = add(g, new THREE.TorusGeometry(0.72, 0.08, 12, 60), au, 0, 0, 0.1); f.scale.set(1, 1.37, 1);
    ringOf(14, 1, (x, y, z, a) => sph(g, 0.07, au, Math.cos(a) * 0.74, Math.sin(a) * 1.01, 0.14)); sph(g, 0.17, au, 0, 1.15, 0); add(g, new THREE.TorusGeometry(0.24, 0.07, 10, 30), au, 0, 1.42, 0); pipeTube(g, [[0, -1.1, 0], [0.12, -1.35, 0], [-0.1, -1.55, 0], [0.04, -1.9, 0]], 0.06, au, 30); return tilt(g, 0.15, -0.3, 0.3); };
  B.necklace = () => { const g = new THREE.Group(); const arc = (x) => -0.62 * (1 - (x / 2.2) ** 2); const pts = [-2.2, -1.5, -0.75, 0, 0.75, 1.5, 2.2].map((x) => [x, arc(x), 0]);
    pipeTube(g, [[-2.2, 0, 0], [-1.6, 0.55, 0], [0, 0.75, 0], [1.6, 0.55, 0], [2.2, 0, 0]], 0.035, au);
    pipeTube(g, pts, 0.07, au); [-1.45, -0.72, 0, 0.72, 1.45].forEach((x, i) => { const y = arc(x) - 0.16; const m = new THREE.Group(); sph(m, 0.3, au, 0, 0, 0, 1, 1.15, 0.3); sph(m, 0.17, i % 2 ? rosy : amber, 0, 0, 0.1, 1, 1.2, 0.5); torus(m, 0.25, 0.04, au, 0, 0, 0.08); m.position.set(x, y, 0); g.add(m); box(g, 0.04, 0.3, 0.04, au, x, y - 0.45, 0); jewel(g, 0.13, i % 2 ? jade : amethyst, x, y - 0.66, 0, 1.4); });
    for (const x of [-1.08, -0.36, 0.36, 1.08, -1.85, 1.85]) { sph(g, 0.1, rosy, x, arc(x) - 0.12, 0.05); jewel(g, 0.08, jade, x, arc(x) - 0.34, 0, 1.4); } return tilt(g, 0.15, 0); };

  B.monocle = () => { const g = new THREE.Group(); add(g, new THREE.CylinderGeometry(0.95, 0.95, 0.12, 60), M(0x6f7690, 0.6, 0.18, { emissive: 0x15182a }), 0, -0.35, 0).rotation.x = Math.PI / 2; torus(g, 0.98, 0.11, au, 0, -0.35, 0); torus(g, 1.1, 0.035, ag, 0, -0.35, 0);
    for (let i = 0; i < 9; i++) sph(g, 0.09, ag, -0.55 + i * 0.14, 0.66 + Math.sin(i / 8 * Math.PI) * 0.18, 0.04); pipeTube(g, [[0.5, 0.65, 0], [0.9, 1.15, 0], [1.15, 1.35, 0], [0.95, 1.55, 0]], 0.09, au, 30);
    beads(g, [[0.9, 1.55, 0], [0, 1.45, 0], [-0.5, 1.1, 0], [-1.3, 1.25, 0], [-1.65, 0.75, 0], [-1.2, 0.45, 0]], 60, 0.045, au); return tilt(g, 0.2, -0.15, -0.1); };
  B.pocket_watch = () => { const g = new THREE.Group(); add(g, new THREE.CylinderGeometry(0.95, 0.95, 0.34, 60), au).rotation.x = Math.PI / 2; add(g, new THREE.CylinderGeometry(0.78, 0.78, 0.06, 60), ivory, 0, 0, 0.17).rotation.x = Math.PI / 2; torus(g, 0.84, 0.09, au, 0, 0, 0.18);
    for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; box(g, 0.04, i % 3 ? 0.1 : 0.17, 0.02, dark, Math.sin(a) * 0.64, Math.cos(a) * 0.64, 0.21).rotation.z = -a; } box(g, 0.05, 0.5, 0.02, black, -0.1, 0.2, 0.23).rotation.z = 0.45; box(g, 0.04, 0.4, 0.02, black, 0.17, 0.08, 0.235).rotation.z = -1.1; torus(g, 0.2, 0.018, dark, 0, -0.4, 0.215);
    cyl(g, 0.13, 0.22, au, 0, 1.1, 0); torus(g, 0.22, 0.05, au, 0, 1.36, 0);
    const lid = new THREE.Group(); add(lid, new THREE.CylinderGeometry(0.93, 0.93, 0.1, 60), au).rotation.x = Math.PI / 2; torus(lid, 0.72, 0.05, auDim, 0, 0, 0.06); lid.position.set(-0.95, -1.18, 0.3); lid.rotation.set(-0.75, 0.2, 0); g.add(lid);
    beads(g, [[0.28, 1.4, 0], [1.2, 1.25, 0], [1.35, 0.2, 0], [1.05, -0.7, 0], [1.55, -1.25, 0]], 44, 0.055, au); cyl(g, 0.045, 0.4, au, 1.57, -1.27, 0).rotation.z = 0.9; return tilt(g, 0.12, -0.28); };
  B.pipe = () => { const g = new THREE.Group(); const meer = M(0xb98a52, 0.05, 0.45), burn = M(0x3a2210, 0.1, 0.8);
    turned(g, [[0, -0.55], [0.4, -0.52], [0.55, -0.15], [0.52, 0.35], [0.56, 0.45], [0.4, 0.47], [0.36, 0.2], [0, 0.15]], meer, 40, -1.25, -0.4, 0); cyl(g, 0.37, 0.05, burn, -1.25, -0.06, 0, 32);
    sph(g, 0.16, meer, -1.65, -0.45, 0.35); sph(g, 0.07, burn, -1.7, -0.4, 0.5); sph(g, 0.07, burn, -1.52, -0.4, 0.5); sph(g, 0.09, meer, -1.62, -0.57, 0.5);
    pipeTube(g, [[-0.85, -0.65, 0], [-0.35, -0.55, 0], [0.1, -0.25, 0]], 0.17, meer, 30); pipeTube(g, [[0.05, -0.28, 0], [0.45, 0.05, 0]], 0.2, ag, 20);
    pipeTube(g, [[0.4, 0.02, 0], [1.0, 0.5, 0], [1.55, 0.8, 0], [2.0, 0.88, 0]], 0.085, M(0x4a4640, 0.5, 0.3), 40); sph(g, 0.1, black, 2.02, 0.88, 0); [0.55, 0.72].forEach((x, i) => sph(g, 0.15 - i * 0.02, ag, x, 0.13 + i * 0.14, 0, 0.5, 1, 1)); return tilt(g, 0.3, -0.25, 0.12); };
  B.lip_rouge = () => { const g = new THREE.Group(); const rouge = M(0x9c2c55, 0.05, 0.55);
    cyl(g, 0.95, 0.34, auDim, -0.35, -0.2, 0.2, 60); cyl(g, 0.8, 0.05, rouge, -0.35, 0.0, 0.2, 60); add(g, new THREE.TorusGeometry(0.87, 0.08, 12, 60), au, -0.35, 0.01, 0.2).rotation.x = Math.PI / 2;
    const lid = new THREE.Group(); cyl(lid, 0.95, 0.26, au, 0, 0, 0, 60); hoop(lid, 0.82, 0.045, auDim, 0.14); hoop(lid, 0.45, 0.035, auDim, 0.14); ringOf(4, 0.23, (x, y, z) => sph(lid, 0.13, amethyst, x, 0.15, z, 1, 0.45, 1)); ringOf(16, 0.64, (x, y, z) => sph(lid, 0.055, auDim, x, 0.13, z)); lid.position.set(0.75, 0.25, -0.5); lid.rotation.set(0.35, 0, -0.25); g.add(lid); return tilt(g, 0.72, -0.2); };

  B.chalice = () => { const g = new THREE.Group(); turned(g, [[0, -1.5], [0.82, -1.5], [0.84, -1.34], [0.56, -1.18], [0.32, -0.9], [0.26, -0.62], [0.44, -0.5], [0.28, -0.38], [0.22, -0.16], [0.62, 0], [0.72, 0.2], [0.68, 0.34], [0.62, 0.4], [0.66, 0.9], [0.74, 1.15], [0.64, 1.15], [0.55, 0.5], [0, 0.45]], au);
    hoop(g, 0.66, 0.07, au, 0.95); hoop(g, 0.74, 0.05, au, 1.15); hoop(g, 0.72, 0.09, au, 0.1); hoop(g, 0.8, 0.07, au, -1.4); ringOf(8, 0.67, (x, y, z, a, i) => sph(g, 0.09, i % 2 ? rubyM : jade, x, 0.95, z)); ringOf(10, 0.62, (x, y, z) => sph(g, 0.13, auDim, x, 0.16, z)); ringOf(12, 0.62, (x, y, z) => sph(g, 0.07, pearl, x, -1.28, z)); return tilt(g, 0.28, -0.2); };
  B.crown = () => { const g = new THREE.Group(); band(g, 1.15, 0.55, au); hoop(g, 1.16, 0.075, au, 0.28); hoop(g, 1.16, 0.085, au, -0.28);
    ringOf(8, 1.15, (x, y, z, a) => { const peak = new THREE.Group(); extrude2(peak, [[-0.3, 0], [-0.12, 0.2], [-0.2, 0.42], [0, 0.66], [0.2, 0.42], [0.12, 0.2], [0.3, 0]], 0.09, au, 0.02); sph(peak, 0.09, pearl, 0, 0.72, 0); jewel(peak, 0.12, rosy, 0, 0.3, 0.07, 1.2); peak.position.set(x, 0.3, z); peak.rotation.y = -a + Math.PI / 2; g.add(peak); });
    ringOf(16, 1.19, (x, y, z, a, i) => jewel(g, i % 2 ? 0.08 : 0.14, [rubyM, jade, amethyst, enamel][i % 4], x, 0, z)); return tilt(g, 0.3, -0.15); };
  B.headdress = () => { const g = new THREE.Group(); const silver = M(0xaeb4b8, 0.85, 0.38);
    const moon = new THREE.Shape(); moon.moveTo(-1.35, 0.75); moon.bezierCurveTo(-1.55, -0.9, 0.35, -1.55, 1.45, -0.05); moon.bezierCurveTo(0.55, -0.62, -0.75, -0.62, -0.75, 0.72); moon.closePath(); add(g, new THREE.ExtrudeGeometry(moon, { depth: 0.14, bevelEnabled: true, bevelSize: 0.05, bevelThickness: 0.05, bevelSegments: 2 }), silver, 0, 0, -0.07);
    sph(g, 0.66, ag, 0.15, 0.28, 0, 0.85, 1.05, 0.28); const big = add(g, new THREE.IcosahedronGeometry(0.52, 1), jade, 0.15, 0.28, 0.12); big.scale.set(0.82, 1.05, 0.55);
    ringOf(12, 1, (x, y, z, a) => sph(g, 0.065, jade, 0.15 + Math.cos(a) * 0.56, 0.28 + Math.sin(a) * 0.68, 0.14)); for (let i = 0; i < 7; i++) torus(g, 0.12, 0.022, ag, -0.95 + i * 0.28, -0.55 - Math.sin(i / 6 * Math.PI) * 0.22, 0.12);
    for (const [x, y, l] of [[-1.2, 0.2, 0.9], [0.75, -0.75, 0.65], [1.35, -0.15, 0.7]]) { beads(g, [[x, y, 0.05], [x + 0.06, y - l, 0.05]], 8, 0.04, ag); sph(g, 0.13, ag, x + 0.06, y - l - 0.1, 0.05, 1, 1, 0.35); } torus(g, 0.16, 0.035, ag, -1.15, 1.0, 0); return tilt(g, 0.15, -0.25, 0.12); };
  B.mask = () => { const g = new THREE.Group(); const face = new THREE.Shape(); face.moveTo(-1.35, 0.35); face.bezierCurveTo(-0.9, 0.75, -0.3, 0.55, 0, 0.6); face.bezierCurveTo(0.3, 0.55, 0.9, 0.75, 1.35, 0.35); face.bezierCurveTo(1.3, -0.35, 0.8, -0.72, 0.35, -0.55); face.bezierCurveTo(0.18, -0.3, -0.18, -0.3, -0.35, -0.55); face.bezierCurveTo(-0.8, -0.72, -1.3, -0.35, -1.35, 0.35);
    for (const m of [-1, 1]) { const eye = new THREE.Path(); eye.absellipse(m * 0.58, -0.03, 0.34, 0.19, 0, Math.PI * 2, false, m * 0.18); face.holes.push(eye); }
    const geo = new THREE.ExtrudeGeometry(face, { depth: 0.12, bevelEnabled: true, bevelSize: 0.05, bevelThickness: 0.05, bevelSegments: 3, curveSegments: 40 }); const pos = geo.attributes.position; for (let i = 0; i < pos.count; i++) pos.setZ(i, pos.getZ(i) - pos.getX(i) ** 2 * 0.28); geo.computeVertexNormals(); add(g, geo, au);
    for (const m of [-1, 1]) { const rim = add(g, new THREE.TorusGeometry(0.34, 0.04, 8, 40), auDim, m * 0.58, -0.03, 0.04); rim.scale.set(1, 0.57, 1); rim.rotation.z = m * 0.18; }
    for (let i = -3; i <= 3; i++) { const a = i * 0.26, len = 0.75 - Math.abs(i) * 0.09; const spike = add(g, new THREE.ConeGeometry(0.09, len, 8), au, Math.sin(a) * 1.0, 0.6 + Math.cos(a) * 0.12 + len / 2 - Math.abs(i) * 0.04, -((Math.sin(a)) ** 2) * 0.28); spike.rotation.z = -a; sph(g, 0.065, pearl, Math.sin(a) * (1 + len * 0.55), 0.6 + Math.cos(a) * 0.12 + len - Math.abs(i) * 0.04, -(Math.sin(a) ** 2) * 0.3); }
    [-0.55, 0, 0.55].forEach((x) => { sph(g, 0.17, au, x, 0.62, 0.1, 1, 1.2, 0.4); jewel(g, 0.1, x ? amethyst : jade, x, 0.62, 0.17, 1.2); }); beads(g, [[-1.2, 0.4, -0.2], [0, 0.46, 0.18], [1.2, 0.4, -0.2]], 22, 0.045, pearl); return tilt(g, 0.12, -0.28); };
  B.perfume = () => { const g = new THREE.Group(); const glass = new THREE.MeshStandardMaterial({ color: 0xcfd8d4, metalness: 0.4, roughness: 0.08, transparent: true, opacity: 0.55 });
    const ribbed = new THREE.SphereGeometry(0.72, 64, 40); const pos = ribbed.attributes.position; for (let i = 0; i < pos.count; i++) { const a = Math.atan2(pos.getZ(i), pos.getX(i)), k = 1 + 0.06 * Math.sin(a * 16); pos.setXYZ(i, pos.getX(i) * k, pos.getY(i) * 0.82, pos.getZ(i) * k); } ribbed.computeVertexNormals(); add(g, ribbed, glass, 0.55, -0.45, 0);
    cyl(g, 0.4, 0.12, au, 0.55, -1.04, 0, 40); sph(g, 0.45, M(0x9a8a58, 0.5, 0.3), 0.55, -0.62, 0, 1, 0.6, 1); cyl(g, 0.17, 0.3, au, 0.55, 0.28, 0); hoop(g, 0.01, 0.001, au); cyl(g, 0.26, 0.1, au, 0.55, 0.46, 0); sph(g, 0.14, au, 0.55, 0.68, 0, 1, 1.3, 1);
    for (let i = 0; i < 6; i++) sph(g, 0.1, au, 0.55 + Math.cos(i) * 0.3, 0.14 + Math.sin(i * 2) * 0.06, Math.sin(i) * 0.3);
    pipeTube(g, [[0.42, 0.45, 0], [-0.05, 0.9, 0], [-0.65, 0.75, 0], [-0.95, 0.05, 0], [-1.0, -0.5, 0]], 0.05, au); const bulb = M(0xd9a98e, 0.15, 0.45); sph(g, 0.34, bulb, -0.98, -0.82, 0, 0.85, 1.2, 0.85); add(g, new THREE.ConeGeometry(0.2, 0.42, 20), au, -0.9, -1.38, 0); return tilt(g, 0.25, -0.2); };

  B.camera = () => { const g = new THREE.Group(); const wood = M(0x5a3418, 0.15, 0.5), bellows = M(0x25221f, 0.05, 0.8), brassy = M(0xb98c3e, 0.85, 0.35);
    box(g, 0.45, 1.5, 1.35, wood, -1.0, 0.1, 0); box(g, 0.5, 1.55, 0.08, brassy, -1.0, 0.1, 0.7); for (let i = 0; i < 7; i++) { const k = 1 - i * 0.055; box(g, 0.2, 1.3 * k, 1.2 * k, i % 2 ? bellows : M(0x37322d, 0.05, 0.75), -0.7 + i * 0.2, 0.08, 0); }
    box(g, 0.22, 1.1, 1.0, wood, 0.78, 0.05, 0); const lens = new THREE.Group(); add(lens, new THREE.CylinderGeometry(0.3, 0.3, 0.42, 36), brassy); add(lens, new THREE.CylinderGeometry(0.34, 0.34, 0.08, 36), brassy, 0, 0.18, 0); add(lens, new THREE.CylinderGeometry(0.22, 0.22, 0.46, 36), M(0x141a24, 0.9, 0.1)); lens.rotation.z = -Math.PI / 2; lens.position.set(1.05, 0.05, 0); g.add(lens);
    box(g, 2.5, 0.14, 1.45, wood, 0.05, -0.78, 0); box(g, 2.3, 0.05, 0.1, brassy, 0.1, -0.69, 0.62); box(g, 2.3, 0.05, 0.1, brassy, 0.1, -0.69, -0.62); for (const z of [0.75, -0.75]) sph(g, 0.13, brassy, 0.65, -0.78, z); sph(g, 0.09, brassy, -1.0, 0.95, 0.45); box(g, 0.3, 0.16, 0.5, brassy, -1.0, 0.92, 0); return tilt(g, 0.28, -0.85); };
  B.butterfly_lamp = () => { const g = new THREE.Group(); const glow = M(0xf1e6c0, 0.1, 0.35, { emissive: 0x6a5420 });
    add(g, new THREE.CylinderGeometry(0.72, 0.72, 1.75, 6), glow); ringOf(6, 0.73, (x, y, z) => box(g, 0.09, 1.8, 0.09, au, x, 0, z));
    for (const y of [-0.9, 0.9]) { add(g, new THREE.CylinderGeometry(0.82, 0.82, 0.12, 6), au, 0, y, 0); }
    ringOf(6, 0.64, (x, y, z, a) => { const wing = new THREE.Group(); sph(wing, 0.12, jade, -0.1, 0.06, 0, 1, 1.3, 0.2); sph(wing, 0.12, rosy, 0.1, 0.06, 0, 1, 1.3, 0.2); box(wing, 0.04, 0.3, 0.04, auDim, 0, 0, 0.02); torus(wing, 0.22, 0.02, au, 0, -0.45, 0); torus(wing, 0.16, 0.02, au, 0, 0.5, 0); wing.position.set(x, 0, z); wing.rotation.y = -a + Math.PI / 2; g.add(wing); });
    add(g, new THREE.ConeGeometry(0.86, 0.55, 6), au, 0, 1.22, 0); sph(g, 0.17, au, 0, 1.62, 0); add(g, new THREE.ConeGeometry(0.07, 0.3, 8), au, 0, 1.88, 0);
    add(g, new THREE.CylinderGeometry(0.62, 0.85, 0.2, 6), au, 0, -1.05, 0); ringOf(6, 0.76, (x, y, z) => { sph(g, 0.15, au, x, -1.25, z, 0.8, 1.3, 0.8); }); return tilt(g, 0.2, 0.26); };
  B.chessboard = () => { const g = new THREE.Group(); const light = M(0xe6dcc0, 0.2, 0.25), darkSq = M(0xa8904a, 0.45, 0.3), rimm = M(0x7a3a24, 0.2, 0.4);
    box(g, 3.0, 0.2, 3.0, rimm, 0, -0.12, 0); box(g, 3.04, 0.07, 3.04, au, 0, -0.03, 0); for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) box(g, 0.34, 0.06, 0.34, (i + j) % 2 ? darkSq : light, -1.19 + i * 0.34, 0.03, -1.19 + j * 0.34);
    for (const x of [-1.4, 1.4]) for (const z of [-1.4, 1.4]) sph(g, 0.14, au, x, -0.3, z);
    const piece = (m, x, z, h) => { turned(g, [[0, 0], [0.17, 0], [0.18, 0.07], [0.08, 0.13], [0.06, h * 0.6], [0.11, h * 0.66], [0.07, h * 0.75], [0.09, h * 0.9], [0, h]], m, 24, x, 0.05, z); };
    piece(M(0x3a3226, 0.7, 0.35), -0.5, -0.85, 0.85); piece(M(0x23262a, 0.6, 0.4), 0.52, 0.18, 0.65); return tilt(g, 0.62, -0.62); };
  const crystals = (g, m) => { const shard = (x, y, rz, rx, len, r) => { const c = new THREE.Group(); add(c, new THREE.CylinderGeometry(r * 0.85, r, len, 6), m, 0, len / 2, 0); add(c, new THREE.ConeGeometry(r * 0.85, r * 1.9, 6), m, 0, len + r * 0.95, 0); c.position.set(x, y, 0); c.rotation.set(rx, 0, rz); g.add(c); };
    shard(0, -0.9, 0.05, 0, 1.7, 0.32); shard(-0.2, -0.95, 0.62, 0.2, 1.15, 0.24); shard(0.25, -0.95, -0.55, 0.1, 1.25, 0.26); shard(-0.35, -1.0, 1.15, -0.1, 0.75, 0.18); shard(0.4, -1.0, -1.2, 0.25, 0.7, 0.17); shard(0.05, -1.0, 0.25, 0.75, 0.6, 0.2); shard(-0.1, -1.0, -0.25, 0.65, 0.55, 0.17); sph(g, 0.5, m, 0, -1.02, 0, 1.2, 0.5, 1); };
  B.ore = () => { const g = new THREE.Group(); crystals(g, amethyst); return tilt(g, 0.2, -0.3); };
  B.gem_velvet = () => { const g = new THREE.Group(); crystals(g, M(0x6b6fd8, 0.45, 0.12, { emissive: 0x151a55, flatShading: true, transparent: true, opacity: 0.92 })); return tilt(g, 0.2, 0.4); };
  B.idol = () => { const g = new THREE.Group(); const gold = M(0xc9952f, 0.92, 0.25, { emissive: 0x1e1200 });
    turned(g, [[0, -1.6], [0.55, -1.58], [0.5, -1.2], [0.36, -0.6], [0.44, -0.05], [0.3, 0.55], [0.17, 0.95], [0, 1.0]], gold);
    sph(g, 0.34, gold, -0.12, 1.12, 0.02, 1, 0.92, 0.9); const beak = add(g, new THREE.ConeGeometry(0.17, 0.62, 12), gold, -0.52, 1.02, 0.05); beak.rotation.z = 1.9; sph(g, 0.06, black, -0.24, 1.2, 0.28);
    for (let i = 0; i < 6; i++) { const y = 1.35 - i * 0.42; const x = 0.2 + Math.sin(i * 0.9) * 0.18 + 0.12; pipeTube(g, [[0.12, y - 0.12, 0], [x + 0.2, y + 0.05, 0], [x + 0.42, y + 0.28 - i * 0.01, 0]], 0.06, gold, 20); torus(g, 0.11, 0.045, gold, x + 0.46, y + 0.36, 0); }
    pipeTube(g, [[-0.3, 0.15, 0.3], [-0.55, -0.1, 0.4], [-0.4, -0.45, 0.35]], 0.09, gold, 20); return tilt(g, 0.12, -0.2); };

  const statueBase = (g, m, y = -1.55) => { turned(g, [[0, y - 0.18], [0.72, y - 0.18], [0.74, y - 0.02], [0.58, y + 0.06], [0.62, y + 0.14], [0, y + 0.16]], m); };
  B.lynx = () => { const g = new THREE.Group(); const body = M(0x4d5a36, 0.65, 0.28), gold = au; statueBase(g, gold);
    sph(g, 0.52, body, 0.12, -0.9, 0, 1, 1.0, 0.85); turned(g, [[0, -1.3], [0.3, -1.25], [0.36, -0.6], [0.3, 0.0], [0.18, 0.5], [0, 0.55]], body, 32, -0.12, 0, 0.05);
    for (const z of [-0.16, 0.24]) { pipeTube(g, [[-0.22, -0.2, z], [-0.42, -0.8, z], [-0.46, -1.38, z]], 0.11, body, 20); sph(g, 0.14, body, -0.52, -1.38, z, 1.3, 0.6, 1); }
    sph(g, 0.33, body, -0.2, 0.82, 0.05, 1, 0.92, 0.95); sph(g, 0.15, body, -0.45, 0.72, 0.1, 1.2, 0.8, 0.9); for (const [x, z] of [[-0.38, 0.25], [-0.02, -0.1]]) { add(g, new THREE.ConeGeometry(0.13, 0.5, 8), body, x, 1.22, z).rotation.z = x < -0.2 ? 0.22 : -0.22; }
    for (const z of [0.3]) sph(g, 0.05, M(0xf3cf4a, 0.5, 0.2, { emissive: 0x5a4200 }), -0.4, 0.88, z); add(g, new THREE.TorusGeometry(0.27, 0.06, 10, 40), gold, -0.14, 0.42, 0.05).rotation.x = Math.PI / 2; ringOf(10, 0.3, (x, y, z) => sph(g, 0.06, gold, -0.14 + x, 0.3, 0.05 + z)); pipeTube(g, [[0.55, -1.25, 0], [0.7, -1.38, 0.4], [0.1, -1.4, 0.55]], 0.09, body, 24); return tilt(g, 0.15, 0.35); };
  B.justitia = () => { const g = new THREE.Group(); const robe = M(0x2f6f8e, 0.55, 0.3), gold = au; statueBase(g, gold);
    turned(g, [[0, -1.4], [0.55, -1.38], [0.38, -0.8], [0.22, -0.15], [0.3, 0.2], [0.24, 0.5], [0.12, 0.65], [0, 0.68]], robe, 24); sph(g, 0.27, gold, 0, 0.28, 0.02, 1, 1.2, 0.75); pipeTube(g, [[0.25, 0.4, 0.1], [0.05, -0.4, 0.32], [-0.25, -1.3, 0.35]], 0.07, gold, 20);
    sph(g, 0.18, gold, 0, 0.88, 0); box(g, 0.36, 0.07, 0.34, ivory, 0, 0.91, 0.02); sph(g, 0.14, auDim, 0.04, 1.05, -0.05);
    pipeTube(g, [[0.18, 0.5, 0], [0.55, 0.75, 0], [0.68, 1.2, 0.05]], 0.065, gold, 20); box(g, 0.85, 0.045, 0.045, gold, 0.68, 1.38, 0.05); cyl(g, 0.025, 0.3, gold, 0.68, 1.28, 0.05);
    for (const x of [0.28, 1.08]) { for (const d of [-0.12, 0.12]) { const c = cyl(g, 0.008, 0.5, gold, x + d / 2, 1.14, 0.05); c.rotation.z = d * 1.9; } sph(g, 0.16, gold, x, 0.88, 0.05, 1, 0.3, 1); }
    pipeTube(g, [[-0.18, 0.5, 0], [-0.5, 0.1, 0.1], [-0.6, -0.3, 0.15]], 0.065, gold, 20); box(g, 0.34, 0.06, 0.08, gold, -0.6, -0.38, 0.15); box(g, 0.09, 1.1, 0.035, ag, -0.62, -0.95, 0.15); return tilt(g, 0.1, -0.15); };
  B.eye = () => { const g = new THREE.Group(); const skin = canvasTex(1024, 512, (x) => {
      x.fillStyle = '#e9ddd8'; x.fillRect(0, 0, 1024, 512); let r = 3; const rnd = () => (r = (r * 16807) % 2147483647) / 2147483647;
      x.strokeStyle = 'rgba(170,50,50,.55)'; x.lineWidth = 2; for (let i = 0; i < 60; i++) { let px = rnd() * 1024, py = rnd() * 512; x.beginPath(); x.moveTo(px, py); for (let k = 0; k < 6; k++) { px += (256 - px) * 0.08 + (rnd() - 0.5) * 30; py += (256 - py) * 0.08 + (rnd() - 0.5) * 30; x.lineTo(px, py); } x.stroke(); }
      x.fillStyle = '#9c4a52'; x.beginPath(); x.arc(256, 256, 72, 0, 7); x.fill(); x.strokeStyle = '#c98a86'; for (let i = 0; i < 90; i++) { const a = i / 90 * 7; x.beginPath(); x.moveTo(256 + Math.cos(a) * 30, 256 + Math.sin(a) * 30); x.lineTo(256 + Math.cos(a) * 68, 256 + Math.sin(a) * 68); x.stroke(); }
      x.fillStyle = '#1a0c0e'; x.beginPath(); x.arc(256, 256, 30, 0, 7); x.fill();
    });
    add(g, new THREE.SphereGeometry(1, 64, 48), new THREE.MeshStandardMaterial({ map: skin, roughness: 0.15, metalness: 0.05 })); return tilt(g, 0.08, -0.18); }; // u = 0.25 of a sphere faces the viewer
  B.mirror = () => { const g = new THREE.Group(); add(g, new THREE.CylinderGeometry(0.88, 0.88, 0.1, 60), M(0xa9bccb, 0.35, 0.08, { emissive: 0x34434f })).rotation.x = Math.PI / 2; torus(g, 0.92, 0.07, au, 0, 0, 0.06); torus(g, 1.14, 0.14, au, 0, 0, 0);
    for (let i = 0; i < 28; i++) { const a = i / 28 * Math.PI * 2; sph(g, 0.1, pearl, Math.cos(a) * 1.09, Math.sin(a) * 1.09, 0.12); }
    for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + Math.PI / 4; const x = Math.cos(a) * 1.24, y = Math.sin(a) * 1.24; sph(g, 0.2, au, x, y, 0.05, 1, 1, 0.5); box(g, 0.24, 0.24, 0.12, rosy, x, y, 0.17).rotation.z = a; for (const d of [-0.22, 0.22]) torus(g, 0.12, 0.035, au, Math.cos(a + d) * 1.3, Math.sin(a + d) * 1.3, 0); }
    for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2; jewel(g, 0.15, ag, Math.cos(a) * 1.12, Math.sin(a) * 1.12, 0.2); } return tilt(g, 0.22, -0.2); };
  B.staff = () => { const g = new THREE.Group(); cyl(g, 0.085, 3.4, au, 0, -0.5, 0, 20); sph(g, 0.15, au, 0, -2.25, 0); for (const y of [-1.4, 0.2, 1.05]) sph(g, 0.15, au, 0, y, 0, 1, 0.6, 1);
    turned(g, [[0, 1.1], [0.14, 1.15], [0.3, 1.45], [0.22, 1.5], [0, 1.5]], au); sph(g, 0.24, rosy, 0, 1.7, 0); for (let i = 0; i < 4; i++) { const m = new THREE.Group(); pipeTube(m, [[0.2, 1.42, 0], [0.45, 1.68, 0], [0.33, 1.98, 0], [0.05, 2.04, 0]], 0.045, au, 24); m.rotation.y = i * Math.PI / 2 + 0.4; g.add(m); } sph(g, 0.1, au, 0, 2.08, 0); sph(g, 0.065, rubyM, 0, 2.2, 0); return tilt(g, 0.15, -0.2, -0.65); };
  B.compass = () => { const g = new THREE.Group(); const wood = M(0x7a4a22, 0.2, 0.45);
    box(g, 2.0, 0.75, 1.7, wood, 0, -0.5, 0.2); box(g, 2.06, 0.08, 1.76, auDim, 0, -0.13, 0.2); for (const x of [-0.98, 0.98]) for (const z of [-0.63, 1.03]) box(g, 0.14, 0.78, 0.14, auDim, x, -0.5, z);
    cyl(g, 0.68, 0.06, ivory, 0, -0.07, 0.25, 60); add(g, new THREE.TorusGeometry(0.7, 0.09, 12, 60), au, 0, -0.04, 0.25).rotation.x = Math.PI / 2; box(g, 0.08, 0.04, 0.5, rubyM, 0.1, 0.0, 0.05).rotation.y = -0.5; box(g, 0.08, 0.04, 0.5, dark, -0.1, 0.0, 0.42).rotation.y = -0.5; sph(g, 0.07, au, 0, 0.02, 0.25);
    const lid = new THREE.Group(); box(lid, 2.0, 1.6, 0.18, wood, 0, 0.8, 0); box(lid, 1.7, 1.3, 0.04, auDim, 0, 0.8, 0.1); torus(lid, 0.45, 0.035, au, 0, 0.8, 0.14); torus(lid, 0.28, 0.025, au, 0, 0.8, 0.14); lid.position.set(0, -0.12, -0.68); lid.rotation.x = -0.18; g.add(lid); box(g, 0.34, 0.26, 0.06, au, 0, -0.42, 1.07); return tilt(g, 0.48, -0.5); };
  B.hourglass = () => { const g = new THREE.Group(); const red = M(0x8e2c1c, 0.3, 0.35), glass = new THREE.MeshStandardMaterial({ color: 0xdde8ea, metalness: 0.2, roughness: 0.05, transparent: true, opacity: 0.4, depthWrite: false }), sand = M(0xd9c690, 0, 0.85);
    turned(g, [[0, -0.98], [0.58, -0.9], [0.52, -0.55], [0.08, 0], [0.52, 0.55], [0.58, 0.9], [0, 0.98]], glass); turned(g, [[0, -0.96], [0.5, -0.9], [0.3, -0.62], [0, -0.5]], sand); turned(g, [[0, 0.04], [0.07, 0.04], [0.28, 0.35], [0, 0.36]], sand);
    for (const m of [-1, 1]) { cyl(g, 1.05, 0.2, red, 0, m * 1.15, 0, 48); hoop(g, 1.05, 0.07, au, m * 1.27); hoop(g, 1.05, 0.06, au, m * 1.04); }
    ringOf(4, 0.85, (x, y, z) => { cyl(g, 0.085, 2.1, red, x, 0, z, 14); for (const yy of [-0.8, -0.25, 0.25, 0.8]) sph(g, 0.14, au, x, yy, z, 1, 0.65, 1); }); return tilt(g, 0.28, 0.35, 0.2); };
  B.clock = () => { const g = new THREE.Group(); const turq = M(0x2f93a0, 0.45, 0.25);
    box(g, 2.3, 0.22, 0.9, au, 0, -1.35, 0); box(g, 2.05, 0.4, 0.75, turq, 0, -1.04, 0); box(g, 2.2, 0.12, 0.85, au, 0, -0.78, 0); for (const x of [-0.95, 0.95]) for (const z of [-0.3, 0.3]) sph(g, 0.17, au, x, -1.52, z);
    box(g, 1.05, 1.5, 0.6, turq, 0, 0.0, 0); box(g, 1.2, 0.14, 0.7, au, 0, 0.78, 0); for (const x of [-0.56, 0.56]) cyl(g, 0.1, 1.55, au, x, 0, 0.28);
    add(g, new THREE.CylinderGeometry(0.46, 0.46, 0.14, 48), ivory, 0, 0.16, 0.32).rotation.x = Math.PI / 2; torus(g, 0.49, 0.09, au, 0, 0.16, 0.38); for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; box(g, 0.03, 0.09, 0.02, dark, Math.sin(a) * 0.35, 0.16 + Math.cos(a) * 0.35, 0.41).rotation.z = -a; } box(g, 0.035, 0.3, 0.02, black, 0, 0.28, 0.43); box(g, 0.03, 0.22, 0.02, black, 0.09, 0.19, 0.435).rotation.z = -1.2;
    for (const m of [-1, 1]) { sph(g, 0.16, ivory, m * 0.86, -0.12, 0.1); turned(g, [[0, -0.7], [0.22, -0.68], [0.12, -0.35], [0.15, -0.25], [0, -0.22]], ivory, 20, m * 0.86, 0, 0.1); sph(g, 0.14, au, m * 0.86, -0.72, 0.1, 1.3, 0.7, 1); }
    sph(g, 0.38, au, 0, 0.95, 0, 1.3, 0.65, 0.9); turned(g, [[0, 1.1], [0.2, 1.15], [0.26, 1.4], [0.1, 1.55], [0.16, 1.62], [0, 1.72]], turq, 24); sph(g, 0.09, au, 0, 1.8, 0); return tilt(g, 0.12, -0.22); };
  B.flagon = () => { const g = new THREE.Group(); const blue = M(0x24486a, 0.55, 0.22);
    turned(g, [[0, -1.7], [0.55, -1.68], [0.5, -1.52], [0.2, -1.35], [0.18, -1.15], [0.62, -0.9], [0.8, -0.45], [0.72, 0.0], [0.45, 0.28], [0.2, 0.55], [0.17, 1.05], [0.3, 1.35], [0.36, 1.48], [0, 1.45]], ag);
    turned(g, [[0.63, -0.89], [0.815, -0.45], [0.735, 0.0]], blue); for (const [y, r] of [[-0.9, 0.64], [0.02, 0.73], [-1.55, 0.5], [0.55, 0.22], [1.05, 0.19]]) hoop(g, r, 0.055, au, y);
    sph(g, 0.3, au, 0, -0.45, 0.72, 1, 1.25, 0.35); sph(g, 0.17, ivory, 0, -0.45, 0.81, 1, 1.25, 0.35); pipeTube(g, [[0.2, 1.25, 0], [0.85, 1.38, 0], [1.0, 0.7, 0], [0.78, 0.15, 0], [0.68, -0.15, 0]], 0.075, au, 40); torus(g, 0.16, 0.035, au, 0.95, 1.02, 0);
    pipeTube(g, [[-0.22, 1.36, 0], [-0.5, 1.55, 0], [-0.68, 1.5, 0]], 0.1, ag, 16); sph(g, 0.13, au, 0, 1.6, 0); return tilt(g, 0.18, -0.15); };
  const lumpy = (g, len, h, d, seed) => { let r = seed; const rnd = () => (r = (r * 16807) % 2147483647) / 2147483647; const geo = new THREE.BoxGeometry(len, h, d, 40, 8, 10); const pos = geo.attributes.position; const v = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) { v.fromBufferAttribute(pos, i); const end = Math.max(0, Math.abs(v.x) / (len / 2) - 0.8) / 0.2; const k = 1 - 0.45 * end * end; const n = 1 + 0.045 * Math.sin(v.x * 11 + seed) * Math.sin(v.z * 13 + v.y * 9) + 0.022 * Math.sin(v.x * 27 - v.y * 15); pos.setXYZ(i, v.x * (1 + 0.02 * Math.sin(v.y * 8)), v.y * k * n * (v.y > 0 ? 1 - 0.25 * (v.z / (d / 2)) ** 2 : 1), v.z * k * n); }
    geo.computeVertexNormals(); return add(g, geo, M(0xd9a43a, 0.95, 0.3, { emissive: 0x2a1a00 })); };
  B.gold_bar = () => { const g = new THREE.Group(); lumpy(g, 2.5, 0.5, 0.95, 5); return tilt(g, 0.7, -0.3, 0.32); };
  B.bar_l = () => { const g = new THREE.Group(); lumpy(g, 3.8, 0.38, 0.58, 9); return tilt(g, 0.65, -0.25, 0.42); };
  B.ingot = () => { const g = new THREE.Group(); const gold = M(0xcfa550, 0.85, 0.36, { emissive: 0x241a04 });
    const sh = new THREE.Shape(); [[-1.45, -0.28], [-1.05, -0.75], [0.95, -0.72], [1.42, -0.2], [1.3, 0.45], [0.8, 0.78], [-1.05, 0.72], [-1.45, 0.2]].forEach(([x, y], i) => (i ? sh.lineTo(x, y) : sh.moveTo(x, y))); const geo = new THREE.ExtrudeGeometry(sh, { depth: 0.52, bevelEnabled: true, bevelSize: 0.12, bevelThickness: 0.14, bevelSegments: 2 }); add(g, geo, gold);
    for (let i = 0; i < 4; i++) for (let j = 0; j < 5 - (i % 2); j++) box(g, 0.1 + ((i * 3 + j) % 3) * 0.07, 0.06, 0.03, auDim, -0.8 + j * 0.38 + (i % 2) * 0.15, -0.4 + i * 0.27, 0.68).rotation.z = ((i + j) % 2) * 0.35; return tilt(g, -0.72, -0.2, 0.35); };

  // ---------- red herb: a tied bunch of stems full of small pink flowers
  B.herb_red = () => { const g = new THREE.Group(); let r = 11; const rnd = () => (r = (r * 16807) % 2147483647) / 2147483647;
    const pinks = [0xd9748f, 0xe89ab0, 0xc65a7c, 0xf0b6c6].map((c) => M(c, 0, 0.7, { emissive: new THREE.Color(c).multiplyScalar(0.16), side: THREE.DoubleSide })), stem = M(0x8d9a5a, 0, 0.85);
    const petal = new THREE.Shape(); petal.moveTo(0, 0); petal.quadraticCurveTo(0.13, 0.1, 0, 0.27); petal.quadraticCurveTo(-0.13, 0.1, 0, 0); const geo = new THREE.ShapeGeometry(petal);
    for (let k = 0; k < 7; k++) { const spread = (k - 3) * 0.27 + (rnd() - 0.5) * 0.1; const top = [Math.sin(spread) * 1.9, 0.35 + Math.cos(spread) * (1.35 + rnd() * 0.45), (rnd() - 0.5) * 0.7]; const c = path3([[0, -0.9, 0], [Math.sin(spread) * 0.55, 0.05, 0], top]); add(g, new THREE.TubeGeometry(c, 24, 0.025, 6, false), stem);
      for (let i = 0; i < 46; i++) { const t = 0.42 + rnd() * 0.58; const at = c.getPoint(t); const p = new THREE.Mesh(geo, pinks[Math.floor(rnd() * pinks.length)]); p.position.set(at.x + (rnd() - 0.5) * 0.2, at.y + (rnd() - 0.5) * 0.12, at.z + (rnd() - 0.5) * 0.22); p.rotation.set((rnd() - 0.5) * 1.6, (rnd() - 0.5) * 1.6, (rnd() - 0.5) * 2.6); p.scale.setScalar(0.7 + rnd() * 0.5); g.add(p); } }
    for (let k = 0; k < 6; k++) pipeTube(g, [[0, -0.9, 0], [(k - 2.5) * 0.09, -1.35, (rnd() - 0.5) * 0.2], [(k - 2.5) * 0.2 + (rnd() - 0.5) * 0.1, -1.75, 0]], 0.025, stem, 16);
    torus(g, 0.1, 0.045, M(0xc9b48a, 0, 0.9), 0, -0.92, 0, Math.PI / 2); return tilt(g, 0.1, -0.1, -0.35); };
  // ---------- key items ------------------------------------------------------------------------------------------------
  const ironK = M(0x7d766e, 0.5, 0.5), rustK = M(0x9a6040, 0.35, 0.7), bronzeK = M(0xb08a50, 0.6, 0.42), steelK = M(0xc8ced4, 0.6, 0.28), stoneK = M(0x77736c, 0.05, 0.9), darkStone = M(0x4e4b46, 0.05, 0.95);
  const goldK = M(0xd6ac4a, 0.75, 0.3, { emissive: 0x2a1c00 });
  // a key lying along x: bow on the left (made by bowF), shaft, bit on the right
  const keyBase = (m, bowF, len = 2.4, bit = 'step') => { const g = new THREE.Group(); xcyl(g, 0.075, 0.075, len, m, 0.15); bowF(g, m, -len / 2 + 0.15);
    for (const x of [-len / 2 + 0.55, len / 2 - 0.25]) xring(g, 0.1, 0.035, m, x);
    const bx = len / 2 + 0.05; if (bit === 'step') { box(g, 0.16, 0.42, 0.08, m, bx, -0.2); box(g, 0.32, 0.12, 0.08, m, bx - 0.12, -0.36); box(g, 0.1, 0.12, 0.08, m, bx - 0.05, -0.1); }
    else { box(g, 0.34, 0.36, 0.08, m, bx - 0.05, -0.22); box(g, 0.08, 0.14, 0.09, dark, bx - 0.12, -0.26); box(g, 0.08, 0.14, 0.09, dark, bx + 0.02, -0.18); } return g; };
  const ringBow = (r, t) => (g, m, x) => { const o = add(g, new THREE.TorusGeometry(r, t, 12, 48), m, x - r, 0, 0); o.scale.set(1, 1.15, 0.7); };
  const ornBow = (g, m, x) => { const o = add(g, new THREE.TorusGeometry(0.42, 0.07, 10, 8), m, x - 0.45, 0, 0); o.rotation.z = Math.PI / 8; torus(g, 0.2, 0.05, m, x - 0.45, 0, 0); for (let i = 0; i < 4; i++) { const b = box(g, 0.05, 0.8, 0.06, m, x - 0.45, 0, 0); b.rotation.z = i * Math.PI / 4; } sph(g, 0.09, m, x - 0.45, 0, 0.03); };
  const keyView = (g, roll = 0.55) => { const w = new THREE.Group(); w.add(g); w.rotation.z = roll; w.userData.view = [0.32, -0.25]; return w; };
  B.key_lodge = () => keyView(keyBase(rustK, (g, m, x) => { const o = add(g, new THREE.TorusGeometry(0.42, 0.06, 10, 40), m, x - 0.42, 0, 0); o.scale.set(0.8, 1.2, 1); for (const d of [-1, 1]) { const b = box(g, 0.05, 0.9, 0.05, m, x - 0.42, 0, 0); b.rotation.z = d * 0.55; } sph(g, 0.08, m, x - 0.42, 0, 0); }, 2.4));
  B.key_steel = () => keyView(keyBase(M(0x8b8a86, 0.8, 0.45), (g, m, x) => { ringBow(0.38, 0.06)(g, m, x); torus(g, 0.12, 0.035, m, x - 0.38, 0.55, 0); }, 2.7, 'step'), 0.6);
  B.key_rust = () => keyView(keyBase(M(0x8c6a40, 0.4, 0.7), (g, m, x) => { const f = new THREE.Group(); box(f, 0.7, 0.12, 0.12, m, 0, 0.32); box(f, 0.7, 0.12, 0.12, m, 0, -0.32); box(f, 0.12, 0.76, 0.12, m, -0.3); box(f, 0.12, 0.76, 0.12, m, 0.3); box(f, 0.5, 0.42, 0.06, M(0x5b3a1f, 0.1, 0.8)); f.position.x = x - 0.38; g.add(f); }, 1.8, 'block'), 0.75);
  B.key_iron = () => keyView(keyBase(M(0x6a5f55, 0.6, 0.6), (g, m, x) => { const o = sph(g, 0.4, M(0x7d6656, 0.4, 0.7), x - 0.42, 0, 0, 1, 1.05, 0.55); void o; for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2; sph(g, 0.12, M(0x8a4f3a, 0.3, 0.7), x - 0.42 + Math.cos(a) * 0.36, Math.sin(a) * 0.38, 0.12); } sph(g, 0.08, rubyM, x - 0.4, 0.05, 0.25); }, 2.3, 'block'), 0.6);
  B.key_brass = () => keyView(keyBase(bronzeK, ornBow, 2.5, 'step'), 0.55);
  B.key_gold = () => keyView(keyBase(goldK, ornBow, 2.3, 'step'), 0.55);
  B.insignia_key = () => { const g = new THREE.Group(); const bone = M(0xb7b2a6, 0.3, 0.6), dk = M(0x4e4a44, 0.6, 0.55); xcyl(g, 0.07, 0.07, 1.6, dk, 0.6); box(g, 0.14, 0.32, 0.08, dk, 1.42, -0.16); box(g, 0.26, 0.1, 0.08, dk, 1.32, -0.3);
    for (const [pts, r] of [[[[-0.2, 0, 0], [-0.7, 0.3, 0.1], [-1.1, 0.95, 0], [-0.9, 1.4, 0.1]], 0.06], [[[-0.3, 0, 0], [-0.9, -0.2, 0], [-1.4, 0.2, 0.1], [-1.55, 0.7, 0]], 0.055], [[[-0.6, 0.25, 0], [-0.35, 0.8, 0], [-0.1, 1.15, 0.05]], 0.045], [[[-1.1, 0.95, 0], [-1.45, 1.1, 0], [-1.6, 1.4, 0]], 0.04], [[[-0.9, -0.2, 0], [-1.2, -0.45, 0], [-1.5, -0.35, 0]], 0.04]]) pipeTube(g, pts, r, bone, 30);
    for (let i = 0; i < 14; i++) { const t = i / 13; pipeTube(g, [[-0.2 + Math.sin(t * 20) * 0.04, 0, 0], [0.5 * t + 0.1, Math.sin(t * 9) * 0.05, 0.08]], 0.025, bone, 6); } return keyView(g, 0.7); };
  B.key_scooter = () => { const g = new THREE.Group(); const k = keyBase(M(0x7d7468, 0.85, 0.35), (gg, m, x) => { const h = add(gg, new THREE.CylinderGeometry(0.42, 0.42, 0.1, 6), m, x - 0.4, 0, 0); h.rotation.x = Math.PI / 2; torus(gg, 0.1, 0.03, dark, x - 0.62, 0.1, 0.06); }, 1.6, 'step'); k.position.set(0.55, -0.35, 0); k.rotation.z = -0.5; g.add(k);
    const fur = M(0xe8b545, 0, 0.85), dkf = M(0x6a4a20, 0, 0.8); const bear = new THREE.Group(); sph(bear, 0.42, fur, 0, -0.25, 0, 1, 1.1, 0.85); sph(bear, 0.36, fur, 0, 0.42, 0); for (const d of [-1, 1]) { sph(bear, 0.14, fur, d * 0.28, 0.72, 0); sph(bear, 0.15, fur, d * 0.42, -0.05, 0.05, 1, 1.4, 1); sph(bear, 0.16, fur, d * 0.24, -0.68, 0.08, 1, 1, 1.3); sph(bear, 0.05, black, d * 0.12, 0.48, 0.32); }
    sph(bear, 0.14, M(0xf3d98a, 0, 0.8), 0, 0.33, 0.28, 1.2, 0.9, 0.8); sph(bear, 0.05, black, 0, 0.38, 0.4); box(bear, 0.4, 0.06, 0.05, dkf, 0, 0.12, 0.33); bear.position.set(-0.9, 0.1, 0.2); bear.rotation.z = 0.3; g.add(bear); torus(g, 0.16, 0.03, steel, -0.45, 0.62, 0); g.userData.view = [0.25, -0.2]; return g; };
  B.key_bunch = () => { const g = new THREE.Group(); torus(g, 0.5, 0.045, M(0x8b8a86, 0.9, 0.35), 0, 0.85, 0); [[-0.55, rustK, 0.45], [-0.2, bronzeK, 0.15], [0.2, M(0x9a9286, 0.8, 0.4), -0.1], [0.55, rustK, -0.4]].forEach(([x, m, r]) => { const k = keyBase(m, ringBow(0.2, 0.045), 1.5, 'step'); k.scale.setScalar(0.62); k.rotation.z = -Math.PI / 2 + r; k.position.set(x, 0.35, 0); g.add(k); }); g.userData.view = [0.2, -0.15]; return g; };

  B.cog = () => { const g = new THREE.Group(); const wd = M(0x6b4a2c, 0.05, 0.8), mt = M(0x4a4540, 0.7, 0.55); add(g, new THREE.TorusGeometry(0.88, 0.2, 12, 48), wd).rotation.x = 0; for (let i = 0; i < 22; i++) { const a = i / 22 * Math.PI * 2; const tth = box(g, 0.16, 0.3, 0.3, wd, Math.cos(a) * 1.15, Math.sin(a) * 1.15, 0); tth.rotation.z = a; }
    for (const r of [0, Math.PI / 2]) { const b = box(g, 1.75, 0.24, 0.26, mt); b.rotation.z = r; } box(g, 0.5, 0.5, 0.32, mt); ringOf(8, 0.88, (x, y, z) => sph(g, 0.06, mt, x, z, 0.2)); g.userData.view = [0.4, -0.2]; return g; };
  B.emblem_hex = () => { const g = new THREE.Group(); const cu = M(0xc08a5e, 0.55, 0.42); const h = add(g, new THREE.CylinderGeometry(1, 1, 0.2, 6), cu); h.rotation.x = Math.PI / 2; h.rotation.y = Math.PI / 6; const in2 = add(g, new THREE.CylinderGeometry(0.82, 0.82, 0.22, 6), M(0x9a6a48, 0.5, 0.5)); in2.rotation.x = Math.PI / 2; in2.rotation.y = Math.PI / 6;
    extrude2(g, [[-0.45, -0.3], [-0.15, 0.1], [-0.35, 0.45], [0.05, 0.25], [0.35, 0.5], [0.3, 0.05], [0.5, -0.25], [0.1, -0.15], [-0.05, -0.45]], 0.12, cu, 0.03).position.z = 0.12; return tilt(g, 0.25, -0.35); };
  B.marble = () => { const g = new THREE.Group(); const tex = canvasTex(512, 256, (x) => { x.fillStyle = '#2b3036'; x.fillRect(0, 0, 512, 256); let r = 7; const rnd = () => (r = (r * 16807) % 2147483647) / 2147483647; for (let i = 0; i < 900; i++) { x.fillStyle = rnd() < 0.85 ? 'rgba(10,12,14,.9)' : 'rgba(200,210,220,.8)'; x.beginPath(); x.arc(rnd() * 512, rnd() * 256, rnd() * 4 + 1, 0, 7); x.fill(); } });
    add(g, new THREE.SphereGeometry(1, 64, 40), new THREE.MeshStandardMaterial({ map: tex, metalness: 0.3, roughness: 0.15 })); return tilt(g, 0.2, 0.3); };
  B.boat_fuel = () => { const g = new THREE.Group(); const rd = M(0xb42a20, 0.35, 0.45); const can = new THREE.Shape(); [[-0.75, -1], [0.75, -1], [0.75, 0.7], [0.45, 1], [-0.75, 1]].forEach(([x, y], i) => (i ? can.lineTo(x, y) : can.moveTo(x, y))); const geo = new THREE.ExtrudeGeometry(can, { depth: 0.6, bevelEnabled: true, bevelSize: 0.08, bevelThickness: 0.08, bevelSegments: 3 }); geo.translate(0, 0, -0.3); add(g, geo, rd);
    for (const x of [-0.45, -0.05, 0.35]) box(g, 0.06, 1.6, 0.06, M(0x8d1f18, 0.3, 0.5), x, -0.1, 0.39); box(g, 0.8, 0.12, 0.22, rd, -0.2, 1.12, 0); box(g, 0.12, 0.24, 0.22, rd, -0.55, 1.02, 0); box(g, 0.12, 0.24, 0.22, rd, 0.15, 1.02, 0);
    cyl(g, 0.12, 0.2, dark, 0.52, 1.05, 0); pipeTube(g, [[0.55, 1.1, 0], [0.7, 1.5, 0], [0.55, 1.9, 0]], 0.06, M(0x3a2a20, 0.2, 0.7), 20); return tilt(g, 0.15, -0.55); };
  const hexPiece = (seed, draw) => () => { const g = new THREE.Group(); const face = canvasTex(512, 512, (x) => { x.fillStyle = '#e9e1d0'; x.fillRect(0, 0, 512, 512); draw(x); x.strokeStyle = '#9a8f78'; x.lineWidth = 10; x.beginPath(); for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2 + Math.PI / 8; x.lineTo(256 + Math.cos(a) * 236, 256 + Math.sin(a) * 236); } x.closePath(); x.stroke(); x.font = 'bold 34px serif'; x.fillStyle = '#6a5a3c'; for (let i = 0; i < 8; i++) { x.save(); x.translate(256, 256); x.rotate(seed + i * 0.78); x.fillText('ENTRAÑAS', -80, -175); x.restore(); } });
    const o = add(g, new THREE.CylinderGeometry(1, 1, 0.24, 8), [M(0xd9d0bc, 0.05, 0.8), printed(face), M(0xd9d0bc, 0.05, 0.8)]); o.rotation.x = Math.PI / 2; o.rotation.y = Math.PI / 8; ringOf(4, 1.0, (x, y, z) => sph(g, 0.08, goldK, x, z, 0.1)); return tilt(g, -0.45, -0.25); };
  const fresco = (x, a0) => { const gr = x.createRadialGradient(256, 256, 30, 256, 256, 200); gr.addColorStop(0, '#d8743c'); gr.addColorStop(1, '#a8401c'); x.fillStyle = gr; x.beginPath(); x.moveTo(256, 256); x.arc(256, 256, 190, a0, a0 + 2.2); x.closePath(); x.fill(); };
  B.hex_a = hexPiece(0.2, (x) => fresco(x, 0.6)); B.hex_b = hexPiece(1.1, (x) => { fresco(x, 2.6); x.strokeStyle = '#3a8fa0'; x.lineWidth = 8; x.beginPath(); x.arc(256, 256, 120, 3.4, 4.6); x.stroke(); }); B.hex_c = hexPiece(2.3, (x) => fresco(x, 4.4));
  B.head_apost = () => { const g = new THREE.Group(); sph(g, 0.85, stoneK, 0, 0, 0, 0.85, 1.05, 0.55); sph(g, 0.25, stoneK, 0, -0.05, 0.42, 0.7, 1.1, 0.8); for (const d of [-1, 1]) { sph(g, 0.14, darkStone, d * 0.3, 0.22, 0.38, 1.3, 0.6, 0.6); const h = add(g, new THREE.ConeGeometry(0.15, 0.7, 10), stoneK, d * 0.45, 0.95, 0); h.rotation.z = -d * 0.45; } box(g, 0.45, 0.07, 0.1, darkStone, 0, -0.5, 0.38); return tilt(g, 0.05, -0.35); };
  B.head_blasph = () => { const g = new THREE.Group(); const st = M(0x84807a, 0.05, 0.9); sph(g, 0.85, st, 0, 0, 0, 0.85, 1.05, 0.55); sph(g, 0.22, st, 0, -0.05, 0.42, 0.7, 1.1, 0.8); for (const d of [-1, 1]) sph(g, 0.13, darkStone, d * 0.3, 0.2, 0.38, 1.3, 0.55, 0.6);
    for (let i = 0; i < 11; i++) { const a = -1.3 + i * 0.26; const sp = add(g, new THREE.ConeGeometry(0.09, 0.55, 6), st, Math.sin(a) * 0.82, 0.5 + Math.cos(a) * 0.55, -0.1); sp.rotation.z = -a; } box(g, 0.42, 0.07, 0.1, darkStone, 0, -0.5, 0.38); return tilt(g, 0.05, -0.3); };
  B.insignia_silver = () => { const g = new THREE.Group(); const im = M(0x6a6560, 0.8, 0.45); torus(g, 0.75, 0.12, im); torus(g, 0.45, 0.08, im); for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; const sp = add(g, new THREE.ConeGeometry(0.12, i % 2 ? 0.6 : 0.95, 4), im, Math.cos(a) * (i % 2 ? 1.05 : 1.2), Math.sin(a) * (i % 2 ? 1.05 : 1.2), 0); sp.rotation.z = a - Math.PI / 2; const b = box(g, 0.08, 0.75, 0.08, im, Math.cos(a) * 0.6, Math.sin(a) * 0.6); b.rotation.z = a - Math.PI / 2; }
    sph(g, 0.18, jade, 0, 0, 0.1, 1, 1, 0.6); return tilt(g, 0.3, -0.2); };
  B.blue_dial = () => { const g = new THREE.Group(); const bl = M(0x2f4fb8, 0.5, 0.3, { emissive: 0x0a1440 }); const o = add(g, new THREE.CylinderGeometry(1, 1, 0.16, 48), bl); o.rotation.x = Math.PI / 2; for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; box(g, 0.32, 0.22, 0.18, bl, Math.cos(a) * 1.05, Math.sin(a) * 1.05).rotation.z = a; }
    torus(g, 0.7, 0.04, goldK, 0, 0, 0.09); torus(g, 0.35, 0.03, goldK, 0, 0, 0.09); for (let i = 0; i < 5; i++) { const b = box(g, 0.04, 1.2, 0.03, goldK, 0, 0, 0.1); b.rotation.z = i * 0.63; } return tilt(g, 0.35, -0.2); };
  B.crank = () => { const g = new THREE.Group(); const mt = M(0x77736d, 0.55, 0.45); pipeTube(g, [[-0.9, -1.0, 0], [-0.75, -0.4, 0], [-0.3, 0.3, 0], [0.35, 0.8, 0]], 0.13, mt, 30); cyl(g, 0.17, 0.35, mt, -0.95, -1.15, 0); box(g, 0.2, 0.2, 0.2, M(0x555048, 0.8, 0.4), -0.95, -1.38, 0);
    const grip = add(g, new THREE.CylinderGeometry(0.17, 0.17, 1.3, 20), M(0xb5562c, 0.1, 0.6), 0.9, 1.05, 0); grip.rotation.z = -1.1; return tilt(g, 0.2, -0.3, 0.2); };
  B.planks = () => { const g = new THREE.Group(); const yel = M(0xd6b52e, 0.05, 0.7), wd = M(0x7a5a30, 0.05, 0.85); for (const [r, y, l] of [[0.35, 0.1, 2.6], [-0.25, -0.05, 2.4], [0.05, -0.25, 2.2]]) { const b = box(g, l, 0.5, 0.12, yel, 0, y, Math.random() * 0.1); b.rotation.z = r; const e = box(g, 0.14, 0.52, 0.14, wd, Math.cos(r) * l / 2, y + Math.sin(r) * l / 2); e.rotation.z = r; } return tilt(g, 0.35, -0.25, 0.4); };
  const swordK2 = (blade, hilt, f) => () => { const g = new THREE.Group(); extrude2(g, [[-0.2, 0.14], [2.6, 0.11], [3.0, 0], [2.6, -0.11], [-0.2, -0.14]], 0.06, blade, 0.03).position.x = 0; if (f) f(g);
    box(g, 0.14, 0.95, 0.14, hilt, -0.3); cyl(g, 0.075, 0.9, hilt, -0.8, 0, 0).rotation.z = Math.PI / 2; sph(g, 0.14, hilt, -1.3, 0); for (const d of [-1, 1]) sph(g, 0.1, hilt, -0.3, d * 0.5, 0); const w = new THREE.Group(); w.add(g); w.rotation.z = 0.7; w.position.x = -0.5; w.userData.view = [0.3, -0.25]; return w; };
  B.sword_iron = swordK2(M(0xd6dadf, 0.55, 0.25), M(0x9a9da2, 0.5, 0.4)); B.sword_gold = swordK2(M(0xe0c070, 0.6, 0.3), goldK); B.sword_rust = swordK2(M(0x7a4a2c, 0.4, 0.85), M(0x6a4024, 0.4, 0.85));
  B.sword_blood = swordK2(M(0xe0c070, 0.6, 0.3), goldK, (g) => { for (const [x, l] of [[0.6, 0.5], [1.5, 0.8], [2.4, 0.4]]) box(g, l, 0.12, 0.08, M(0x9a1410, 0.3, 0.35, { emissive: 0x300000 }), x, (x % 1 - 0.5) * 0.08, 0.02); });
  B.halo_wheel = () => { const g = new THREE.Group(); torus(g, 1.0, 0.14, goldK); torus(g, 0.82, 0.05, goldK); const c = add(g, new THREE.CylinderGeometry(0.8, 0.8, 0.06, 48), M(0x5e6a60, 0.6, 0.45)); c.rotation.x = Math.PI / 2; for (let i = 0; i < 6; i++) { const b = box(g, 0.1, 1.6, 0.1, M(0x8c8f84, 0.8, 0.4), 0, 0, 0.05); b.rotation.z = i * Math.PI / 6 * 2; } sph(g, 0.2, goldK, 0, 0, 0.08, 1, 1, 0.5); ringOf(4, 1.0, (x, y, z, a) => sph(g, 0.17, goldK, x, z, 0, 1, 1, 0.8)); return tilt(g, 0.3, -0.2); };
  B.lantern = () => { const g = new THREE.Group(); const ir = M(0x2e2a28, 0.75, 0.5), glow = M(0xd0302a, 0.1, 0.4, { emissive: 0x8a1008, transparent: true, opacity: 0.85 }); add(g, new THREE.CylinderGeometry(0.42, 0.3, 0.9, 6), glow, 0, -0.2, 0); ringOf(6, 0.42, (x, y, z) => box(g, 0.06, 1.0, 0.06, ir, x * 0.9, -0.2, z * 0.9));
    add(g, new THREE.ConeGeometry(0.6, 0.45, 6), ir, 0, 0.5, 0); add(g, new THREE.CylinderGeometry(0.2, 0.35, 0.2, 6), ir, 0, -0.75, 0); add(g, new THREE.ConeGeometry(0.12, 0.3, 6), ir, 0, -0.95, 0).rotation.x = Math.PI; for (let i = 0; i < 6; i++) torus(g, 0.07, 0.02, ir, 0, 0.82 + i * 0.13, 0, i % 2 ? Math.PI / 2 : 0); return tilt(g, 0.12, 0.3); };
  const lithoK2 = (bg, ink, emblem) => () => { const g = new THREE.Group(); const face = canvasTex(384, 512, (x) => { x.fillStyle = '#f1ede6'; x.fillRect(0, 0, 384, 512); x.strokeStyle = ink; x.lineWidth = 6; let r = 3; const rnd = () => (r = (r * 16807) % 2147483647) / 2147483647; for (let i = 0; i < 160; i++) { const px = rnd() * 384, py = rnd() * 512; if (px > 60 && px < 324 && py > 90 && py < 420) continue; x.beginPath(); x.arc(px, py, 10 + rnd() * 14, rnd() * 6, rnd() * 6 + 2); x.stroke(); }
      x.fillStyle = '#f7f4ef'; x.beginPath(); for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2 + Math.PI / 6; x.lineTo(192 + Math.cos(a) * 125, 256 + Math.sin(a) * 125); } x.closePath(); x.fill(); x.lineWidth = 8; x.stroke(); x.fillStyle = bg; emblem(x); });
    const side = M(0xe7e2da, 0.05, 0.6); add(g, new THREE.BoxGeometry(1.5, 2, 0.3), [side, side, side, side, printed(face), side]); return tilt(g, 0.2, -0.3, 0.12); };
  const shield = (x) => { x.beginPath(); x.moveTo(140, 200); x.lineTo(244, 200); x.lineTo(240, 280); x.quadraticCurveTo(192, 330, 144, 280); x.closePath(); x.fill(); };
  B.litho_a = lithoK2('#c43a34', '#c46a64', (x) => { x.beginPath(); x.moveTo(192, 190); x.lineTo(250, 300); x.lineTo(134, 300); x.closePath(); x.fill(); });
  B.litho_b = lithoK2('#3c4ea8', '#5a64b0', shield); B.litho_c = lithoK2('#c43a34', '#d77b74', shield);
  B.litho_d = lithoK2('#3c4ea8', '#5a64b0', (x) => { x.fillRect(184, 180, 16, 140); x.fillRect(160, 290, 64, 12); x.fillRect(186, 300, 12, 34); });
  B.cubic_device = () => { const g = new THREE.Group(); const st = M(0x8e9294, 0.35, 0.55), gd = goldK; box(g, 1.6, 1.6, 1.6, st); for (const d of [-0.42, 0.42]) { box(g, 1.64, 0.14, 1.64, M(0x6a6d70, 0.4, 0.6), 0, d, 0); box(g, 0.14, 1.64, 1.64, M(0x6a6d70, 0.4, 0.6), d, 0, 0); }
    for (const a of [-1, 1]) for (const b of [-1, 1]) for (const c of [-1, 1]) box(g, 0.2, 0.2, 0.2, gd, a * 0.78, b * 0.78, c * 0.78); for (const [x, y] of [[0.55, 0.55], [-0.55, -0.55]]) box(g, 0.45, 0.45, 0.06, M(0x5a5c5e, 0.5, 0.6), x, y, 0.82); return tilt(g, 0.45, -0.6); };
  const goldHead = (f) => () => { const g = new THREE.Group(); f(g); return tilt(g, 0.1, -0.5); };
  B.head_lion = goldHead((g) => { sph(g, 0.95, goldK, 0, 0, -0.1, 1, 1.05, 0.7); for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2; sph(g, 0.28, goldK, Math.cos(a) * 0.85, Math.sin(a) * 0.9, -0.1, 0.8, 1.2, 0.8); } sph(g, 0.55, goldK, 0, -0.05, 0.35, 1, 1.05, 0.9); sph(g, 0.22, goldK, 0, -0.25, 0.8, 1.2, 0.8, 0.9); for (const d of [-1, 1]) sph(g, 0.08, M(0x4a3410, 0.6, 0.5), d * 0.22, 0.15, 0.82); });
  B.head_goat = goldHead((g) => { sph(g, 0.5, goldK, 0, 0, 0, 1, 1.1, 1); const snout = add(g, new THREE.ConeGeometry(0.28, 0.9, 16), goldK, 0.2, -0.35, 0.45); snout.rotation.x = 2.2; for (const d of [-1, 1]) { pipeTube(g, [[d * 0.3, 0.35, -0.1], [d * 0.75, 0.6, -0.3], [d * 0.95, 0.1, -0.2], [d * 0.7, -0.25, 0.05]], 0.13, goldK, 30); sph(g, 0.07, rubyM, d * 0.25, 0.1, 0.42); } });
  B.head_serpent = goldHead((g) => { sph(g, 0.6, goldK, 0, 0.15, 0, 1.3, 0.55, 0.8); sph(g, 0.5, goldK, 0.1, -0.35, 0.05, 1.25, 0.35, 0.75); sph(g, 0.4, M(0x6a1a12, 0.3, 0.6), 0.15, -0.1, 0.05, 1.1, 0.25, 0.6); for (let i = 0; i < 4; i++) add(g, new THREE.ConeGeometry(0.05, 0.22, 6), white, 0.55 - i * 0.25, -0.02, 0.32).rotation.x = Math.PI; for (const d of [-1, 1]) sph(g, 0.08, rubyM, -0.25, 0.38, d * 0.38); pipeTube(g, [[-0.6, 0, 0], [-1.0, -0.4, 0], [-1.1, -0.9, 0]], 0.3, goldK, 20); });
  B.unicorn_horn = () => { const g = new THREE.Group(); const horn = new THREE.ConeGeometry(0.32, 2.6, 24, 40); const pos = horn.attributes.position; for (let i = 0; i < pos.count; i++) { const y = pos.getY(i), a = Math.atan2(pos.getZ(i), pos.getX(i)); const k = 1 + 0.18 * Math.sin(a * 2 + y * 6); pos.setX(i, pos.getX(i) * k); pos.setZ(i, pos.getZ(i) * k); } horn.computeVertexNormals(); add(g, horn, M(0x8a6a48, 0.2, 0.6));
    cyl(g, 0.36, 0.22, goldK, 0, -1.3, 0); cyl(g, 0.12, 0.3, goldK, 0, -1.55, 0); const w = new THREE.Group(); w.add(g); w.rotation.z = -0.75; w.userData.view = [0.25, -0.2]; return w; };
  B.dynamite = () => { const g = new THREE.Group(); const rd = M(0xb8251c, 0.1, 0.55); for (const [x, y] of [[0, 0], [0.42, 0], [-0.42, 0], [0.21, 0.37], [-0.21, 0.37]]) { const c = cyl(g, 0.22, 1.9, rd, 0, y, x * 1); c.rotation.z = Math.PI / 2; cyl(g, 0.221, 0.02, M(0xe8d9a8, 0, 0.8), 0.95, y, x).rotation.z = Math.PI / 2; }
    for (const xx of [-0.4, 0.4]) { const t = add(g, new THREE.TorusGeometry(0.58, 0.04, 8, 30), M(0xd8d4c8, 0, 0.9), xx, 0.15, 0); t.rotation.y = Math.PI / 2; t.scale.set(1, 0.85, 1); } pipeTube(g, [[-0.95, 0.15, 0], [-1.3, 0.3, 0.1], [-1.5, 0.05, 0], [-1.8, -0.2, 0.1]], 0.03, M(0xbfb8a8, 0, 0.9), 20); return tilt(g, 0.35, -0.55, 0.25); };
  const keycardK2 = (lit) => () => { const g = new THREE.Group(); const body = M(0x6a6e72, 0.4, 0.45); box(g, 2.2, 1.35, 0.14, body); box(g, 2.25, 0.08, 0.16, M(0x55595d, 0.7, 0.4), 0, 0.64); for (let i = 0; i < 3; i++) { const x = -0.7 + i * 0.7; box(g, 0.6, 0.9, 0.04, M(0x45484b, 0.4, 0.5), x, -0.05, 0.08);
      const h = add(g, new THREE.CylinderGeometry(0.2, 0.2, 0.03, 6), i < lit ? M(0xe0b43c, 0.6, 0.3, { emissive: 0x6a4a08 }) : M(0x555048, 0.5, 0.5), x, -0.05, 0.11); h.rotation.x = Math.PI / 2; } box(g, 0.08, 0.3, 0.16, M(0x55595d, 0.7, 0.4), 1.1, 0.5); return tilt(g, 0.55, -0.35, 0.2); };
  B.keycard_1 = keycardK2(1); B.keycard_2 = keycardK2(2); B.keycard_3 = keycardK2(3);
  B.wrench = () => { const g = new THREE.Group(); const ch = M(0xdfe4e8, 0.55, 0.28); extrude2(g, [[-1.6, 0.14], [0.8, 0.16], [0.8, -0.16], [-1.6, -0.14]], 0.12, ch, 0.04); torus(g, 0.1, 0.04, ch, -1.45, 0, 0.0);
    extrude2(g, [[0.7, 0.3], [1.3, 0.45], [1.55, 0.2], [1.25, 0.12], [1.25, -0.1], [1.6, -0.2], [1.4, -0.45], [0.7, -0.3]], 0.16, ch, 0.05); cyl(g, 0.1, 0.18, M(0x8c9196, 0.9, 0.3), 0.85, 0, 0.12).rotation.x = Math.PI / 2; const w = new THREE.Group(); w.add(g); w.rotation.z = 0.8; w.userData.view = [0.3, -0.25]; return w; };
  const tokenK2 = (face, rim) => () => { const g = new THREE.Group(); const tex = canvasTex(512, 512, (x) => { x.fillStyle = rim; x.fillRect(0, 0, 512, 512); x.fillStyle = face; x.beginPath(); x.arc(256, 256, 190, 0, 7); x.fill(); x.strokeStyle = 'rgba(30,25,20,.75)'; x.lineWidth = 10;
      x.strokeRect(206, 170, 100, 150); x.beginPath(); x.arc(256, 210, 34, 0, 7); x.stroke(); for (const d of [-1, 1]) { x.beginPath(); x.moveTo(256 + d * 50, 170); x.lineTo(256 + d * 110, 120); x.stroke(); x.beginPath(); x.moveTo(256 + d * 50, 300); x.lineTo(256 + d * 110, 350); x.stroke(); }
      x.fillStyle = 'rgba(30,25,20,.6)'; x.font = 'bold 34px serif'; x.textAlign = 'center'; for (let i = 0; i < 16; i++) { x.save(); x.translate(256, 256); x.rotate(i / 16 * Math.PI * 2); x.fillText('·', 0, -222); x.restore(); } });
    const o = add(g, new THREE.CylinderGeometry(1, 1, 0.14, 64), [M(0x8a8478, 0.8, 0.4), printed(tex), printed(tex)]); o.rotation.x = Math.PI / 2; torus(g, 0.99, 0.05, rim === '#b8b4ac' ? steelK : goldK, 0, 0, 0.06); return tilt(g, 0.25, -0.3); };
  B.token_silver = tokenK2('#4f78b8', '#b8b4ac'); B.token_gold = tokenK2('#c0392b', '#b8913a');
  B.insignia_gold = () => { const g = new THREE.Group(); const sh = new THREE.Shape(); sh.moveTo(-0.85, 1.05); sh.lineTo(0.85, 1.05); sh.lineTo(0.85, -0.2); sh.quadraticCurveTo(0.8, -1.0, 0, -1.25); sh.quadraticCurveTo(-0.8, -1.0, -0.85, -0.2); sh.closePath(); const geo = new THREE.ExtrudeGeometry(sh, { depth: 0.18, bevelEnabled: true, bevelSize: 0.08, bevelThickness: 0.06, bevelSegments: 3 }); add(g, geo, M(0xb08a40, 0.85, 0.4));
    extrude2(g, [[-0.35, -0.7], [-0.1, -0.2], [-0.45, 0.2], [-0.2, 0.75], [0.2, 0.55], [0.05, 0.2], [0.4, -0.1], [0.15, -0.65]], 0.1, M(0xd8b860, 0.9, 0.3), 0.03).position.z = 0.28; return tilt(g, 0.2, -0.3); };
  return B;
}
