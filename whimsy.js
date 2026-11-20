/* Whimsy: handgetekende iconen, kabouterhoudingen, sterrenpatronen en kronkelpaadjes.
   Alles wordt hier in de browser getekend met een vaste "random" zaadwaarde,
   zodat het er elke keer hetzelfde uitziet (net zoals in het Figma-ontwerp). */
(() => {
  const INK = '#3B2541';

  // Voorspelbare toevalsgenerator (mulberry32)
  const rng = seed => () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
  const f = v => (Math.round(v * 100) / 100).toString();

  // Vormhulpjes
  const arc = (cx, cy, rx, ry, a0, a1, n = 30) => {
    const p = [];
    for (let i = 0; i <= n; i++) { const a = (a0 + (a1 - a0) * i / n) * Math.PI / 180; p.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]); }
    return p;
  };
  const quad = (a, c, b, n = 16) => {
    const p = [];
    for (let i = 0; i <= n; i++) { const t = i / n; p.push([(1 - t) * (1 - t) * a[0] + 2 * (1 - t) * t * c[0] + t * t * b[0], (1 - t) * (1 - t) * a[1] + 2 * (1 - t) * t * c[1] + t * t * b[1]]); }
    return p;
  };
  const rrect = (x0, y0, x1, y1, r) => [...arc(x1 - r, y0 + r, r, r, -90, 0, 6), ...arc(x1 - r, y1 - r, r, r, 0, 90, 6), ...arc(x0 + r, y1 - r, r, r, 90, 180, 6), ...arc(x0 + r, y0 + r, r, r, 180, 270, 6)];
  const starPts = (cx, cy, ro, ri, rot = 0) => {
    const p = [];
    for (let i = 0; i < 10; i++) { const a = (-90 + rot + i * 36) * Math.PI / 180, r = i % 2 ? ri : ro; p.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); }
    return p;
  };
  function resample(pts, closed, step = 0.5) {
    const P = closed ? [...pts, pts[0]] : pts, out = [P[0]];
    for (let i = 1; i < P.length; i++) {
      const a = P[i - 1], b = P[i], n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / step));
      for (let k = 1; k <= n; k++) out.push([a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n]);
    }
    return out;
  }
  // Wiebelige lijn: punten verschuiven een beetje loodrecht op de lijn en worden glad gemaakt.
  function wobble(R, pts, { closed = false, fill = false, amp = 0.42 } = {}) {
    let P = resample(pts, closed);
    if (closed && !fill) P = P.concat(P.slice(1, 5));            // overlapje zoals een getekende lus
    const s = [0];
    for (let i = 1; i < P.length; i++) s.push(s[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]));
    const l1 = 8 + R() * 6, l2 = 3.5 + R() * 2.5, p1 = R() * 6.28, p2 = R() * 6.28;
    const o = P.map((p, i) => {
      const a = P[Math.max(0, i - 2)], b = P[Math.min(P.length - 1, i + 2)];
      let tx = b[0] - a[0], ty = b[1] - a[1]; const L = Math.hypot(tx, ty) || 1;
      const n = amp * (0.65 * Math.sin(2 * Math.PI * s[i] / l1 + p1) + 0.35 * Math.sin(2 * Math.PI * s[i] / l2 + p2));
      return [p[0] - ty / L * n, p[1] + tx / L * n];
    });
    const D = [];
    for (let i = 0; i < o.length; i += 3) D.push(o[i]);
    D.push(o[o.length - 1]);
    let d = `M${f(D[0][0])} ${f(D[0][1])}`;
    for (let i = 0; i < D.length - 1; i++) {
      const p0 = D[Math.max(0, i - 1)], q1 = D[i], q2 = D[i + 1], p3 = D[Math.min(D.length - 1, i + 2)];
      d += ` C${f(q1[0] + (q2[0] - p0[0]) / 6)} ${f(q1[1] + (q2[1] - p0[1]) / 6)} ${f(q2[0] - (p3[0] - q1[0]) / 6)} ${f(q2[1] - (p3[1] - q1[1]) / 6)} ${f(q2[0])} ${f(q2[1])}`;
    }
    return d + (closed && fill ? ' Z' : '');
  }
  const S = (R, pts, o = {}, w = 2.1) => `<path d="${wobble(R, pts, o)}" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`;
  const F = (R, pts, col = 'currentColor') => `<path d="${wobble(R, pts, { closed: true, fill: true, amp: 0.3 })}" fill="${col}" stroke="${col}" stroke-width="1.3" stroke-linejoin="round"/>`;
  const dot = (x, y, w = 2.8) => `<path d="M${x} ${y}l.05 .05" stroke="currentColor" stroke-width="${w}" stroke-linecap="round"/>`;

  /* ---------- Iconen (24×24) ---------- */
  const mirror = pts => pts.map(([x, y]) => [24 - x, y]);
  function rotArrow(R, back) {
    let P = arc(12, 12.8, 7.8, 7.8, -105, 195, 30);
    const a = -105 * Math.PI / 180, dir = [-Math.sin(a), Math.cos(a)], tip = P[0];
    const rot = (v, d) => { const r = d * Math.PI / 180; return [v[0] * Math.cos(r) - v[1] * Math.sin(r), v[0] * Math.sin(r) + v[1] * Math.cos(r)]; };
    const w1 = rot(dir, 48), w2 = rot(dir, -48);
    let head = [[tip[0] + w1[0] * 4.2, tip[1] + w1[1] * 4.2], tip, [tip[0] + w2[0] * 4.2, tip[1] + w2[1] * 4.2]];
    if (!back) { P = mirror(P); head = mirror(head); }
    return S(R, P, { amp: 0.4 }) + S(R, head, { amp: 0.15 });
  }
  const ICONS = {
    zoeken: R => S(R, arc(10.5, 10.5, 6.6, 6.6, -140, 230, 50)) + S(R, [[15.6, 15.6], [20.4, 20.6]]),
    account: R => S(R, arc(12, 8.2, 3.9, 3.9, -120, 250, 40)) + S(R, arc(12, 21.2, 7.6, 6.4, 182, 358, 30)),
    sluiten: R => S(R, [[6, 6.2], [18, 17.8]]) + S(R, [[17.8, 6], [6.2, 18.1]]),
    omlaag: R => S(R, [[6, 9.2], [12, 15], [18, 8.8]]),
    lijst: R => S(R, [[9.2, 7], [20, 6.8]]) + S(R, [[9.2, 12.1], [19.6, 12]]) + S(R, [[9.2, 17.1], [20.2, 17.2]]) + dot(4.6, 7) + dot(4.6, 12.1) + dot(4.6, 17.1),
    plus: R => S(R, [[12.1, 5], [11.9, 19]]) + S(R, [[5, 12.1], [19, 11.9]]),
    koptelefoon: R => S(R, [[3.6, 16.5], ...arc(12, 13, 8.4, 8.4, 180, 360, 40), [20.4, 16.5]]) + S(R, rrect(3.3, 13.6, 7.6, 20.4, 1.8), { closed: true }) + S(R, rrect(16.4, 13.6, 20.7, 20.4, 1.8), { closed: true }),
    boek: R => S(R, [...quad([12, 6.6], [7.5, 4.2], [2.8, 5.4]), [2.8, 18.4], ...quad([2.8, 18.4], [7.5, 17.4], [12, 19.6])]) + S(R, [...quad([12, 6.6], [16.5, 4.2], [21.2, 5.4]), [21.2, 18.4], ...quad([21.2, 18.4], [16.5, 17.4], [12, 19.6])]) + S(R, [[12, 6.8], [12, 19.4]]),
    ebook: R => S(R, rrect(6, 3, 18, 21, 2.8), { closed: true }) + S(R, [[10.6, 17.8], [13.4, 17.9]]),
    afspelen: R => F(R, [[7.6, 4.8], [19.6, 12], [7.6, 19.4]]),
    pauze: R => F(R, rrect(6, 4.6, 10, 19.4, 1.4)) + F(R, rrect(14, 4.6, 18, 19.4, 1.4)),
    terug: R => rotArrow(R, true),
    vooruit: R => rotArrow(R, false),
    vorige: R => S(R, [[6.2, 5], [6, 19]]) + F(R, [[19, 5.2], [9, 12], [19, 18.8]]),
    volgende: R => S(R, [[17.8, 5], [18, 19]]) + F(R, [[5, 5.2], [15, 12], [5, 18.8]]),
    ster: R => F(R, starPts(12, 12.8, 9.4, 4.3)),
    sterleeg: R => S(R, starPts(12, 12.8, 9.4, 4.3), { closed: true }, 1.9),
    vinkje: R => S(R, [[5, 12.6], [9.8, 17.4], [19.4, 7]]),
  };
  const iconCache = {};
  function icon(name, size = 24, variant = 0) {
    const key = name + '|' + variant;
    if (!iconCache[key]) {
      const seed = [...name].reduce((a, c) => a + c.charCodeAt(0), 0) * 7 + variant * 101;
      iconCache[key] = ICONS[name](rng(seed));
    }
    return `<svg class="hd" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" aria-hidden="true">${iconCache[key]}</svg>`;
  }

  /* ---------- Kabouter in verschillende houdingen (62×106, zelfde maat als het logo) ---------- */
  const st = (R, pts, o) => `<path d="${wobble(R, pts, { amp: 0.35, ...o })}" stroke="${INK}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`;
  const fl = (R, pts, col = INK) => `<path d="${wobble(R, pts, { closed: true, fill: true, amp: 0.2 })}" fill="${col}" stroke="${INK}" stroke-width="1.3" stroke-linejoin="round"/>`;
  const note = (R, x, y, s) => fl(R, arc(x, y, 2.3 * s, 1.7 * s, 0, 360, 16)) + st(R, [[x + 2.1 * s, y - 0.4 * s], [x + 2.1 * s, y - 8.5 * s]]) + st(R, quad([x + 2.1 * s, y - 8.5 * s], [x + 5 * s, y - 7 * s], [x + 4.6 * s, y - 4.2 * s]));
  const Z = (R, x, y, s) => st(R, [[x, y], [x + s, y - 0.2], [x + 0.1, y + s], [x + s, y + s + 0.1]]);
  const POSES = {
    lezen: { eyes: true, draw: () => '' },
    luisteren: { eyes: true, draw: R => note(R, 6, 46, 0.85) + note(R, 12, 33, 0.7) },
    slapen: { eyes: false, draw: R => st(R, arc(23.6, 63.6, 2.4, 2, 15, 165, 10)) + st(R, arc(33.2, 64.2, 2.4, 2, 15, 165, 10)) +
      st(R, [[26.5, 31.2], [34, 30.4], [41.6, 29.6]]) + st(R, [[23.2, 41.2], [33.5, 40.3], [44.4, 39.4]]) +
      Z(R, 11, 32, 6) + Z(R, 9, 23.4, 4.5) + Z(R, 15, 15, 3.4) },
    zwaaien: { eyes: true, draw: R => st(R, [[13.5, 66], [13, 60], [12.4, 57], [11.7, 54.5]]) + fl(R, arc(11.5, 49.9, 4.4, 4.5, 0, 360, 20), '#FFFFFF') +
      st(R, arc(11.5, 49.9, 8.6, 8.6, 200, 240, 10)) + st(R, arc(11.5, 49.9, 11.6, 11.6, 204, 236, 10)) },
    verveeld: { eyes: false, draw: R => fl(R, [...arc(23.6, 64.3, 2.3, 2.1, 0, 180, 8)]) + st(R, [[20.6, 64.2], [26.6, 64]]) +
      fl(R, [...arc(33.2, 64.9, 2.3, 2.1, 0, 180, 8)]) + st(R, [[30.2, 64.8], [36.2, 64.6]]) +
      fl(R, arc(6, 44, 1.05, 1.05, 0, 360, 10)) + fl(R, arc(10.2, 42.6, 1.05, 1.05, 0, 360, 10)) + fl(R, arc(14.4, 41.2, 1.05, 1.05, 0, 360, 10)) },
  };
  const poseCache = {};
  function kabouter(pose = 'lezen', cls = '') {
    const p = POSES[pose] || POSES.lezen;
    poseCache[pose] ||= p.draw(rng(pose.length * 31 + 5));
    return `<svg class="kab kab-${pose} ${cls}" viewBox="0 0 62 106" aria-hidden="true" overflow="visible"><use href="#${p.eyes ? 'logo' : 'logo-noeyes'}" width="62" height="106"/>${poseCache[pose]}</svg>`;
  }
  // Logo zonder oogjes (voor slapen en verveeld)
  function makeNoEyes() {
    const sym = document.getElementById('logo');
    if (!sym || document.getElementById('logo-noeyes')) return;
    const c = sym.cloneNode(true); c.id = 'logo-noeyes';
    const paths = c.querySelectorAll('path');
    // de laatste twee paden in het logo zijn de oogjes
    paths[paths.length - 1]?.remove(); paths[paths.length - 2]?.remove();
    sym.parentNode.appendChild(c);
  }

  /* ---------- Sterrenpatronen voor boeken zonder cover ---------- */
  function starPath(R, cx, cy, Rr, rot) {
    const pts = [];
    for (let k = 0; k < 5; k++) {
      const ta = (rot + k * 72 + (R() - 0.5) * 14) * Math.PI / 180, tr = Rr * (0.8 + R() * 0.32);
      pts.push([cx + tr * Math.cos(ta), cy + tr * Math.sin(ta), 't']);
      const va = (rot + k * 72 + 36 + (R() - 0.5) * 12) * Math.PI / 180, vr = Rr * (0.34 + R() * 0.12);
      pts.push([cx + vr * Math.cos(va), cy + vr * Math.sin(va), 'v']);
    }
    const n = pts.length, lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
    let d = '';
    pts.forEach((p, i) => {
      const fr = p[2] === 't' ? 0.16 + R() * 0.08 : 0.14;
      const e = lerp(p, pts[(i - 1 + n) % n], fr), x = lerp(p, pts[(i + 1) % n], fr);
      d += (i ? ` L${f(e[0])} ${f(e[1])}` : `M${f(e[0])} ${f(e[1])}`) + ` Q${f(p[0])} ${f(p[1])} ${f(x[0])} ${f(x[1])}`;
    });
    return d + ' Z';
  }
  const PATTERNS = {
    blauw: { bg: '#8E99DE', colors: ['#F7E2A6', '#F3D894', '#FAEBC0'], speck: '#2E356B', seed: 21 },
    creme: { bg: '#FBF3E2', colors: ['#6C5FE6', '#9AA6F2', '#E59AC0', '#D9507E', '#FC9461', '#F2C14E'], speck: '#8A7A5A', seed: 22 },
    groen: { bg: '#5E3F70', colors: ['#FBEFCF', '#FFE59A', '#FFFFFF'], speck: '#3B2541', seed: 23 },
  };
  function patternSVG(name) {
    const p = PATTERNS[name], R = rng(p.seed), W = 360, step = 36;
    let s = `<rect width="${W}" height="${W}" fill="${p.bg}"/>`, row = 0;
    for (let y = step / 2; y < W + step; y += step * 0.87, row++) {
      for (let x = row % 2 ? step / 2 : 0; x < W + step; x += step) {
        const px = (x + (R() - 0.5) * step * 0.55) % W, py = (y + (R() - 0.5) * step * 0.5) % W, r = 5.2 + R() * 2.6;
        const col = p.colors[Math.floor(R() * p.colors.length)], op = (0.88 + R() * 0.12).toFixed(2), rot = R() * 72 - 90;
        s += `<path d="${starPath(R, px, py, r, rot)}" fill="${col}" fill-opacity="${op}"/>`;
      }
    }
    for (let i = 0; i < 70; i++) s += `<circle cx="${f(R() * W)}" cy="${f(R() * W)}" r="${f(0.35 + R() * 0.45)}" fill="${p.speck}" fill-opacity=".35"/>`;
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${W}" viewBox="0 0 ${W} ${W}">${s}</svg>`;
  }

  /* ---------- Kronkelpaadjes ---------- */
  function wavePath(w, h, amp, wl, sw) {
    const yc = h / 2, pts = [];
    for (let x = sw / 2; x <= w - sw / 2 + 0.01; x += 1) pts.push(f(x) + ' ' + f(yc + amp * Math.sin(2 * Math.PI * x / wl)));
    return 'M' + pts.join(' L');
  }
  function waveSVG(w, h, amp, wl, sw, color = '#000') {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><path d="${wavePath(w, h, amp, wl, sw)}" fill="none" stroke="${color}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  }
  const dataURL = svg => `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;

  // Sterknop van de schuifbalk (geel sterretje met gezichtje)
  function knobSVG() {
    const pts = starPts(13, 13.8, 11.2, 5.4, -6), n = pts.length, mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    let m = mid(pts[n - 1], pts[0]), d = `M${f(m[0])} ${f(m[1])}`;
    for (let i = 0; i < n; i++) { const m2 = mid(pts[i], pts[(i + 1) % n]); d += ` Q${f(pts[i][0])} ${f(pts[i][1])} ${f(m2[0])} ${f(m2[1])}`; }
    return `<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 26 26"><path d="${d} Z" fill="#FFE59A" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/><path d="M9.6 11.6l.5.3M15.4 11.4l.5.3" stroke="${INK}" stroke-width="1.6" stroke-linecap="round"/><path d="M10.9 15.3q1.9 1.5 3.7-.1" stroke="${INK}" stroke-width="1.2" stroke-linecap="round" fill="none"/></svg>`;
  }

  /* ---------- Sterretjes-plof bij afspelen ---------- */
  function burst(el) {
    if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const r = el.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const angles = [-100, -40, 15, 70, 140, 205], sizes = [26, 20, 24, 18, 22, 19];
    angles.forEach((a, i) => {
      const s = document.createElement('img');
      s.src = `img/paillet-${i % 3 + 1}.png`; s.alt = ''; s.className = 'plof';
      const rad = a * Math.PI / 180, dist = 62 + Math.random() * 14;
      s.style.cssText = `left:${cx}px;top:${cy}px;width:${sizes[i]}px;--dx:${Math.cos(rad) * dist}px;--dy:${Math.sin(rad) * dist}px;--rot:${(Math.random() - .5) * 120}deg`;
      document.body.appendChild(s);
      setTimeout(() => s.remove(), 900);
    });
  }

  /* ---------- Opstarten ---------- */
  function init() {
    makeNoEyes();
    const root = document.documentElement.style;
    for (const k of Object.keys(PATTERNS)) root.setProperty('--pat-' + k, dataURL(patternSVG(k)));
    root.setProperty('--wave-s', dataURL(waveSVG(64, 10, 1.6, 16, 3)));
    root.setProperty('--wave-m', dataURL(waveSVG(120, 10, 1.6, 18, 3.4)));
    root.setProperty('--wave-xs', dataURL(waveSVG(120, 6, 1, 14, 2.4)));
    root.setProperty('--knob', dataURL(knobSVG()));
  }

  window.WH = { icon, kabouter, burst, init, wavePath };
})();
