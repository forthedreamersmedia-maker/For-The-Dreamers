// ENVIRONMENT — a sunlit greenhouse library: glass roof, bookshelves, plants,
// a long reading table. Each published story is a book left open on the table.
// Same shape as every environment: theme, fog, path, arrive, build(ctx).
import * as THREE from 'three';

function canvasTex(w, h, draw, repeat) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); }
  return t;
}
function woodTex(base, repeat) {
  return canvasTex(512, 512, (ctx, w, h) => {
    ctx.fillStyle = base; ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 240; i++) {
      const y = Math.random() * h;
      ctx.strokeStyle = `rgba(${Math.random() > 0.5 ? '255,235,200' : '70,40,10'},${0.04 + Math.random() * 0.08})`;
      ctx.lineWidth = 0.5 + Math.random() * 2.2; ctx.beginPath(); ctx.moveTo(0, y);
      ctx.bezierCurveTo(w * 0.3, y + (Math.random() - 0.5) * 9, w * 0.7, y + (Math.random() - 0.5) * 9, w, y + (Math.random() - 0.5) * 5); ctx.stroke();
    }
  }, repeat);
}
const rnd = (a, b) => a + Math.random() * (b - a);

const W = 3, Z0 = 6.5, Z1 = -14, EAVE = 3.2, RIDGE = 5.4;   // room: x ±3, z 6.5 … -14
const BOOK = { x: 0.08, y: 0.795, z: -9.05 };               // Story 001, open on the table

export const greenhouseLibrary = {
  theme: 'light',
  exposure: 0.8,
  bloom: 0.07,
  fog: { color: 0xeef1e4, corridor: 0.0035, hall: 0.0035 },
  path: {
    pos: [[0, 1.65, 5.0], [-0.35, 1.62, 1.4], [-1.3, 1.58, -2.6], [-1.35, 1.56, -5.3], [-1.0, 1.5, -7.0], [-0.62, 1.4, -7.95]],
    look: [[0, 1.55, -6], [0.1, 1.3, -8], [0.5, 1.0, -8], [0.7, 0.9, -8.6], [0.25, 0.85, -9.0], [0.3, 0.84, -9.1]],
    timing: [[0, 0], [0.06, 0.02], [0.5, 0.6], [0.58, 0.63], [0.88, 1], [1, 1]],
  },
  arrive: 0.9,
  captions: ['Dreams shouldn’t depend on who you know.', 'The first story is open on the table.'],

  build(ctx) {
    const g = new THREE.Group();
    const M = (o) => new THREE.MeshStandardMaterial(o);
    const oak = M({ map: woodTex('#b98d5c', [3, 1]), roughness: 0.6 });
    const oakShelf = M({ map: woodTex('#a87a4a', [1, 1]), roughness: 0.7 });
    const white = M({ color: 0xf2efe6, roughness: 0.6 });
    const terracotta = M({ color: 0xb5613c, roughness: 0.9 });
    const stone = M({ map: canvasTex(512, 512, (c, w, h) => {
      c.fillStyle = '#8f8674'; c.fillRect(0, 0, w, h);
      for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) {
        const off = y % 2 ? 64 : 0, l = 178 + Math.random() * 30;
        c.fillStyle = `rgb(${l},${l - 8},${l - 26})`; c.fillRect(x * 128 + off + 2, y * 128 + 2, 124, 124); c.fillRect(x * 128 + off - 512 + 2, y * 128 + 2, 124, 124);
      }
      for (let i = 0; i < 7000; i++) { c.fillStyle = `rgba(${Math.random() > 0.5 ? 255 : 60},${Math.random() > 0.5 ? 250 : 50},${40},${Math.random() * 0.06})`; c.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
    }, [3, 10]), roughness: 0.85 });
    const box = (w, h, d, mat, x, y, z, shadow = true) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z);
      m.castShadow = shadow; m.receiveShadow = true; g.add(m); return m;
    };
    const LEN = Z0 - Z1, ZM = (Z0 + Z1) / 2;

    // floor, right wall (behind the shelves), low left wall
    box(W * 2 + 2, 0.2, LEN + 2, stone, 0, -0.1, ZM, false);
    box(0.2, EAVE, LEN, white, W + 0.1, EAVE / 2, ZM);
    box(0.2, 0.7, LEN, white, -W - 0.1, 0.35, ZM);
    box(0.3, 0.05, LEN, oak, -W + 0.05, 0.72, ZM, false);

    // garden seen through the glass
    const garden = canvasTex(512, 512, (c, w, h) => {
      c.fillStyle = '#9dbb78'; c.fillRect(0, 0, w, h);
      for (let i = 0; i < 900; i++) {
        const l = Math.random();
        c.fillStyle = `rgba(${60 + l * 130},${110 + l * 110},${40 + l * 70},0.5)`;
        c.beginPath(); c.arc(Math.random() * w, Math.random() * h, 6 + Math.random() * 30, 0, 7); c.fill();
      }
    }, [5, 1]);
    const gardenMat = new THREE.MeshBasicMaterial({ map: garden, fog: false });
    const gl = new THREE.Mesh(new THREE.PlaneGeometry(LEN + 8, 5), gardenMat); gl.rotation.y = Math.PI / 2; gl.position.set(-W - 2.2, 2.2, ZM); g.add(gl);
    const ge = new THREE.Mesh(new THREE.PlaneGeometry(14, 6), gardenMat); ge.position.set(0, 2.6, Z1 - 2.5); g.add(ge);
    const gb = new THREE.Mesh(new THREE.PlaneGeometry(14, 6), gardenMat); gb.rotation.y = Math.PI; gb.position.set(0, 2.6, Z0 + 2.5); g.add(gb);

    // glazing bars: left wall, gable ends, roof
    for (let z = Z0; z >= Z1 - 0.01; z -= 1.025) box(0.07, EAVE - 0.7, 0.07, white, -W, 0.7 + (EAVE - 0.7) / 2, z);
    box(0.08, 0.08, LEN, white, -W, 2.1, ZM); box(0.12, 0.12, LEN, white, -W, EAVE, ZM); box(0.12, 0.12, LEN, white, W, EAVE, ZM);
    const SL = Math.hypot(W, RIDGE - EAVE), ANG = Math.atan2(RIDGE - EAVE, W);
    for (let z = Z0; z >= Z1 - 0.01; z -= 1.025) for (const s of [-1, 1]) {
      const r = box(SL, 0.09, 0.06, white, s * W / 2, (EAVE + RIDGE) / 2, z); r.rotation.z = -s * ANG;
    }
    box(0.1, 0.14, LEN, white, 0, RIDGE, ZM);
    for (const s of [-1, 1]) box(0.07, 0.07, LEN, white, s * W / 2, (EAVE + RIDGE) / 2 - 0.02, ZM);
    for (const z of [Z1, Z0]) {                                   // gable ends
      box(W * 2, 0.12, 0.1, white, 0, EAVE, z);
      for (const x of [-2, -1, 0, 1, 2]) box(0.07, (RIDGE - EAVE) * (1 - Math.abs(x) / W), 0.07, white, x, EAVE + (RIDGE - EAVE) * (1 - Math.abs(x) / W) / 2, z);
    }
    // end wall with French doors
    for (const s of [-1, 1]) { box(1.9, EAVE, 0.16, white, s * 2.05, EAVE / 2, Z1); }
    box(2.2, EAVE - 2.4, 0.16, white, 0, 2.4 + (EAVE - 2.4) / 2, Z1);
    for (const s of [-1, 1]) {
      const cx = s * 0.55;
      box(0.09, 2.4, 0.07, white, cx - 0.5, 1.2, Z1); box(0.09, 2.4, 0.07, white, cx + 0.5, 1.2, Z1);
      box(1.09, 0.09, 0.07, white, cx, 2.36, Z1); box(1.09, 0.2, 0.07, white, cx, 0.1, Z1);
      for (const yy of [0.85, 1.6]) box(1.0, 0.04, 0.05, white, cx, yy, Z1);
      box(0.04, 2.3, 0.05, white, cx, 1.2, Z1);
    }
    box(W * 2, EAVE, 0.16, white, 0, EAVE / 2, Z0 + 0.4);         // wall behind the visitor

    // ---------- bookshelves + books ----------
    const palette = [0xe9dfc8, 0xd8c7a3, 0x9c3f2c, 0x7a5a3a, 0x2f4a3a, 0x24364f, 0xc9a25a, 0xb9b3a4, 0x6d2b2b, 0x4f6b58, 0xefe9da, 0x8a9aa8];
    const bookM = [], col = new THREE.Color();
    const shelfUnit = (x, zA, zB, top, face) => {                 // face: +1 looks toward +x, -1 toward -x
      const len = zA - zB, zm = (zA + zB) / 2, D = 0.3;
      box(D, 0.05, len, oakShelf, x, top, zm);
      for (let z = zA; z >= zB - 0.01; z -= len / Math.round(len / 1.5)) box(D, top, 0.05, oakShelf, x, top / 2, z);
      box(0.03, top, len, oakShelf, x - face * D / 2, top / 2, zm, false);
      for (let y = 0.12; y < top - 0.3; y += 0.42) {
        box(D, 0.035, len, oakShelf, x, y, zm, false);
        let z = zA - 0.06;
        while (z > zB + 0.08) {
          if (Math.random() < 0.06) { z -= rnd(0.1, 0.3); continue; }
          if (Math.random() < 0.07) {                             // a small flat stack
            const n = 2 + Math.floor(Math.random() * 4), l = rnd(0.2, 0.26);
            for (let i = 0; i < n; i++) bookM.push([x + face * 0.02, y + 0.035 + 0.02 * i + 0.015, z - l / 2, rnd(0.17, 0.21), 0.035, l, 0]);
            z -= l + 0.02; continue;
          }
          const t = rnd(0.022, 0.06), h = rnd(0.2, 0.33), d = rnd(0.16, 0.22);
          bookM.push([x + face * (D / 2 - d / 2 - 0.02), y + 0.018 + h / 2, z - t / 2, d, h, t, Math.random() < 0.08 ? rnd(-0.18, 0.18) : 0]);
          z -= t + 0.002;
        }
      }
    };
    shelfUnit(W - 0.16, Z0 - 0.2, Z1 + 0.3, 3.15, -1);            // right wall, floor to eave
    shelfUnit(-W + 0.45, 4.6, 0.6, 2.4, 1);                       // a run on the left, near the entrance
    const books = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), M({ roughness: 0.85 }), bookM.length);
    const o = new THREE.Object3D();
    bookM.forEach(([x, y, z, sx, sy, sz, tilt], i) => {
      o.position.set(x, y, z); o.scale.set(sx, sy, sz); o.rotation.set(tilt, 0, 0); o.updateMatrix(); books.setMatrixAt(i, o.matrix);
      col.setHex(palette[Math.floor(Math.random() * palette.length)]).multiplyScalar(rnd(0.8, 1.08)); books.setColorAt(i, col);
    });
    books.castShadow = !ctx.mobile; books.receiveShadow = true; g.add(books);
    // library ladder leaning on the left run
    const lad = new THREE.Group(); lad.position.set(-W + 1.15, 0, 2.2); lad.rotation.z = 0.24;
    for (const dz of [-0.24, 0.24]) { const r = new THREE.Mesh(new THREE.BoxGeometry(0.05, 2.9, 0.035), oak); r.position.set(0, 1.45, dz); r.castShadow = true; lad.add(r); }
    for (let y = 0.3; y < 2.8; y += 0.3) { const r = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.03, 0.48), oak); r.position.set(0, y, 0); r.castShadow = true; lad.add(r); }
    g.add(lad);

    // ---------- reading table, chairs, books ----------
    const TZ = -6.6, TL = 6.4;
    box(1.15, 0.06, TL, oak, 0, 0.76, TZ);
    box(0.95, 0.1, TL - 0.4, oakShelf, 0, 0.68, TZ, false);
    for (const dz of [-TL / 2 + 0.25, 0, TL / 2 - 0.25]) for (const s of [-1, 1]) box(0.09, 0.73, 0.09, oakShelf, s * 0.45, 0.365, TZ + dz);
    const chair = (x, z, rot) => {
      const c = new THREE.Group(); c.position.set(x, 0, z); c.rotation.y = rot;
      const add = (w, h, d, px, py, pz, mat = oakShelf) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(px, py, pz); m.castShadow = true; m.receiveShadow = true; c.add(m); };
      add(0.44, 0.04, 0.42, 0, 0.46, 0); add(0.38, 0.03, 0.36, 0, 0.49, 0, M({ color: 0x7c3b2a, roughness: 0.9 }));
      for (const sx of [-1, 1]) { add(0.04, 0.46, 0.04, sx * 0.19, 0.23, -0.18); add(0.04, 0.95, 0.04, sx * 0.19, 0.475, 0.19); }
      add(0.42, 0.07, 0.03, 0, 0.9, 0.19); add(0.42, 0.05, 0.03, 0, 0.7, 0.19);
      g.add(c);
    };
    chair(-0.95, -4.6, -Math.PI / 2 + 0.2); chair(0.95, -5.4, Math.PI / 2 - 0.1); chair(0.9, -7.6, Math.PI / 2 + 0.25); chair(0.98, -9.1, Math.PI / 2 - 0.5); chair(0, -3.0, Math.PI + 0.1);
    const cover = (hex) => M({ color: hex, roughness: 0.8 }), pageM = M({ color: 0xe4dcc8, roughness: 0.95 });
    const stack = (x, z, n) => { for (let i = 0; i < n; i++) { const b = box(rnd(0.17, 0.22), 0.035, rnd(0.24, 0.3), cover(palette[Math.floor(Math.random() * palette.length)]), x, 0.81 + i * 0.036, z); b.rotation.y = rnd(-0.3, 0.3); } };
    stack(0.3, -4.3, 3); stack(-0.25, -5.6, 2); stack(0.32, -6.9, 4); stack(-0.3, -8.1, 1);
    const openBook = (x, y, z, rot, tex, s = 1) => {
      const b = new THREE.Group(); b.position.set(x, y, z); b.rotation.y = rot; b.scale.setScalar(s);
      const cv = new THREE.Mesh(new THREE.BoxGeometry(0.47, 0.012, 0.31), cover(0x2f4a3a)); cv.castShadow = true; b.add(cv);
      for (const sx of [-1, 1]) {
        const p = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.022, 0.29), tex ? [pageM, pageM, M({ map: tex[sx < 0 ? 0 : 1], roughness: 0.9 }), pageM, pageM, pageM] : pageM);
        p.position.set(sx * 0.113, 0.016, 0); p.rotation.z = sx * 0.06; p.castShadow = true; p.receiveShadow = true; b.add(p);
      }
      g.add(b);
    };
    const pageTex = (title) => canvasTex(360, 480, (c, w, h) => {
      c.fillStyle = '#e9e2cf'; c.fillRect(0, 0, w, h); c.fillStyle = '#1e1c18';
      let y = 60;
      if (title) { c.font = '500 15px Georgia,serif'; c.fillText('STORY 001', 40, 60); c.font = '400 40px Georgia,serif'; c.fillText(ctx.story.name, 40, 112); y = 160; }
      c.fillStyle = 'rgba(30,28,24,0.6)';
      for (; y < h - 50; y += 17) c.fillRect(40, y, (w - 80) * (Math.random() < 0.15 ? 0.55 : 1), 2.2);
    });
    openBook(BOOK.x, BOOK.y, BOOK.z, 0.12, [pageTex(true), pageTex(false)], 1.25);
    openBook(-0.2, 0.795, -6.2, -0.5, null);
    const pencil = box(0.008, 0.008, 0.17, M({ color: 0xc9a25a }), BOOK.x + 0.42, 0.8, BOOK.z + 0.05, false); pencil.rotation.y = 0.7;
    const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.034, 0.09, 24), white); cup.position.set(BOOK.x - 0.45, 0.835, BOOK.z - 0.12); cup.castShadow = true; g.add(cup);

    // ---------- plants ----------
    const leafShape = new THREE.Shape(); leafShape.moveTo(0, 0); leafShape.quadraticCurveTo(0.07, 0.07, 0, 0.24); leafShape.quadraticCurveTo(-0.07, 0.07, 0, 0);
    const leafM = [];
    const greens = [0x3f7d3a, 0x4f9444, 0x2f6a35, 0x6aa84f, 0x5b8f3c, 0x7cb35a];
    const bush = (x, y, z, r, n, droop = 0.3, size = 1) => {
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2, e = rnd(-droop, 1) * Math.PI / 2, d = r * Math.cbrt(Math.random());
        leafM.push([x + Math.cos(a) * Math.cos(e) * d, y + Math.sin(e) * d * 0.9, z + Math.sin(a) * Math.cos(e) * d, a, e, size * rnd(0.7, 1.5)]);
      }
    };
    const vine = (x, y, z, len, n) => { for (let i = 0; i < n; i++) { const t = Math.random(); leafM.push([x + rnd(-0.1, 0.1), y - t * len, z + rnd(-0.12, 0.12), Math.random() * 7, -1.2 + rnd(-0.4, 0.4), rnd(0.4, 0.75)]); } };
    const pot = (x, z, r, h, y0 = 0) => { const p = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 0.72, h, 20), terracotta); p.position.set(x, y0 + h / 2, z); p.castShadow = true; p.receiveShadow = true; g.add(p); };
    const k = ctx.mobile ? 0.5 : 1;
    for (let z = 0; z > Z1 + 0.5; z -= rnd(0.9, 1.5)) {            // along the glass wall
      const big = Math.random() < 0.45, x = -W + rnd(0.45, 0.8);
      if (big) { pot(x, z, 0.24, 0.42); bush(x, 1.2, z, rnd(0.55, 0.85), 230 * k, 0.2, 0.95); }
      else { pot(x, z, 0.15, 0.26); bush(x, 0.6, z, rnd(0.28, 0.4), 110 * k, 0.5, 0.65); }
      if (Math.random() < 0.6) { pot(-W + 0.08, z - 0.5, 0.1, 0.16, 0.74); bush(-W + 0.1, 1.06, z - 0.5, 0.24, 60 * k, 0.8, 0.5); }
    }
    for (let z = Z0 - 1; z > Z1; z -= rnd(1.6, 2.6)) {             // vines from the eaves and ridge
      vine(-W + 0.1, EAVE, z, rnd(0.8, 1.9), 80 * k);
      if (Math.random() < 0.5) vine(rnd(-1.4, 1.4), RIDGE - 0.3, z - 0.8, rnd(0.6, 1.3), 60 * k);
    }
    for (let z = Z0 - 0.5; z > Z1; z -= 0.5) if (Math.random() < 0.75) bush(-W + 0.05, EAVE - 0.05, z, 0.3, 24 * k, 1, 0.6);
    pot(2.35, -13.2, 0.26, 0.5); bush(2.35, 1.4, -13.2, 0.8, 280 * k, 0.1, 1.0);
    pot(-2.3, 5.4, 0.26, 0.5); bush(-2.3, 1.4, 5.4, 0.75, 240 * k, 0.1, 1.0);
    pot(0.05, -7.75, 0.09, 0.13, 0.79); bush(0.05, 1.04, -7.75, 0.17, 70 * k, 0.5, 0.4);
    for (const [y, z] of [[1.83, -2.2], [2.67, -6.4], [1.41, -10.8], [2.25, 3.1]]) { pot(W - 0.18, z, 0.07, 0.11, y - 0.4 + 0.02); bush(W - 0.24, y - 0.2, z, 0.18, 50 * k, 1, 0.45); }
    const leaves = new THREE.InstancedMesh(new THREE.ShapeGeometry(leafShape, 4), M({ roughness: 0.7, side: THREE.DoubleSide }), leafM.length);
    leafM.forEach(([x, y, z, a, e, s], i) => {
      o.position.set(x, y, z); o.rotation.set(0, 0, 0); o.rotateY(-a + Math.PI / 2); o.rotateX(Math.PI / 2 - e + rnd(-0.4, 0.4)); o.rotateY(rnd(-0.6, 0.6));
      o.scale.setScalar(s); o.updateMatrix(); leaves.setMatrixAt(i, o.matrix);
      col.setHex(greens[Math.floor(Math.random() * greens.length)]).multiplyScalar(rnd(0.75, 1.15)); leaves.setColorAt(i, col);
    });
    leaves.castShadow = true; leaves.receiveShadow = true; g.add(leaves);

    // ---------- light ----------
    g.add(new THREE.HemisphereLight(0xfdfbf4, 0xb9a988, 0.95));
    const sun = new THREE.DirectionalLight(0xfff0d2, 3.4);
    sun.position.set(7, 16, -1); sun.target.position.set(0, 0, -5);
    sun.castShadow = true; sun.shadow.mapSize.set(ctx.mobile ? 1024 : 4096, ctx.mobile ? 1024 : 4096);
    Object.assign(sun.shadow.camera, { left: -13, right: 13, top: 8, bottom: -8, near: 2, far: 40 });
    sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.02; g.add(sun, sun.target);
    // dust in the sun
    const DN = ctx.mobile ? 200 : 600, dp = new Float32Array(DN * 3);
    for (let i = 0; i < DN; i++) { dp[i * 3] = rnd(-2.6, 2.6); dp[i * 3 + 1] = rnd(0.4, 3.6); dp[i * 3 + 2] = rnd(Z1, 4); }
    const dustG = new THREE.BufferGeometry(); dustG.setAttribute('position', new THREE.BufferAttribute(dp, 3));
    g.add(new THREE.Points(dustG, new THREE.PointsMaterial({ color: 0xffffff, size: 0.012, transparent: true, opacity: 0.55, depthWrite: false })));

    return {
      group: g,
      update(p, t) {
        const a = dustG.attributes.position;
        for (let i = 0; i < DN; i++) { a.array[i * 3 + 1] += Math.sin(t * 0.3 + i) * 0.0005; a.array[i * 3] += Math.cos(t * 0.2 + i * 1.7) * 0.0004; }
        a.needsUpdate = true;
        leaves.rotation.z = Math.sin(t * 0.5) * 0.0015;           // the faintest stir of air
      },
    };
  },
};
