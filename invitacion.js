{
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- DATOS (edita aquí) ---------- */
const PADRES = [];          // ej.: ['Sr. Juan Pérez', 'Sra. Ana López']
const APELLIDO = '';        // ej.: 'Pérez López'
if (PADRES.length) {
  const box = $('#parents'); box.hidden = false;
  box.innerHTML = '<p class="role">Mis papás</p>';
  PADRES.forEach(n => { const p = document.createElement('p'); p.textContent = n; box.append(p); });
}
if (APELLIDO) $('#fullname').textContent = 'Gloria ' + APELLIDO;

/* ---------- BOLA DISCO QUE BAILA: teselas curvas ---------- */
{
  const g = document.getElementById('tiles'), NS = 'http://www.w3.org/2000/svg';
  const cx = 120, cy = 108, R = 78, rows = 9, cols = 12, tilt = .28;
  const shades = ['#ff9ccd', '#f37ab6', '#ffc6e2', '#e9609f', '#ffb3d8', '#fbd9ea'];
  const P = (la, lo) => { const x = Math.cos(la) * Math.sin(lo), y = Math.sin(la), z = Math.cos(la) * Math.cos(lo);
    return [cx + x * R, cy - (y * Math.cos(tilt) - z * Math.sin(tilt)) * R, y * Math.sin(tilt) + z * Math.cos(tilt)]; };
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const la0 = -Math.PI / 2 + Math.PI * r / rows, la1 = la0 + Math.PI / rows;
    const lo0 = -Math.PI / 2 + Math.PI * c / cols, lo1 = lo0 + Math.PI / cols;
    const pts = [P(la0, lo0), P(la0, lo1), P(la1, lo1), P(la1, lo0)];
    if (pts.every(p => p[2] < 0)) continue;
    const path = document.createElementNS(NS, 'path');
    path.setAttribute('d', 'M' + pts.map(p => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('L') + 'Z');
    const checker = (r + c) % 2 === 0;
    path.setAttribute('fill', checker ? shades[Math.floor(Math.random() * 2)] : shades[2 + Math.floor(Math.random() * 4)]);
    path.setAttribute('stroke', '#111'); path.setAttribute('stroke-width', '2');
    path.style.animationDelay = (-Math.random() * 2.4).toFixed(2) + 's';
    g.append(path);
  }
}

/* ---------- MÚSICA ---------- */
const music = $('#music'), musicBtn = $('#music-toggle');
let musicWanted = false;
const musicState = () => {
  const on = !music.paused;
  musicBtn.setAttribute('aria-pressed', String(on));
  musicBtn.setAttribute('aria-label', on ? 'Pausar música' : 'Reproducir música');
};
music.addEventListener('play', musicState); music.addEventListener('pause', musicState);
musicBtn.addEventListener('click', () => {
  if (music.paused) { musicWanted = true; music.play().catch(musicState); } else { musicWanted = false; music.pause(); }
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden) music.pause(); else if (musicWanted) music.play().catch(musicState);
});

/* ---------- BOLA DISCO DE PORTADA ---------- */
const ball = DiscoBall($('#ball'), { speed: .35 });
if (!reduced) ball.start();

/* reflejos de luz girando por la sala */
const ref = $('#reflejos'), refColors = ['#ffffff', '#ffd3ea', '#f58cc2', '#d4f6fb', '#7fe1f0'];
for (let i = 0; i < 46; i++) {
  const d = document.createElement('i');
  d.style.cssText = `--a:${Math.random() * 360}deg;--r:${60 + Math.random() * 70}vmax;--s:${4 + Math.random() * 9}px;--c:${refColors[i % refColors.length]};--d:-${Math.random() * 3}s`;
  ref.append(d);
}
function placeReflejos() {
  const r = $('#ball').getBoundingClientRect();
  ref.style.left = (r.left + r.width / 2) + 'px'; ref.style.top = (r.top + r.height / 2) + 'px';
  ref.querySelectorAll('i').forEach(d => d.style.setProperty('--r', (r.width * .7 + Math.random() * Math.max(innerWidth, innerHeight) * .7) + 'px'));
}
placeReflejos(); addEventListener('resize', placeReflejos);

/* ---------- ABRIR ---------- */
const observer = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target); }
}), { threshold: .1 });
$$('.reveal').forEach(sec => [...sec.children].forEach((c, i) => c.style.setProperty('--d', (i * .1).toFixed(2) + 's')));

let opened = false;
function openInvitation() {
  if (opened) return; opened = true;
  musicWanted = true; music.play().catch(musicState);
  $('#cover').classList.add('opening');
  // la bola acelera
  let s = ball.speed; const acc = setInterval(() => { s = Math.min(6, s * 1.25 + .1); ball.setSpeed(s); }, 60);
  setTimeout(() => $('#cover').classList.add('leaving'), reduced ? 50 : 2300);
  setTimeout(() => {
    clearInterval(acc); ball.stop();
    $('#cover').hidden = true; $('#invitation').hidden = false; $('#controls').hidden = false;
    animState(); window.scrollTo(0, 0); $('.name').focus({ preventScroll: true });
    $$('.reveal').forEach(s => observer.observe(s));
    startMiniBalls();
  }, reduced ? 200 : 3200);
}
$('#open').addEventListener('click', openInvitation);

/* ---------- ANIMACIONES ---------- */
const animBtn = $('#anim-toggle');
let animOn = !reduced;
const minis = [];
function animState() {
  document.body.classList.toggle('still', !animOn);
  animBtn.setAttribute('aria-pressed', String(animOn));
  animBtn.setAttribute('aria-label', animOn ? 'Pausar animaciones' : 'Reanudar animaciones');
  minis.forEach(m => animOn && m.visible ? m.ball.start() : m.ball.stop());
}
animBtn.addEventListener('click', () => { animOn = !animOn; animState(); });

function startMiniBalls() {
  $$('.mini-ball').forEach(c => {
    const m = { ball: DiscoBall(c, { speed: .5, rows: 18 }), visible: false }; minis.push(m);
    new IntersectionObserver(([e]) => { m.visible = e.isIntersecting; animOn && m.visible ? m.ball.start() : m.ball.stop(); }).observe(c);
  });
}

const colors = ['#ffffff', '#c6cad4', '#f58cc2', '#ffd3ea', '#7fe1f0', '#d4f6fb'];
const kinds = ['star', 'dot', 'conf'];
const brillos = $('#brillos');
for (let i = 0; i < 26; i++) {
  const el = document.createElement('i'); el.className = kinds[i % 3];
  el.style.cssText = `--x:${Math.random() * 100}%;--s:${6 + Math.random() * 10}px;--c:${colors[i % colors.length]};--d:${10 + Math.random() * 12}s;--delay:-${Math.random() * 22}s;--drift:${-60 + Math.random() * 120}px;--r:${200 + Math.random() * 600}deg`;
  brillos.append(el);
}

/* ---------- CUENTA REGRESIVA ---------- */
const target = new Date('2026-12-11T18:30:00-04:00').getTime();
const units = [['days', 86400000], ['hours', 3600000], ['minutes', 60000], ['seconds', 1000]];
function count() {
  let n = target - Date.now();
  if (n <= 0) { $('#countdown').hidden = true; $('#today').hidden = false; return; }
  units.forEach(([id, ms]) => {
    const el = document.getElementById(id), v = String(Math.floor(n / ms)).padStart(2, '0'); n %= ms;
    if (el.textContent !== v) { el.textContent = v; el.classList.remove('tick'); void el.offsetWidth; el.classList.add('tick'); }
  });
}
count(); setInterval(count, 1000);

/* ---------- CONFIRMACIÓN ---------- */
$('#rsvp').addEventListener('submit', e => {
  e.preventDefault();
  const name = $('#guest').value.trim(), people = $('#people').value;
  let msg = '¡Hola! ' + (name ? `Soy ${name}. ` : '') + 'Confirmo mi asistencia a los 15 años de Gloria el viernes 11 de diciembre a las 18:30.';
  msg += people === '1' ? ' Asistiré 1 persona.' : ` Asistiremos ${people} personas.`;
  window.open('https://wa.me/59179950927?text=' + encodeURIComponent(msg), '_blank', 'noopener');
});
}
