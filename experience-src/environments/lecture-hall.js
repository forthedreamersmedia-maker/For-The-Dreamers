// ENVIRONMENT — university corridor + lecture hall.
// Every environment exports: build(THREE, ctx) -> { group, update(p, t) }, plus
// a camera path (points + look targets) and a timing map from scroll (0..1)
// to position along that path. A future café or studio follows the same shape.
import * as THREE from 'three';

const ROWS = 9, ROW_D = 1.05, STEP = 0.17, ROW_Z0 = -27.2;
const rowZ = (k) => ROW_Z0 - ROW_D * k;
const rowY = (k) => -STEP * (k + 1);
const STUDENT_ROW = 4, STUDENT_X = -2.9;

function canvasTex(w, h, draw, repeat) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); }
  t.anisotropy = 4;
  return t;
}
function noise(ctx, w, h, base, amt, n = 9000) {
  ctx.fillStyle = base; ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < n; i++) {
    const a = Math.random() * amt;
    ctx.fillStyle = Math.random() > 0.5 ? `rgba(255,255,255,${a})` : `rgba(0,0,0,${a})`;
    ctx.fillRect(Math.random() * w, Math.random() * h, 1 + Math.random() * 2, 1 + Math.random() * 2);
  }
}
function woodTex(base, repeat) {
  return canvasTex(512, 512, (ctx, w, h) => {
    ctx.fillStyle = base; ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 260; i++) {
      const y = Math.random() * h;
      ctx.strokeStyle = `rgba(${Math.random() > 0.5 ? '255,220,170' : '20,10,0'},${0.03 + Math.random() * 0.08})`;
      ctx.lineWidth = 0.5 + Math.random() * 2;
      ctx.beginPath(); ctx.moveTo(0, y);
      ctx.bezierCurveTo(w * 0.3, y + (Math.random() - 0.5) * 8, w * 0.7, y + (Math.random() - 0.5) * 8, w, y + (Math.random() - 0.5) * 4);
      ctx.stroke();
    }
  }, repeat);
}

export const lectureHall = {
  fog: { color: 0x070605, corridor: 0.05, hall: 0.016 },

  // Camera journey. pos[i] pairs with look[i].
  path: {
    pos: [
      [0, 1.6, 4], [0, 1.6, -6], [0.12, 1.6, -15], [0, 1.6, -21.4],
      [0, 1.58, -25.6], [0, 1.3, -28.3], [-0.4, 1.0, -29.7], [-1.05, 0.78, -29.95],
    ],
    look: [
      [0, 1.5, -12], [0, 1.5, -20], [0, 1.5, -24], [0, 1.45, -26],
      [-1.6, 0.3, -37], [-2.2, 0.0, -36], [-2.8, 0.15, -32.6], [-2.35, 0.2, -31.9],
    ],
    // scroll progress -> position along path (0..1). Flat stretches are pauses.
    timing: [
      [0, 0], [0.05, 0.02], [0.34, 3 / 7], [0.45, 3.12 / 7], [0.58, 4 / 7],
      [0.65, 4.1 / 7], [0.88, 1], [1, 1],
    ],
  },
  doors: [0.33, 0.45],   // scroll range over which the doors open
  arrive: 0.9,           // scroll point where the story card appears

  build(ctx) {
    const g = new THREE.Group();
    const M = (o) => new THREE.MeshStandardMaterial(o);
    const plaster = M({ map: canvasTex(256, 256, (c, w, h) => noise(c, w, h, '#57534c', 0.05), [6, 2]), roughness: 0.95 });
    const plasterDark = M({ color: 0x2b2926, roughness: 0.95 });
    const floorCorr = M({ map: canvasTex(256, 256, (c, w, h) => noise(c, w, h, '#2a2724', 0.09, 14000), [3, 24]), roughness: 0.28, metalness: 0.05 });
    const wood = M({ map: woodTex('#5a3d26', [4, 1]), roughness: 0.55 });
    const woodDark = M({ map: woodTex('#33231a', [2, 2]), roughness: 0.6 });
    const carpet = M({ map: canvasTex(256, 256, (c, w, h) => noise(c, w, h, '#22262b', 0.12, 20000), [10, 2]), roughness: 1 });
    const seatMat = M({ color: 0x3a2320, roughness: 0.9 });
    const metal = M({ color: 0x1b1b1c, roughness: 0.45, metalness: 0.7 });
    const ceilMat = M({ color: 0x1e1d1b, roughness: 1 });

    const box = (w, h, d, mat, x, y, z, shadow = true) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
      m.position.set(x, y, z); m.castShadow = shadow; m.receiveShadow = true; g.add(m); return m;
    };

    // ---------- Corridor (z = 7 … -24) ----------
    const CL = 31, CZ = -8.5, CW = 3.6, CH = 3.3;
    box(CW, 0.2, CL, floorCorr, 0, -0.1, CZ);
    box(CW, 0.2, CL, ceilMat, 0, CH + 0.1, CZ);
    box(0.3, CH, CL, plaster, -CW / 2 - 0.15, CH / 2, CZ);
    box(0.3, CH, CL, plaster, CW / 2 + 0.15, CH / 2, CZ);
    box(CW, CH, 0.3, plasterDark, 0, CH / 2, 7.15);
    // baseboards + wainscot rail
    for (const s of [-1, 1]) {
      box(0.04, 0.14, CL, woodDark, s * (CW / 2 - 0.02), 0.07, CZ, false);
      box(0.03, 0.06, CL, woodDark, s * (CW / 2 - 0.015), 1.05, CZ, false);
    }
    // side doors, notice boards, ceiling lights
    const doorSide = M({ map: woodTex('#3b2a1f', [1, 2]), roughness: 0.5 });
    const cork = M({ color: 0x6b5236, roughness: 1 });
    const paper = M({ color: 0xd9d2c0, roughness: 0.9 });
    const lightPanel = M({ color: 0x000000, emissive: 0xffe2b0, emissiveIntensity: 2.2 });
    const corridorLights = [];
    for (let i = 0; i < 6; i++) {
      const z = 2 - i * 4.6;
      const s = i % 2 ? 1 : -1;
      box(0.06, 2.15, 1.0, doorSide, s * (CW / 2 - 0.02), 1.075, z - 1.2, false);
      box(0.08, 2.3, 1.16, woodDark, s * (CW / 2 - 0.01), 1.15, z - 1.2, false);
      box(0.03, 0.03, 0.12, metal, s * (CW / 2 - 0.07), 1.02, z - 0.85, false);
      box(0.04, 0.9, 1.5, cork, -s * (CW / 2 - 0.02), 1.6, z - 2.6, false);
      for (let k = 0; k < 5; k++)
        box(0.045, 0.22 + Math.random() * 0.12, 0.17, paper, -s * (CW / 2 - 0.03), 1.4 + Math.random() * 0.45, z - 3.2 + k * 0.28, false)
          .rotation.x = (Math.random() - 0.5) * 0.12;
      box(1.1, 0.03, 0.35, lightPanel, 0, CH - 0.01, z - 2, false);
      box(1.3, 0.08, 0.5, metal, 0, CH + 0.03, z - 2, false);
      if (i % 2 === 0 || i === 5) {
        const pl = new THREE.PointLight(0xffd9a8, 9, 9, 1.8);
        pl.position.set(0, CH - 0.35, z - 2); g.add(pl); corridorLights.push(pl);
      }
    }
    // bench
    box(0.4, 0.05, 1.6, wood, 1.5, 0.45, -10.5); box(0.05, 0.45, 0.05, metal, 1.5, 0.22, -9.9); box(0.05, 0.45, 0.05, metal, 1.5, 0.22, -11.1);

    // ---------- Door wall (z = -24) ----------
    const DZ = -24;
    box(0.8, CH, 0.3, plasterDark, -1.4, CH / 2, DZ);
    box(0.8, CH, 0.3, plasterDark, 1.4, CH / 2, DZ);
    box(2.0, CH - 2.4, 0.3, plasterDark, 0, 2.4 + (CH - 2.4) / 2, DZ);
    box(2.16, 0.1, 0.36, woodDark, 0, 2.45, DZ, false);
    for (const s of [-1, 1]) box(0.08, 2.4, 0.36, woodDark, s * 1.04, 1.2, DZ, false);
    const sign = canvasTex(512, 128, (c, w, h) => {
      c.fillStyle = '#14120f'; c.fillRect(0, 0, w, h);
      c.fillStyle = '#d8c9a8'; c.font = '500 44px Georgia, serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText('LECTURE HALL  001', w / 2, h / 2 + 2);
    });
    const signMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.3), new THREE.MeshStandardMaterial({ map: sign, emissive: 0xffffff, emissiveMap: sign, emissiveIntensity: 0.35, roughness: 0.6 }));
    signMesh.position.set(0, 2.85, DZ + 0.16); g.add(signMesh);
    const signLight = new THREE.SpotLight(0xffd9a8, 14, 5, 0.5, 0.8, 1.5);
    signLight.position.set(0, 3.2, DZ + 1.4); signLight.target.position.set(0, 1.9, DZ); g.add(signLight, signLight.target);

    const doorMat = M({ map: woodTex('#4a3122', [1, 2]), roughness: 0.45 });
    const glassGlow = new THREE.MeshBasicMaterial({ color: 0xffc98a, transparent: true, opacity: 0.55 });
    const leaves = [];
    for (const s of [-1, 1]) {
      const hinge = new THREE.Group(); hinge.position.set(s * 1.0, 0, DZ);
      const leaf = new THREE.Mesh(new THREE.BoxGeometry(1.0, 2.38, 0.06), doorMat);
      leaf.position.set(-s * 0.5, 1.19, 0); leaf.castShadow = true; leaf.receiveShadow = true; hinge.add(leaf);
      for (const zz of [0.035, -0.035]) {
        const win = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.7), glassGlow);
        win.position.set(-s * 0.72, 1.55, zz); if (zz < 0) win.rotation.y = Math.PI; hinge.add(win);
      }
      const bar = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.5, 0.05), metal); bar.position.set(-s * 0.9, 1.1, 0.06); hinge.add(bar);
      g.add(hinge); leaves.push({ hinge, s });
    }
    const spill = new THREE.PointLight(0xffb469, 0, 12, 1.6); spill.position.set(0, 1.4, DZ - 0.8); g.add(spill);

    // ---------- Lecture hall (z = -24.15 … -46, x = -9 … 9) ----------
    const HX = 9, HZ0 = -24.15, HZ1 = -46, HC = 5.2, FLOOR = -STEP * (ROWS + 1);
    const hallLen = HZ0 - HZ1, hallMid = (HZ0 + HZ1) / 2;
    box(HX * 2, 0.2, (HZ0 + 0.3) - (ROW_Z0 + ROW_D / 2), carpet, 0, -0.1, (HZ0 + 0.3 + ROW_Z0 + ROW_D / 2) / 2); // landing
    for (let k = 0; k < ROWS; k++) box(HX * 2, rowY(k) - FLOOR + 0.3, ROW_D, carpet, 0, (rowY(k) + FLOOR - 0.3) / 2, rowZ(k));
    const frontZ0 = rowZ(ROWS - 1) - ROW_D / 2;
    box(HX * 2, 0.3, frontZ0 - HZ1, woodDark, 0, FLOOR - 0.15, (frontZ0 + HZ1) / 2);
    box(HX * 2 + 0.6, 0.3, hallLen + 0.3, ceilMat, 0, HC + 0.15, hallMid);
    // back wall (either side of corridor) & front wall
    for (const s of [-1, 1]) box(HX - 1.8, HC, 0.3, plasterDark, s * (1.8 + (HX - 1.8) / 2), HC / 2, HZ0 + 0.15);
    box(3.6, HC - CH, 0.3, plasterDark, 0, CH + (HC - CH) / 2, HZ0 + 0.15);
    box(HX * 2, HC - FLOOR, 0.3, plaster, 0, (HC + FLOOR) / 2, HZ1 - 0.15);
    // right wall: timber slats
    const slats = M({ map: canvasTex(256, 256, (c, w, h) => {
      c.fillStyle = '#2a1c13'; c.fillRect(0, 0, w, h);
      for (let x = 0; x < w; x += 16) { c.fillStyle = `rgb(${70 + Math.random() * 16},${46 + Math.random() * 10},${28 + Math.random() * 8})`; c.fillRect(x, 0, 11, h); }
    }, [14, 1]), roughness: 0.6 });
    box(0.3, HC - FLOOR, hallLen, slats, HX + 0.15, (HC + FLOOR) / 2, hallMid);
    // left wall with real window openings
    const WIN = { w: 2.0, y0: 0.5, y1: 4.3, zs: [-28.4, -31.7, -35.0, -38.3, -41.6] };
    box(0.4, WIN.y0 - FLOOR, hallLen, plaster, -HX - 0.2, (WIN.y0 + FLOOR) / 2, hallMid);
    box(0.4, HC - WIN.y1, hallLen, plaster, -HX - 0.2, (HC + WIN.y1) / 2, hallMid);
    const edges = [HZ0, ...WIN.zs.flatMap((z) => [z + WIN.w / 2, z - WIN.w / 2]), HZ1];
    for (let i = 0; i < edges.length; i += 2) box(0.4, WIN.y1 - WIN.y0, edges[i] - edges[i + 1], plaster, -HX - 0.2, (WIN.y0 + WIN.y1) / 2, (edges[i] + edges[i + 1]) / 2);
    const sky = new THREE.MeshBasicMaterial({ color: 0xffd7a0 });
    const shaftTex = canvasTex(64, 256, (c, w, h) => {
      const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, 'rgba(255,205,140,0.55)'); gr.addColorStop(1, 'rgba(255,205,140,0)');
      c.fillStyle = gr; c.fillRect(0, 0, w, h);
      const gx = c.createLinearGradient(0, 0, w, 0); gx.addColorStop(0, 'rgba(0,0,0,1)'); gx.addColorStop(0.25, 'rgba(0,0,0,0)'); gx.addColorStop(0.75, 'rgba(0,0,0,0)'); gx.addColorStop(1, 'rgba(0,0,0,1)');
      c.globalCompositeOperation = 'destination-out'; c.fillStyle = gx; c.fillRect(0, 0, w, h);
    });
    const shaftMat = new THREE.MeshBasicMaterial({ map: shaftTex, transparent: true, opacity: 0.085, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false });
    const SUN = new THREE.Vector3(1, -0.42, -0.16).normalize();
    for (const z of WIN.zs) {
      const pane = new THREE.Mesh(new THREE.PlaneGeometry(WIN.w, WIN.y1 - WIN.y0), sky);
      pane.rotation.y = Math.PI / 2; pane.position.set(-HX - 0.38, (WIN.y0 + WIN.y1) / 2, z); g.add(pane);
      box(0.06, WIN.y1 - WIN.y0, 0.05, metal, -HX - 0.05, (WIN.y0 + WIN.y1) / 2, z, true);
      for (const yy of [1.75, 3.05]) box(0.06, 0.05, WIN.w, metal, -HX - 0.05, yy, z, true);
      box(0.5, 0.05, WIN.w + 0.1, woodDark, -HX + 0.05, WIN.y0, z, false);
      // light shafts: 3 stacked sheets following the sun direction
      for (const yy of [1.2, 2.4, 3.6]) {
        const len = 9;
        const sh = new THREE.Mesh(new THREE.PlaneGeometry(WIN.w * 0.9, len), shaftMat);
        const mid = new THREE.Vector3(-HX, yy, z).addScaledVector(SUN, len / 2);
        sh.position.copy(mid);
        sh.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), SUN);
        sh.rotateY(Math.PI / 2);
        g.add(sh);
      }
    }
    const sun = new THREE.DirectionalLight(0xffc27d, 0);
    sun.position.copy(new THREE.Vector3(0, 1, -34).addScaledVector(SUN, -30)); sun.target.position.set(0, 1, -34);
    sun.castShadow = true; sun.shadow.mapSize.set(ctx.mobile ? 1024 : 2048, ctx.mobile ? 1024 : 2048);
    Object.assign(sun.shadow.camera, { left: -22, right: 22, top: 12, bottom: -12, near: 5, far: 60 });
    sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.03;
    g.add(sun, sun.target);
    const hallFill = new THREE.PointLight(0xffc893, 0, 26, 1.4); hallFill.position.set(-5, 3.2, -34); g.add(hallFill);
    const hallCool = new THREE.PointLight(0x8fa6c4, 0, 24, 1.5); hallCool.position.set(5, 3.5, -30); g.add(hallCool);

    // rows: benches + seats
    const padG = new THREE.BoxGeometry(0.46, 0.07, 0.42), backG = new THREE.BoxGeometry(0.46, 0.5, 0.06);
    const perSide = 13, total = ROWS * perSide * 2;
    const pads = new THREE.InstancedMesh(padG, seatMat, total), backs = new THREE.InstancedMesh(backG, seatMat, total);
    pads.castShadow = backs.castShadow = true; pads.receiveShadow = backs.receiveShadow = true;
    const m4 = new THREE.Matrix4(); let n = 0;
    for (let k = 0; k < ROWS; k++) {
      const y = rowY(k), z = rowZ(k);
      for (const s of [-1, 1]) {
        box(7.7, 0.04, 0.4, wood, s * 4.95, y + 0.74, z - 0.33);
        box(7.7, 0.72, 0.03, woodDark, s * 4.95, y + 0.37, z - 0.52);
        for (let i = 0; i < perSide; i++) {
          const x = s * (1.1 + 0.6 * i);
          m4.makeTranslation(x, y + 0.45, z + 0.14); pads.setMatrixAt(n, m4);
          m4.makeRotationX(0.12).setPosition(x, y + 0.72, z + 0.4); backs.setMatrixAt(n, m4); n++;
        }
      }
    }
    g.add(pads, backs);
    // front: chalkboard, lectern, a few notebooks left on desks
    const board = M({ map: canvasTex(512, 256, (c, w, h) => {
      noise(c, w, h, '#1b2420', 0.05, 5000);
      c.strokeStyle = 'rgba(230,230,220,0.16)'; c.lineWidth = 2;
      for (let i = 0; i < 7; i++) { c.beginPath(); const y = 40 + i * 28; c.moveTo(40 + Math.random() * 30, y); for (let x = 70; x < 300 + Math.random() * 160; x += 14) c.lineTo(x, y + (Math.random() - 0.5) * 7); c.stroke(); }
    }), roughness: 0.85 });
    box(9, 2.6, 0.06, board, 0, FLOOR + 2.4, HZ1 + 0.05, false);
    box(9.3, 0.08, 0.14, woodDark, 0, FLOOR + 1.06, HZ1 + 0.1, false);
    box(0.7, 1.1, 0.5, woodDark, 2.6, FLOOR + 0.55, -43.2); box(0.8, 0.04, 0.6, wood, 2.6, FLOOR + 1.12, -43.2);
    const page = M({ color: 0xe8e2d2, roughness: 0.9 });
    for (const [k, x] of [[1, 3.4], [2, -5.2], [3, 1.7], [5, -4.1], [6, 4.6], [7, -1.9]]) {
      const b = box(0.21, 0.02, 0.29, k % 2 ? page : M({ color: 0x25324a, roughness: 0.7 }), x, rowY(k) + 0.775, rowZ(k) - 0.33); b.rotation.y = (Math.random() - 0.5) * 0.7;
    }

    // ---------- The student (seen from behind — no face is shown) ----------
    const st = new THREE.Group(); st.position.set(STUDENT_X, rowY(STUDENT_ROW), rowZ(STUDENT_ROW));
    const hoodie = M({ color: 0x5d584f, roughness: 0.95 }), jeans = M({ color: 0x1f2733, roughness: 0.9 });
    const hair = M({ color: 0x0c0a09, roughness: 0.55 }), skin = M({ color: 0xc79a7b, roughness: 0.7 });
    const up = new THREE.Vector3(0, 1, 0);
    const limb = (a, b, r, mat) => {
      const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), d = B.clone().sub(A);
      const m = new THREE.Mesh(new THREE.CapsuleGeometry(r, d.length(), 6, 14), mat);
      m.position.copy(A).addScaledVector(d, 0.5); m.quaternion.setFromUnitVectors(up, d.normalize());
      m.castShadow = true; m.receiveShadow = true; st.add(m); return m;
    };
    const ball = (r, p, mat, sc) => { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 24, 18), mat); m.position.set(...p); if (sc) m.scale.set(...sc); m.castShadow = true; st.add(m); return m; };
    for (const s of [-1, 1]) {
      limb([s * 0.09, 0.53, 0.16], [s * 0.1, 0.53, -0.26], 0.075, jeans);
      limb([s * 0.1, 0.5, -0.28], [s * 0.1, 0.1, -0.22], 0.058, jeans);
      limb([s * 0.2, 0.99, 0.07], [s * 0.25, 0.78, -0.1], 0.052, hoodie);
      limb([s * 0.25, 0.78, -0.12], [s * 0.1, 0.8, -0.4], 0.043, hoodie);
      ball(0.04, [s * 0.08, 0.8, -0.44], skin, [1, 0.6, 1.2]);
    }
    limb([0, 0.6, 0.17], [0, 0.95, 0.08], 0.15, hoodie).scale.set(1.15, 1, 0.82);
    limb([-0.17, 1.0, 0.07], [0.17, 1.0, 0.07], 0.078, hoodie);
    ball(0.13, [0, 0.98, 0.15], hoodie, [1.25, 0.7, 0.6]); // hood resting on the back
    limb([0, 1.0, 0.06], [0, 1.1, 0.045], 0.045, skin);
    ball(0.1, [0, 1.2, 0.03], skin, [0.9, 1.1, 1]);
    ball(0.108, [0, 1.215, 0.05], hair, [0.95, 1.08, 1.02]);
    limb([0, 1.16, 0.1], [0, 0.86, 0.17], 0.085, hair).scale.set(1.45, 1, 0.55);
    ball(0.035, [0.02, 1.33, 0.08], hair, [1.3, 0.9, 1.3]); // small bun
    g.add(st);
    const deskY = rowY(STUDENT_ROW) + 0.765, deskZ = rowZ(STUDENT_ROW) - 0.36;
    for (const s of [-1, 1]) box(0.19, 0.012, 0.27, page, STUDENT_X + s * 0.1, deskY, deskZ, true).rotation.z = s * -0.03;
    box(0.012, 0.012, 0.15, metal, STUDENT_X + 0.13, deskY + 0.012, deskZ + 0.02, false).rotation.y = 0.5;
    const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.032, 0.11, 20), M({ color: 0xe9e4d8, roughness: 0.8 })); cup.position.set(STUDENT_X + 0.42, deskY + 0.05, deskZ + 0.02); cup.castShadow = true; g.add(cup);
    box(0.33, 0.012, 0.23, M({ color: 0x9a9da3, roughness: 0.35, metalness: 0.8 }), STUDENT_X - 0.5, deskY, deskZ + 0.01); // closed laptop
    box(0.34, 0.36, 0.14, M({ color: 0x2f3a33, roughness: 1 }), STUDENT_X + 0.6, rowY(STUDENT_ROW) + 0.66, rowZ(STUDENT_ROW) + 0.2).rotation.x = -0.15; // bag on next seat
    const key = new THREE.SpotLight(0xffd3a1, 0, 7, 0.5, 0.9, 1.4);
    key.position.set(STUDENT_X + 0.4, 3.4, rowZ(STUDENT_ROW) - 1.6); key.target.position.set(STUDENT_X, rowY(STUDENT_ROW) + 0.8, rowZ(STUDENT_ROW) - 0.2); g.add(key, key.target);

    // ---------- Dust in the light ----------
    const DN = ctx.mobile ? 350 : 1100, dp = new Float32Array(DN * 3);
    for (let i = 0; i < DN; i++) { dp[i * 3] = -8.5 + Math.random() * 11; dp[i * 3 + 1] = FLOOR + 0.3 + Math.random() * 3.6; dp[i * 3 + 2] = -27 - Math.random() * 16; }
    const dustG = new THREE.BufferGeometry(); dustG.setAttribute('position', new THREE.BufferAttribute(dp, 3));
    const dust = new THREE.Points(dustG, new THREE.PointsMaterial({ color: 0xffd9a6, size: 0.013, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
    g.add(dust);

    const ss = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
    return {
      group: g,
      update(p, t) {
        const open = ss(lectureHall.doors[0], lectureHall.doors[1], p);
        for (const { hinge, s } of leaves) hinge.rotation.y = s * open * 1.75;
        const inHall = ss(0.3, 0.5, p);
        sun.intensity = 4.2 * inHall; hallFill.intensity = 30 * inHall; hallCool.intensity = 10 * inHall;
        spill.intensity = 22 * open * (1 - ss(0.5, 0.62, p));
        key.intensity = 8 * ss(0.6, 0.9, p);
        dust.material.opacity = 0.42 * inHall;
        for (const l of corridorLights) l.intensity = 9 * (1 - 0.6 * ss(0.5, 0.7, p));
        const a = dustG.attributes.position;
        for (let i = 0; i < DN; i += 1) { a.array[i * 3 + 1] += Math.sin(t * 0.3 + i) * 0.0006; a.array[i * 3] += Math.cos(t * 0.21 + i * 1.7) * 0.0005; }
        a.needsUpdate = true;
      },
    };
  },
};
