// ENGINE — renderer, scroll-driven camera, intro and story card.
// It knows nothing about lecture halls: it plays whatever environment the
// current story supplies (see stories.js and environments/).
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { STORIES, UPCOMING_ENVIRONMENTS } from './stories.js';

const story = STORIES[0], env = story.environment;
const $ = (id) => document.getElementById(id);
const root = document.documentElement;

// story card content comes from data, never from markup
$('s-label').textContent = story.label;
$('s-name').textContent = story.name;
$('s-desc').textContent = story.description;
$('s-cta').textContent = story.cta; $('s-cta').href = story.href;
$('cap1').textContent = env.captions[0]; $('cap2').textContent = env.captions[1];
$('s-next').textContent = 'More rooms in production: ' + UPCOMING_ENVIRONMENTS.join(', ').toLowerCase() + '.';

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const canvas = $('scene');
let renderer = null;
if (!reduced) {
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' }); } catch (e) { renderer = null; }
}
if (!renderer) {
  root.classList.add('flat'); // 2D fallback: no WebGL, or reduced motion requested
} else {
  root.classList.add('live', 'theme-' + (env.theme || 'dark'));
  const mobile = Math.min(innerWidth, innerHeight) < 700 || /Mobi|Android/i.test(navigator.userAgent);
  renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.5 : 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = env.exposure || 1;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(env.fog.color);
  scene.fog = new THREE.FogExp2(env.fog.color, env.fog.corridor);
  const pm = new THREE.PMREMGenerator(renderer);
  scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture; scene.environmentIntensity = env.theme === 'light' ? 0.45 : 0.1;

  const camera = new THREE.PerspectiveCamera(50, 1, 0.08, 90);
  const built = env.build({ mobile, story });
  scene.add(built.group);

  const toV = (a) => a.map((p) => new THREE.Vector3(...p));
  const posCurve = new THREE.CatmullRomCurve3(toV(env.path.pos), false, 'centripetal');
  const lookCurve = new THREE.CatmullRomCurve3(toV(env.path.look), false, 'centripetal');
  const ease = (t) => t * t * (3 - 2 * t);
  const along = (p) => {
    const T = env.path.timing;
    for (let i = 1; i < T.length; i++) if (p <= T[i][0]) {
      const [p0, u0] = T[i - 1], [p1, u1] = T[i];
      return u0 + (u1 - u0) * ease((p - p0) / (p1 - p0 || 1));
    }
    return 1;
  };

  let composer = null;
  if (!mobile) {
    composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    composer.addPass(new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), env.bloom ?? 0.42, 0.9, 0.9));
    composer.addPass(new OutputPass());
  }
  const resize = () => {
    const w = innerWidth, h = innerHeight;
    renderer.setSize(w, h, false); composer && composer.setSize(w, h);
    camera.aspect = w / h; camera.fov = w < h ? 68 : 50; camera.updateProjectionMatrix();
  };
  addEventListener('resize', resize); resize();

  let target = 0, p = 0, mx = 0, my = 0, smx = 0, smy = 0;
  const readScroll = () => { const max = document.documentElement.scrollHeight - innerHeight; target = max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0; };
  addEventListener('scroll', readScroll, { passive: true }); readScroll();
  addEventListener('pointermove', (e) => { mx = e.clientX / innerWidth - 0.5; my = e.clientY / innerHeight - 0.5; });

  const fade = (a, b, c, d, x) => Math.min(Math.max((x - a) / (b - a), 0), 1) * (1 - Math.min(Math.max((x - c) / (d - c), 0), 1));
  const title = $('title'), hint = $('hint'), cap1 = $('cap1'), cap2 = $('cap2'), card = $('card'), bar = $('bar');
  const P = new THREE.Vector3(), L = new THREE.Vector3(), clock = new THREE.Clock();
  let shown = false;

  function frame() {
    const dt = Math.min(clock.getDelta(), 0.1), t = clock.elapsedTime;
    p += (target - p) * (1 - Math.exp(-dt * 3.2));
    smx += (mx - smx) * 0.04; smy += (my - smy) * 0.04;
    const u = along(p);
    posCurve.getPoint(u, P); lookCurve.getPoint(u, L);
    P.y += Math.sin(t * 0.9) * 0.006; // breathing, barely there
    L.x += smx * 0.5; L.y -= smy * 0.3;
    camera.position.copy(P); camera.lookAt(L);
    scene.fog.density = env.fog.corridor + (env.fog.hall - env.fog.corridor) * ease(Math.min(1, Math.max(0, (p - 0.36) / 0.2)));
    built.update(p, t);
    composer ? composer.render() : renderer.render(scene, camera);

    title.style.opacity = 1 - Math.min(1, p / 0.07);
    title.style.transform = `translateY(${-p * 300}px)`;
    hint.style.opacity = 1 - Math.min(1, p / 0.02);
    cap1.style.opacity = fade(0.12, 0.17, 0.27, 0.32, p);
    cap2.style.opacity = fade(0.57, 0.61, 0.68, 0.72, p);
    bar.style.transform = `scaleY(${p})`;
    const on = p > env.arrive;
    if (on !== shown) { shown = on; card.classList.toggle('on', on); card.setAttribute('aria-hidden', String(!on)); $('scrim').classList.toggle('on', on); }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(() => { frame(); root.classList.add('ready'); });

  // leave through black, like a cut
  $('s-cta').addEventListener('click', (e) => {
    e.preventDefault(); root.classList.add('leaving');
    setTimeout(() => { location.href = story.href; }, 700);
  });
  addEventListener('pageshow', (e) => { if (e.persisted) root.classList.remove('leaving'); });
}
