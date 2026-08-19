import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, Download, Share2, X } from "lucide-react";
import { TOKENS } from "./messages.js";
import { deliverCard, renderVerseCard, THEMES } from "./verseImage.js";

const THEME_KEY = "share-theme";

function storedTheme() {
  try {
    const id = localStorage.getItem(THEME_KEY);
    return THEMES.some((t) => t.id === id) ? id : "paper";
  } catch {
    return "paper";
  }
}

/**
 * Shows the card before it goes anywhere, so the style can be chosen and the
 * result checked rather than discovered in the share sheet.
 */
// `labels` lets a screen with its own language (the reader) pass its strings in.
// The jar has no language toggle, so it passes nothing and gets English.
const DEFAULTS = {
  preview: "PREVIEW", sendIt: "Share this", rendering: "Rendering…",
  saved: "Saved", sent: "Shared", preparing: "Preparing…",
};

export default function SharePreview({ verse, labels, onClose }) {
  const t = { ...DEFAULTS, ...(labels || {}) };
  const [theme, setTheme] = useState(storedTheme);
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null);
  const blobRef = useRef(null);
  const urlRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const blob = await renderVerseCard(verse, theme);
      if (cancelled || !blob) return;
      blobRef.current = blob;
      // Each render makes a new object URL; drop the last or they accumulate.
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      urlRef.current = URL.createObjectURL(blob);
      setPreview(urlRef.current);
    })();
    return () => {
      cancelled = true;
    };
  }, [verse, theme]);

  useEffect(
    () => () => {
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    },
    []
  );

  const pick = (id) => {
    setTheme(id);
    setDone(null);
    try {
      localStorage.setItem(THEME_KEY, id);
    } catch {
      /* private mode */
    }
  };

  const send = async () => {
    if (!blobRef.current || busy) return;
    setBusy(true);
    const result = await deliverCard(blobRef.current, verse.ref);
    setBusy(false);
    if (result !== "cancelled") setDone(result);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(10,5,8,0.86)",
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 18,
      }}
    >
      <motion.div
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 240, damping: 26 }}
        style={{ width: "100%", maxWidth: 360, display: "flex", flexDirection: "column", alignItems: "center" }}
      >
        <div className="w-full flex items-center justify-between mb-3">
          <span style={{ color: TOKENS.muted, fontSize: 11.5, fontWeight: 700, letterSpacing: 1.2 }}>{t.preview}</span>
          <button onClick={onClose} aria-label="Close preview" style={{ color: TOKENS.muted, padding: 4 }}>
            <X size={17} />
          </button>
        </div>

        <div
          style={{
            width: "100%",
            aspectRatio: "1080 / 1350",
            borderRadius: 14,
            overflow: "hidden",
            background: TOKENS.bgCard,
            boxShadow: "0 20px 50px rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <AnimatePresence mode="wait">
            {preview ? (
              <motion.img
                key={theme}
                src={preview}
                alt="Card preview"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
              />
            ) : (
              <span style={{ color: TOKENS.muted, fontSize: 12 }}>{t.rendering}</span>
            )}
          </AnimatePresence>
        </div>

        <div className="flex items-center justify-center gap-2 mt-4 mb-4 flex-wrap">
          {THEMES.map((opt) => (
            <button
              key={opt.id}
              onClick={() => pick(opt.id)}
              aria-label={`${opt.label} style`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 12px",
                borderRadius: 9999,
                border: `1px solid ${theme === opt.id ? TOKENS.gold : TOKENS.line}`,
                color: theme === opt.id ? TOKENS.gold : TOKENS.muted,
                fontSize: 11,
                fontWeight: 700,
              }}
            >
              <span
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 4,
                  background: `linear-gradient(140deg, ${opt.top}, ${opt.bottom})`,
                  border: `1px solid ${opt.frame}`,
                }}
              />
              {opt.label}
            </button>
          ))}
        </div>

        <motion.button
          onClick={send}
          disabled={!preview || busy}
          whileTap={{ scale: 0.98 }}
          style={{ background: TOKENS.gold, color: TOKENS.bgDeep, fontWeight: 700, opacity: !preview || busy ? 0.6 : 1 }}
          className="w-full h-12 rounded-full flex items-center justify-center gap-2"
        >
          {done ? <Check size={16} /> : navigator.canShare ? <Share2 size={16} /> : <Download size={16} />}
          {busy ? t.preparing : done === "downloaded" ? t.saved : done === "shared" ? t.sent : t.sendIt}
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
