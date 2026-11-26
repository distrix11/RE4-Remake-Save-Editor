// Original side-view models of single weapons (own geometry, no third-party and no game assets): recognisable shapes of the
// real firearms they are named after. Each is drawn in a box of w x h case cells, 100 units per cell, x to the right
// (muzzle), y down - the same as sketching on the case grid. makeGuns(THREE) returns { name: { w, h, build() } }.
export function makeGuns(THREE) {
  const M = (color, metalness, roughness, extra = {}) => new THREE.MeshStandardMaterial({ color, metalness, roughness, ...extra });
  const metal = M(0x4a5158, 0.75, 0.36), metalDark = M(0x2b3035, 0.7, 0.42), bright = M(0xb9c0c6, 0.95, 0.26), black = M(0x1a1d20, 0.35, 0.5),
    poly = M(0x33383d, 0.15, 0.58), polyDark = M(0x23272b, 0.1, 0.65), wood = M(0x7d4a27, 0.05, 0.5), woodDark = M(0x4a2a17, 0.05, 0.55),
    grey = M(0xa3b0b7, 0.12, 0.52), greyDark = M(0x67727a, 0.15, 0.55), camo = M(0x7a7344, 0.1, 0.6), camoDark = M(0x45432a, 0.1, 0.65),
    red = M(0xc4362c, 0.1, 0.45), brass = M(0xc99a45, 0.85, 0.32);

  const S = 0.01; // 100 units = one cell
  function kit(g, W, H) {
    const X = (x) => (x - W * 50) * S, Y = (y) => (H * 50 - y) * S;
    const path = (pts, P) => { // [x,y] = line to, [cx,cy,x,y] = curve
      pts.forEach((p, i) => { if (!i) P.moveTo(X(p[0]), Y(p[1])); else if (p.length === 4) P.quadraticCurveTo(X(p[0]), Y(p[1]), X(p[2]), Y(p[3])); else P.lineTo(X(p[0]), Y(p[1])); });
      return P;
    };
    const k = {};
    // a flat part: outline (and holes) given depth and rounded edges
    k.part = (pts, depth, m, z = 0, holes = [], bevel = 3) => {
      const s = path(pts, new THREE.Shape());
      for (const h of holes) s.holes.push(path(h, new THREE.Path()));
      const geo = new THREE.ExtrudeGeometry(s, { depth: depth * S, bevelEnabled: true, bevelThickness: bevel * S, bevelSize: bevel * S, bevelOffset: -bevel * S, bevelSegments: 3, curveSegments: 18 });
      geo.translate(0, 0, (z - depth / 2) * S);
      const o = new THREE.Mesh(geo, m); g.add(o); return o;
    };
    k.rect = (x1, y1, x2, y2, depth, m, z = 0, r = 3) => k.part([[x1, y1], [x2, y1], [x2, y2], [x1, y2]], depth, m, z, [], r);
    // a round bar between two points (barrels, tubes, pins, strings)
    k.rod = (x1, y1, x2, y2, r, m, z = 0) => {
      const a = new THREE.Vector3(X(x1), Y(y1), z * S), b = new THREE.Vector3(X(x2), Y(y2), z * S), d = b.clone().sub(a);
      const o = new THREE.Mesh(new THREE.CylinderGeometry(r * S, r * S, d.length(), 24), m);
      o.position.copy(a).addScaledVector(d, 0.5); o.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); g.add(o); return o;
    };
    // a pin or screw head facing the viewer
    k.pin = (x, y, r, m, z) => { const o = new THREE.Mesh(new THREE.CylinderGeometry(r * S, r * S, 4 * S, 20), m); o.rotation.x = Math.PI / 2; o.position.set(X(x), Y(y), z * S); g.add(o); return o; };
    k.ring = (x, y, R, r, m, z = 0) => { const o = new THREE.Mesh(new THREE.TorusGeometry(R * S, r * S, 12, 32), m); o.position.set(X(x), Y(y), z * S); g.add(o); return o; };
    // a few parallel slots or ribs
    k.ribs = (x, y, n, step, w, h, m, z) => { for (let i = 0; i < n; i++) k.rect(x + i * step, y, x + i * step + w, y + h, 3, m, z, 1); };
    return k;
  }
  const gun = (w, h, draw) => ({ w, h, build() { const g = new THREE.Group(); draw(kit(g, w, h)); return g; } });
  const G = {};

  // broom-handle pistol: long thin barrel, boxy receiver, magazine ahead of the trigger, round wooden grip with a red 9
  G.red9 = gun(3, 2, (k) => {
    k.rod(150, 62, 292, 62, 8, metal); k.rod(262, 62, 292, 62, 10, metalDark); k.part([[278, 52], [286, 42], [290, 53]], 8, metalDark);
    k.part([[60, 48], [150, 48], [166, 56], [182, 60], [182, 72], [150, 76], [60, 76]], 30, metal);
    k.rect(70, 40, 128, 50, 20, metalDark); k.part([[98, 40], [112, 30], [124, 40]], 14, metalDark); k.rect(46, 52, 64, 68, 22, metalDark); k.pin(52, 52, 7, bright, 12);
    k.rect(104, 76, 160, 128, 28, metal, 0, 6); k.rect(112, 84, 152, 118, 3, metalDark, 15.5);
    k.part([[60, 74], [106, 74], [106, 88], [92, 92], [74, 90], [66, 84]], 18, metalDark);
    k.part([[62, 90], [84, 118, 100, 94], [96, 92], [82, 108, 68, 90]], 8, metal); k.rod(80, 88, 76, 102, 3, bright);
    k.part([[48, 70], [80, 78], [66, 108], [56, 150, 62, 176], [60, 192, 40, 190], [16, 184, 18, 164], [22, 126, 38, 100]], 28, wood);
    k.ribs(30, 120, 1, 0, 2, 2, woodDark, 0); for (let i = 0; i < 6; i++) k.rod(28 + i * 2, 110 + i * 11, 58 + i, 106 + i * 11, 1.6, woodDark, 15);
    // the red 9
    k.ring(45, 142, 9, 3.4, red, 16.5); k.rod(54, 142, 50, 162, 3.4, red, 16.5); k.rod(50, 162, 40, 168, 3.4, red, 16.5);
    k.ring(46, 186, 6, 2, bright, 4);
  });

  // blocky polymer machine pistol with a short slide and a big straight grip
  G.matilda = gun(3, 2, (k) => {
    k.part([[40, 36], [262, 36], [276, 40], [284, 34], [292, 34], [286, 56], [246, 80], [40, 80]], 36, metal, 0, [], 4);
    k.rect(66, 28, 84, 38, 16, metalDark); k.rect(262, 28, 276, 36, 12, metalDark); k.rod(284, 62, 292, 62, 8, black);
    k.rect(120, 44, 178, 60, 3, metalDark, 19); k.ribs(56, 44, 8, 8, 3, 24, metalDark, 19);
    k.part([[52, 78], [236, 78], [220, 96], [168, 100], [150, 130], [134, 128], [112, 104], [96, 106], [76, 176], [70, 186], [24, 180], [20, 170], [44, 110], [48, 92], [36, 84]], 34, poly, 0, [], 5);
    k.part([[112, 100], [196, 100], [200, 114], [190, 138], [140, 142], [128, 130]], 20, poly, 0, [[[130, 108], [184, 106], [180, 128], [142, 130]]]);
    k.part([[150, 104], [160, 104], [152, 128], [146, 126]], 9, metalDark);
    for (let i = 0; i < 7; i++) k.rod(50 - i * 3.4, 108 + i * 10, 92 - i * 3.6, 112 + i * 10, 1.6, polyDark, 19);
    k.pin(206, 88, 4, bright, 19); k.pin(96, 92, 5, metalDark, 19);
    k.rect(46, 76, 236, 80, 3, bright, 18, 1); k.rect(48, 40, 258, 44, 3, greyDark, 18, 1);
    k.part([[112, 100], [196, 100], [200, 114], [190, 138], [140, 142], [128, 130]], 5, greyDark, 14, [[[126, 106], [190, 104], [184, 132], [140, 136]]], 1);
  });

  // semi-automatic shotgun: skeleton telescopic stock, pistol grip, long barrel over a magazine tube
  G.riot_gun = gun(8, 2, (k) => {
    k.rect(20, 76, 46, 168, 28, polyDark, 0, 7);
    k.part([[42, 82], [228, 66], [232, 86], [150, 100], [132, 92], [46, 108]], 22, poly, 0, [[[66, 92], [118, 86], [112, 96], [66, 101]]]);
    k.part([[46, 150], [180, 104], [226, 96], [224, 114], [190, 120], [60, 168], [44, 168]], 16, poly);
    k.part([[222, 68], [286, 68], [296, 108], [262, 112], [244, 168], [210, 172], [204, 162], [228, 110], [216, 96]], 30, polyDark, 0, [], 6);
    k.part([[270, 106], [330, 106], [326, 130], [286, 134], [268, 120]], 14, polyDark, 0, [[[284, 112], [318, 112], [314, 124], [290, 126]]]);
    k.part([[300, 110], [308, 110], [302, 124], [298, 122]], 7, bright);
    k.part([[262, 62], [292, 50], [486, 50], [494, 60], [494, 100], [470, 108], [286, 108], [262, 98]], 34, metal, 0, [], 5);
    k.rect(330, 64, 420, 84, 4, black, 18); k.rect(340, 70, 396, 78, 6, bright, 19); k.rect(300, 42, 470, 52, 18, metalDark); k.ribs(308, 38, 12, 13, 7, 6, metalDark, 0);
    k.rect(490, 60, 630, 102, 36, polyDark, 0, 8); k.ribs(506, 70, 9, 13, 5, 24, black, 19.5);
    k.rod(486, 58, 772, 58, 9, metal); k.rod(756, 58, 780, 58, 11, metalDark); k.rect(744, 38, 756, 52, 9, metalDark); k.rect(300, 34, 316, 48, 12, metalDark);
    k.rod(626, 86, 676, 86, 11, metalDark); k.ring(690, 74, 16, 4, metalDark); k.pin(470, 92, 5, bright, 19); k.pin(296, 92, 5, bright, 19);
  });

  // short pump shotgun: pistol grip instead of a stock, a vertical grip on the pump
  G.sawed_off = gun(6, 2, (k) => {
    k.part([[22, 176], [58, 100], [96, 80], [128, 76], [134, 112], [108, 116], [78, 184], [60, 190], [26, 186]], 30, woodDark, 0, [], 8);
    k.part([[104, 62], [150, 40], [278, 40], [286, 46], [286, 100], [150, 104], [116, 96]], 34, metalDark, 0, [], 5);
    k.rect(194, 50, 262, 68, 4, black, 18); k.rect(200, 54, 250, 64, 6, bright, 19); k.pin(142, 84, 5, bright, 19); k.pin(172, 88, 4, metal, 19);
    k.part([[132, 102], [206, 102], [200, 130], [152, 134], [134, 122]], 14, metalDark, 0, [[[150, 108], [194, 108], [188, 122], [156, 124]]]);
    k.part([[170, 106], [178, 106], [172, 122], [168, 120]], 7, bright);
    k.rod(282, 52, 540, 52, 11, metal); k.rod(520, 52, 546, 52, 13, metalDark); k.rect(500, 30, 516, 44, 10, metalDark);
    k.rod(282, 80, 520, 80, 11, metalDark); k.ring(522, 66, 18, 4, metalDark);
    k.rect(370, 66, 490, 100, 36, black, 0, 8); k.ribs(382, 74, 5, 12, 4, 18, polyDark, 19.5);
    k.part([[420, 96], [462, 96], [436, 176], [424, 188], [398, 182], [400, 168], [408, 156], [402, 148], [412, 136], [406, 126], [416, 114]], 28, black, 0, [], 7);
    k.rect(290, 72, 370, 90, 12, metal);
  });

  // grey polymer rifle with a thumbhole stock, a rail on top and a thin barrel
  G.stingray = gun(7, 2, (k) => {
    k.part([[14, 62], [30, 56], [180, 60], [232, 52], [300, 58], [300, 122], [262, 122], [248, 176], [214, 178], [200, 168], [208, 122], [190, 118], [166, 160], [140, 172], [66, 140], [40, 166], [16, 166]], 30, grey, 0,
      [[[120, 102], [150, 96, 182, 98], [196, 112, 174, 120], [150, 134, 122, 124], [104, 112, 120, 102]]], 6);
    k.rect(8, 60, 22, 168, 34, polyDark, 0, 5); k.rect(44, 44, 164, 62, 24, polyDark, 0, 7); k.pin(56, 112, 6, greyDark, 17); k.pin(96, 90, 5, greyDark, 17);
    k.part([[262, 116], [334, 116], [330, 142], [292, 146], [264, 134]], 14, greyDark, 0, [[[274, 122], [320, 122], [318, 134], [286, 136]]]);
    k.part([[296, 122], [304, 122], [296, 138], [292, 134]], 7, metalDark);
    k.part([[292, 54], [470, 54], [478, 62], [478, 118], [420, 122], [400, 112], [300, 118]], 34, grey, 0, [], 4);
    k.part([[352, 108], [404, 108], [412, 164], [366, 170]], 24, M(0x6a5a2e, 0.1, 0.45), 0, [], 4); for (let i = 0; i < 5; i++) k.rod(362 + i, 120 + i * 9, 404 + i, 116 + i * 9, 1.5, camoDark, 14);
    k.rect(330, 82, 372, 94, 4, greyDark, 18); k.pin(316, 74, 6, metalDark, 19); k.pin(446, 96, 5, metalDark, 19); k.rect(392, 66, 450, 84, 4, greyDark, 18);
    k.part([[476, 62], [622, 66], [634, 74], [634, 98], [476, 108]], 30, grey, 0, [], 4); k.ribs(500, 76, 8, 15, 8, 14, greyDark, 16);
    k.rect(236, 38, 490, 54, 20, metalDark); k.ribs(244, 33, 18, 13.5, 7, 7, metalDark, 0);
    k.rect(266, 14, 292, 36, 14, metalDark); k.part([[462, 34], [470, 12], [484, 12], [488, 34]], 12, metalDark);
    k.rod(628, 84, 694, 84, 7, metal); k.rod(668, 84, 696, 84, 9, metalDark);
  });

  // hunting crossbow seen from above: camouflage rail and stock, limbs with cams to both sides, the string drawn back
  G.crossbow = gun(5, 3, (k) => {
    k.part([[14, 134], [92, 126], [112, 138], [112, 164], [92, 176], [14, 166]], 26, black, 0, [[[36, 144], [80, 142], [80, 158], [36, 156]]], 6);
    k.part([[104, 138], [300, 136], [316, 142], [316, 160], [300, 166], [104, 164]], 24, camo, 0, [], 6);
    k.part([[150, 118], [172, 114], [186, 138], [160, 138]], 14, camo); k.part([[196, 164], [226, 164], [214, 196], [192, 196]], 18, black);
    k.ribs(122, 146, 5, 30, 18, 9, camoDark, 14); k.rect(220, 128, 330, 138, 12, metalDark);
    k.rect(300, 130, 452, 170, 22, camoDark, 0, 7); k.rod(170, 150, 470, 150, 5, bright, 18); k.part([[470, 142], [492, 150], [470, 158]], 10, metal, 18); k.rect(236, 142, 290, 158, 6, M(0x5d6a78, 0.5, 0.4), 15);
    for (const s of [-1, 1]) { // the two limbs, mirrored about the rail
      const y = (v) => 150 + s * v;
      k.part([[430, y(14)], [466, y(52), 436, y(104)], [380, y(132), 300, y(122)], [296, y(106)], [372, y(112), 416, y(88)], [440, y(54), 408, y(18)]], 18, camo, -4, [], 4);
      k.part([[318, y(120)], [380, y(120), 420, y(100)], [414, y(94)], [372, y(110), 318, y(111)]], 4, camoDark, 7, [], 1);
      k.ring(300, y(114), 17, 5, metalDark, 6); k.pin(300, y(114), 7, bright, 10);
      k.rod(298, y(100), 232, 150, 1.8, M(0xd9d2b8, 0, 0.7), 12);
    }
    k.ring(466, 150, 24, 6, metalDark, 0); k.pin(436, 136, 6, bright, 15); k.pin(436, 164, 6, bright, 15); k.pin(322, 150, 7, metal, 15);
  });

  // ---------------------------------------------------------------- pistols
  // slide + frame + raked grip + trigger guard; o: slide, frame, len (muzzle x), grip colour
  const pistolBody = (k, o) => {
    const len = o.len || 270, sl = o.slide || metal, fr = o.frame || polyDark;
    k.part([[40, 40], [len - 8, 40], [len, 46], [len, 76], [40, 76]], 34, sl, 0, [], 4);
    k.ribs(50, 44, 7, 8, 3, 28, metalDark, 18); k.rect(48, 32, 62, 42, 14, metalDark); k.rect(len - 22, 33, len - 10, 42, 10, metalDark);
    k.rect(128, 46, 176, 60, 3, black, 18); k.rect(132, 50, 168, 55, 4, bright, 18.5);
    k.part([[48, 74], [len - 14, 74], [len - 18, 94], [176, 96], [168, 104], [118, 104], [102, 110], [88, 186], [34, 184], [30, 172], [56, 104], [56, 92], [40, 84]], 32, fr, 0, [], 5);
    k.part([[112, 98], [178, 94], [180, 112], [168, 134], [124, 136], [108, 124]], 18, fr, 0, [[[122, 106], [166, 104], [158, 126], [126, 128]]]);
    k.part([[134, 104], [144, 104], [136, 124], [130, 122]], 9, metalDark);
    for (let i = 0; i < 7; i++) k.rod(52 - i * 3, 118 + i * 9, 96 - i * 2.2, 122 + i * 9, 1.5, black, 18);
    k.pin(190, 84, 4, bright, 18); k.pin(76, 90, 5, metalDark, 18);
    k.rod(len - 2, 56, len + 6, 56, 7, black);
  };
  const tanPoly = M(0x9c8560, 0.1, 0.6), silver = M(0xc3c9ce, 0.9, 0.3);
  G.sg09r = gun(3, 2, (k) => { pistolBody(k, {}); k.rect(186, 94, 256, 104, 24, metalDark); });
  G.punisher = gun(3, 2, (k) => { pistolBody(k, { len: 276, frame: tanPoly, slide: metalDark }); k.rect(180, 94, 260, 108, 26, tanPoly); k.ribs(190, 104, 5, 13, 6, 6, metalDark, 12); k.rect(38, 182, 92, 190, 34, metalDark); });
  G.sentinel_nine = gun(3, 2, (k) => { pistolBody(k, { len: 262, slide: silver, frame: black }); k.rod(260, 56, 292, 56, 10, metalDark); k.ribs(266, 47, 4, 7, 3, 18, black, 9); k.part([[40, 180], [86, 182], [80, 197], [30, 195]], 30, silver); });
  G.blacktail = gun(2, 2, (k) => {
    k.part([[14, 46], [176, 46], [184, 52], [184, 82], [14, 82]], 34, metal, 0, [], 4); k.ribs(22, 50, 6, 8, 3, 28, metalDark, 18); k.rect(22, 38, 36, 48, 14, metalDark); k.rect(162, 39, 174, 48, 10, metalDark);
    k.rect(82, 52, 122, 66, 3, black, 18);
    k.part([[20, 80], [170, 80], [166, 100], [122, 102], [112, 110], [84, 112], [72, 118], [64, 184], [12, 182], [8, 170], [30, 108], [30, 98], [14, 90]], 32, polyDark, 0, [], 5);
    k.part([[78, 104], [128, 100], [130, 116], [120, 138], [88, 140], [76, 128]], 18, polyDark, 0, [[[88, 112], [118, 110], [112, 130], [90, 132]]]);
    for (let i = 0; i < 7; i++) k.rod(26 - i * 2.4, 120 + i * 9, 66 - i * 1.6, 124 + i * 9, 1.5, black, 18);
    k.rod(182, 62, 190, 62, 7, black); k.pin(140, 90, 4, bright, 18);
  });
  G.blacktail_ac = gun(2, 2, (k) => {
    k.part([[12, 46], [166, 46], [174, 52], [174, 80], [12, 80]], 34, metalDark, 0, [], 4); k.ribs(20, 50, 6, 8, 3, 26, black, 18); k.rect(20, 38, 34, 48, 14, black);
    k.rect(76, 52, 118, 64, 3, bright, 18); k.rect(166, 48, 192, 82, 28, black, 0, 6); k.ribs(171, 52, 3, 7, 3, 26, metalDark, 15);
    k.part([[18, 78], [164, 78], [160, 98], [120, 100], [112, 110], [82, 112], [70, 118], [62, 184], [10, 182], [8, 170], [28, 106], [28, 96], [12, 88]], 32, black, 0, [], 5);
    k.part([[76, 102], [126, 98], [128, 114], [118, 136], [86, 138], [74, 126]], 18, black, 0, [[[86, 110], [116, 108], [110, 128], [88, 130]]]);
    k.rect(120, 98, 158, 114, 22, metalDark); k.pin(154, 106, 4, red, 13);
    for (let i = 0; i < 6; i++) k.rod(26 - i * 2.4, 124 + i * 9, 62 - i * 1.6, 128 + i * 9, 1.5, metalDark, 18);
  });

  // ---------------------------------------------------------------- revolvers
  const revolver = (k, o) => {
    const W = o.W, bar = o.barrel, m = o.metal;
    k.part([[o.x0 + 14, 56], [o.x0 + 44, 42], [o.x0 + 124, 42], [o.x0 + 132, 52], [o.x0 + 132, 96], [o.x0 + 96, 100], [o.x0 + 70, 110], [o.x0 + 34, 108]], 24, m, 0, [], 5);
    k.rect(o.x0 + 50, 50, o.x0 + 118, 98, 44, bright, 0, 12); k.ribs(o.x0 + 58, 60, 3, 22, 10, 30, metalDark, 22);
    k.part([[o.x0 + 130, 46], [bar, 46], [bar, 66], [o.x0 + 190, 70], [o.x0 + 170, 84], [o.x0 + 130, 84]], 22, m, 0, [], 4);
    k.rect(o.x0 + 150, 38, bar - 14, 47, 10, metalDark); k.rect(bar - 14, 28, bar - 2, 46, 8, metalDark); k.rect(o.x0 + 40, 32, o.x0 + 62, 44, 12, metalDark);
    if (o.brake) { k.rect(bar - 4, 42, bar + 18, 72, 28, metalDark); k.ribs(bar + 1, 46, 3, 6, 3, 10, black, 15); }
    k.part([[o.x0 + 18, 50], [o.x0 + 2, 40], [o.x0 + 10, 58]], 8, metalDark);
    k.part([[o.x0 + 30, 94], [o.x0 + 70, 104], [o.x0 + 60, 130], [o.x0 + 52, 168, o.x0 + 58, 186], [o.x0 + 30, 194], [o.x0 + 2, 184], [o.x0 - 2, 160, o.x0 + 14, 130], [o.x0 + 24, 110]], 28, o.grip, 0, [], 9);
    k.pin(o.x0 + 34, 140, 6, brass, 17); k.pin(o.x0 + 26, 172, 4, brass, 17);
    k.part([[o.x0 + 66, 100], [o.x0 + 116, 98], [o.x0 + 118, 116], [o.x0 + 104, 136], [o.x0 + 74, 136]], 14, m, 0, [[[o.x0 + 76, 108], [o.x0 + 106, 106], [o.x0 + 98, 126], [o.x0 + 80, 126]]]);
    k.part([[o.x0 + 86, 102], [o.x0 + 95, 102], [o.x0 + 88, 122], [o.x0 + 83, 120]], 8, metalDark);
  };
  G.handcannon = gun(4, 2, (k) => revolver(k, { W: 4, x0: 14, barrel: 370, metal: silver, grip: wood, brake: true }));
  G.killer7 = gun(3, 2, (k) => { revolver(k, { W: 3, x0: 14, barrel: 264, metal: metalDark, grip: black, brake: false }); k.rect(150, 66, 260, 82, 20, metal); k.ribs(162, 70, 6, 16, 8, 8, black, 12); });
  // top-break single-action revolver: round fluted cylinder, thin round barrel with a rib, hammer spur, curved wooden grip
  G.butterfly = gun(3, 2, (k) => {
    // frame with the top strap and the latch over the cylinder
    k.part([[44, 62], [70, 50], [100, 50], [100, 114], [60, 112], [44, 96]], 22, metal, 0, [], 4); // behind the cylinder
    k.rect(96, 48, 168, 56, 18, metal, 0, 2); // top strap
    k.part([[96, 106], [152, 106], [150, 110], [126, 112], [96, 116]], 18, metal, 0, [], 2); // under the cylinder
    k.rect(148, 56, 158, 106, 18, metal, 0, 2); // in front of the cylinder
    k.part([[64, 50], [74, 40], [92, 40], [96, 50]], 18, metalDark); k.pin(84, 46, 4, bright, 10);
    // the cylinder: five round chambers lying along the barrel, so it reads as a drum
    for (const [y, r] of [[60, 6], [69, 11], [81, 14], [93, 11], [102, 6]]) k.rod(100, y, 148, y, r, greyDark, 0);
    for (const y of [64, 75, 87, 98]) k.rod(102, y, 146, y, 2.4, black, 12);
    k.rod(96, 81, 152, 81, 4, metalDark, 0);
    // barrel, rib and front sight; ejector rod under it
    k.rod(150, 68, 292, 68, 9, metal); k.rect(152, 54, 290, 61, 10, metalDark, 0, 2); k.part([[280, 54], [284, 44], [290, 54]], 6, metalDark);
    k.rod(288, 68, 294, 68, 6, black, 4); k.rod(152, 86, 262, 86, 4.5, bright); k.rect(262, 80, 270, 92, 10, metalDark, 0, 2);
    // hammer spur at the back
    k.part([[50, 62], [40, 40], [30, 32], [36, 28], [52, 40], [66, 58]], 10, metalDark, 0, [], 2);
    // trigger guard and trigger
    k.part([[92, 110], [138, 108], [136, 124], [120, 142], [96, 142], [88, 126]], 12, metal, 0, [[[98, 116], [128, 114], [118, 134], [100, 134]]], 2);
    k.part([[108, 110], [116, 110], [110, 130], [104, 128]], 6, metalDark);
    // curved wooden grip and its screw
    k.part([[48, 100], [88, 112], [80, 134], [72, 168, 80, 190], [46, 196], [22, 190], [14, 160, 28, 130], [38, 112]], 28, woodDark, 0, [], 9);
    k.pin(52, 150, 6, bright, 16); k.pin(36, 184, 4, brass, 16);
  });

  // ---------------------------------------------------------------- submachine guns
  G.tmp = gun(3, 2, (k) => {
    k.part([[40, 46], [226, 42], [240, 52], [240, 96], [200, 100], [40, 96]], 36, polyDark, 0, [], 6); k.rect(60, 34, 200, 44, 16, metalDark); k.ribs(66, 29, 10, 13, 7, 6, metalDark, 0);
    k.rod(238, 64, 284, 64, 10, metal); k.ribs(250, 54, 4, 8, 3, 20, metalDark, 9);
    k.part([[104, 94], [150, 94], [138, 186], [98, 184]], 28, black, 0, [], 6); k.part([[108, 150], [134, 152], [128, 196], [102, 194]], 18, metal);
    k.part([[196, 94], [226, 94], [218, 150], [194, 148]], 22, polyDark, 0, [], 5);
    k.part([[148, 96], [186, 96], [180, 122], [148, 120]], 12, black, 0, [[[156, 102], [176, 102], [172, 114], [156, 114]]]);
    k.rect(18, 52, 42, 92, 26, metalDark); k.rect(70, 60, 130, 72, 4, metal, 19); k.pin(60, 80, 5, bright, 19); k.pin(210, 76, 4, bright, 19);
  });
  G.le5 = gun(6, 2, (k) => {
    k.part([[16, 60], [38, 56], [44, 150], [18, 152]], 28, black, 0, [], 6); k.rod(38, 72, 180, 72, 6, metalDark, 8); k.rod(38, 112, 180, 96, 6, metalDark, 8);
    k.part([[170, 50], [400, 50], [410, 58], [410, 96], [170, 100]], 34, metalDark, 0, [], 5); k.rod(180, 40, 470, 40, 8, metal);
    k.part([[404, 52], [500, 54], [508, 66], [504, 102], [410, 100]], 36, black, 0, [], 8); k.ribs(420, 64, 6, 13, 5, 28, polyDark, 19);
    k.rod(500, 62, 568, 62, 9, metal); k.rod(548, 62, 576, 62, 11, metalDark); k.ring(528, 40, 11, 4, metalDark); k.rect(522, 48, 534, 58, 8, metalDark); k.rect(190, 26, 214, 42, 14, metalDark);
    k.part([[184, 96], [246, 96], [250, 112], [232, 118], [218, 180], [182, 178], [198, 118], [184, 110]], 28, black, 0, [], 6);
    k.part([[236, 104], [278, 102], [274, 128], [240, 130]], 12, black, 0, [[[246, 110], [268, 109], [265, 121], [248, 122]]]);
    k.part([[300, 96], [342, 96], [352, 140], [378, 182], [340, 194], [312, 150]], 22, metalDark, 0, [], 4); k.ribs(318, 120, 1, 0, 22, 3, black, 12);
    k.rect(230, 62, 300, 76, 4, black, 18); k.pin(200, 82, 5, red, 19); k.pin(380, 82, 5, bright, 19);
  });
  G.chicago = gun(7, 3, (k) => {
    k.part([[14, 128], [170, 108], [190, 122], [188, 164], [150, 168], [40, 234], [14, 230]], 32, wood, 0, [], 8);
    k.part([[180, 96], [420, 96], [428, 106], [428, 156], [180, 160]], 40, metal, 0, [], 5); k.rect(220, 82, 250, 98, 16, metalDark); k.rect(300, 112, 380, 126, 4, black, 21);
    k.part([[196, 156], [246, 156], [232, 252], [194, 248]], 28, wood, 0, [], 8);
    k.part([[244, 160], [290, 160], [284, 188], [246, 186]], 12, metalDark, 0, [[[254, 166], [278, 166], [274, 180], [256, 180]]]);
    const drum = (r, d, m, z) => { const o = k.pin(348, 214, r, m, z); o.scale.y = d / 4; };
    drum(66, 44, metalDark, 0); drum(46, 8, metal, 24); drum(14, 8, bright, 29); for (let i = 0; i < 8; i++) k.pin(348 + 30 * Math.cos(i * Math.PI / 4), 214 + 30 * Math.sin(i * Math.PI / 4), 5, black, 30);
    k.rod(426, 116, 660, 116, 13, metalDark); k.ribs(440, 100, 11, 12, 5, 32, metal, 0); k.rod(650, 116, 690, 116, 16, metal); k.rect(662, 90, 674, 104, 8, metalDark);
    k.part([[444, 134], [560, 136], [556, 168], [516, 164], [506, 190, 486, 188], [472, 162], [446, 160]], 34, wood, 0, [], 9);
    k.pin(206, 130, 6, bright, 22); k.pin(404, 140, 5, bright, 22);
  });

  // ---------------------------------------------------------------- shotguns
  G.w870 = gun(8, 2, (k) => {
    k.part([[14, 96], [180, 66], [236, 62], [244, 108], [206, 112], [150, 120], [30, 170], [16, 166]], 30, wood, 0, [], 8); k.rect(10, 94, 22, 170, 34, black, 0, 4);
    k.part([[232, 56], [270, 46], [420, 46], [428, 54], [428, 104], [240, 108]], 34, metalDark, 0, [], 5); k.rect(300, 58, 384, 76, 4, black, 18); k.rect(308, 63, 372, 71, 6, bright, 19);
    k.part([[264, 106], [340, 106], [336, 130], [298, 136], [268, 124]], 14, metalDark, 0, [[[280, 112], [326, 112], [322, 124], [300, 128]]]);
    k.part([[304, 110], [312, 110], [306, 124], [302, 122]], 7, bright);
    k.rod(426, 56, 770, 56, 11, metal); k.rod(752, 56, 780, 56, 13, metalDark); k.rect(750, 36, 764, 48, 10, brass);
    k.rod(426, 88, 690, 88, 11, metalDark); k.ring(700, 70, 19, 4, metalDark);
    k.rect(500, 72, 640, 108, 38, wood, 0, 10); k.ribs(514, 80, 8, 15, 6, 20, woodDark, 19.5); k.pin(262, 90, 5, bright, 19); k.pin(402, 90, 5, bright, 19);
  });
  G.striker = gun(8, 2, (k) => {
    k.part([[16, 70], [190, 66], [196, 88], [60, 96], [44, 172], [18, 170]], 24, black, 0, [[[44, 82], [110, 80], [60, 88], [44, 92]]], 5);
    k.part([[200, 60], [330, 56], [340, 100], [260, 108], [200, 104]], 32, metalDark, 0, [], 6);
    k.part([[212, 100], [258, 104], [240, 182], [204, 178]], 28, black, 0, [], 7);
    k.part([[258, 104], [306, 104], [300, 130], [260, 128]], 12, black, 0, [[[266, 110], [292, 110], [288, 122], [268, 122]]]);
    const drum = k.rod(330, 100, 470, 100, 60, metal); drum.material = metal;
    k.ribs(344, 52, 7, 18, 7, 96, metalDark, 58); k.ring(400, 100, 22, 6, brass, 62); k.pin(400, 100, 9, bright, 64);
    k.rect(470, 52, 520, 96, 36, metalDark); k.rod(468, 62, 740, 62, 13, metal); k.rod(724, 62, 756, 62, 16, metalDark); k.rect(470, 36, 700, 46, 12, black); k.ribs(480, 31, 14, 15, 7, 6, black, 0);
    k.part([[560, 74], [602, 74], [588, 164], [552, 162]], 26, black, 0, [], 7);
  });
  G.skull = gun(5, 1, (k) => {
    const sx = (x) => 14 + (x > 850 ? 850 + (x - 850) * 1.4 : x) * 0.19, sy = (y) => 2 + y * 0.168; // sketched on a 1880 x 580 sheet; the barrels are drawn longer to fill the 5 cells
    const P = (pts) => pts.map((p) => p.map((v, i) => (i % 2 ? sy(v) : sx(v))));
    const at = (x, y) => [sx(x), sy(y)];
    const bar = (x1, y, x2, r, m, z = 0) => k.rod(...at(x1, y), ...at(x2, y), r * 0.157, m, z);
    bar(840, 54, 1878, 36, metal); bar(840, 139, 1844, 39, metalDark); bar(1840, 124, 1872, 9, metal);
    k.part(P([[848, 90], [1560, 90], [1560, 105], [848, 105]]), 9, black, 0, [], 1);
    k.part(P([[852, 44], [1520, 44], [1580, 50, 1572, 95], [1568, 144, 1515, 146], [852, 146]]), 8, wood, 6.5, [], 2);
    for (const x of [912, 1385]) { k.pin(...at(x, 95), 2.6, metal, 11.5); k.pin(...at(x, 95), 1.2, black, 13); }
    k.part(P([[4, 400], [10, 290, 130, 252], [372, 188], [415, 305], [330, 345], [190, 405], [120, 495], [10, 470, 4, 400]]), 20, wood, 0, [], 4);
    k.part(P([[45, 385], [190, 270], [350, 228], [410, 322], [300, 372], [180, 430], [125, 482], [80, 445]]), 4, metal, 13.5, [], 1);
    k.part(P([[150, 478], [185, 410, 330, 352], [440, 320], [498, 438], [492, 458], [428, 448], [360, 535, 235, 566], [150, 572, 150, 478]]), 9, metal, 0,
      [P([[178, 482], [200, 430, 340, 372], [405, 372], [412, 436], [350, 515, 238, 540], [176, 546, 178, 482]])], 1.5);
    k.part(P([[372, 188], [468, 168], [540, 52, 660, 28], [832, 24], [852, 42], [852, 172], [828, 182], [782, 228], [722, 236], [705, 272], [520, 282], [408, 305]]), 26, metal, 0, [], 3);
    k.part(P([[790, -2], [850, -2], [850, 28], [790, 28]]), 10, metalDark);
    k.part(P([[430, 300], [452, 300], [440, 350], [476, 398], [462, 404], [424, 356]]), 6, metalDark, 0, [], 1);
    k.part(P([[570, 278], [640, 278], [612, 305], [608, 345], [590, 345], [588, 305]]), 8, metalDark, 0, [], 1);
    for (const [x, y, r] of [[473, 184, 1.8], [547, 195, 3], [672, 243, 1.8]]) k.pin(...at(x, y), r, bright, 14);
    k.rod(...at(535, 207), ...at(560, 183), 0.6, black, 16.5);
  });

  // ---------------------------------------------------------------- rifles
  G.m1903 = gun(9, 1, (k) => {
    k.part([[10, 34], [96, 32], [200, 38], [240, 46], [262, 40], [640, 40], [646, 62], [300, 66], [250, 74], [200, 66], [150, 70], [40, 92], [10, 90]], 26, wood, 0, [], 6);
    k.rect(8, 32, 18, 92, 30, metalDark, 0, 3); k.rect(250, 28, 372, 42, 20, bright); k.rod(280, 24, 300, 8, 4, bright, 10); k.pin(302, 8, 7, bright, 10);
    k.part([[270, 64], [322, 64], [318, 80], [276, 80]], 12, metalDark, 0, [[[282, 68], [310, 68], [308, 75], [286, 75]]]);
    k.rod(372, 36, 876, 36, 6.5, metal); k.rod(840, 36, 878, 36, 8, metal); k.rect(520, 36, 532, 66, 30, metalDark); k.rect(636, 36, 652, 64, 30, metalDark);
    k.rod(640, 46, 790, 46, 6, woodDark); k.rect(850, 18, 862, 34, 8, metalDark); k.rect(262, 22, 276, 30, 12, metalDark);
  });
  G.cqbr = gun(7, 2, (k) => {
    k.part([[14, 62], [120, 66], [128, 92], [76, 104], [60, 150], [16, 152]], 30, black, 0, [[[40, 82], [86, 80], [64, 92], [40, 100]]], 5);
    k.rod(110, 76, 220, 76, 14, metalDark);
    k.part([[210, 52], [390, 52], [398, 66], [396, 100], [330, 104], [216, 108]], 34, metalDark, 0, [], 5);
    k.part([[222, 104], [268, 104], [248, 176], [214, 170]], 26, black, 0, [], 6);
    k.part([[266, 106], [306, 106], [302, 130], [262, 128]], 12, black, 0, [[[272, 112], [294, 112], [290, 122], [270, 122]]]);
    k.part([[318, 102], [366, 102], [372, 140], [392, 180], [354, 192], [330, 148]], 22, metal, 0, [], 4);
    k.rect(216, 38, 560, 54, 22, black); k.ribs(224, 33, 24, 14, 7, 7, black, 0);
    k.part([[396, 56], [556, 58], [560, 100], [398, 100]], 38, polyDark, 0, [], 6); k.ribs(410, 66, 9, 16, 8, 24, black, 20);
    k.rod(556, 74, 640, 74, 8, metal); k.rod(636, 74, 686, 74, 12, metalDark); k.part([[520, 40], [532, 8], [544, 8], [552, 40]], 10, black); k.rect(240, 16, 270, 40, 16, black);
    k.rect(290, 66, 348, 80, 4, black, 18); k.pin(240, 88, 5, red, 19); k.pin(378, 84, 4, bright, 19);
  });

  // ---------------------------------------------------------------- bows
  G.bolt_thrower = gun(4, 2, (k) => {
    k.part([[16, 84], [70, 78], [220, 82], [226, 116], [100, 120], [74, 176], [40, 172], [56, 116], [18, 112]], 30, wood, 0, [], 7);
    k.part([[110, 116], [156, 116], [152, 140], [112, 140]], 12, metalDark, 0, [[[120, 122], [144, 122], [141, 132], [122, 132]]]);
    k.rect(60, 62, 360, 80, 24, metalDark); k.rect(150, 82, 214, 156, 26, metal, 0, 6); k.ribs(160, 92, 4, 13, 6, 54, metalDark, 14);
    k.rect(290, 56, 340, 112, 34, metalDark, 0, 8);
    k.part([[318, 60], [352, 24, 300, 12], [292, 22], [326, 36, 304, 62]], 16, camo); k.part([[318, 108], [352, 152, 300, 178], [292, 168], [326, 146, 304, 106]], 16, camo);
    k.rod(298, 16, 190, 72, 1.6, M(0xd9d2b8, 0, 0.7), 14); k.rod(298, 174, 190, 72, 1.6, M(0xd9d2b8, 0, 0.7), 14);
    k.rod(196, 56, 384, 56, 4, bright, 10); k.part([[380, 48], [398, 56], [380, 64]], 10, red, 10);
  });
  G.krauser_bow = gun(5, 2, (k) => {
    k.part([[26, 20], [60, 14, 150, 34], [250, 84], [262, 100], [250, 116], [150, 166], [60, 186, 26, 180], [40, 166], [130, 148, 222, 108], [226, 100], [222, 92], [130, 52, 40, 34]], 18, camoDark, 0, [], 4);
    k.rod(32, 24, 32, 176, 2, M(0xd9d2b8, 0, 0.7), 10); k.rect(218, 70, 268, 130, 28, black, 0, 10); k.ribs(222, 82, 1, 0, 42, 6, metal, 15);
    k.ring(34, 24, 12, 4, metalDark, 6); k.ring(34, 176, 12, 4, metalDark, 6);
    k.rod(40, 100, 452, 100, 5, wood, 14); k.part([[448, 84], [488, 100], [448, 116], [456, 100]], 10, bright, 14);
    k.part([[40, 100], [18, 80], [72, 82], [90, 100]], 6, red, 14); k.part([[40, 100], [18, 120], [72, 118], [90, 100]], 6, red, 14);
  });

  // ---------------------------------------------------------------- launchers
  const launcher = (k, tube, band, mark) => {
    k.rod(40, 80, 660, 80, 38, tube); k.rod(14, 80, 70, 80, 50, metalDark); k.rod(640, 80, 720, 80, 46, metalDark);
    k.part([[716, 40], [760, 52], [788, 80], [760, 108], [716, 120]], 56, band, 0, [], 12);
    k.rect(300, 28, 380, 44, 30, metalDark); k.rect(330, 10, 360, 30, 18, black); k.rect(176, 112, 460, 126, 30, metalDark);
    k.part([[240, 122], [284, 122], [268, 184], [232, 180]], 28, black, 0, [], 7); k.part([[410, 122], [452, 122], [446, 176], [412, 176]], 28, black, 0, [], 7);
    k.part([[284, 124], [326, 124], [322, 148], [282, 146]], 12, black, 0, [[[292, 130], [314, 130], [310, 140], [290, 140]]]);
    [150, 540].forEach((x) => k.rod(x, 80, x + 24, 80, 41, mark)); k.ribs(480, 66, 3, 14, 7, 28, mark, 40);
  };
  const olive = M(0x66703a, 0.2, 0.55), orange = M(0xc4702c, 0.2, 0.45), gold = M(0xd9ab45, 0.85, 0.3);
  G.rocket = gun(8, 2, (k) => launcher(k, olive, olive, camoDark));
  G.rocket_special = gun(8, 2, (k) => launcher(k, olive, red, orange));
  G.rocket_infinite = gun(8, 2, (k) => { launcher(k, metalDark, gold, gold); k.ring(560, 80, 12, 4, gold, 43); k.ring(580, 80, 12, 4, gold, 43); });

  // ---------------------------------------------------------------- knives (point to the left: upright in the case with the point up)
  const knife = (w, draw) => gun(w, 1, draw);
  const handle = (k, x1, x2, m, wrap) => { k.rect(x1, 36, x2, 68, 28, m, 0, 9); k.ribs(x1 + 14, 36, Math.floor((x2 - x1 - 24) / 14), 14, 5, 32, wrap, 15); k.rect(x2 - 6, 34, x2 + 6, 70, 30, metalDark); };
  const guard = (k, x, m) => k.rect(x - 6, 22, x + 6, 80, 18, m, 0, 3);
  G.knife_combat = knife(3, (k) => { k.part([[12, 48], [60, 32], [92, 36], [100, 30], [108, 36], [116, 30], [124, 36], [132, 30], [140, 36], [174, 34], [174, 66], [60, 66]], 8, bright, 0, [], 2); k.rect(58, 49, 166, 54, 10, metal); guard(k, 178, metalDark); handle(k, 184, 282, olive, camoDark); });
  G.knife_fighting = knife(4, (k) => { k.part([[10, 52], [60, 34, 130, 38], [200, 26, 232, 36], [236, 66], [150, 68], [70, 66, 10, 52]], 8, bright, 0, [], 2); k.rod(52, 50, 214, 48, 2.4, metal, 5); guard(k, 240, silver); handle(k, 246, 372, black, metalDark); k.pin(382, 52, 12, silver, 0); });
  G.knife_kitchen = knife(3, (k) => { k.part([[12, 62], [46, 34, 120, 30], [188, 30], [188, 66], [12, 66]], 6, silver, 0, [], 1.5); k.rect(184, 32, 196, 68, 20, bright); k.rect(196, 36, 288, 64, 24, woodDark, 0, 10); [220, 244, 268].forEach((x) => k.pin(x, 50, 5, brass, 13)); });
  G.knife_boot = knife(2, (k) => { k.part([[8, 50], [34, 38], [112, 40], [112, 60], [34, 62]], 8, bright, 0, [], 2); k.rect(30, 48, 106, 52, 10, metal); guard(k, 116, metalDark); k.rect(122, 38, 188, 62, 22, black, 0, 8); k.ribs(130, 38, 4, 14, 4, 24, metalDark, 12); });
  G.knife_tactical = knife(3, (k) => { k.part([[14, 56], [44, 32], [176, 34], [176, 66], [60, 66]], 9, greyDark, 0, [], 2); k.rod(50, 66, 170, 66, 4, bright, 5); k.rod(48, 36, 170, 36, 2.5, bright, 5); guard(k, 180, black); handle(k, 186, 278, polyDark, black); k.pin(206, 52, 5, red, 16); k.pin(252, 52, 5, red, 16); });
  G.knife_primal = knife(3, (k) => {
    const blade = M(0x7b8187, 0.85, 0.42), grip = M(0x2c2f32, 0.15, 0.7);
    k.part([[10, 50], [42, 36], [70, 34], [128, 40], [138, 40], [143, 33], [148, 40], [153, 33], [158, 40], [163, 33], [168, 40], [174, 40], [174, 60], [70, 66], [40, 62]], 8, blade, 0, [], 2);
    k.rod(44, 50, 150, 50, 2, metalDark, 5); k.ring(156, 50, 6, 1.4, metalDark, 5);
    k.part([[172, 28], [182, 22], [188, 38], [188, 62], [182, 78], [172, 72], [176, 60], [176, 40]], 18, metalDark, 0, [], 3);
    k.rect(186, 36, 280, 66, 26, grip, 0, 9); [196, 216, 236, 256].forEach((x) => k.rect(x, 34, x + 14, 68, 29, grip, 0, 5));
    [212, 232, 252].forEach((x) => k.rect(x, 37, x + 3, 65, 30, black, 0, 1));
    k.rect(278, 33, 292, 69, 28, metalDark, 0, 7);
  });

  return G;
}
