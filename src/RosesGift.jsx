import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import { drawRose, makeRose, STEM_TIP } from "./rose3d.js";

// ── Mətn ────────────────────────────────────────────────────────────────────
// Qeyddə görünən hər şey buradadır. `verse` boş qalsa, ayə bloku göstərilmir.
const COPY = {
  tapRose: "qızılgülə toxun",
  cover: "Qənirəyə",
  tapNote: "aç",
  note: [
    "Qənirə,",
    "Bilirəm, bu günlərdə içində bir sıxıntı var.",
    "Sənin adına niyyət edib bir yardım etdim. Qoy o savab sənə yazılsın, Allah ürəyindəki ağırlığı götürsün, yerinə rahatlıq qoysun.",
    "Bu güllər də ondandır ki, biləsən: tək deyilsən.",
  ],
  verse: {
    arabic: "فَإِنَّ مَعَ الْعُسْرِ يُسْرًا",
    meaning: "Həqiqətən, çətinliklə yanaşı bir asanlıq da var. (İnşirah, 5)",
  },
  signature: "Cavanşir",
};

const C = {
  bg: "radial-gradient(ellipse at 50% 28%, #2b1217 0%, #160a0d 52%, #0c0507 100%)",
  text: "#F3E7DA",
  muted: "rgba(243,231,218,0.62)",
  paper: "#F4EADB",
  ink: "#3A2626",
  inkSoft: "rgba(58,38,38,0.66)",
};

// The bouquet is laid out in a 400 × 540 box; everything below is in those units.
const VB = { w: 400, h: 540 };
const TIE = { x: 200, y: 446 };

// Where each flower sits (the top of its stem) and how big it is, back row
// first so the rows in front are drawn over it. Eleven: flowers are given in
// odd numbers.
const HEADS = [
  [122, 206, 150], [180, 184, 156], [240, 186, 154], [292, 210, 148],
  [82, 262, 152], [148, 248, 162], [220, 250, 162], [306, 266, 150],
  [128, 312, 160], [200, 302, 168], [274, 314, 158],
];

// Each rose: the cubic curve of its stem (bottom → flower), the flower's size,
// and how it faces the viewer. Every stem passes through the bow, and they
// cross there, so the bottoms fan out mirrored.
const ROSES = HEADS.map(([x, y, size], i) => {
  const off = x - TIE.x;
  const stem = [
    [TIE.x - off * 0.16, 538],
    [TIE.x - off * 0.04, 480],
    [TIE.x + off * 0.5, TIE.y + (y - TIE.y) * 0.55],
    [x, y],
  ];
  // Opening ripples out from the middle of the front row.
  const dist = Math.hypot(x - 200, (y - 302) * 1.3);
  return {
    seed: 11 + i * 18,
    stem,
    size,
    view: { yaw: (i * 2.39) % 6.28, lean: -off / 330, tilt: 0.5 + ((i * 7) % 5) * 0.04 },
    delay: 300 + dist * 26,
    dur: 4200 + ((i * 5) % 4) * 250,
  };
});
const BLOOM_MS = Math.max(...ROSES.map((r) => r.delay + r.dur));
const BUD_OPEN = 0.03;
// Past this the outer petals fold right down and it reads as a peony.
const FULL_OPEN = 0.85;

function bez(pts, t) {
  const m = 1 - t;
  const a = m * m * m, b = 3 * m * m * t, c = 3 * m * t * t, d = t * t * t;
  return [
    a * pts[0][0] + b * pts[1][0] + c * pts[2][0] + d * pts[3][0],
    a * pts[0][1] + b * pts[1][1] + c * pts[2][1] + d * pts[3][1],
  ];
}

function bezTangent(pts, t) {
  const m = 1 - t;
  const x = 3 * m * m * (pts[1][0] - pts[0][0]) + 6 * m * t * (pts[2][0] - pts[1][0]) + 3 * t * t * (pts[3][0] - pts[2][0]);
  const y = 3 * m * m * (pts[1][1] - pts[0][1]) + 6 * m * t * (pts[2][1] - pts[1][1]) + 3 * t * t * (pts[3][1] - pts[2][1]);
  const l = Math.hypot(x, y) || 1;
  return [x / l, y / l];
}

const stemPath = (p) => `M${p[0][0]},${p[0][1]} C${p[1][0]},${p[1][1]} ${p[2][0]},${p[2][1]} ${p[3][0]},${p[3][1]}`;

const easeInOut = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

// The bloom is played back from frames rendered in advance (see
// roseWorker.js): this many per rose, bud to full, blended in between. All
// but the last are rendered at LOW of the canvas size — they are only on
// screen for a moment each, while the last one stays.
const FRAMES = 14;
const LOW = 0.6;
// How long the stems, leaves and buds take to arrive. Nothing heavy runs
// before this, so that animation has the phone to itself.
const GROW_MS = 3600;

export default function RosesGift() {
  // grow → bud (waits for a tap) → bloom → bloomed → note
  const reduced = useMemo(() => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches, []);
  const [phase, setPhase] = useState(reduced ? "bloomed" : "grow");
  const [noteOpen, setNoteOpen] = useState(false);
  const bloomStart = useRef(reduced ? -Infinity : null);
  // Flipped a moment after mount, not on it: the stems need one painted frame
  // at zero length for their draw-in transition to have somewhere to start.
  const [grown, setGrown] = useState(reduced);
  const [growDone, setGrowDone] = useState(reduced);
  const [baked, setBaked] = useState(false);
  const canvases = useRef([]);
  const frames = useRef(ROSES.map(() => []));
  const dirty = useRef(false);

  useEffect(() => {
    if (reduced) return undefined;
    const a = setTimeout(() => setGrown(true), 250);
    const b = setTimeout(() => setGrowDone(true), GROW_MS);
    return () => {
      clearTimeout(a);
      clearTimeout(b);
    };
  }, [reduced]);

  // The tap is only offered once every frame of the bloom exists.
  useEffect(() => {
    if (phase === "grow" && growDone && baked) setPhase("bud");
  }, [phase, growDone, baked]);

  useEffect(() => {
    const onFrame = (id, k, img) => {
      frames.current[id][k]?.close?.();
      frames.current[id][k] = img;
      dirty.current = true;
    };
    const stop = bakeFrames({ canvases: canvases.current, onFrame, onDone: () => setBaked(true), delay: reduced ? 0 : GROW_MS });
    return () => {
      stop();
      frames.current.forEach((fs) => fs.forEach((f) => f?.close?.()));
      frames.current = ROSES.map(() => []);
    };
  }, [reduced]);

  // Playback: each frame, every canvas shows the two baked frames either side
  // of where its rose should be, blended. Two drawImage calls per rose.
  useEffect(() => {
    const shown = ROSES.map(() => -1);
    const sizes = ROSES.map(() => 0);
    const fit = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvases.current.forEach((c, i) => {
        const px = Math.round(c.clientWidth * dpr);
        if (px > 0 && px !== sizes[i]) {
          c.width = c.height = sizes[i] = px;
          shown[i] = -1;
        }
      });
    };
    fit();
    const ro = new ResizeObserver(fit);
    canvases.current.forEach((c) => ro.observe(c));
    let raf = 0;
    const tick = (now) => {
      const force = dirty.current;
      dirty.current = false;
      ROSES.forEach((r, i) => {
        const pos = bloomPos(r, bloomStart.current, now);
        if (!force && Math.abs(pos - shown[i]) < 0.002) return;
        if (paint(canvases.current[i], frames.current[i], pos)) shown[i] = pos;
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  const startBloom = () => {
    if (phase !== "bud") return;
    bloomStart.current = performance.now();
    setPhase("bloom");
    setTimeout(() => setPhase("bloomed"), BLOOM_MS + 300);
  };

  const bloomed = phase === "bloomed";

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center overflow-x-hidden"
      style={{ background: C.bg, fontFamily: "'Manrope', ui-sans-serif, system-ui, sans-serif", paddingBottom: 48 }}
    >
      <Styles />
      <Dust />
      {bloomed && !reduced && <FallingPetals />}

      <div
        className={`rg-bouquet ${noteOpen ? "rg-bouquet-small" : ""}`}
        onClick={startBloom}
        style={{ cursor: phase === "bud" ? "pointer" : "default" }}
      >
        <div className="rg-glow" style={{ opacity: grown ? 1 : 0 }} />
        <Stems grown={grown} instant={reduced} />
        {ROSES.map((r, i) => (
          <Head
            key={r.seed}
            index={i}
            rose={r}
            shown={grown}
            instant={reduced}
            swaying={bloomed && !reduced}
            canvasRef={(el) => {
              if (el) canvases.current[i] = el;
            }}
          />
        ))}
      </div>

      <div className="w-full flex flex-col items-center" style={{ padding: "0 16px", minHeight: 120 }}>
        {phase === "bud" && (
          <p className="rg-hint" style={{ color: C.muted }}>
            {COPY.tapRose}
          </p>
        )}
        {bloomed && <Note open={noteOpen} onOpen={() => setNoteOpen(true)} instant={reduced} />}
      </div>
    </div>
  );
}

/** Where rose `r` is in its bloom at `now`, as a position among the frames. */
function bloomPos(r, start, now) {
  if (start === null) return 0;
  const x = Math.min(1, Math.max(0, (now - start - r.delay) / r.dur));
  return easeInOut(x) * (FRAMES - 1);
}

/** Shows `pos` on the canvas: frame ⌊pos⌋, with the next one blended over it. */
function paint(canvas, fs, pos) {
  if (!canvas || !canvas.width) return false;
  const k = Math.min(FRAMES - 1, Math.floor(pos));
  let a = fs[k];
  let b = null;
  let f = 0;
  if (a) {
    b = fs[k + 1] || null;
    f = pos - k;
  } else {
    // Not rendered yet — hold the latest one that is.
    for (let j = k - 1; j >= 0 && !a; j--) a = fs[j];
    if (!a) return false;
  }
  const ctx = canvas.getContext("2d");
  const w = canvas.width;
  ctx.clearRect(0, 0, w, w);
  ctx.globalAlpha = 1;
  ctx.drawImage(a, 0, 0, w, w);
  if (b && f > 0.002) {
    ctx.globalAlpha = f;
    ctx.drawImage(b, 0, 0, w, w);
    ctx.globalAlpha = 1;
  }
  return true;
}

/**
 * Renders every rose's frames: the buds straight away (they are cheap), the
 * rest after `delay`. Uses a couple of workers where OffscreenCanvas exists,
 * and otherwise — or if a worker fails — renders on this thread in small
 * slices between frames. Returns a function that stops it.
 */
function bakeFrames({ canvases, onFrame, onDone, delay }) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const spec = ROSES.map((r, i) => ({
    id: i,
    seed: r.seed,
    view: r.view,
    px: Math.max(32, Math.round((canvases[i]?.clientWidth || 140) * dpr)),
  }));
  // The first to open are rendered first.
  const order = [...spec].sort((a, b) => ROSES[a.id].delay - ROSES[b.id].delay);
  const bakeMsg = { type: "bake", frames: FRAMES, bud: BUD_OPEN, full: FULL_OPEN, low: LOW };
  const timers = [];
  let stopped = false;
  let workers = null;
  let stopLocal = null;

  const local = (fromBuds) => {
    const jobs = [];
    if (fromBuds) spec.forEach((r) => jobs.push({ r, k: 0 }));
    const rest = [];
    order.forEach((r) => {
      for (let k = 1; k < FRAMES; k++) rest.push({ r, k });
    });
    let i = 0;
    const run = () => {
      if (stopped) return;
      const t0 = performance.now();
      while (i < jobs.length && performance.now() - t0 < 8) {
        const { r, k } = jobs[i++];
        const last = k === FRAMES - 1;
        const px = k === 0 || last ? r.px : Math.max(32, Math.round(r.px * LOW));
        const c = document.createElement("canvas");
        c.width = c.height = px;
        const mesh = last ? "fine" : k === 0 ? "coarse" : "draft";
        drawRose(c.getContext("2d"), localModel(r.seed), BUD_OPEN + ((FULL_OPEN - BUD_OPEN) * k) / (FRAMES - 1), px, r.view, mesh);
        onFrame(r.id, k, c);
      }
      if (i < jobs.length) timers.push(setTimeout(run, 0));
      else if (jobs.length === spec.length && fromBuds) {
        // Buds done; the rest waits for the growing animation to finish.
        jobs.push(...rest);
        timers.push(setTimeout(run, delay));
      } else onDone();
    };
    run();
    stopLocal = () => {
      stopped = true;
    };
  };

  const supported =
    typeof Worker !== "undefined" &&
    typeof OffscreenCanvas !== "undefined" &&
    typeof OffscreenCanvas.prototype.transferToImageBitmap === "function";
  if (supported) {
    try {
      const n = (navigator.hardwareConcurrency || 2) >= 4 ? 2 : 1;
      workers = Array.from({ length: n }, () => new Worker(new URL("./roseWorker.js", import.meta.url), { type: "module" }));
    } catch {
      workers = null;
    }
  }

  if (!workers) {
    local(true);
  } else {
    let pending = workers.length;
    let failed = false;
    const share = (list, wi) => list.filter((_, j) => j % workers.length === wi);
    workers.forEach((w, wi) => {
      w.onmessage = ({ data }) => {
        if (data.done) {
          if (--pending === 0) onDone();
        } else onFrame(data.id, data.k, data.bitmap);
      };
      w.onerror = () => {
        if (failed || stopped) return;
        failed = true;
        workers.forEach((x) => x.terminate());
        timers.forEach(clearTimeout);
        local(true);
      };
      w.postMessage({ type: "buds", roses: share(spec, wi), bud: BUD_OPEN });
    });
    timers.push(setTimeout(() => workers.forEach((w, wi) => w.postMessage({ ...bakeMsg, roses: share(order, wi) })), delay));
  }

  return () => {
    stopped = true;
    timers.forEach(clearTimeout);
    workers?.forEach((w) => w.terminate());
    stopLocal?.();
  };
}

const localModels = new Map();
function localModel(seed) {
  if (!localModels.has(seed)) localModels.set(seed, makeRose(seed));
  return localModels.get(seed);
}

/** One flower head: a canvas the playback loop above paints into. */
function Head({ index, rose, shown, instant, swaying, canvasRef }) {
  const [tx, ty] = rose.stem[3];
  return (
    <div
      className="rg-head"
      style={{
        left: `${((tx - rose.size / 2) / VB.w) * 100}%`,
        top: `${((ty - STEM_TIP * rose.size) / VB.h) * 100}%`,
        width: `${(rose.size / VB.w) * 100}%`,
        transformOrigin: `50% ${STEM_TIP * 100}%`,
        transform: shown ? "scale(1)" : "scale(0.12)",
        opacity: shown ? 1 : 0,
        // The buds arrive once the stems have reached them.
        transition: instant
          ? "none"
          : `transform 1.1s cubic-bezier(.2,.9,.3,1.12) ${1.5 + 0.09 * index}s, opacity .5s ease ${1.5 + 0.09 * index}s`,
      }}
    >
      <div
        className={swaying ? "rg-sway" : ""}
        style={{ width: "100%", height: "100%", transformOrigin: `50% ${STEM_TIP * 100}%`, animationDelay: `${-index * 1.9}s` }}
      >
        <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block" }} />
      </div>
    </div>
  );
}

// ── Stems, leaves, thorns, bow ──────────────────────────────────────────────

// Some on the outer stems below the flowers, and some high on the back stems
// so they show between the heads, the way foliage does in a real bouquet.
const LEAVES = [
  { rose: 4, t: 0.6, angle: 196, len: 66 },
  { rose: 7, t: 0.6, angle: -16, len: 64 },
  { rose: 8, t: 0.5, angle: 206, len: 56 },
  { rose: 10, t: 0.5, angle: -26, len: 56 },
  { rose: 0, t: 0.9, angle: 214, len: 62 },
  { rose: 3, t: 0.9, angle: -34, len: 62 },
  { rose: 1, t: 0.94, angle: 250, len: 56 },
  { rose: 2, t: 0.94, angle: -70, len: 56 },
  { rose: 4, t: 0.94, angle: 176, len: 54 },
  { rose: 7, t: 0.94, angle: 4, len: 54 },
];

const THORNS = [0.3, 0.55, 0.8];

function leafletPath(l, w, seed) {
  const N = 11;
  const hw = (x) => w * Math.pow(Math.sin(Math.PI * Math.pow(Math.min(1, Math.max(0, x / l)), 0.78)), 0.9);
  const top = [];
  for (let i = 0; i < N; i++) {
    const xa = (l * i) / N;
    const xb = (l * (i + 0.8)) / N;
    const tooth = i >= 1 && i < N - 1 ? w * (0.07 + 0.02 * Math.sin(i * 2.3 + seed)) : 0;
    top.push([xa, -hw(xa)]);
    top.push([xb, -hw(xb) - tooth]);
  }
  const bottom = top.map(([x, y], i) => [x, -y * (0.94 + 0.05 * Math.sin(i + seed))]).reverse();
  const pts = [[0, 0], ...top, [l, 0], ...bottom];
  return `M${pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" L")} Z`;
}

function Leaflet({ l, w, seed }) {
  const d = useMemo(() => leafletPath(l, w, seed), [l, w, seed]);
  const veins = [];
  for (let k = 1; k <= 5; k++) {
    const x = (l * k) / 6.5;
    const reach = w * 0.78 * Math.sin(Math.PI * (x / l) ** 0.78);
    veins.push(`M${x},0 Q${x + reach * 0.5},${-reach * 0.5} ${x + reach * 0.9},${-reach}`);
    veins.push(`M${x},0 Q${x + reach * 0.5},${reach * 0.5} ${x + reach * 0.9},${reach}`);
  }
  return (
    <g>
      <path d={d} fill="url(#rg-leaf)" stroke="#16331a" strokeWidth="0.6" strokeLinejoin="round" />
      <path d={d} fill="url(#rg-leaf-shine)" />
      <path d={`M0,0 Q${l * 0.5},${-w * 0.08} ${l * 0.96},0`} stroke="#79a86a" strokeOpacity="0.55" strokeWidth="0.9" fill="none" />
      <path d={veins.join(" ")} stroke="#8cba7a" strokeOpacity="0.28" strokeWidth="0.5" fill="none" />
    </g>
  );
}

function CompoundLeaf({ len }) {
  const l = len * 0.52;
  return (
    <g>
      <path d={`M0,0 Q${len * 0.5},-3 ${len * 0.9},0`} stroke="#2c5226" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      <g transform={`translate(${len * 0.42},-1) rotate(-52)`}>
        <Leaflet l={l * 0.8} w={l * 0.3} seed={1} />
      </g>
      <g transform={`translate(${len * 0.42},0) rotate(48)`}>
        <Leaflet l={l * 0.78} w={l * 0.29} seed={2} />
      </g>
      <g transform={`translate(${len * 0.86},0) rotate(-4)`}>
        <Leaflet l={l} w={l * 0.34} seed={3} />
      </g>
    </g>
  );
}

function Stems({ grown, instant }) {
  const draw = (delay) => ({
    strokeDasharray: 1,
    strokeDashoffset: grown ? 0 : 1,
    transition: instant ? "none" : `stroke-dashoffset 1.7s cubic-bezier(.45,.05,.3,1) ${delay}s`,
  });
  const later = (delay, dur = 0.8) => ({
    opacity: grown ? 1 : 0,
    transform: grown ? "scale(1)" : "scale(0.2)",
    transition: instant ? "none" : `opacity ${dur}s ease ${delay}s, transform ${dur + 0.3}s cubic-bezier(.2,.9,.3,1.15) ${delay}s`,
  });

  return (
    <svg viewBox={`0 0 ${VB.w} ${VB.h}`} className="rg-stems" aria-hidden="true">
      <defs>
        <linearGradient id="rg-leaf" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#4f8b41" />
          <stop offset="0.55" stopColor="#2f6130" />
          <stop offset="1" stopColor="#1b3f1f" />
        </linearGradient>
        <radialGradient id="rg-leaf-shine" cx="0.35" cy="0.3" r="0.6">
          <stop offset="0" stopColor="#d9f0c0" stopOpacity="0.22" />
          <stop offset="1" stopColor="#d9f0c0" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="rg-satin" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FBF3E8" />
          <stop offset="0.45" stopColor="#EADAC4" />
          <stop offset="1" stopColor="#B99F82" />
        </linearGradient>
        <linearGradient id="rg-satin-side" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#F4E7D5" />
          <stop offset="0.5" stopColor="#D8C2A6" />
          <stop offset="1" stopColor="#A88D70" />
        </linearGradient>
        <radialGradient id="rg-knot" cx="0.4" cy="0.35" r="0.7">
          <stop offset="0" stopColor="#FFF8EE" />
          <stop offset="1" stopColor="#BFA487" />
        </radialGradient>
      </defs>

      {ROSES.map((r, i) => (
        <g key={i}>
          <path d={stemPath(r.stem)} pathLength="1" stroke="#1f3f1c" strokeWidth="5.6" fill="none" strokeLinecap="round" style={draw(0.1 * i)} />
          <path d={stemPath(r.stem)} pathLength="1" stroke="#3d7535" strokeWidth="3.2" fill="none" strokeLinecap="round" style={draw(0.1 * i)} />
          <path
            d={stemPath(r.stem)}
            pathLength="1"
            stroke="#8fc07c"
            strokeOpacity="0.5"
            strokeWidth="1"
            fill="none"
            strokeLinecap="round"
            transform="translate(-1.1,0)"
            style={draw(0.1 * i)}
          />
          {THORNS.map((t, k) => {
            const [x, y] = bez(r.stem, t);
            const [dx, dy] = bezTangent(r.stem, t);
            const side = (k + i) % 2 ? 1 : -1;
            const nx = -dy * side, ny = dx * side;
            const b1 = [x - dx * 3 + nx * 2, y - dy * 3 + ny * 2];
            const b2 = [x + dx * 3 + nx * 2, y + dy * 3 + ny * 2];
            const tip = [x + nx * 7 + dx * 4, y + ny * 7 + dy * 4];
            return (
              <path
                key={k}
                d={`M${b1} Q${x + nx * 4},${y + ny * 4} ${tip} Q${x + nx * 3 + dx * 2},${y + ny * 3 + dy * 2} ${b2} Z`}
                fill="#5a3326"
                stroke="#2f1a14"
                strokeWidth="0.4"
                style={{ ...later(1.2 + t * 0.6, 0.4), transformBox: "fill-box", transformOrigin: "center" }}
              />
            );
          })}
        </g>
      ))}

      {LEAVES.map((lf, k) => {
        const [x, y] = bez(ROSES[lf.rose].stem, lf.t);
        return (
          <g key={k} transform={`translate(${x},${y}) rotate(${lf.angle})`}>
            <g style={{ ...later(1.3 + k * 0.08, 0.9), transformBox: "view-box", transformOrigin: "0px 0px" }}>
              <CompoundLeaf len={lf.len} />
            </g>
          </g>
        );
      })}

      {/* The bow where the stems cross. */}
      <g transform={`translate(${TIE.x},${TIE.y})`}>
        <g style={{ ...later(2.0, 0.7), transformBox: "view-box", transformOrigin: "0px 0px" }}>
          <path d="M-5,5 C-11,22 -19,42 -28,64 L-18,60 L-13,69 C-7,46 -3,26 3,7 Z" fill="url(#rg-satin-side)" />
          <path d="M5,5 C13,23 21,43 31,62 L21,60 L18,70 C11,47 5,27 -2,7 Z" fill="url(#rg-satin-side)" />
          <rect x="-17" y="-7" width="34" height="14" rx="3" fill="url(#rg-satin)" />
          <path d="M-17,-2 L17,-2" stroke="#fff" strokeOpacity="0.4" strokeWidth="1" />
          <path d="M0,0 C-14,-24 -46,-28 -48,-8 C-50,9 -23,11 0,0 Z" fill="url(#rg-satin)" />
          <path d="M-4,-2 C-16,-16 -36,-18 -40,-8" stroke="#A48B6E" strokeOpacity="0.55" strokeWidth="1.2" fill="none" />
          <path d="M0,0 C16,-26 48,-26 49,-6 C50,11 23,11 0,0 Z" fill="url(#rg-satin)" />
          <path d="M4,-2 C17,-17 38,-18 42,-7" stroke="#A48B6E" strokeOpacity="0.55" strokeWidth="1.2" fill="none" />
          <path d="M-30,-15 C-22,-19 -12,-16 -6,-9" stroke="#fff" strokeOpacity="0.55" strokeWidth="1.4" fill="none" strokeLinecap="round" />
          <path d="M28,-17 C20,-20 11,-16 6,-9" stroke="#fff" strokeOpacity="0.45" strokeWidth="1.4" fill="none" strokeLinecap="round" />
          <ellipse cx="0" cy="0" rx="7.5" ry="8.5" fill="url(#rg-knot)" stroke="#9C8264" strokeWidth="0.5" />
        </g>
      </g>
    </svg>
  );
}

// ── Atmosphere ──────────────────────────────────────────────────────────────

const PETALS = Array.from({ length: 10 }, (_, i) => ({
  left: 22 + ((i * 37) % 56),
  top: 8 + ((i * 23) % 26),
  size: 13 + ((i * 7) % 9),
  dur: 10 + ((i * 13) % 7),
  delay: i * 1.35 + ((i * 7) % 3),
  sway: ((i % 2) * 2 - 1) * (22 + ((i * 11) % 26)),
  spin: 0.8 + ((i * 3) % 5) / 4,
  hue: i % 3,
}));

const PETAL_FILLS = [
  ["#5c0612", "#a3121f", "#c83341"],
  ["#4a0510", "#8f0f1c", "#b8293a"],
  ["#66101a", "#b01b2a", "#d3434f"],
];

function Petal({ size, hue }) {
  const [a, b, c] = PETAL_FILLS[hue];
  const id = `rg-pf-${hue}`;
  return (
    <svg width={size} height={size * 1.3} viewBox="0 0 24 32" style={{ display: "block", overflow: "visible" }}>
      <defs>
        <radialGradient id={id} cx="0.5" cy="0.95" r="1">
          <stop offset="0" stopColor={a} />
          <stop offset="0.55" stopColor={b} />
          <stop offset="1" stopColor={c} />
        </radialGradient>
      </defs>
      {/* Narrow at the base, one broad rounded top — no notch, so it reads
          as a petal and not a heart. */}
      <path d="M12 31 C6.5 28.5 1.2 21 1.4 13 C1.6 6 6 1.6 12.6 1.4 C18.6 1.2 22.8 5.4 22.6 12.2 C22.4 20.4 17.6 28.2 12 31 Z" fill={`url(#${id})`} />
      <path d="M4 9 C6 5 9 4 11.5 5.5" stroke="#fff" strokeOpacity="0.18" strokeWidth="1.2" fill="none" strokeLinecap="round" />
    </svg>
  );
}

function FallingPetals() {
  return (
    // In front of the flowers, behind the note — petals drifting across the
    // text would make it hard to read.
    <div aria-hidden="true" style={{ position: "fixed", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 1 }}>
      {PETALS.map((p, i) => (
        <div
          key={i}
          className="rg-fall"
          style={{
            left: `${p.left}%`,
            top: `${p.top}%`,
            "--sway": `${p.sway}px`,
            animationDuration: `${p.dur}s`,
            animationDelay: `${p.delay}s`,
          }}
        >
          <div className="rg-drift" style={{ animationDuration: `${p.dur / 3}s`, "--sway": `${p.sway}px` }}>
            <div className="rg-flutter" style={{ animationDuration: `${2.6 / p.spin}s` }}>
              <Petal size={p.size} hue={p.hue} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

const MOTES = Array.from({ length: 14 }, (_, i) => ({
  left: (i * 41) % 100,
  top: (i * 29) % 90,
  size: 1.5 + (i % 3),
  dur: 9 + ((i * 7) % 8),
  delay: -((i * 5) % 11),
}));

function Dust() {
  return (
    <div aria-hidden="true" style={{ position: "fixed", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
      {MOTES.map((m, i) => (
        <span
          key={i}
          className="rg-mote"
          style={{
            left: `${m.left}%`,
            top: `${m.top}%`,
            width: m.size,
            height: m.size,
            animationDuration: `${m.dur}s`,
            animationDelay: `${m.delay}s`,
          }}
        />
      ))}
    </div>
  );
}

// ── The note ────────────────────────────────────────────────────────────────

const PAPER = {
  backgroundColor: C.paper,
  backgroundImage: `radial-gradient(ellipse at 50% 40%, rgba(255,255,255,0.5), rgba(214,196,170,0.35) 100%), url("data:image/svg+xml,${encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 0.35  0 0 0 0 0.26  0 0 0 0 0.18  0 0 0 0.09 0"/></filter><rect width="100%" height="100%" filter="url(#n)"/></svg>',
  )}")`,
  boxShadow: "0 24px 60px rgba(0,0,0,0.5), 0 3px 10px rgba(0,0,0,0.35)",
};

function Note({ open, onOpen, instant }) {
  // closed → turning (the cover swings open) → open (the page grows, ink appears)
  const [stage, setStage] = useState(open ? "open" : "closed");
  const ref = useRef(null);

  const tap = () => {
    if (stage !== "closed") return;
    setStage("turning");
    setTimeout(
      () => {
        setStage("open");
        onOpen();
        setTimeout(() => ref.current?.scrollIntoView({ behavior: instant ? "auto" : "smooth", block: "center" }), 500);
      },
      instant ? 0 : 950,
    );
  };

  const ink = (i) => ({
    initial: instant ? false : { opacity: 0, y: 5, filter: "blur(5px)" },
    animate: { opacity: 1, y: 0, filter: "blur(0px)" },
    transition: { duration: 1.1, delay: 0.9 + i * 0.75, ease: [0.22, 0.61, 0.36, 1] },
  });

  if (stage !== "open") {
    return (
      <motion.div
        initial={instant ? false : { opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: [0.2, 0.8, 0.3, 1] }}
        className="flex flex-col items-center"
        style={{ marginTop: 6, position: "relative", zIndex: 2 }}
      >
        <button
          onClick={tap}
          aria-label={COPY.tapNote}
          className={stage === "closed" ? "rg-card-bob" : ""}
          style={{ position: "relative", width: 250, height: 150, perspective: 1100, border: "none", background: "none", padding: 0, cursor: "pointer" }}
        >
          {/* Inside page, seen as the cover turns away. */}
          <div style={{ ...PAPER, position: "absolute", inset: 0, borderRadius: 4 }} />
          <div
            style={{
              position: "absolute",
              inset: 0,
              transformOrigin: "0% 50%",
              transformStyle: "preserve-3d",
              transform: stage === "turning" ? "rotateY(-172deg)" : "rotateY(0deg)",
              transition: "transform 1s cubic-bezier(.5,.05,.25,1)",
            }}
          >
            <div
              style={{
                ...PAPER,
                position: "absolute",
                inset: 0,
                borderRadius: 4,
                backfaceVisibility: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid rgba(160,130,95,0.35)",
              }}
            >
              <div style={{ position: "absolute", inset: 9, border: "1px solid rgba(150,110,80,0.28)", borderRadius: 2 }} />
              <span style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: "italic", fontSize: 30, color: C.ink }}>
                {COPY.cover}
              </span>
              <WaxSeal />
            </div>
            <div
              style={{
                ...PAPER,
                position: "absolute",
                inset: 0,
                borderRadius: 4,
                transform: "rotateY(180deg)",
                backfaceVisibility: "hidden",
                filter: "brightness(0.9)",
              }}
            />
          </div>
        </button>
        {stage === "closed" && (
          <p className="rg-hint" style={{ color: C.muted, marginTop: 18 }}>
            {COPY.tapNote}
          </p>
        )}
      </motion.div>
    );
  }

  const paragraphs = COPY.note;
  return (
    <motion.div
      ref={ref}
      initial={instant ? false : { opacity: 0.6, scaleX: 0.7, scaleY: 0.35 }}
      animate={{ opacity: 1, scaleX: 1, scaleY: 1 }}
      transition={{ duration: 0.8, ease: [0.3, 0.7, 0.2, 1] }}
      style={{
        ...PAPER,
        position: "relative",
        zIndex: 2,
        width: "100%",
        maxWidth: 380,
        borderRadius: 4,
        padding: "34px 28px 30px",
        transformOrigin: "50% 0%",
        color: C.ink,
        fontFamily: "'Cormorant Garamond', Georgia, serif",
        marginTop: 4,
      }}
    >
      <div style={{ position: "absolute", top: 12, right: 14, transform: "rotate(28deg)", filter: "drop-shadow(0 2px 2px rgba(60,20,20,0.35))" }}>
        <Petal size={20} hue={0} />
      </div>
      {paragraphs.map((text, i) => (
        <motion.p
          key={i}
          {...ink(i)}
          style={{
            fontSize: i === 0 ? 25 : 20,
            fontStyle: "italic",
            fontWeight: 500,
            lineHeight: 1.45,
            margin: i === 0 ? "0 0 12px" : "0 0 12px",
          }}
        >
          {text}
        </motion.p>
      ))}
      {COPY.verse && (
        <motion.div {...ink(paragraphs.length)} style={{ textAlign: "center", margin: "22px 0 8px" }}>
          <div style={{ width: 40, height: 1, background: "rgba(90,60,50,0.3)", margin: "0 auto 14px" }} />
          <p dir="rtl" lang="ar" style={{ fontFamily: "'Amiri', serif", fontSize: 26, lineHeight: 1.6, color: "#6b1a24", margin: 0 }}>
            {COPY.verse.arabic}
          </p>
          <p style={{ fontSize: 15.5, fontStyle: "italic", color: C.inkSoft, margin: "4px 0 0" }}>{COPY.verse.meaning}</p>
        </motion.div>
      )}
      <motion.p
        {...ink(paragraphs.length + 1)}
        style={{ textAlign: "right", fontSize: 26, fontStyle: "italic", fontWeight: 600, margin: "18px 4px 0" }}
      >
        {COPY.signature}
      </motion.p>
    </motion.div>
  );
}

function WaxSeal() {
  return (
    <svg width="38" height="38" viewBox="0 0 40 40" style={{ position: "absolute", right: 16, bottom: 14 }} aria-hidden="true">
      <defs>
        <radialGradient id="rg-wax" cx="0.38" cy="0.32" r="0.75">
          <stop offset="0" stopColor="#c23a47" />
          <stop offset="0.6" stopColor="#8a1522" />
          <stop offset="1" stopColor="#5a0a14" />
        </radialGradient>
      </defs>
      <path
        d="M20 2 C25 1 28 4 32 6 C37 9 38 14 38 19 C39 25 36 29 33 33 C29 37 24 38 19 38 C13 38 9 36 6 32 C2 28 2 23 2 18 C3 12 6 8 10 5 C13 3 16 2 20 2 Z"
        fill="url(#rg-wax)"
      />
      <circle cx="20" cy="20" r="11.5" fill="none" stroke="#5a0a14" strokeOpacity="0.55" strokeWidth="1.4" />
      <circle cx="20" cy="20" r="11.5" fill="none" stroke="#e46b76" strokeOpacity="0.3" strokeWidth="0.6" transform="translate(-0.6,-0.6)" />
      {/* A rose seen from above, pressed into the wax as a spiral. */}
      <path
        d="M20 20 C21.5 19 22.2 21 20.8 22 C18.8 23.2 17 21 18 19 C19.2 16.8 22.6 16.8 23.8 19.4 C25 22.4 22.6 25.4 19.4 25.2 C15.6 25 13.8 21.4 15 18 C16.4 14.4 21 13 24.4 15.2"
        fill="none"
        stroke="#5c0a15"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      <path
        d="M20 20 C21.5 19 22.2 21 20.8 22 C18.8 23.2 17 21 18 19 C19.2 16.8 22.6 16.8 23.8 19.4 C25 22.4 22.6 25.4 19.4 25.2 C15.6 25 13.8 21.4 15 18 C16.4 14.4 21 13 24.4 15.2"
        fill="none"
        stroke="#e46b76"
        strokeOpacity="0.3"
        strokeWidth="0.5"
        transform="translate(-0.5,-0.5)"
      />
    </svg>
  );
}

function Styles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;1,500;1,600&display=swap');

      .rg-bouquet {
        position: relative;
        width: min(100vw - 24px, 420px);
        aspect-ratio: ${VB.w} / ${VB.h};
        margin-top: 12px;
        transform-origin: 50% 0%;
        transition: transform 1.2s cubic-bezier(.3,.7,.2,1), margin-bottom 1.2s cubic-bezier(.3,.7,.2,1);
        -webkit-tap-highlight-color: transparent;
      }
      .rg-bouquet-small {
        transform: scale(0.55);
        margin-bottom: calc(min(100vw - 24px, 420px) * ${VB.h / VB.w} * -0.45);
      }
      .rg-stems { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; }
      .rg-head { position: absolute; aspect-ratio: 1; }
      .rg-glow {
        position: absolute; left: 10%; right: 10%; top: 8%; height: 52%;
        background: radial-gradient(ellipse at 50% 50%, rgba(214,90,90,0.16), rgba(214,90,90,0) 70%);
        transition: opacity 2s ease;
        pointer-events: none;
      }

      @keyframes rg-sway {
        0%, 100% { transform: rotate(-1.1deg); }
        50%      { transform: rotate(1.1deg); }
      }
      .rg-sway { animation: rg-sway 6.5s ease-in-out infinite; }

      @keyframes rg-hint {
        0%, 100% { opacity: 0.45; }
        50%      { opacity: 1; }
      }
      .rg-hint {
        font-size: 12px; letter-spacing: 3px; text-transform: lowercase;
        animation: rg-hint 2.6s ease-in-out infinite;
        margin-top: 4px;
      }

      @keyframes rg-card-bob {
        0%, 100% { transform: translateY(0) rotate(-1.2deg); }
        50%      { transform: translateY(-5px) rotate(0.6deg); }
      }
      .rg-card-bob { animation: rg-card-bob 4.2s ease-in-out infinite; }

      @keyframes rg-fall {
        0%   { transform: translateY(0); opacity: 0; }
        8%   { opacity: 0.95; }
        85%  { opacity: 0.9; }
        100% { transform: translateY(105vh); opacity: 0; }
      }
      @keyframes rg-drift {
        0%, 100% { transform: translateX(0); }
        50%      { transform: translateX(var(--sway)); }
      }
      @keyframes rg-flutter {
        0%   { transform: rotateX(0deg) rotateY(0deg) rotateZ(0deg); }
        25%  { transform: rotateX(55deg) rotateY(20deg) rotateZ(40deg); }
        50%  { transform: rotateX(10deg) rotateY(70deg) rotateZ(90deg); }
        75%  { transform: rotateX(-45deg) rotateY(25deg) rotateZ(150deg); }
        100% { transform: rotateX(0deg) rotateY(0deg) rotateZ(200deg); }
      }
      .rg-fall { position: absolute; opacity: 0; animation: rg-fall linear infinite; will-change: transform; }
      .rg-drift { animation: rg-drift ease-in-out infinite; }
      .rg-flutter { animation: rg-flutter linear infinite; transform-style: preserve-3d; filter: drop-shadow(0 3px 3px rgba(0,0,0,0.35)); }

      @keyframes rg-mote {
        0%, 100% { transform: translate(0, 0); opacity: 0; }
        30%      { opacity: 0.55; }
        50%      { transform: translate(14px, -26px); opacity: 0.35; }
        70%      { opacity: 0.5; }
      }
      .rg-mote {
        position: absolute; border-radius: 9999px;
        background: rgba(240, 200, 150, 0.8);
        box-shadow: 0 0 6px rgba(240, 200, 150, 0.6);
        animation: rg-mote ease-in-out infinite;
      }

      @media (prefers-reduced-motion: reduce) {
        .rg-sway, .rg-hint, .rg-card-bob, .rg-mote { animation: none; }
        .rg-bouquet { transition: none; }
      }
    `}</style>
  );
}
