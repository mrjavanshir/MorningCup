/**
 * A rose built from geometry rather than drawn as a picture. Every petal is a
 * curved surface in 3D: a profile curve (how it leans out from the centre)
 * swept around the stem axis, with the edges rolled back the way real rose
 * petals roll. The surface is cut into small quads, each one lit on its own
 * (soft diffuse light, light shining through the petal from behind, a velvet
 * sheen at grazing angles, darkness deep in the cup), and the quads are
 * painted back to front on a 2D canvas.
 *
 * `open` runs from 0 (a closed bud held by its sepals) to 1 (full bloom). The
 * outer petals open first and furthest; the centre never fully opens, which
 * is what keeps it looking like a rose and not a flat flower.
 */

const TAU = Math.PI * 2;
// Petals per ring, innermost first.
const RINGS = [3, 3, 4, 5, 5, 5, 6];
// Quads across and along a petal. Set per draw: coarse while the flower is
// moving, fine for the frame it comes to rest on (see drawRose).
let NU = 10;
let NV = 13;
const MAX_NU = 14;
const MAX_NV = 20;
const STEPS = 28; // integration steps for a petal's profile curve

const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (a, b, x) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Linear-light albedos; converted to sRGB only at the very end.
const RED = {
  inner: [0.3, 0.004, 0.016],
  outer: [0.36, 0.014, 0.03],
  edge: [0.52, 0.035, 0.055],
  base: [0.07, 0.002, 0.01],
  through: [0.5, 0.012, 0.02],
};
const GREEN = {
  inner: [0.03, 0.085, 0.02],
  outer: [0.05, 0.13, 0.03],
  edge: [0.09, 0.2, 0.05],
  base: [0.025, 0.06, 0.015],
  through: [0.12, 0.25, 0.03],
};

/** Everything random about one rose, fixed by its seed. */
export function makeRose(seed) {
  const r = rng(seed);
  const petals = [];
  let phase = r() * TAU;
  RINGS.forEach((n, k) => {
    const t = k / (RINGS.length - 1);
    phase += 2.4; // roughly the golden angle, so rings never line up
    for (let j = 0; j < n; j++) {
      petals.push({
        t,
        phi: phase + (j * TAU) / n + (r() - 0.5) * 0.35,
        len: 1 + (r() - 0.5) * 0.1,
        wid: 1 + (r() - 0.5) * 0.14,
        wob: r() * TAU,
        tone: (r() - 0.5) * 0.12,
        lag: r() * 0.07,
      });
    }
  });
  const sepals = Array.from({ length: 5 }, (_, j) => ({
    phi: phase * 0.7 + (j * TAU) / 5 + (r() - 0.5) * 0.3,
    len: 1 + (r() - 0.5) * 0.18,
    wob: r() * TAU,
  }));
  return { petals, sepals };
}

// A petal's centre line in the (radius, height) plane, from the angle it
// makes with the stem at each point along its length.
function profile(beta, L, r0, y0) {
  const R = new Float32Array(STEPS + 1);
  const Y = new Float32Array(STEPS + 1);
  R[0] = r0;
  Y[0] = y0;
  const dv = 1 / STEPS;
  for (let i = 1; i <= STEPS; i++) {
    const b = beta((i - 0.5) * dv);
    R[i] = R[i - 1] + Math.sin(b) * L * dv;
    Y[i] = Y[i - 1] + Math.cos(b) * L * dv;
  }
  return { R, Y };
}

function sample(prof, v) {
  const x = v * STEPS;
  const i = Math.min(STEPS - 1, Math.max(0, Math.floor(x)));
  const f = x - i;
  return [lerp(prof.R[i], prof.R[i + 1], f), lerp(prof.Y[i], prof.Y[i + 1], f)];
}

// How open one petal is, given how open the whole flower is.
function petalOpen(p, open) {
  const start = (1 - p.t) * 0.4 + p.lag;
  return smooth(start, start + 0.6, open) * lerp(0.1, 1, Math.pow(p.t, 0.8));
}

function petalSurface(p, open, grid, attr) {
  const t = p.t;
  const o = petalOpen(p, open);
  const L = lerp(0.74, 1.02, t) * p.len;
  const r0 = lerp(0.025, 0.15, t);
  // Closed: bulge out, then curl back in over the centre (a bud's teardrop).
  const c0 = lerp(0.28, 0.5, t);
  const c1 = lerp(0.62, 0.95, t);
  // Open: lean out, bend further, and roll right back at the tip.
  // Lean grows faster than linearly with the ring, so the middle rings stay
  // upright and the centre stays high, the way a real rose's does.
  const b0 = lerp(0.1, 0.9, Math.pow(t, 1.5));
  const b1 = lerp(0.06, 0.4, t);
  const b2 = lerp(0, 0.85, Math.pow(t, 1.4));
  const beta = (v) => lerp(c0 - c1 * v, b0 + b1 * v + b2 * smooth(0.45, 1, v), o);
  const prof = profile(beta, L, r0, 0);
  const W = lerp(0.4, 0.62, t) * p.wid * L;
  const flare = o * Math.pow(t, 3);
  const cup = lerp(0.02, 0.06, t);

  const PR = prof.R, PY = prof.Y;
  const layerBase = 0.25 * t;
  let g = 0;
  for (let iu = 0; iu <= NU; iu++) {
    const u = -1 + (2 * iu) / NU;
    const edgeRoll = flare * Math.pow(Math.abs(u), 2.2) * L * 0.42;
    const cupU = cup * (1 - u * u) * L;
    const shingle = 0.045 * u * L;
    const ripple = 0.012 * o;
    const rippleU = u * 6.3 + p.wob;
    // Rounded top, with a little unevenness so no two petals match.
    const vmax = 1 - 0.14 * u * u - 0.07 * u * u * u * u + 0.02 * Math.sin(u * 4.1 + p.wob);
    for (let iv = 0; iv <= NV; iv++) {
      const s = iv / NV;
      const v = s * vmax;
      const x = v * STEPS;
      const i = x >= STEPS ? STEPS - 1 : x < 0 ? 0 : x | 0;
      const f = x - i;
      const R = PR[i] + (PR[i + 1] - PR[i]) * f;
      const Y = PY[i] + (PY[i + 1] - PY[i]) * f;
      const b = beta(v);
      const w = Math.pow(Math.sin((Math.PI / 2) * Math.min(1, (v + 0.06) / 0.7)), 0.85) * (1 - 0.12 * smooth(0.8, 1, v));
      const a = Math.min(1.95, (W * w) / Math.max(R, 0.03));
      // Pushed along the surface normal: out at the rolled-back edges, in a
      // little across the middle (the cup of the petal).
      const d =
        edgeRoll * smooth(0.15, 1, v) -
        cupU * Math.sin(Math.PI * v) +
        ripple * v * Math.sin(rippleU + v * 4) +
        // Shingled: one edge tucks under the next petal, the other lies over
        // the previous one, so neighbours never occupy the same surface.
        shingle * smooth(0, 0.35, v);
      const Rf = R + d * Math.cos(b);
      const Yf = Y - d * Math.sin(b);
      const ang = p.phi + u * a;
      grid[g * 3] = Rf * Math.sin(ang);
      grid[g * 3 + 1] = Yf;
      grid[g * 3 + 2] = Rf * Math.cos(ang);
      attr[g] = s;
      LAYER[g] = layerBase + 0.03 * u;
      g++;
    }
  }
}

function sepalSurface(sp, open, grid, attr) {
  const o = smooth(0, 0.45, open);
  const L = 0.62 * sp.len;
  // Hug the bud, then fold down and away once it opens.
  const beta = (v) => lerp(0.62 - 0.45 * v, 1.5 + 1.3 * v, o);
  const prof = profile(beta, L, 0.1, -0.03);
  let g = 0;
  for (let iu = 0; iu <= NU; iu++) {
    const u = -1 + (2 * iu) / NU;
    for (let iv = 0; iv <= NV; iv++) {
      const s = iv / NV;
      const [R, Y] = sample(prof, s);
      const hw = 0.13 * Math.pow(1 - s, 0.9) + 0.008;
      const a = Math.min(1.2, hw / Math.max(R, 0.05));
      const ang = sp.phi + u * a + 0.08 * Math.sin(s * 5 + sp.wob) * s;
      grid[g * 3] = R * Math.sin(ang);
      grid[g * 3 + 1] = Y;
      grid[g * 3 + 2] = R * Math.cos(ang);
      attr[g] = s;
      LAYER[g] = 0.35; // outside every petal
      g++;
    }
  }
}

// The green hip under the flower, a surface of revolution.
function hipSurface(grid, attr) {
  let g = 0;
  for (let iu = 0; iu <= NU; iu++) {
    const ang = (iu / NU) * TAU;
    for (let iv = 0; iv <= NV; iv++) {
      const s = iv / NV;
      const r = 0.15 * Math.sin(Math.PI * (0.22 + 0.62 * s));
      grid[g * 3] = r * Math.sin(ang);
      grid[g * 3 + 1] = -0.02 - 0.27 * s;
      grid[g * 3 + 2] = r * Math.cos(ang);
      attr[g] = 1 - s;
      g++;
    }
  }
}

const GRID = new Float32Array((MAX_NU + 1) * (MAX_NV + 1) * 3);
const ATTR = new Float32Array((MAX_NU + 1) * (MAX_NV + 1));
// Per vertex: how far out it sits in the flower's layering (ring, plus which
// edge of the petal), used only to settle draw order where petals touch.
const LAYER = new Float32Array((MAX_NU + 1) * (MAX_NV + 1));

// Light in view space: upper left, a little in front.
const LX = -0.45, LY = 0.76, LZ = 0.47;
const LN = Math.hypot(LX, LY, LZ);
const L0 = [LX / LN, LY / LN, LZ / LN];
const HN = Math.hypot(L0[0], L0[1], L0[2] + 1);
const H0 = [L0[0] / HN, L0[1] / HN, (L0[2] + 1) / HN];

// Linear light → sRGB byte, by table: this runs three times per quad.
const SRGB = new Uint8Array(4097);
for (let i = 0; i <= 4096; i++) SRGB[i] = Math.round(Math.pow(i / 4096, 1 / 2.2) * 255);
const toSrgb = (c) => SRGB[c <= 0 ? 0 : c >= 1 ? 4096 : (c * 4096) | 0];

// fillStyle wants a string; the same few thousand colours recur frame after
// frame, so each is built once.
const STYLE = new Map();
function style(rgb) {
  let str = STYLE.get(rgb);
  if (str === undefined) {
    if (STYLE.size > 60000) STYLE.clear();
    str = `#${(rgb | 0x1000000).toString(16).slice(1)}`;
    STYLE.set(rgb, str);
  }
  return str;
}

// Scratch buffers, reused for every surface of every frame — allocating them
// per surface was a large share of the cost of a frame.
const MAXV = (MAX_NU + 1) * (MAX_NV + 1);
const V = new Float32Array(MAXV * 3); // view-space positions
const P = new Float32Array(MAXV * 2); // screen positions
const B = new Float32Array(MAXV); // sort nudge (see below)
const N = new Float32Array(MAXV * 3); // vertex normals
const COL = new Float32Array(MAXV * 3); // vertex colours, linear

// Every quad of the frame, flat. Surfaces are contiguous runs of it.
const MAXQ = 40 * MAX_NU * MAX_NV;
const QP = new Float32Array(MAXQ * 8);
const QD = new Float32Array(MAXQ);
const QC = new Int32Array(MAXQ);
const ORDER = new Uint32Array(MAXQ);
let qCount = 0;
const groups = [];

/**
 * Transforms the surface in GRID into view space, shades it, and appends its
 * quads to the frame as one group with a depth for the surface as a whole.
 *
 * Whole surfaces are ordered first and quads only within a surface. Sorting
 * every quad of every petal together looks right until two petals pass
 * through each other, and then the crossing becomes a sawtooth of
 * alternating quads.
 */
function emit(cam, mat, info) {
  const { cy, sy, cl, sl, ce, se, scale, ox, oy } = cam;
  const n = (NU + 1) * (NV + 1);
  let sum = 0;
  for (let i = 0; i < n; i++) {
    const x = GRID[i * 3], y = GRID[i * 3 + 1], z = GRID[i * 3 + 2];
    const x1 = x * cy + z * sy;
    const z1 = -x * sy + z * cy;
    const x2 = x1 * cl - y * sl;
    const y2 = x1 * sl + y * cl;
    const y3 = y2 * ce - z1 * se;
    const z3 = y2 * se + z1 * ce;
    V[i * 3] = x2;
    V[i * 3 + 1] = y3;
    V[i * 3 + 2] = z3;
    P[i * 2] = ox + x2 * scale;
    P[i * 2 + 1] = oy - y3 * scale;
    N[i * 3] = N[i * 3 + 1] = N[i * 3 + 2] = 0;
    // Nudges the petal's sort depth outward along its radius — toward the
    // viewer at the front of the flower, away at the back — so where two
    // petals overlap, the outer one is drawn over the inner.
    let bias = 0;
    if (info.layered) {
      const h = Math.hypot(x, z) || 1;
      const rx = x / h, rz = z / h;
      const rz1 = -rx * sy + rz * cy;
      const ry2 = (rx * cy + rz * sy) * sl;
      bias = LAYER[i] * (ry2 * se + rz1 * ce);
    }
    B[i] = bias;
    sum += z3 + bias;
  }
  const row = NV + 1;

  // Normals are averaged onto the vertices and each quad takes the mean of
  // its corners' colours — flat per-quad shading shows every facet.
  for (let iu = 0; iu < NU; iu++) {
    for (let iv = 0; iv < NV; iv++) {
      const a = iu * row + iv, b = a + row, c = b + 1, d = a + 1;
      const e1x = V[c * 3] - V[a * 3], e1y = V[c * 3 + 1] - V[a * 3 + 1], e1z = V[c * 3 + 2] - V[a * 3 + 2];
      const e2x = V[d * 3] - V[b * 3], e2y = V[d * 3 + 1] - V[b * 3 + 1], e2z = V[d * 3 + 2] - V[b * 3 + 2];
      let nx = e1y * e2z - e1z * e2y;
      let ny = e1z * e2x - e1x * e2z;
      let nz = e1x * e2y - e1y * e2x;
      const len = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
      nx /= len; ny /= len; nz /= len;
      N[a * 3] += nx; N[a * 3 + 1] += ny; N[a * 3 + 2] += nz;
      N[b * 3] += nx; N[b * 3 + 1] += ny; N[b * 3 + 2] += nz;
      N[c * 3] += nx; N[c * 3 + 1] += ny; N[c * 3 + 2] += nz;
      N[d * 3] += nx; N[d * 3 + 1] += ny; N[d * 3 + 2] += nz;
    }
  }

  const tone = 1 + info.tone;
  const { inner, outer, edge: edgeCol, base: baseCol, through: thru } = mat;
  for (let i = 0; i < n; i++) {
    let nx = N[i * 3], ny = N[i * 3 + 1], nz = N[i * 3 + 2];
    const len = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
    nx /= len; ny /= len; nz /= len;
    // The raw normal points out of the petal's outer (back) face. Whichever
    // face is toward the viewer is the one that gets lit.
    const outerSide = nz > 0;
    if (!outerSide) { nx = -nx; ny = -ny; nz = -nz; }
    const s = ATTR[i];

    const nl = nx * L0[0] + ny * L0[1] + nz * L0[2];
    const diff = clamp01((nl + 0.3) / 1.3);
    const lit = 0.05 + 1.1 * diff * Math.sqrt(Math.sqrt(diff));
    const through = clamp01(-nl) * 0.45; // light coming through the petal
    const nh = Math.max(0, nx * H0[0] + ny * H0[1] + nz * H0[2]);
    const nh2 = nh * nh, nh4 = nh2 * nh2, nh8 = nh4 * nh4;
    const spec = nh8 * nh4 * nh2 * info.spec;
    const g1 = 1 - nz;
    const sheen = g1 * g1 * 0.16 * 0.9;

    let ao = (0.14 + 0.86 * smooth(0, 0.8, s)) * (info.aoBase + info.aoTip * smooth(0.55, 1, s));
    if (!outerSide) ao *= 0.62 + 0.38 * smooth(-0.15, 0.55, V[i * 3 + 1] + info.lift);

    const albedo = outerSide ? outer : inner;
    const edge = smooth(0.8, 1, s) * info.edge;
    const base = (1 - smooth(0, 0.3, s)) * 0.7;
    for (let k = 0; k < 3; k++) {
      let alb = albedo[k] + (edgeCol[k] - albedo[k]) * edge;
      alb = (alb + (baseCol[k] - alb) * base) * tone;
      COL[i * 3 + k] = alb * (lit * ao + sheen) + thru[k] * through * ao + spec * SPEC_TINT[k];
    }
  }

  const start = qCount;
  for (let iu = 0; iu < NU; iu++) {
    for (let iv = 0; iv < NV; iv++) {
      const a = iu * row + iv, b = a + row, c = b + 1, d = a + 1;
      const q = qCount++;
      const o = q * 8;
      QP[o] = P[a * 2]; QP[o + 1] = P[a * 2 + 1];
      QP[o + 2] = P[b * 2]; QP[o + 3] = P[b * 2 + 1];
      QP[o + 4] = P[c * 2]; QP[o + 5] = P[c * 2 + 1];
      QP[o + 6] = P[d * 2]; QP[o + 7] = P[d * 2 + 1];
      QD[q] = V[a * 3 + 2] + V[b * 3 + 2] + V[c * 3 + 2] + V[d * 3 + 2];
      const r = toSrgb((COL[a * 3] + COL[b * 3] + COL[c * 3] + COL[d * 3]) * 0.25);
      const gg = toSrgb((COL[a * 3 + 1] + COL[b * 3 + 1] + COL[c * 3 + 1] + COL[d * 3 + 1]) * 0.25);
      const bb = toSrgb((COL[a * 3 + 2] + COL[b * 3 + 2] + COL[c * 3 + 2] + COL[d * 3 + 2]) * 0.25);
      QC[q] = (r << 16) | (gg << 8) | bb;
    }
  }
  groups.push({ depth: sum / n, start, end: qCount });
}

const SPEC_TINT = [0.9, 0.38, 0.42];

/**
 * Paints `rose` at openness `open` into a canvas of `size` × `size` device
 * pixels. The flower's base (where the stem meets the hip) lands at
 * STEM_TIP of the canvas height, centred horizontally.
 */
export const HEAD = { originY: 0.56, scale: 0.33 };

const GREEN_HIP = { aoBase: 1, aoTip: 0, edge: 0, tone: 0, lift: 1, spec: 0.12 };
const GREEN_SEPAL = { aoBase: 1, aoTip: 0, edge: 0.4, tone: 0, lift: 1, spec: 0.1, layered: true };
const byDepth = (a, b) => QD[a] - QD[b];

export function drawRose(ctx, rose, open, size, view = {}, fine = false) {
  const { yaw = 0, lean = 0, tilt = 0.5 } = view;
  NU = fine ? MAX_NU : 8;
  NV = fine ? MAX_NV : 11;
  const cam = {
    cy: Math.cos(yaw), sy: Math.sin(yaw),
    cl: Math.cos(lean), sl: Math.sin(lean),
    ce: Math.cos(tilt), se: Math.sin(tilt),
    scale: size * HEAD.scale,
    ox: size / 2,
    oy: size * HEAD.originY,
  };
  qCount = 0;
  groups.length = 0;

  hipSurface(GRID, ATTR);
  emit(cam, GREEN, GREEN_HIP);

  for (const sp of rose.sepals) {
    sepalSurface(sp, open, GRID, ATTR);
    emit(cam, GREEN, GREEN_SEPAL);
  }

  for (const p of rose.petals) {
    petalSurface(p, open, GRID, ATTR);
    const t = p.t;
    emit(cam, RED, {
      // The inner rings sit down in the cup; only their tips catch light.
      aoBase: lerp(0.5, 1, t),
      aoTip: (1 - t) * 0.3,
      edge: lerp(0.1, 0.85, t * t),
      tone: p.tone,
      lift: 0.15,
      spec: 0.1,
      layered: true,
    });
  }

  groups.sort((a, b) => a.depth - b.depth);
  let k = 0;
  for (const g of groups) {
    const run = ORDER.subarray(k, k + g.end - g.start);
    for (let q = g.start; q < g.end; q++) run[q - g.start] = q;
    run.sort(byDepth);
    k += run.length;
  }

  ctx.clearRect(0, 0, size, size);
  ctx.lineJoin = "round";
  ctx.lineWidth = Math.max(0.6, size / 600);
  let last = -1;
  for (let j = 0; j < k; j++) {
    const q = ORDER[j];
    const o = q * 8;
    if (QC[q] !== last) {
      last = QC[q];
      const st = style(last);
      ctx.fillStyle = st;
      ctx.strokeStyle = st; // closes the hairline seams between quads
    }
    ctx.beginPath();
    ctx.moveTo(QP[o], QP[o + 1]);
    ctx.lineTo(QP[o + 2], QP[o + 3]);
    ctx.lineTo(QP[o + 4], QP[o + 5]);
    ctx.lineTo(QP[o + 6], QP[o + 7]);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
}

/** Where the stem meets the flower, as a fraction of the canvas height. */
export const STEM_TIP = HEAD.originY + 0.085;
