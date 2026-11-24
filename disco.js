/* Bola disco 3D en canvas · Digital Pro */
window.DiscoBall = function (canvas, opts = {}) {
  const ctx = canvas.getContext('2d');
  const rows = opts.rows || 26, tilt = opts.tilt ?? .32;
  let speed = opts.speed || .25, phi = 0, last = 0, running = false, raf = 0, W = 0;
  const L = norm([-.55, .62, .75]), L2 = norm([.8, .25, .55]), L3 = norm([-.2, -.7, .7]);
  function norm(v) { const m = Math.hypot(...v); return v.map(x => x / m); }

  // teselas con semilla fija para que el brillo sea estable
  const tiles = [];
  let seed = 7;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let k = 0; k < rows; k++) {
    const a0 = -Math.PI / 2 + Math.PI * k / rows, a1 = -Math.PI / 2 + Math.PI * (k + 1) / rows;
    const m = Math.max(4, Math.round(2 * rows * Math.cos((a0 + a1) / 2)));
    for (let j = 0; j < m; j++) {
      const s = rnd();
      tiles.push({ a0, a1, b0: 2 * Math.PI * j / m, b1: 2 * Math.PI * (j + 1) / m, base: .55 + rnd() * .45,
        tint: s < .1 ? [255, 160, 210] : s < .2 ? [150, 230, 245] : null, tw: rnd() * 6.28 });
    }
  }
  function resize() {
    const r = canvas.getBoundingClientRect(), d = Math.min(devicePixelRatio || 1, 2);
    W = Math.max(10, r.width); canvas.width = W * d; canvas.height = W * d; ctx.setTransform(d, 0, 0, d, 0, 0);
  }
  function P(lat, lon) {
    const x = Math.cos(lat) * Math.sin(lon), y = Math.sin(lat), z = Math.cos(lat) * Math.cos(lon);
    return [x, y * Math.cos(tilt) - z * Math.sin(tilt), y * Math.sin(tilt) + z * Math.cos(tilt)];
  }
  function draw(t) {
    const R = W / 2 * .94, cx = W / 2, cy = W / 2;
    ctx.clearRect(0, 0, W, W);
    const bg = ctx.createRadialGradient(cx - R * .3, cy - R * .35, R * .1, cx, cy, R);
    bg.addColorStop(0, '#5a5d6a'); bg.addColorStop(1, '#14151d');
    ctx.fillStyle = bg; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.fill();
    const g = .0065;
    const sparkles = [];
    for (const tl of tiles) {
      const la0 = tl.a0 + g, la1 = tl.a1 - g, lo0 = tl.b0 + phi + g, lo1 = tl.b1 + phi - g;
      const c = P((la0 + la1) / 2, (lo0 + lo1) / 2);
      if (c[2] <= .02) continue;
      const pts = [P(la0, lo0), P(la0, lo1), P(la1, lo1), P(la1, lo0)];
      const diff = Math.max(0, c[0] * L[0] + c[1] * L[1] + c[2] * L[2]);
      const rz = 2 * c[2], r = [rz * c[0], rz * c[1], rz * c[2] - 1];
      const dot = (v) => Math.max(0, r[0] * v[0] + r[1] * v[1] + r[2] * v[2]);
      const spec = Math.pow(dot(L), 30);
      const pink = Math.pow(dot(L2), 14), blue = Math.pow(dot(L3), 14);
      const env = .32 + .38 * Math.max(0, r[1]) + .25 * Math.sin(r[0] * 9 + r[1] * 7 + tl.tw);
      const tw = .5 + .5 * Math.sin(t * .003 + tl.tw * 3);
      let b = (env * tl.base * (.75 + .25 * tw) + .35 * diff) * (.45 + .55 * c[2]) + spec * 1.2;
      b = Math.min(1.3, Math.max(.06, b));
      let col = [205 * b + 18, 208 * b + 18, 220 * b + 22];
      col = [col[0] + 255 * pink * .9, col[1] + 120 * pink * .9, col[2] + 200 * pink * .9];
      col = [col[0] + 90 * blue, col[1] + 230 * blue * .9, col[2] + 250 * blue * .9];
      if (tl.tint) col = col.map((v, i) => v * .6 + tl.tint[i] * .4 * Math.min(1, b + .25));
      ctx.beginPath();
      pts.forEach((p, i) => { const X = cx + p[0] * R, Y = cy - p[1] * R; i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); });
      ctx.closePath();
      ctx.fillStyle = `rgb(${col.map(v => Math.max(0, Math.min(255, v | 0))).join(',')})`;
      ctx.fill();
      if (spec > .55 || pink > .8 || blue > .8) sparkles.push([cx + c[0] * R, cy - c[1] * R, spec > .5 ? spec : .6]);
    }
    // brillo general
    const hl = ctx.createRadialGradient(cx - R * .38, cy - R * .42, 0, cx - R * .38, cy - R * .42, R * .9);
    hl.addColorStop(0, 'rgba(255,255,255,.35)'); hl.addColorStop(.4, 'rgba(255,255,255,.06)'); hl.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = hl; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.fill();
    const rim = ctx.createRadialGradient(cx, cy, R * .75, cx, cy, R);
    rim.addColorStop(0, 'rgba(0,0,0,0)'); rim.addColorStop(1, 'rgba(0,0,10,.45)');
    ctx.fillStyle = rim; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.fill();
    // destellos de estrella
    ctx.globalCompositeOperation = 'lighter';
    for (const [x, y, s] of sparkles.slice(0, 9)) {
      const len = R * .16 * Math.min(1, s);
      const gr = ctx.createRadialGradient(x, y, 0, x, y, len);
      gr.addColorStop(0, 'rgba(255,255,255,.95)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = gr;
      ctx.fillRect(x - len, y - 1.2, len * 2, 2.4); ctx.fillRect(x - 1.2, y - len, 2.4, len * 2);
      ctx.beginPath(); ctx.arc(x, y, len * .25, 0, 7); ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';
  }
  function loop(t) {
    if (!running) return;
    const dt = last ? Math.min(60, t - last) : 16; last = t;
    phi += speed * dt / 1000;
    draw(t); raf = requestAnimationFrame(loop);
  }
  resize(); draw(0);
  addEventListener('resize', () => { resize(); draw(performance.now()); });
  return {
    start() { if (!running) { running = true; last = 0; raf = requestAnimationFrame(loop); } },
    stop() { running = false; cancelAnimationFrame(raf); },
    setSpeed(v) { speed = v; },
    get speed() { return speed; }
  };
};
