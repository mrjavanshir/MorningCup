import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Eye, X } from "lucide-react";
import { endVisit, fetchVisits, startVisit, visitsAvailable } from "./birthdayVisits.js";

// ── İanənin təfərrüatları ───────────────────────────────────────────────────
// GlobalGiving-in göndərdiyi PDF sertifikatındakı məlumatlar. `certificate`
// boş qalsa, "sertifikatı aç" sətri ümumiyyətlə göstərilmir — PDF-i paylaşmaq
// istəsən onu public/ qovluğuna at və fayl adını bura yaz.
const GIFT = {
  org: "GlobalGiving",
  project: "One Child, One Future: Educate to Liberate",
  projectUrl: "https://www.globalgiving.org/71925",
  honoree: "Ganira",
  date: "August 23, 2026",
  certificate: "",
};

const C = {
  bg: "radial-gradient(ellipse at 50% 38%, #241119 0%, #170D11 100%)",
  card: "#2A1620",
  accent: "#B23A48",
  accentDark: "#7C2635",
  gold: "#D8A857",
  text: "#F3E7DA",
  muted: "rgba(243,231,218,0.75)",
  border: "rgba(216,168,87,0.25)",
};

const CANDLES = [66, 83, 100, 117, 134]; // SVG x koordinatları
const TRICK = 2; // ortadakı şam — özünü iki dəfə yenidən yandıran
const RELIGHTS = 2;

// Şamlar sönəndən sonra göydən tökülür. dx — yana sürüşmə, rot — fırlanma.
const CONFETTI = Array.from({ length: 26 }, (_, i) => ({
  left: (i * 37) % 100,
  size: 5 + ((i * 7) % 6),
  dx: ((i % 5) - 2) * 26,
  rot: 180 + ((i * 53) % 540),
  dur: 2.4 + ((i * 13) % 11) / 10,
  delay: ((i * 17) % 9) / 10,
  color: [C.gold, C.accent, C.text][i % 3],
  round: i % 4 === 0,
}));

const SPARKS = [
  { tx: -6, ty: -104, size: 12, delay: 0 },
  { tx: 34, ty: -92, size: 9, delay: 70 },
  { tx: -42, ty: -84, size: 10, delay: 40 },
  { tx: 66, ty: -68, size: 7, delay: 150 },
  { tx: -72, ty: -60, size: 8, delay: 120 },
  { tx: 16, ty: -128, size: 6, delay: 210 },
  { tx: -22, ty: -70, size: 7, delay: 260 },
  { tx: 52, ty: -112, size: 9, delay: 190 },
  { tx: -94, ty: -34, size: 6, delay: 300 },
  { tx: 88, ty: -30, size: 7, delay: 330 },
];

const STAGE_IN = {
  initial: { opacity: 0, y: 26, scale: 0.96 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -20, scale: 0.97 },
  transition: { type: "spring", stiffness: 240, damping: 26, mass: 0.9 },
};

export default function BirthdayGiftCard({ admin = false }) {
  // candles → wish → box → opening → card
  const [stage, setStage] = useState("candles");

  useTrackVisit();

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center px-5 py-10 overflow-hidden"
      style={{ background: C.bg, fontFamily: "'Manrope', ui-sans-serif, system-ui, sans-serif" }}
    >
      <Styles />

      {admin && <AdminVisits />}

      {stage !== "candles" && stage !== "card" && <Confetti />}

      <AnimatePresence mode="wait">
        <motion.div
          key={stage === "opening" ? "box" : stage}
          {...STAGE_IN}
          className="w-full flex flex-col items-center"
        >
          {stage === "candles" && <Candles onDone={() => setStage("wish")} />}
          {stage === "wish" && <Wish onDone={() => setStage("box")} />}
          {(stage === "box" || stage === "opening") && (
            <BoxStage opening={stage === "opening"} onOpen={() => setStage("opening")} onDone={() => setStage("card")} />
          )}
          {stage === "card" && <Card />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/**
 * Records one open-to-close visit. Fires the opening write immediately (so
 * "how many times" is accurate even if she closes the tab a second later),
 * then the closing write on whichever of visibilitychange/pagehide fires
 * first — pagehide is the more reliable of the two on mobile browsers, but
 * visibilitychange usually fires first and gives the fetch more time to
 * actually land before the tab is gone, so both are wired and the elapsed
 * time is only ever sent once.
 */
function useTrackVisit() {
  useEffect(() => {
    if (!visitsAvailable()) return;
    const start = Date.now();
    let handle = null;
    let sent = false;
    let cancelled = false;

    startVisit().then((h) => {
      if (cancelled) return;
      handle = h;
    });

    const send = () => {
      if (sent || !handle) return;
      sent = true;
      endVisit(handle, Date.now() - start);
    };
    const onHide = () => {
      if (document.visibilityState === "hidden") send();
    };

    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", send);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", send);
      send();
    };
  }, []);
}

function formatDuration(ms) {
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  return `${m}m ${s % 60}s`;
}

function formatWhen(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const today = new Date();
  const sameDay = d.toDateString() === today.toDateString();
  const date = sameDay ? "today" : d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  const time = d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  return `${date}, ${time}`;
}

/**
 * Admin-only: how many times the card was opened and how long each visit
 * stayed on screen. Nothing here is reachable unless the `admin` prop is
 * true, and that only happens through the app's existing admin unlock —
 * see owner.js. Ganira's own device never sets it.
 */
function AdminVisits() {
  const [open, setOpen] = useState(false);
  const [visits, setVisits] = useState(null); // null = not loaded yet
  const [loading, setLoading] = useState(false);

  const load = () => {
    setLoading(true);
    fetchVisits()
      .then(setVisits)
      .finally(() => setLoading(false));
  };

  const toggle = () => {
    setOpen((o) => {
      const next = !o;
      if (next && visits === null) load();
      return next;
    });
  };

  const total = visits?.length ?? 0;
  const totalMs = visits?.reduce((sum, v) => sum + (v.ms || 0), 0) ?? 0;

  return (
    <div style={{ position: "fixed", top: 12, right: 12, zIndex: 50 }}>
      <button
        type="button"
        onClick={toggle}
        aria-label="Visit stats (admin only)"
        style={{
          width: 34,
          height: 34,
          borderRadius: 9999,
          border: `1px solid ${C.border}`,
          background: C.card,
          color: C.gold,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Eye size={15} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            style={{
              position: "absolute",
              top: 42,
              right: 0,
              width: 240,
              maxHeight: "60vh",
              overflowY: "auto",
              background: C.card,
              border: `1px solid ${C.border}`,
              borderRadius: 12,
              padding: 14,
              boxShadow: "0 16px 40px rgba(0,0,0,0.5)",
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <span style={{ color: C.text, fontSize: 12, fontWeight: 700, letterSpacing: 0.4 }}>
                Card visits
              </span>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close" style={{ color: C.muted }}>
                <X size={13} />
              </button>
            </div>

            {loading && visits === null ? (
              <p style={{ color: C.muted, fontSize: 12 }}>loading…</p>
            ) : !visitsAvailable() ? (
              <p style={{ color: C.muted, fontSize: 12 }}>store not configured — set VITE_STORE_URL.</p>
            ) : total === 0 ? (
              <p style={{ color: C.muted, fontSize: 12 }}>no visits recorded yet.</p>
            ) : (
              <>
                <p style={{ color: C.muted, fontSize: 11.5 }} className="mb-3">
                  opened <span style={{ color: C.gold, fontWeight: 700 }}>{total}</span> time{total === 1 ? "" : "s"}
                  {" · "}
                  <span style={{ color: C.gold, fontWeight: 700 }}>{formatDuration(totalMs)}</span> total
                </p>
                <div className="flex flex-col gap-1.5">
                  {visits.map((v) => (
                    <div key={v.id} className="flex items-center justify-between" style={{ fontSize: 11.5 }}>
                      <span style={{ color: C.text }}>{formatWhen(v.at)}</span>
                      <span style={{ color: C.muted }}>{v.ms ? formatDuration(v.ms) : "—"}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── 1. Şamlar ──────────────────────────────────────────────────────────── */

function Candles({ onDone }) {
  const [lit, setLit] = useState(() => CANDLES.map(() => true));
  const [relights, setRelights] = useState(0);
  const [smoke, setSmoke] = useState([]); // {id, x}

  const litRef = useRef(lit);
  litRef.current = lit;
  const swiping = useRef(false);
  const last = useRef(null);
  const hits = useRef([]);
  const smokeId = useRef(0);

  const blowOut = (i) => {
    if (!litRef.current[i]) return;
    const next = [...litRef.current];
    next[i] = false;
    litRef.current = next;
    setLit(next);

    const id = ++smokeId.current;
    setSmoke((s) => [...s, { id, x: CANDLES[i] }]);
    setTimeout(() => setSmoke((s) => s.filter((p) => p.id !== id)), 1350);
  };

  // Barmağın alova nə qədər yaxın keçdiyinə baxırıq — SVG koordinatı yox,
  // ekran koordinatı, çünki şəkil ölçüsü telefondan telefona dəyişir.
  const douse = (x, y) => {
    hits.current.forEach((el, i) => {
      if (!el) return;
      const r = el.getBoundingClientRect();
      const dx = Math.abs(x - (r.left + r.width / 2));
      const dy = Math.abs(y - (r.top + r.height / 2));
      // Enində dar, hündürlüyündə geniş: yanından keçən barmaq qonşu şamı
      // aparmasın, amma alovun bir az üstündən keçmək kifayət etsin.
      if (dx < r.width * 0.55 && dy < r.height * 1.1) blowOut(i);
    });
  };

  // pointermove ~60Hz-də gəlir, sürətli çəkiliş iki nöqtə arasında bütöv bir
  // şamı atlaya bilər — ona görə addımların arasını da yoxlayırıq.
  const douseAlong = (x, y) => {
    const p = last.current;
    if (!p) {
      douse(x, y);
    } else {
      const steps = Math.min(14, Math.max(1, Math.ceil(Math.hypot(x - p.x, y - p.y) / 8)));
      for (let s = 1; s <= steps; s++) {
        const t = s / steps;
        douse(p.x + (x - p.x) * t, p.y + (y - p.y) * t);
      }
    }
    last.current = { x, y };
  };

  useEffect(() => {
    if (lit.some(Boolean)) return;
    // Trick candle: hamısı sönən kimi ortadakı özünü yenidən yandırır.
    if (relights < RELIGHTS) {
      const t = setTimeout(() => {
        const n = [...litRef.current];
        n[TRICK] = true;
        litRef.current = n;
        setLit(n);
        setRelights((r) => r + 1);
      }, 820);
      return () => clearTimeout(t);
    }
    const t = setTimeout(onDone, 900);
    return () => clearTimeout(t);
  }, [lit, relights, onDone]);

  const caption =
    relights === 0
      ? "swipe your finger over the candles"
      : relights === 1
        ? "hmm. these candles do that. once more."
        : "okay, that's the last one. promise.";

  return (
    <div className="w-full flex flex-col items-center">
      <div
        className="relative select-none"
        style={{ width: 300, maxWidth: "86vw", touchAction: "none" }}
        onPointerDown={(e) => {
          swiping.current = true;
          last.current = null;
          douseAlong(e.clientX, e.clientY);
        }}
        onPointerMove={(e) => {
          if (swiping.current) douseAlong(e.clientX, e.clientY);
        }}
        onPointerUp={() => {
          swiping.current = false;
          last.current = null;
        }}
        onPointerCancel={() => {
          swiping.current = false;
          last.current = null;
        }}
      >
        <Cake lit={lit} smoke={smoke} hits={hits} />
      </div>

      <AnimatePresence mode="wait">
        <motion.p
          key={caption}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.32 }}
          className="mt-2 text-sm text-center"
          style={{ color: C.muted }}
        >
          {caption}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}

function Cake({ lit, smoke, hits }) {
  return (
    <svg viewBox="0 0 200 200" width="100%" role="img" aria-label="Cake with candles">
      <defs>
        <linearGradient id="gcBody" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={C.accent} />
          <stop offset="100%" stopColor={C.accentDark} />
        </linearGradient>
        <linearGradient id="gcLid" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#C24552" />
          <stop offset="100%" stopColor={C.accent} />
        </linearGradient>
        <linearGradient id="gcGold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#E8C078" />
          <stop offset="100%" stopColor={C.gold} />
        </linearGradient>
        <linearGradient id="gcFlame" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor={C.accent} />
          <stop offset="45%" stopColor={C.gold} />
          <stop offset="100%" stopColor="#FFF3DC" />
        </linearGradient>
        <radialGradient id="gcHalo">
          <stop offset="0%" stopColor={C.gold} stopOpacity="0.4" />
          <stop offset="100%" stopColor={C.gold} stopOpacity="0" />
        </radialGradient>
      </defs>

      <ellipse cx="100" cy="181" rx="66" ry="7" fill="#000" opacity="0.3" />

      {/* Alt qat */}
      <rect x="38" y="134" width="124" height="40" rx="7" fill="url(#gcBody)" />
      <path d={frosting(38, 124, 134, 7, 7)} fill={C.text} opacity="0.92" />

      {/* Üst qat */}
      <rect x="54" y="100" width="92" height="38" rx="7" fill="url(#gcLid)" />
      <path d={frosting(54, 92, 100, 5, 7)} fill={C.text} opacity="0.92" />

      <rect x="38.75" y="134.75" width="122.5" height="38.5" rx="6.25" fill="none" stroke={C.border} strokeWidth="1.5" />
      <rect x="54.75" y="100.75" width="90.5" height="36.5" rx="6.25" fill="none" stroke={C.border} strokeWidth="1.5" />

      {/* Səpələnmiş qızılı xırdalar */}
      {[
        [64, 152],
        [88, 160],
        [112, 150],
        [136, 162],
        [100, 168],
        [76, 166],
      ].map(([x, y], i) => (
        <rect key={i} x={x} y={y} width="5" height="2" rx="1" fill={C.gold} opacity="0.5" transform={`rotate(${i * 34} ${x} ${y})`} />
      ))}

      {CANDLES.map((x, i) => (
        <g key={x}>
          <rect x={x - 3.5} y="70" width="7" height="34" rx="2" fill={i % 2 ? "url(#gcGold)" : C.text} opacity="0.95" />
          <rect x={x - 3.5} y="70" width="2" height="34" fill="#000" opacity="0.1" />
          <line x1={x} y1="70" x2={x} y2="65" stroke={C.muted} strokeWidth="1.4" strokeLinecap="round" />
        </g>
      ))}

      <AnimatePresence>
        {CANDLES.map((x, i) =>
          lit[i] ? (
            <motion.g
              key={`flame-${x}`}
              initial={{ opacity: 0, scaleY: 0.2 }}
              animate={{ opacity: 1, scaleY: 1 }}
              exit={{ opacity: 0, scaleY: 0.15, y: 2 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              style={{ transformBox: "fill-box", transformOrigin: "50% 100%" }}
            >
              <circle cx={x} cy="58" r="16" fill="url(#gcHalo)" className="gc-halo" style={{ animationDelay: `${i * 240}ms` }} />
              <g className="gc-flicker" style={{ animationDelay: `${i * 190}ms` }}>
                <path
                  d={`M ${x} 66 C ${x + 7} 60, ${x + 6} 50, ${x} 44 C ${x - 6} 50, ${x - 7} 60, ${x} 66 Z`}
                  fill="url(#gcFlame)"
                />
                <path
                  d={`M ${x} 65 C ${x + 3} 61, ${x + 2.5} 55, ${x} 52 C ${x - 2.5} 55, ${x - 3} 61, ${x} 65 Z`}
                  fill="#FFF6E4"
                  opacity="0.85"
                />
              </g>
            </motion.g>
          ) : null,
        )}
      </AnimatePresence>

      {smoke.map((p) => (
        <g key={p.id} className="gc-smoke" style={{ transformBox: "fill-box", transformOrigin: "50% 100%" }}>
          <path
            d={`M ${p.x} 66 C ${p.x - 5} 60, ${p.x + 5} 56, ${p.x} 50`}
            fill="none"
            stroke={C.text}
            strokeWidth="2.5"
            strokeLinecap="round"
            opacity="0.5"
          />
        </g>
      ))}

      {/* Toxunuş hədəfləri — həmişə var, alov sönsə də yeri bilinsin */}
      {CANDLES.map((x, i) => (
        <circle key={`hit-${x}`} ref={(el) => {
            hits.current[i] = el;
          }} cx={x} cy="58" r="14" fill="transparent" />
      ))}
    </svg>
  );
}

// Qatın üstündəki damcılı krem: düz kənar, sonra sağdan sola dalğalar.
function frosting(x, w, y, count, depth) {
  const seg = w / count;
  let d = `M ${x} ${y + 4} H ${x + w} V ${y + depth}`;
  for (let i = count; i > 0; i--) {
    const x1 = x + i * seg;
    d += ` Q ${x1 - seg / 2} ${y + depth * 2.4}, ${x1 - seg} ${y + depth}`;
  }
  return `${d} Z`;
}

/* ── 2. Arzu ────────────────────────────────────────────────────────────── */

function Wish({ onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2100);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className="flex flex-col items-center text-center px-4">
      <motion.h2
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 18 }}
        className="text-2xl"
        style={{ fontFamily: "'Fraunces', ui-serif, Georgia, serif", color: C.text, fontWeight: 500 }}
      >
        Make a wish.
      </motion.h2>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.45 }}
        className="mt-3 text-sm"
        style={{ color: C.muted }}
      >
        you think, I'll wait.
      </motion.p>
    </div>
  );
}

function Confetti() {
  return (
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 5 }}>
      {CONFETTI.map((p, i) => (
        <span
          key={i}
          className="gc-confetti absolute top-0"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.round ? p.size : p.size * 1.8,
            background: p.color,
            borderRadius: p.round ? "9999px" : 1,
            animationDuration: `${p.dur}s`,
            animationDelay: `${p.delay}s`,
            "--dx": `${p.dx}px`,
            "--rot": `${p.rot}deg`,
          }}
        />
      ))}
    </div>
  );
}

/* ── 3. Hədiyyə qutusu ──────────────────────────────────────────────────── */

function BoxStage({ opening, onOpen, onDone }) {
  const open = () => {
    if (opening) return;
    onOpen();
    setTimeout(onDone, 1000);
  };

  return (
    <div className="w-full flex flex-col items-center">
      <button
        type="button"
        onClick={open}
        aria-label="Open the gift"
        className="relative block bg-transparent border-0 p-0 cursor-pointer focus:outline-none"
        style={{ width: 232, height: 232 }}
      >
        <div style={{ width: "100%", height: "100%" }}>
          <GiftBox opening={opening} />
        </div>

        {opening &&
          SPARKS.map((s, i) => (
            <span
              key={i}
              className="gc-spark absolute pointer-events-none"
              style={{
                left: "49%",
                top: "32%",
                width: s.size,
                height: s.size,
                marginLeft: -s.size / 2,
                marginTop: -s.size / 2,
                background: i % 3 === 0 ? C.text : C.gold,
                clipPath: "polygon(50% 0%, 61% 39%, 100% 50%, 61% 61%, 50% 100%, 39% 61%, 0% 50%, 39% 39%)",
                animationDelay: `${300 + s.delay}ms`,
                "--tx": `${s.tx}px`,
                "--ty": `${s.ty}px`,
              }}
            />
          ))}
      </button>

      <p
        className={`mt-3 text-sm tracking-wide ${opening ? "" : "gc-caption"}`}
        style={{ color: C.muted, opacity: opening ? 0 : undefined, transition: "opacity 250ms" }}
      >
        one more thing — tap it, pull the ribbon
      </p>
    </div>
  );
}

/* Qutunun həndəsəsi ─ ön üz düz, dərinlik sağa-yuxarı gedən sadə oblik
   proyeksiya. Nöqtələri əldə hesablamaq əvəzinə buradan çıxarırıq: ölçünü
   dəyişmək bir sətirdir, üzlər isə heç vaxt bir-birindən sürüşmür. */
const D = { x: 27, y: -19 };
const DU = { x: D.x / Math.hypot(D.x, D.y), y: D.y / Math.hypot(D.x, D.y) };
const vec = (x, y) => ({ x, y });
const add = (p, ...vs) => vs.reduce((a, b) => vec(a.x + b.x, a.y + b.y), p);
const mul = (u, k) => vec(u.x * k, u.y * k);
const poly = (...ps) => ps.map((q) => `${q.x.toFixed(1)},${q.y.toFixed(1)}`).join(" ");

const BW = 96, BH = 74, OVER = 5, SKIRT = 10, LIDH = 22, SW = 9, D0 = 8.5, D1 = 24;

const Ftl = vec(36, 73);
const Ftr = add(Ftl, vec(BW, 0));
const Fbr = add(Ftr, vec(0, BH));
const Fbl = add(Ftl, vec(0, BH));
const Btl = add(Ftl, D), Btr = add(Ftr, D), Bbr = add(Fbr, D);

// Qapaq yanlardan OVER qədər, arxadan da bir o qədər çıxır — yoxsa gövdənin
// üst üzünün arxa küncü qapağın altından görünür.
const LD = add(D, mul(DU, OVER));
const Q1 = add(Ftl, vec(-OVER, SKIRT));
const Q2 = add(Ftr, vec(OVER, SKIRT));
const Q3 = add(Q2, LD), Q4 = add(Q1, LD);
const T1 = add(Q1, vec(0, -LIDH)), T2 = add(Q2, vec(0, -LIDH));
const T3 = add(Q3, vec(0, -LIDH)), T4 = add(Q4, vec(0, -LIDH));

const CX = Ftl.x + BW / 2;
const s0 = mul(DU, D0), s1 = mul(DU, D1);
const MOUTH = vec((Ftl.x + Ftr.x + Btr.x + Btl.x) / 4, (Ftl.y + Ftr.y + Btr.y + Btl.y) / 4);
const BOW = add(T1, vec(CX - T1.x, 0), mul(DU, (D0 + D1) / 2));

const FACE = {
  bodyFront: poly(Ftl, Ftr, Fbr, Fbl),
  bodySide: poly(Ftr, Btr, Bbr, Fbr),
  opening: poly(Ftl, Ftr, Btr, Btl),
  innerWall: poly(Ftl, Ftr, add(Ftr, mul(DU, 5)), add(Ftl, mul(DU, 5))),
  lidTop: poly(T1, T2, T3, T4),
  lidFront: poly(T1, T2, Q2, Q1),
  lidSide: poly(T2, T3, Q3, Q2),
};

// Lent iki qurşaqdır: biri öndən arxaya, biri soldan sağa. Hər üz üçün ayrıca
// parça, çünki hər üzün işığı fərqlidir.
const STRAP = {
  aBody: poly(vec(CX - SW, Ftl.y), vec(CX + SW, Ftl.y), vec(CX + SW, Fbr.y), vec(CX - SW, Fbr.y)),
  aLidFront: poly(vec(CX - SW, T1.y), vec(CX + SW, T1.y), vec(CX + SW, Q1.y), vec(CX - SW, Q1.y)),
  aLidTop: poly(
    vec(CX - SW, T1.y),
    vec(CX + SW, T1.y),
    add(vec(CX + SW, T1.y), LD),
    add(vec(CX - SW, T1.y), LD),
  ),
  bBody: poly(add(Ftr, s0), add(Ftr, s1), add(Fbr, s1), add(Fbr, s0)),
  bLidSide: poly(add(T2, s0), add(T2, s1), add(Q2, s1), add(Q2, s0)),
  bLidTop: poly(add(T1, s0), add(T2, s0), add(T2, s1), add(T1, s1)),
};

function GiftBox({ opening }) {
  const on = (cls) => (opening ? cls : "");

  return (
    <svg viewBox="0 0 200 200" width="100%" height="100%" role="img" aria-label="Gift box">
      <defs>
        <linearGradient id="bxTop" x1="0" y1="1" x2="0.3" y2="0">
          <stop offset="0%" stopColor="#D45C6B" />
          <stop offset="100%" stopColor="#BC4553" />
        </linearGradient>
        <linearGradient id="bxLidFront" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#BE4854" />
          <stop offset="100%" stopColor="#98323E" />
        </linearGradient>
        <linearGradient id="bxLidSide" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#832A39" />
          <stop offset="100%" stopColor="#5C1B27" />
        </linearGradient>
        <linearGradient id="bxFront" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#9E313D" />
          <stop offset="100%" stopColor="#6F212C" />
        </linearGradient>
        <linearGradient id="bxSide" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#6B2029" />
          <stop offset="100%" stopColor="#49141E" />
        </linearGradient>
        <linearGradient id="bxGoldTop" x1="0" y1="1" x2="0.2" y2="0">
          <stop offset="0%" stopColor="#F0D095" />
          <stop offset="100%" stopColor="#DFAF62" />
        </linearGradient>
        <linearGradient id="bxGoldFront" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#DEB061" />
          <stop offset="100%" stopColor="#BB8B41" />
        </linearGradient>
        <linearGradient id="bxGoldSide" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#A2762F" />
          <stop offset="100%" stopColor="#7C5824" />
        </linearGradient>
        {/* Kağızın parıltısı: ön üzlərdən keçən yumşaq işıq zolağı */}
        <linearGradient id="bxSheen" x1="0" y1="0" x2="1" y2="0.2">
          <stop offset="0%" stopColor="#fff" stopOpacity="0" />
          <stop offset="22%" stopColor="#fff" stopOpacity="0.11" />
          <stop offset="46%" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="bxUnderLid" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#000" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#000" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="bxGlow">
          <stop offset="0%" stopColor="#FFE0A8" stopOpacity="0.75" />
          <stop offset="55%" stopColor={C.gold} stopOpacity="0.28" />
          <stop offset="100%" stopColor={C.gold} stopOpacity="0" />
        </radialGradient>
      </defs>

      <ellipse
        className={opening ? "bx-shadow-open" : "bx-shadow-idle"}
        cx={MOUTH.x + 6}
        cy={Fbr.y + 7}
        rx="66"
        ry="8"
        fill="#000"
      />

      <g className={opening ? "bx-fx" : "bx-fx bx-bob"}>
        {/* Gövdə */}
        <g className={`bx-fx ${on("bx-body")}`}>
          <polygon points={FACE.bodySide} fill="url(#bxSide)" />
          <polygon points={FACE.bodyFront} fill="url(#bxFront)" />
          <polygon points={FACE.bodyFront} fill="url(#bxSheen)" />
          <polygon points={FACE.opening} fill="#150A0F" />
          <polygon points={FACE.innerWall} fill="#3A1E2B" />
        </g>

        {/* Gövdənin üstündəki lent — qapaqdan ƏVVƏL çəkilir, çünki qapağın ətəyi
            onun yuxarı hissəsini örtür. Aşağıdakı qrupla eyni animasiyanı alır. */}
        <g className={`bx-fx ${on("bx-ribbon")}`}>
          <polygon points={STRAP.bBody} fill="url(#bxGoldSide)" />
          <polygon points={STRAP.aBody} fill="url(#bxGoldFront)" />
        </g>

        <g className={`bx-fx ${on("bx-body")}`}>
          {/* Qapağın gövdəyə saldığı kölgə və ön tilin işığı */}
          <polygon
            points={poly(
              vec(Ftl.x, Ftl.y + SKIRT),
              vec(Ftr.x, Ftr.y + SKIRT),
              vec(Ftr.x, Ftr.y + SKIRT + 20),
              vec(Ftl.x, Ftl.y + SKIRT + 20),
            )}
            fill="url(#bxUnderLid)"
            className={on("bx-underlid")}
          />
        </g>

        {opening && <ellipse className="bx-fx bx-glow" cx={MOUTH.x} cy={MOUTH.y} rx="54" ry="24" fill="url(#bxGlow)" />}

        {/* Qapaq */}
        <g className={`bx-fx ${on("bx-lid")}`}>
          <polygon points={FACE.lidSide} fill="url(#bxLidSide)" />
          <polygon points={FACE.lidTop} fill="url(#bxTop)" />
          <polygon points={FACE.lidFront} fill="url(#bxLidFront)" />
          <polygon points={FACE.lidFront} fill="url(#bxSheen)" />
          <line x1={T1.x} y1={T1.y} x2={T2.x} y2={T2.y} stroke="#FFEED0" strokeOpacity="0.34" strokeWidth="1.1" />
          <line x1={T2.x} y1={T2.y} x2={T3.x} y2={T3.y} stroke="#FFEED0" strokeOpacity="0.2" strokeWidth="1.1" />
          <line x1={T1.x} y1={T1.y} x2={T4.x} y2={T4.y} stroke="#FFEED0" strokeOpacity="0.14" strokeWidth="1" />
          <line x1={T2.x} y1={T2.y} x2={Q2.x} y2={Q2.y} stroke="#FFEED0" strokeOpacity="0.12" strokeWidth="1" />
          <line x1={Q1.x} y1={Q1.y} x2={Q2.x} y2={Q2.y} stroke="#FFEED0" strokeOpacity="0.16" strokeWidth="1" />
        </g>

        {/* Qapağın üstündəki lent + bant */}
        <g className={`bx-fx ${on("bx-ribbon")}`}>
          <polygon points={STRAP.bLidTop} fill="url(#bxGoldTop)" />
          <polygon points={STRAP.aLidTop} fill="url(#bxGoldTop)" />
          <polygon points={STRAP.bLidSide} fill="url(#bxGoldSide)" />
          <polygon points={STRAP.aLidFront} fill="url(#bxGoldFront)" />

          <g className={`bx-fx ${on("bx-bow")}`}>
            <g transform={`translate(${BOW.x.toFixed(1)} ${BOW.y.toFixed(1)}) scale(0.82) translate(-100 -62)`}>
              <ellipse cx="100" cy="70" rx="15" ry="5" fill="#000" opacity="0.2" />
              <path d="M97 64 C 95 73, 89 80, 80 85 L 74 77 C 83 73, 91 68, 93 62 Z" fill="url(#bxGoldFront)" />
              <path d="M103 64 C 105 73, 111 80, 120 85 L 126 77 C 117 73, 109 68, 107 62 Z" fill="url(#bxGoldFront)" />
              <path d="M100 61 C 90 50, 78 32, 64 30 C 52 29, 48 50, 60 58 C 72 64, 92 64, 100 61 Z" fill="url(#bxGoldTop)" />
              <path d="M100 61 C 110 50, 122 32, 136 30 C 148 29, 152 50, 140 58 C 128 64, 108 64, 100 61 Z" fill="url(#bxGoldTop)" />
              <path d="M100 61 C 90 50, 78 32, 64 30 C 52 29, 48 50, 60 58 C 72 64, 92 64, 100 61 Z" fill="#000" opacity="0.14" />
              <ellipse cx="100" cy="61" rx="8.5" ry="6.5" fill="#F0D095" />
            </g>
          </g>
        </g>
      </g>
    </svg>
  );
}

/* ── 4. Məzmun kartı ────────────────────────────────────────────────────── */

// How long "Javanshir is typing…" shows before the real message lands — three
// stop-start bursts (see .gc-typing-pulse in Styles) rather than one steady
// show, so it reads as someone drafting and re-drafting, not just loading.
// Keep this equal to the pulse keyframe's duration below or they drift apart.
const TYPE_MS = 2600;

function Certificate() {
  return (
    <div
      className="rounded-xl px-5 py-6 text-center"
      style={{ border: `1px solid ${C.border}`, background: "rgba(216,168,87,0.05)" }}
    >
      <div className="flex justify-center">
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
          <path d="M12 2.6l2.5 5.3 5.8.8-4.2 4 1 5.7L12 15.7 6.9 18.4l1-5.7-4.2-4 5.8-.8z" fill={C.gold} opacity="0.9" />
        </svg>
      </div>

      <p className="mt-4 text-[10px] uppercase tracking-[0.22em]" style={{ color: "rgba(216,168,87,0.75)" }}>
        Donation Certificate
      </p>

      <p
        className="mt-3 text-lg leading-snug"
        style={{ fontFamily: "'Fraunces', ui-serif, Georgia, serif", color: C.text, fontWeight: 500 }}
      >
        {GIFT.org}
      </p>

      <p className="mt-2 text-[13px] leading-snug" style={{ color: C.muted }}>
        {GIFT.project}
      </p>

      <div className="mx-auto my-5 h-px w-16" style={{ background: C.border }} />

      <p className="text-[13px]" style={{ color: C.text }}>
        In honor of <span style={{ fontFamily: "'Fraunces', ui-serif, Georgia, serif" }}>{GIFT.honoree}</span>
      </p>

      <p className="mt-2 text-[11px] tracking-wide" style={{ color: "rgba(243,231,218,0.55)" }}>
        {GIFT.date}
      </p>

      {/* Ayrıca sətir — adın özünü linkə çevirəndə iki sətrə düşüb altı xətli
          qalırdı, üstəlik barmaq üçün hədəf kimi də pisdi. */}
      <div className="mt-5 flex items-center justify-center gap-3 text-[11px] tracking-wide">
        <a href={GIFT.projectUrl} target="_blank" rel="noreferrer" style={{ color: C.gold }}>
          view the project ↗
        </a>
        {GIFT.certificate && (
          <>
            <span style={{ color: C.border }}>·</span>
            <a
              href={`${import.meta.env.BASE_URL}${GIFT.certificate}`}
              target="_blank"
              rel="noreferrer"
              style={{ color: C.gold }}
            >
              certificate ↗
            </a>
          </>
        )}
      </div>
    </div>
  );
}

function Card() {
  const [typed, setTyped] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setTyped(true), TYPE_MS);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className="w-full max-w-sm rounded-2xl px-6 py-9 sm:px-8 sm:py-10"
      style={{
        background: C.card,
        border: `1px solid ${C.border}`,
        boxShadow: "0 24px 60px rgba(0,0,0,0.45)",
      }}
    >
      <h1
        className="gc-rise text-2xl leading-snug"
        style={{
          fontFamily: "'Fraunces', ui-serif, Georgia, serif",
          color: C.text,
          fontWeight: 500,
          animationDelay: "0ms",
        }}
      >
        Happy birthday, Ganira
      </h1>

      <div className="gc-rise mt-5" style={{ animationDelay: "150ms", minHeight: 22 }}>
        <AnimatePresence mode="wait">
          {!typed ? (
            <motion.div
              key="typing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              {/* The outer motion.div only fades in once, on mount — the
                  repeated stop-start pulse below is a separate CSS animation
                  on the inner line, so the two don't fight over `opacity`. */}
              <p className="gc-typing-pulse flex items-center gap-2 text-[13px]" style={{ color: C.muted }}>
                <span>Javanshir is typing</span>
                <span className="inline-flex items-center gap-0.5">
                  <span className="gc-dot" style={{ animationDelay: "0ms" }} />
                  <span className="gc-dot" style={{ animationDelay: "160ms" }} />
                  <span className="gc-dot" style={{ animationDelay: "320ms" }} />
                </span>
              </p>
            </motion.div>
          ) : (
            <motion.p
              key="message"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="text-[15px] leading-relaxed"
              style={{ color: C.muted }}
            >
              When you talked about your idea of building a school in Africa, I could tell it wasn't
              just a project to you. So for your birthday, I took a small step in your name. It's
              not a big thing — but maybe it's a small support for your big idea.
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      <div className="gc-rise" style={{ animationDelay: `${TYPE_MS + 300}ms` }}>
        <Certificate />
      </div>

      <p
        className="gc-rise mt-8 text-center text-[13px] leading-relaxed"
        style={{ color: C.muted, animationDelay: `${TYPE_MS + 450}ms` }}
      >
        Wishing you health, happiness, and everything you want this year.
      </p>
    </div>
  );
}

function Styles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Manrope:wght@400;500;600&display=swap');

      @keyframes gc-flicker {
        0%, 100% { transform: scale(1, 1) translateX(0); }
        25%      { transform: scale(0.9, 1.1) translateX(-0.7px); }
        50%      { transform: scale(1.07, 0.93) translateX(0.3px); }
        75%      { transform: scale(0.95, 1.05) translateX(0.6px); }
      }
      @keyframes gc-halo {
        0%, 100% { opacity: 0.85; transform: scale(1); }
        50%      { opacity: 0.5;  transform: scale(1.14); }
      }
      @keyframes gc-smoke {
        0%   { opacity: 0;    transform: translateY(0) scale(0.5, 0.6); }
        22%  { opacity: 0.65; }
        100% { opacity: 0;    transform: translateY(-22px) scale(1.3, 1.4); }
      }
      @keyframes gc-confetti {
        0%   { transform: translate3d(0, -12vh, 0) rotate(0deg); opacity: 0; }
        10%  { opacity: 1; }
        100% { transform: translate3d(var(--dx), 104vh, 0) rotate(var(--rot)); opacity: 0; }
      }
      @keyframes bx-bob {
        0%, 100% { transform: translateY(0) rotate(-0.4deg); }
        50%      { transform: translateY(-5px) rotate(0.4deg); }
      }
      @keyframes bx-shadow-idle {
        0%, 100% { transform: scale(1);          opacity: 0.30; }
        50%      { transform: scale(0.95, 0.9);  opacity: 0.22; }
      }
      @keyframes bx-shadow-open {
        0%   { transform: scale(1);          opacity: 0.30; }
        18%  { transform: scale(1.05, 1.1);  opacity: 0.36; }
        60%  { transform: scale(1.16, 0.86); opacity: 0.18; }
        100% { transform: scale(1.03, 1);    opacity: 0.28; }
      }
      @keyframes gc-caption {
        0%, 100% { opacity: 0.55; }
        50%      { opacity: 1; }
      }
      /* Bant əvvəl dartılıb açılır, sonra lent bütöv halda yuxarı sıyrılır. */
      @keyframes bx-bow-untie {
        0%   { transform: scale(1) rotate(0deg); opacity: 1; }
        26%  { transform: scale(1.07, 0.9) rotate(-3deg); opacity: 1; }
        62%  { transform: scale(0.68, 0.52) rotate(-12deg) translateY(-5px); opacity: 0.9; }
        100% { transform: scale(0.22, 0.16) rotate(-26deg) translateY(-22px); opacity: 0; }
      }
      @keyframes bx-ribbon-off {
        0%   { transform: translate(0, 0); opacity: 1; }
        22%  { transform: translate(0, 3px); opacity: 1; }
        100% { transform: translate(10px, -62px) scale(1.03); opacity: 0; }
      }
      /* Qapaq əvvəl bir az AŞAĞI basılır — o kiçik gözləmə olmadan qalxma
         mexaniki görünür — sonra qalxıb fırlanaraq uçur və uzaqlaşır. */
      @keyframes bx-lid-off {
        0%   { transform: translate(0, 0) rotate(0deg) scale(1); opacity: 1; }
        14%  { transform: translate(0, 4px) rotate(0deg) scale(1.015, 0.985); opacity: 1; }
        32%  { transform: translate(-2px, -16px) rotate(-2.5deg) scale(1.02); opacity: 1; }
        58%  { transform: translate(10px, -58px) rotate(10deg) scale(1.05); opacity: 1; }
        100% { transform: translate(50px, -200px) rotate(36deg) scale(1.13); opacity: 0; }
      }
      /* İkinci dərəcəli hərəkət: qapaq qopanda gövdə bir az dartılıb yerinə oturur. */
      @keyframes bx-body-react {
        0%   { transform: scale(1, 1); }
        16%  { transform: scale(1.028, 0.962); }
        46%  { transform: scale(0.984, 1.032); }
        72%  { transform: scale(1.012, 0.99); }
        100% { transform: scale(1, 1); }
      }
      @keyframes bx-glow-out {
        0%   { opacity: 0; transform: scale(0.45, 0.25); }
        40%  { opacity: 1; }
        100% { opacity: 0.55; transform: scale(1.18, 1); }
      }
      @keyframes bx-underlid-fade { to { opacity: 0; } }
      @keyframes gc-spark {
        0%   { transform: translate(0, 0) scale(0.2) rotate(0deg); opacity: 0; }
        30%  { opacity: 1; }
        100% { transform: translate(var(--tx), var(--ty)) scale(1) rotate(140deg); opacity: 0; }
      }
      @keyframes gc-rise {
        from { opacity: 0; transform: translateY(18px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      @keyframes gc-dot-bounce {
        0%, 60%, 100% { transform: translateY(0); opacity: 0.5; }
        30%           { transform: translateY(-3px); opacity: 1; }
      }
      /* Three visible bursts separated by full-opacity-zero pauses, so the
         line looks like it's being stopped and started rather than shown
         once. Duration must match TYPE_MS above. */
      @keyframes gc-typing-pulse {
        0%   { opacity: 0; }
        5%   { opacity: 1; }
        22%  { opacity: 1; }
        28%  { opacity: 0; }
        38%  { opacity: 0; }
        44%  { opacity: 1; }
        61%  { opacity: 1; }
        67%  { opacity: 0; }
        77%  { opacity: 0; }
        83%  { opacity: 1; }
        95%  { opacity: 1; }
        100% { opacity: 0; }
      }

      .gc-flicker  { animation: gc-flicker 420ms ease-in-out infinite; transform-box: fill-box; transform-origin: 50% 100%; }
      .gc-halo     { animation: gc-halo 1.8s ease-in-out infinite; transform-box: fill-box; transform-origin: center; }
      .gc-smoke    { animation: gc-smoke 1.25s ease-out forwards; }
      .gc-confetti { animation: gc-confetti linear forwards; }
      .gc-caption  { animation: gc-caption 2.8s ease-in-out infinite; }
      .gc-rise     { opacity: 0; animation: gc-rise 620ms cubic-bezier(.22,.68,.32,1) both; }
      .gc-dot      {
        width: 4px; height: 4px; border-radius: 9999px; background: currentColor;
        display: inline-block; animation: gc-dot-bounce 900ms ease-in-out infinite;
      }
      .gc-typing-pulse { animation: gc-typing-pulse 2600ms ease-in-out both; }

      .gc-spark       { animation: gc-spark 760ms ease-out 200ms both; }

      /* SVG-də transform-un viewBox koordinatına görə hesablanması açıq yazılır:
         qapaq və lent ayrı-ayrı qruplardır, fərqli mərkəzlərə görə fırlansalar
         bir-birindən sürüşərlər. */
      .bx-fx { transform-box: view-box; }
      .bx-bob         { animation: bx-bob 4.6s ease-in-out infinite; transform-origin: 102px 152px; }
      .bx-shadow-idle { transform-box: view-box; transform-origin: 108px 154px; opacity: 0.3;
                        animation: bx-shadow-idle 4.6s ease-in-out infinite; }
      .bx-shadow-open { transform-box: view-box; transform-origin: 108px 154px;
                        animation: bx-shadow-open 900ms cubic-bezier(.3,.6,.4,1) both; }
      .bx-body        { transform-origin: 102px 147px; animation: bx-body-react 900ms cubic-bezier(.3,.9,.4,1) 120ms both; }
      .bx-lid         { transform-origin: 104px 72px;  animation: bx-lid-off 780ms cubic-bezier(.34,.02,.5,1) 220ms both; }
      .bx-ribbon      { transform-origin: 102px 100px; animation: bx-ribbon-off 470ms cubic-bezier(.5,0,.75,.4) 110ms both; }
      .bx-bow         { transform-origin: 97px 52px;   animation: bx-bow-untie 430ms cubic-bezier(.4,0,.6,1) both; }
      .bx-glow        { transform-origin: 97px 63px;   animation: bx-glow-out 720ms ease-out 300ms both; }
      .bx-underlid    { animation: bx-underlid-fade 420ms ease-out 240ms both; }

      @media (prefers-reduced-motion: reduce) {
        .gc-caption, .gc-flicker, .gc-halo, .bx-bob, .bx-shadow-idle, .gc-dot { animation: none; }
        .gc-typing-pulse { animation: none; opacity: 1; }
        .gc-rise { animation-duration: 1ms; }
      }
    `}</style>
  );
}
