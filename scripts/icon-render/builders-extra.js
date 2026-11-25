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
  return B;
}
