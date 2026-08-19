import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, ImageDown, Pause, Play, Share2, Star, X } from "lucide-react";
import { TOKENS, VERSE_JAR, alpha } from "./messages.js";
import { createCollection, readCollection, storeConfigured, updateCollection } from "./store.js";
import SharePreview from "./SharePreview.jsx";

const PAPER = "#F6EEDE";
const JAR_W = 300;
const JAR_H = 380;
const COLS = 12;
const READ_KEY = "verse-jar-read";
const KEPT_KEY = "verse-jar-kept";
const NOTES_KEY = "verse-jar-notes";
const NOTE_MAX = 220;
const COLLECTION_KEY = "verse-jar-collection";
const RECITER = "Alafasy_128kbps";

// everyayah.com names each file by zero-padded surah + ayah, so a verse that
// spans two ayahs is two files played back to back.
function audioUrls(verse) {
  return verse.ayahs.map(
    (a) =>
      `https://everyayah.com/data/${RECITER}/${String(verse.surah).padStart(3, "0")}${String(a).padStart(3, "0")}.mp3`
  );
}

function loadRead() {
  try {
    const raw = localStorage.getItem(READ_KEY);
    const ids = raw ? JSON.parse(raw) : [];
    return Array.isArray(ids) ? Object.fromEntries(ids.map((id) => [id, true])) : {};
  } catch {
    return {};
  }
}

function saveRead(read) {
  try {
    localStorage.setItem(READ_KEY, JSON.stringify(Object.keys(read)));
  } catch {
    /* private mode / storage full */
  }
}

function loadIds(key) {
  try {
    const raw = localStorage.getItem(key);
    const ids = raw ? JSON.parse(raw) : [];
    return Array.isArray(ids) ? Object.fromEntries(ids.map((id) => [id, true])) : {};
  } catch {
    return {};
  }
}

function saveIds(key, map) {
  try {
    localStorage.setItem(key, JSON.stringify(Object.keys(map)));
  } catch {
    /* private mode / storage full */
  }
}

function loadNotes() {
  try {
    const raw = localStorage.getItem(NOTES_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function saveNotes(notes) {
  try {
    localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
  } catch {
    /* private mode / storage full */
  }
}

function loadCollection() {
  try {
    const raw = localStorage.getItem(COLLECTION_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed && parsed.id && parsed.key ? parsed : null;
  } catch {
    return null;
  }
}

function readSharedCollectionId() {
  const id = new URLSearchParams(window.location.search).get("kept");
  return id && /^[a-z0-9]{10}$/.test(id) ? id : null;
}

// Same calendar day gives the same verse to whoever opens it, so two people
// can land on the same one without anything being shared between them. This has
// to index ALL_PAPERS, not the laid-out papers — those get shuffled per mount,
// which would hand out a different verse on every reload.
function verseOfTheDayId() {
  const d = new Date();
  const key = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return ALL_PAPERS[hash % ALL_PAPERS.length].id;
}

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
  // Paper height has to follow the row height, or adding verses silently makes
  // the papers overlap each other once the grid gets tall enough.
  const maxH = Math.max(12, ch - 4);
  return order.map((p, i) => {
    const row = Math.floor(i / COLS);
    const col = i % COLS;
    return {
      ...p,
      cx: 12 + col * cw,
      cy: top + row * ch,
      cw,
      ch,
      dx: Math.random() * 4 - 2,
      dy: Math.random() * 4 - 2,
      tilt: Math.random() * 20 - 10,
      h: Math.min(22 + Math.random() * 8, maxH),
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

function KeptList({ ids, notes = {}, title, subtitle, onBack, onShare, shareLabel }) {
  const verses = ids.map((id) => ALL_PAPERS.find((p) => p.id === id)).filter(Boolean);
  return (
    <div className="w-full flex flex-col items-center">
      <p style={{ color: TOKENS.muted, fontSize: 13, textAlign: "center" }} className="mb-1">
        {title}
      </p>
      <p style={{ color: TOKENS.muted, fontSize: 11.5, textAlign: "center" }} className="mb-5">
        {subtitle}
      </p>

      {verses.length === 0 ? (
        <p style={{ color: TOKENS.muted, fontSize: 12.5, textAlign: "center", opacity: 0.8 }} className="mb-6">
          Nothing kept yet.
        </p>
      ) : (
        <div className="w-full flex flex-col gap-2.5 mb-5">
          {verses.map((v) => (
            <motion.div
              key={v.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 24 }}
              style={{
                width: "100%",
                background: `linear-gradient(180deg, ${PAPER} 0%, #EDE2CC 100%)`,
                borderTop: `4px solid ${v.color}`,
                borderRadius: 10,
                padding: "14px 16px",
                boxShadow: "0 8px 20px rgba(0,0,0,0.4)",
              }}
            >
              <p
                dir="rtl"
                lang="ar"
                style={{ color: "#2A1620", fontFamily: "'Amiri', serif", fontSize: 17, lineHeight: 1.9, textAlign: "center" }}
              >
                {v.arabic}
              </p>
              <p style={{ color: "#2A1620", fontFamily: "'Fraunces', serif", fontSize: 13.5, lineHeight: 1.5, textAlign: "center", marginTop: 8 }}>
                {v.text}
              </p>
              <p
                style={{
                  color: v.color,
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: 1.1,
                  textTransform: "uppercase",
                  textAlign: "center",
                  marginTop: 8,
                }}
              >
                {v.ref}
              </p>
              {notes[v.id] && (
                <p
                  style={{
                    color: "#5A4632",
                    fontSize: 12,
                    fontStyle: "italic",
                    lineHeight: 1.45,
                    textAlign: "center",
                    marginTop: 10,
                    paddingTop: 10,
                    borderTop: `1px dashed ${v.color}44`,
                  }}
                >
                  “{notes[v.id]}”
                </p>
              )}
            </motion.div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-3">
        {onBack && (
          <button onClick={onBack} style={{ color: TOKENS.muted, fontSize: 12.5 }} className="flex items-center gap-1.5">
            <X size={13} /> Back to the jar
          </button>
        )}
        {onShare && verses.length > 0 && (
          <button
            onClick={onShare}
            style={{
              color: TOKENS.gold,
              fontSize: 11.5,
              fontWeight: 700,
              border: `1px solid ${alpha(TOKENS.gold, "44")}`,
              borderRadius: 9999,
              padding: "6px 15px",
            }}
            className="flex items-center gap-1.5"
          >
            <Share2 size={12} /> {shareLabel}
          </button>
        )}
      </div>
    </div>
  );
}

export default function VerseJarGame() {
  const papers = useMemo(layoutPapers, []);
  const [openId, setOpenId] = useState(readSharedId);
  const [read, setRead] = useState(loadRead);
  const [kept, setKept] = useState(() => loadIds(KEPT_KEY));
  const [notes, setNotes] = useState(loadNotes);
  const [noteDraft, setNoteDraft] = useState(null); // null = not editing
  const [shareVerse, setShareVerse] = useState(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [shared, setShared] = useState(false);
  const [lid, setLid] = useState(() => (readSharedId() ? "open" : "closed"));
  const [playing, setPlaying] = useState(false);
  const [showKept, setShowKept] = useState(false);
  const [collectionShared, setCollectionShared] = useState(false);
  const audioRef = useRef(null);
  const lidOpen = lid === "open";

  // Someone else's collection, opened read-only from a ?kept= link.
  const [sharedCollectionId] = useState(readSharedCollectionId);
  const [sharedCollection, setSharedCollection] = useState(null);
  const [loadingShared, setLoadingShared] = useState(() => readSharedCollectionId() !== null);

  useEffect(() => {
    if (!sharedCollectionId) return undefined;
    let cancelled = false;
    (async () => {
      const data = await readCollection(sharedCollectionId);
      if (cancelled) return;
      setSharedCollection(data);
      setLoadingShared(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [sharedCollectionId]);

  // State is local-first: localStorage is the source of truth on this device,
  // and the collection is a copy that makes it portable and shareable. A failed
  // sync therefore costs nothing locally.
  const syncCollection = async (nextKept, nextRead, nextNotes = notes) => {
    if (!storeConfigured()) return;
    // Only notes on kept verses travel — a note on a verse she later un-kept
    // should not keep showing up in a shared collection.
    const keptNotes = Object.fromEntries(
      Object.entries(nextNotes).filter(([id, text]) => nextKept[id] && text.trim())
    );
    const payload = { kept: Object.keys(nextKept), read: Object.keys(nextRead), notes: keptNotes };
    const existing = loadCollection();
    if (existing) {
      if (await updateCollection(existing.id, existing.key, payload)) return;
      // The collection is gone — deleted, or expired after ~13 months. Without
      // this the stale id would sit in localStorage and every later sync would
      // fail silently, so drop it and start a fresh one below.
      try {
        localStorage.removeItem(COLLECTION_KEY);
      } catch {
        /* private mode */
      }
    }
    const created = await createCollection(payload);
    if (created) {
      try {
        localStorage.setItem(COLLECTION_KEY, JSON.stringify(created));
      } catch {
        /* private mode */
      }
    }
  };

  const toggleKeep = () => {
    setKept((prev) => {
      const next = { ...prev };
      if (next[openId]) delete next[openId];
      else next[openId] = true;
      saveIds(KEPT_KEY, next);
      syncCollection(next, read);
      return next;
    });
  };

  const shareImage = () =>
    setShareVerse({ arabic: open.arabic, text: open.text, ref: open.ref, label: open.label });

  // Wipes this device's jar state. The collection is abandoned rather than
  // deleted — the Worker has no delete route, and it expires on its own.
  const resetJar = () => {
    for (const key of [READ_KEY, KEPT_KEY, NOTES_KEY, COLLECTION_KEY]) {
      try {
        localStorage.removeItem(key);
      } catch {
        /* private mode */
      }
    }
    setRead({});
    setKept({});
    setNotes({});
    setShowKept(false);
    setConfirmReset(false);
  };

  const saveNote = () => {
    const text = (noteDraft || "").trim().slice(0, NOTE_MAX);
    setNotes((prev) => {
      const next = { ...prev };
      if (text) next[openId] = text;
      else delete next[openId];
      saveNotes(next);
      syncCollection(kept, read, next);
      return next;
    });
    setNoteDraft(null);
  };

  const shareCollection = async () => {
    const existing = loadCollection();
    if (!existing) return;
    const url = `${window.location.origin}${import.meta.env.BASE_URL}games/jar?kept=${existing.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Verses I've kept", url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCollectionShared(true);
      setTimeout(() => setCollectionShared(false), 1900);
    } catch {
      /* dismissed or unavailable */
    }
  };

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

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.onended = null;
      audioRef.current = null;
    }
    setPlaying(false);
  };

  // Stop the recitation if the component goes away mid-playback.
  useEffect(() => stopAudio, []);

  const toggleAudio = () => {
    if (playing) {
      stopAudio();
      return;
    }
    const urls = audioUrls(open);
    let i = 0;
    const el = new Audio(urls[0]);
    audioRef.current = el;
    el.onended = () => {
      i += 1;
      if (i < urls.length && audioRef.current === el) {
        el.src = urls[i];
        el.play().catch(stopAudio);
      } else {
        stopAudio();
      }
    };
    el.onerror = stopAudio;
    setPlaying(true);
    el.play().catch(stopAudio);
  };

  const putBack = () => {
    stopAudio();
    setRead((prev) => {
      const next = { ...prev, [openId]: true };
      saveRead(next);
      syncCollection(kept, next);
      return next;
    });
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

  // Opened from a ?kept= link: someone else's collection, read-only.
  if (sharedCollectionId) {
    if (loadingShared) {
      return (
        <p style={{ color: TOKENS.muted, fontSize: 13, textAlign: "center" }} className="mt-6">
          Opening…
        </p>
      );
    }
    if (!sharedCollection) {
      return (
        <div className="w-full flex flex-col items-center mt-6">
          <p style={{ color: TOKENS.cream, fontFamily: "'Fraunces', serif", fontSize: 17, textAlign: "center" }} className="mb-2">
            Nothing here.
          </p>
          <p style={{ color: TOKENS.muted, fontSize: 12.5, textAlign: "center" }}>
            This collection has expired or the link is wrong.
          </p>
        </div>
      );
    }
    return (
      <KeptList
        ids={sharedCollection.kept || []}
        notes={sharedCollection.notes || {}}
        title="Verses she kept"
        subtitle={`${(sharedCollection.kept || []).length} of ${ALL_PAPERS.length}`}
      />
    );
  }

  if (showKept) {
    return (
      <KeptList
        ids={Object.keys(kept)}
        notes={notes}
        title="Verses you've kept"
        subtitle={`${Object.keys(kept).length} of ${ALL_PAPERS.length}`}
        onBack={() => setShowKept(false)}
        onShare={storeConfigured() && loadCollection() ? shareCollection : null}
        shareLabel={collectionShared ? "Link copied" : "Share these"}
      />
    );
  }

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
          role="button"
          aria-label="Open the jar"
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
                  top: "20%",
                  transformOrigin: "top center",
                  background: `linear-gradient(180deg, ${PAPER} 0%, #EDE2CC 100%)`,
                  borderRadius: 10,
                  borderTop: `5px solid ${open.color}`,
                  boxShadow: "0 22px 48px rgba(0,0,0,0.62)",
                  padding: "22px 22px 18px",
                  zIndex: 9,
                  // full ayahs run long (Ayat al-Kursi is ~550 chars), so the
                  // paper scrolls rather than growing off the bottom of the screen
                  maxHeight: "58vh",
                  overflowY: "auto",
                }}
              >
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.22 }}>
                  {open.arabic && (
                    <p
                      dir="rtl"
                      lang="ar"
                      style={{
                        color: "#2A1620",
                        fontFamily: "'Amiri', serif",
                        fontSize: 21,
                        lineHeight: 2,
                        textAlign: "center",
                        marginBottom: 14,
                      }}
                    >
                      {open.arabic}
                    </p>
                  )}
                  <div style={{ width: 40, height: 1, background: `${open.color}44`, margin: "0 auto 14px" }} />
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
                  <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
                    <button
                      onClick={toggleKeep}
                      aria-label={kept[open.id] ? "Remove from kept verses" : "Keep this verse"}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 7,
                        background: kept[open.id] ? open.color : "transparent",
                        border: `1px solid ${open.color}${kept[open.id] ? "" : "55"}`,
                        color: kept[open.id] ? PAPER : open.color,
                        borderRadius: 9999,
                        padding: "7px 16px",
                        fontSize: 11.5,
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      <Star size={13} fill={kept[open.id] ? PAPER : "none"} /> {kept[open.id] ? "Kept" : "Keep"}
                    </button>
                    <button
                      onClick={toggleAudio}
                      aria-label={playing ? "Stop recitation" : "Play recitation"}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 7,
                        background: playing ? `${open.color}1a` : "transparent",
                        border: `1px solid ${open.color}55`,
                        color: open.color,
                        borderRadius: 9999,
                        padding: "7px 16px",
                        fontSize: 11.5,
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      {playing ? <Pause size={13} /> : <Play size={13} />} {playing ? "Stop" : "Listen"}
                    </button>
                    <button
                      onClick={share}
                      aria-label="Share this verse"
                      style={{
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
                    <button
                      onClick={shareImage}
                      aria-label="Share this verse as an image"
                      style={{
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
                      <ImageDown size={13} /> Image
                    </button>
                  </div>
                  {kept[open.id] && (
                    <div style={{ marginTop: 14, borderTop: `1px dashed ${open.color}44`, paddingTop: 12 }}>
                      {noteDraft !== null ? (
                        <>
                          <textarea
                            value={noteDraft}
                            onChange={(e) => setNoteDraft(e.target.value.slice(0, NOTE_MAX))}
                            placeholder="Why this one?"
                            rows={2}
                            autoFocus
                            style={{
                              width: "100%",
                              background: "rgba(0,0,0,0.04)",
                              border: `1px solid ${open.color}44`,
                              borderRadius: 8,
                              color: "#2A1620",
                              fontFamily: "'Manrope', sans-serif",
                              fontSize: 12.5,
                              padding: "8px 10px",
                              resize: "none",
                            }}
                          />
                          <div style={{ display: "flex", justifyContent: "center", gap: 14, marginTop: 8 }}>
                            <button onClick={saveNote} style={{ color: open.color, fontSize: 11.5, fontWeight: 700 }}>
                              Save
                            </button>
                            <button onClick={() => setNoteDraft(null)} style={{ color: "#8C7355", fontSize: 11.5 }}>
                              Cancel
                            </button>
                          </div>
                        </>
                      ) : notes[open.id] ? (
                        <button
                          onClick={() => setNoteDraft(notes[open.id])}
                          style={{ display: "block", width: "100%", textAlign: "center", cursor: "pointer" }}
                        >
                          <p style={{ color: "#5A4632", fontSize: 12.5, fontStyle: "italic", lineHeight: 1.45 }}>
                            “{notes[open.id]}”
                          </p>
                          <span style={{ color: "#8C7355", fontSize: 10.5 }}>tap to edit</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => setNoteDraft("")}
                          style={{ display: "block", margin: "0 auto", color: "#8C7355", fontSize: 11.5 }}
                        >
                          + Add a note
                        </button>
                      )}
                    </div>
                  )}

                  {/* Dismiss lives on the paper itself: the paper is taller than the
                      jar once the Arabic is in, so anything below it gets covered. */}
                  <button
                    onClick={putBack}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      margin: "14px auto 0",
                      background: "transparent",
                      border: "none",
                      color: "#8C7355",
                      fontSize: 11.5,
                      cursor: "pointer",
                    }}
                  >
                    <X size={12} /> Put it back
                  </button>
                </motion.div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {shareVerse && <SharePreview verse={shareVerse} onClose={() => setShareVerse(null)} />}
      </AnimatePresence>

      {open ? null : (
        <div className="flex flex-col items-center gap-2.5">
          <p style={{ color: TOKENS.muted, fontSize: 11.5 }}>
            {!lidOpen
              ? "Tap the cork to open it"
              : readCount > 0
                ? `${readCount} of ${papers.length} opened`
                : `${papers.length} papers in the jar`}
          </p>
          <div className="flex items-center gap-2">
            <motion.button
              onClick={() => {
                setLid("open");
                setOpenId(verseOfTheDayId());
              }}
              whileTap={{ scale: 0.97 }}
              style={{
                color: TOKENS.gold,
                fontSize: 11.5,
                fontWeight: 700,
                border: `1px solid ${alpha(TOKENS.gold, "44")}`,
                borderRadius: 9999,
                padding: "6px 15px",
              }}
            >
              Today's verse
            </motion.button>
            {Object.keys(kept).length > 0 && (
              <motion.button
                onClick={() => setShowKept(true)}
                whileTap={{ scale: 0.97 }}
                style={{
                  color: TOKENS.gold,
                  fontSize: 11.5,
                  fontWeight: 700,
                  border: `1px solid ${alpha(TOKENS.gold, "44")}`,
                  borderRadius: 9999,
                  padding: "6px 15px",
                }}
                className="flex items-center gap-1.5"
              >
                <Star size={12} /> Kept ({Object.keys(kept).length})
              </motion.button>
            )}
          </div>
          <p style={{ color: TOKENS.muted, fontSize: 10.5, textAlign: "center", opacity: 0.8 }}>
            the same one for whoever opens it today
          </p>

          {(readCount > 0 || Object.keys(kept).length > 0) &&
            (confirmReset ? (
              <div className="flex items-center gap-3" style={{ marginTop: 2 }}>
                <span style={{ color: TOKENS.muted, fontSize: 11 }}>Clear kept verses and progress?</span>
                <button
                  onClick={resetJar}
                  aria-label="Confirm clearing the jar"
                  style={{ color: "#C4184F", fontSize: 11, fontWeight: 700 }}
                >
                  Clear
                </button>
                <button
                  onClick={() => setConfirmReset(false)}
                  aria-label="Cancel clearing the jar"
                  style={{ color: TOKENS.muted, fontSize: 11 }}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmReset(true)}
                style={{ color: TOKENS.muted, fontSize: 10.5, opacity: 0.65, marginTop: 2 }}
              >
                Start the jar over
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
