import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, Share2, X } from "lucide-react";
import { TOKENS, VERSE_JAR } from "./messages.js";

const PAPER = "#F6EEDE";
const JAR_W = 300;
const JAR_H = 380;
const COLS = 10;

const ALL_PAPERS = (() => {
  const flat = [];
  VERSE_JAR.forEach((group) => {
    group.verses.forEach((verse, vi) => {
      flat.push({ id: `${group.key}-${vi}`, color: group.color, label: group.label, ...verse });
    });
  });
  return flat;
})();

// Each paper gets its own non-overlapping hit cell so every one stays reachable.
function layoutPapers() {
  const order = [...ALL_PAPERS];
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  const rows = Math.ceil(order.length / COLS);
  const top = 22;
  const cw = (JAR_W - 24) / COLS;
  const ch = (JAR_H - top - 24) / rows;
  return order.map((p, i) => {
    const row = Math.floor(i / COLS);
    const col = i % COLS;
    return {
      ...p,
      cx: 12 + col * cw,
      cy: top + row * ch,
      cw,
      ch,
      dx: Math.random() * 5 - 2.5,
      dy: Math.random() * 5 - 2.5,
      tilt: Math.random() * 20 - 10,
      h: 26 + Math.random() * 8,
    };
  });
}

function readSharedId() {
  const v = new URLSearchParams(window.location.search).get("v");
  return v && ALL_PAPERS.some((p) => p.id === v) ? v : null;
}

const GLASS_BODY = {
  position: "absolute",
  inset: 0,
  borderRadius: "26px 26px 38px 38px",
  background:
    "linear-gradient(100deg, rgba(190,225,215,0.16) 0%, rgba(255,255,255,0.04) 30%, rgba(255,255,255,0.02) 62%, rgba(190,225,215,0.13) 100%)",
  border: "1px solid rgba(243,231,218,0.30)",
  overflow: "hidden",
  boxShadow:
    "0 26px 46px rgba(0,0,0,0.55), inset 0 0 44px rgba(255,255,255,0.05), inset 0 -18px 30px rgba(0,0,0,0.34), inset 14px 0 22px rgba(0,0,0,0.22), inset -14px 0 22px rgba(0,0,0,0.22)",
};

function PaperShape({ p, style }) {
  return (
    <div
      style={{
        position: "absolute",
        left: p.cw / 2 - 9 + p.dx,
        top: (p.ch - p.h) / 2 + p.dy,
        width: 18,
        height: p.h,
        borderRadius: 4,
        rotate: `${p.tilt}deg`,
        background: `linear-gradient(90deg, ${p.color}bb 0%, ${p.color} 24%, rgba(255,255,255,0.45) 45%, ${p.color} 66%, ${p.color}aa 100%)`,
        boxShadow: "0 2px 6px rgba(0,0,0,0.5)",
        pointerEvents: "none",
        ...style,
      }}
    >
      <span
        style={{
          position: "absolute",
          left: 1,
          right: 1,
          top: -2,
          height: 5,
          borderRadius: "50%",
          background: `linear-gradient(180deg, #ffffffaa, ${p.color})`,
        }}
      />
    </div>
  );
}

function GlassDressing() {
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: -6,
          right: -6,
          top: -16,
          height: 34,
          borderRadius: "50%",
          background: "linear-gradient(180deg, rgba(255,255,255,0.22), rgba(255,255,255,0.02))",
          border: "1px solid rgba(243,231,218,0.42)",
          boxShadow: "inset 0 3px 8px rgba(0,0,0,0.35)",
          pointerEvents: "none",
          zIndex: 3,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 8,
          right: 8,
          bottom: 6,
          height: 22,
          borderRadius: "50%",
          background: "linear-gradient(180deg, rgba(0,0,0,0.34), rgba(255,255,255,0.07))",
          pointerEvents: "none",
          zIndex: 2,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 16,
          top: 16,
          bottom: 34,
          width: 15,
          borderRadius: 12,
          background: "linear-gradient(180deg, rgba(255,255,255,0.42), rgba(255,255,255,0.03))",
          pointerEvents: "none",
          zIndex: 2,
        }}
      />
      <div
        style={{
          position: "absolute",
          right: 14,
          top: 34,
          bottom: 48,
          width: 6,
          borderRadius: 8,
          background: "linear-gradient(180deg, rgba(255,255,255,0.16), rgba(255,255,255,0.01))",
          pointerEvents: "none",
          zIndex: 2,
        }}
      />
    </>
  );
}

export default function VerseJarGame() {
  const papers = useMemo(layoutPapers, []);
  const [openId, setOpenId] = useState(readSharedId);
  const [read, setRead] = useState({});
  const [shared, setShared] = useState(false);
  const [lid, setLid] = useState(() => (readSharedId() ? "open" : "closed"));
  const lidOpen = lid === "open";

  const open = openId ? papers.find((p) => p.id === openId) : null;
  const readCount = Object.keys(read).length;
  const jarRef = useRef(null);

  // Tap anywhere off the jar to cork it again. The listener goes on a tick late
  // because the tap that opens the jar removes its own button from the DOM,
  // which would otherwise look like an outside click and shut it immediately.
  useEffect(() => {
    if (!lidOpen || openId) return undefined;
    const onDocClick = (e) => {
      if (jarRef.current && !jarRef.current.contains(e.target)) setLid("closed");
    };
    const t = setTimeout(() => document.addEventListener("click", onDocClick), 0);
    return () => {
      clearTimeout(t);
      document.removeEventListener("click", onDocClick);
    };
  }, [lidOpen, openId]);

  const putBack = () => {
    setRead((prev) => ({ ...prev, [openId]: true }));
    setShared(false);
    setOpenId(null);
  };

  const share = async () => {
    const url = `${window.location.origin}${import.meta.env.BASE_URL}games/jar?v=${open.id}`;
    const text = `“${open.text}” — ${open.ref}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Verses Jar", text, url });
        return;
      }
      await navigator.clipboard.writeText(`${text}\n${url}`);
      setShared(true);
      setTimeout(() => setShared(false), 1900);
    } catch {
      /* dismissed or unavailable */
    }
  };

  return (
    <div className="w-full flex flex-col items-center" style={{ minHeight: 680 }}>
      <p style={{ color: TOKENS.muted, fontSize: 13, textAlign: "center" }} className="mb-1">
        {open ? open.label : "Read me when…"}
      </p>
      <p style={{ color: TOKENS.muted, fontSize: 11.5, textAlign: "center" }} className="mb-5">
        {open ? " " : lidOpen ? "Reach in and take any one you like" : "Pull the cork out"}
      </p>

      <div ref={jarRef} style={{ position: "relative", width: JAR_W, marginBottom: 16 }}>
        {/* cork */}
        <motion.div
          initial={{ y: -10, opacity: 0 }}
          animate={lidOpen ? { y: -14, x: 100, rotate: -26, opacity: 1 } : { y: 0, x: 0, rotate: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 190, damping: 17 }}
          onClick={() => !lidOpen && setLid("open")}
          style={{
            position: "relative",
            width: 150,
            height: 34,
            margin: "0 auto",
            zIndex: 6,
            cursor: lidOpen ? "default" : "pointer",
            pointerEvents: lidOpen ? "none" : "auto",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "6px 6px 3px 3px",
              background: "linear-gradient(90deg, #9C7444 0%, #D8B078 22%, #C29A63 55%, #A07949 100%)",
              boxShadow: "inset 0 -5px 9px rgba(0,0,0,0.25)",
            }}
          />
          {[0.2, 0.38, 0.58, 0.78].map((t) => (
            <span
              key={t}
              style={{
                position: "absolute",
                left: `${t * 100}%`,
                top: 8,
                width: 2,
                height: 18,
                borderRadius: 2,
                background: "rgba(80,50,20,0.18)",
              }}
            />
          ))}
          <div
            style={{
              position: "absolute",
              left: -1,
              right: -1,
              top: -7,
              height: 14,
              borderRadius: "50%",
              background: "linear-gradient(180deg, #E3BC85, #C79E67)",
              border: "1px solid rgba(90,60,25,0.35)",
            }}
          />
        </motion.div>

        {/* neck + twine + tag */}
        <div style={{ position: "relative", width: 176, height: 20, margin: "-3px auto 0", zIndex: 5 }}>
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "3px 3px 0 0",
              background:
                "linear-gradient(90deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.20) 18%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0.16) 82%, rgba(255,255,255,0.04) 100%)",
              borderLeft: "1px solid rgba(243,231,218,0.32)",
              borderRight: "1px solid rgba(243,231,218,0.32)",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: -8,
              right: -8,
              top: 7,
              height: 6,
              borderRadius: 3,
              background: "repeating-linear-gradient(72deg, #C3A272 0 3px, #94764E 3px 6px)",
              boxShadow: "0 2px 4px rgba(0,0,0,0.45)",
            }}
          />
          <div
            style={{
              position: "absolute",
              right: -26,
              top: 12,
              width: 24,
              height: 17,
              borderRadius: 3,
              transform: "rotate(9deg)",
              background: "linear-gradient(160deg, #D9C296, #BBA274)",
              boxShadow: "0 2px 5px rgba(0,0,0,0.4)",
            }}
          />
        </div>

        {/* the jar flips between its label face and its papers face */}
        <div style={{ perspective: 1400, width: JAR_W, height: JAR_H }}>
          <motion.div
            animate={{ rotateY: lidOpen ? 180 : 0 }}
            transition={{ type: "spring", stiffness: 75, damping: 15 }}
            style={{ position: "relative", width: "100%", height: "100%", transformStyle: "preserve-3d" }}
          >
            {/* front — the label with the colour key */}
            {/* backface-visibility hides a turned-away face but does not reliably
                remove it from hit-testing, so the pointer events are gated too. */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                backfaceVisibility: "hidden",
                pointerEvents: lidOpen ? "none" : "auto",
              }}
            >
              <div style={GLASS_BODY}>
                {papers.map((p) => (
                  <div key={p.id} style={{ position: "absolute", left: p.cx, top: p.cy, width: p.cw, height: p.ch }}>
                    <PaperShape p={p} style={{ opacity: 0.7 }} />
                  </div>
                ))}
                <GlassDressing />

                <div
                  style={{
                    position: "absolute",
                    left: 22,
                    right: 22,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: PAPER,
                    borderRadius: 5,
                    padding: "14px 14px 15px",
                    boxShadow: "0 4px 14px rgba(0,0,0,0.45)",
                    zIndex: 4,
                  }}
                >
                  <p
                    style={{
                      color: "#5A4632",
                      fontSize: 9,
                      letterSpacing: 1.2,
                      textAlign: "center",
                      textTransform: "uppercase",
                      marginBottom: 3,
                    }}
                  >
                    A verse for every feeling
                  </p>
                  <p
                    style={{
                      color: "#2A1620",
                      fontFamily: "'Fraunces', serif",
                      fontSize: 17,
                      textAlign: "center",
                      letterSpacing: 0.5,
                      marginBottom: 11,
                    }}
                  >
                    READ ME WHEN…
                  </p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 10px" }}>
                    {VERSE_JAR.map((g) => (
                      <span key={g.key} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ width: 8, height: 8, borderRadius: 1.5, background: g.color, flexShrink: 0 }} />
                        <span
                          style={{
                            color: "#5A4632",
                            fontSize: 10,
                            fontWeight: 700,
                            letterSpacing: 0.6,
                            textTransform: "uppercase",
                          }}
                        >
                          {g.label}
                        </span>
                      </span>
                    ))}
                  </div>
                  <p style={{ color: "#8C7355", fontSize: 8.5, textAlign: "center", marginTop: 11, letterSpacing: 0.4 }}>
                    COLOUR CODED VERSES
                  </p>
                </div>
              </div>
            </div>

            {/* back — the papers she picks from */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                backfaceVisibility: "hidden",
                transform: "rotateY(180deg)",
                pointerEvents: lidOpen ? "auto" : "none",
              }}
            >
              <div style={GLASS_BODY}>
                {papers.map((p, i) => (
                  <motion.button
                    key={p.id}
                    onClick={() => lidOpen && !openId && setOpenId(p.id)}
                    aria-label={`Take a ${p.label} paper`}
                    whileTap={openId || !lidOpen ? undefined : { scale: 0.86 }}
                    animate={{ opacity: openId && openId !== p.id ? 0.2 : read[p.id] ? 0.42 : 1 }}
                    transition={{ duration: 0.25, delay: openId ? 0 : i * 0.004 }}
                    style={{
                      position: "absolute",
                      left: p.cx,
                      top: p.cy,
                      width: p.cw,
                      height: p.ch,
                      background: "transparent",
                      border: "none",
                      padding: 0,
                      overflow: "visible",
                      cursor: !lidOpen || openId ? "default" : "pointer",
                      pointerEvents: lidOpen && !openId ? "auto" : "none",
                      zIndex: 1,
                    }}
                  >
                    <PaperShape p={p} />
                  </motion.button>
                ))}
                <GlassDressing />
              </div>
            </div>
          </motion.div>
        </div>

        <div
          style={{
            width: JAR_W - 34,
            height: 16,
            margin: "-6px auto 0",
            borderRadius: "50%",
            background: "radial-gradient(ellipse, rgba(0,0,0,0.6), transparent 70%)",
            filter: "blur(4px)",
            pointerEvents: "none",
          }}
        />

        {/* the paper she took out */}
        <AnimatePresence>
          {open && (
            <>
              <motion.div
                key="backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={putBack}
                style={{ position: "absolute", inset: -24, background: "rgba(12,6,10,0.78)", borderRadius: 26, zIndex: 8 }}
              />
              <motion.div
                key="scroll"
                initial={{ opacity: 0, scaleY: 0.08, y: 26 }}
                animate={{ opacity: 1, scaleY: 1, y: 0 }}
                exit={{ opacity: 0, scaleY: 0.08, y: 26 }}
                transition={{ type: "spring", stiffness: 150, damping: 20 }}
                style={{
                  position: "absolute",
                  left: -8,
                  right: -8,
                  top: "38%",
                  transformOrigin: "top center",
                  background: `linear-gradient(180deg, ${PAPER} 0%, #EDE2CC 100%)`,
                  borderRadius: 10,
                  borderTop: `5px solid ${open.color}`,
                  boxShadow: "0 22px 48px rgba(0,0,0,0.62)",
                  padding: "22px 22px 18px",
                  zIndex: 9,
                }}
              >
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.22 }}>
                  <p style={{ color: "#2A1620", fontFamily: "'Fraunces', serif", fontSize: 16.5, lineHeight: 1.6, textAlign: "center" }}>
                    {open.text}
                  </p>
                  <div style={{ width: 40, height: 1, background: `${open.color}66`, margin: "14px auto 10px" }} />
                  <p
                    style={{
                      color: open.color,
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: 1.2,
                      textTransform: "uppercase",
                      textAlign: "center",
                    }}
                  >
                    {open.ref}
                  </p>
                  <button
                    onClick={share}
                    aria-label="Share this verse"
                    style={{
                      margin: "16px auto 0",
                      display: "flex",
                      alignItems: "center",
                      gap: 7,
                      background: "transparent",
                      border: `1px solid ${open.color}55`,
                      color: open.color,
                      borderRadius: 9999,
                      padding: "7px 16px",
                      fontSize: 11.5,
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    {shared ? <Check size={13} /> : <Share2 size={13} />} {shared ? "Copied" : "Share"}
                  </button>
                </motion.div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {open ? (
        <motion.button
          onClick={putBack}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          whileTap={{ scale: 0.97 }}
          style={{ color: TOKENS.muted, fontSize: 12.5 }}
          className="flex items-center gap-1.5"
        >
          <X size={13} /> Put it back
        </motion.button>
      ) : (
        <p style={{ color: TOKENS.muted, fontSize: 11.5 }}>
          {!lidOpen
            ? "Tap the cork to open it"
            : readCount > 0
              ? `${readCount} of ${papers.length} opened`
              : `${papers.length} papers in the jar`}
        </p>
      )}
    </div>
  );
}
