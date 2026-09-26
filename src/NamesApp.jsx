import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { BookOpenText, ChevronLeft, ChevronRight, Grid3x3, Heart, Shuffle, X } from "lucide-react";
import { TOKENS, alpha } from "./messages.js";
import { NAMES } from "./names.js";
import { NAMES_AZ } from "./namesAz.js";
import { cachedDoc, readDoc, updateDoc } from "./doc.js";
import { water } from "./garden.js";

const SEEN_KEY = "names-seen";
const LANG_KEY = "names-lang";
const MORE_KEY = "names-more";
const DOC = "names";
const LIKE_COLOR = "#C0656B";

// Only Azerbaijani has the longer explanation; English keeps the short meaning.
const STRINGS = {
  en: {
    title: "The ninety-nine Names", hint: "Swipe, or tap the grid for all of them",
    all: "All ninety-nine", opened: (n, total) => `${n} of ${total} opened`, back: "Back",
    prev: "Previous name", next: "Next name", random: "Random name", grid: "Show all names",
    like: "Like this name", unlike: "Unlike this name", allTab: "All", likedTab: (n) => `Liked · ${n}`,
    likedEmpty: "Tap ♥ on a name and it will wait for you here.",
  },
  az: {
    title: "Allahın doxsan doqquz adı", hint: "Sürüşdür, ya da hamısı üçün cədvələ toxun",
    all: "Doxsan doqquzu da", opened: (n, total) => `${total} addan ${n} açılıb`, back: "Geri",
    prev: "Əvvəlki ad", next: "Növbəti ad", random: "Təsadüfi ad", grid: "Bütün adları göstər",
    more: "Ətraflı izah", less: "İzahı gizlət",
    like: "Bu adı bəyən", unlike: "Bəyənməni geri al", allTab: "Hamısı", likedTab: (n) => `Bəyəndiklərim · ${n}`,
    likedEmpty: "Addakı ♥ işarəsinə toxun — burada səni gözləyəcək.",
  },
};

function stored(key, fallback) {
  try {
    return localStorage.getItem(key) || fallback;
  } catch {
    return fallback;
  }
}

function store(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* private mode */
  }
}

function loadSeen() {
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? new Set(arr) : new Set();
  } catch {
    return new Set();
  }
}

function saveSeen(seen) {
  try {
    localStorage.setItem(SEEN_KEY, JSON.stringify([...seen]));
  } catch {
    /* private mode */
  }
}

// Same Name for anyone opening it on a given day, like the jar's verse.
function nameOfTheDay() {
  const d = new Date();
  const key = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return hash % NAMES.length;
}

function readStartIndex() {
  const n = new URLSearchParams(window.location.search).get("n");
  const num = Number(n);
  return n && Number.isInteger(num) && num >= 1 && num <= NAMES.length ? num - 1 : nameOfTheDay();
}

export default function NamesApp() {
  const [index, setIndex] = useState(readStartIndex);
  const [dir, setDir] = useState(0);
  const [seen, setSeen] = useState(loadSeen);
  // What had been opened before this visit, so only a new Name waters the rose.
  const openedBefore = useRef(null);
  if (openedBefore.current === null) openedBefore.current = new Set(seen);
  const [showIndex, setShowIndex] = useState(false);
  const [lang, setLang] = useState(() => (stored(LANG_KEY, "en") === "az" ? "az" : "en"));
  // Left open, the explanation follows you from name to name.
  const [showMore, setShowMore] = useState(() => stored(MORE_KEY, "") === "1");
  const [doc, setDoc] = useState(() => cachedDoc(DOC) || {});
  const [gridView, setGridView] = useState("all");

  const likes = doc.likes || {};
  const likedList = Object.entries(likes)
    .sort(([, a], [, b]) => (b.at || "").localeCompare(a.at || ""))
    .map(([n]) => Number(n) - 1)
    .filter((i) => NAMES[i]);

  useEffect(() => {
    let cancelled = false;
    readDoc(DOC).then((d) => {
      if (!cancelled && d) setDoc(d);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // One key per Name, so a like made on your other device survives the merge.
  const toggleLike = async (n) => {
    const on = !likes[n];
    const withLike = (d) => {
      const next = { ...(d.likes || {}) };
      if (on) next[n] = { at: new Date().toISOString() };
      else delete next[n];
      return { ...d, likes: next };
    };
    setDoc((d) => withLike(d));
    const saved = await updateDoc(DOC, (latest) => ({ ...withLike(latest), updated: new Date().toISOString() }));
    if (saved) setDoc(saved);
  };

  const name = NAMES[index];
  const az = NAMES_AZ[index];
  const t = STRINGS[lang];
  const label = lang === "az" ? az.name : name.tr;
  const meaning = lang === "az" ? az.meaning : name.meaning;

  const pickLang = (id) => {
    setLang(id);
    store(LANG_KEY, id);
  };
  const toggleMore = () => {
    setShowMore((v) => {
      store(MORE_KEY, v ? "" : "1");
      return !v;
    });
  };

  const langToggle = (
    <div className="flex gap-1.5 mb-4">
      {[["en", "English"], ["az", "Azərbaycan"]].map(([id, text]) => (
        <button
          key={id}
          onClick={() => pickLang(id)}
          style={{
            fontSize: 10.5,
            fontWeight: 700,
            padding: "5px 11px",
            borderRadius: 9999,
            border: `1px solid ${lang === id ? alpha(TOKENS.gold, "66") : TOKENS.line}`,
            color: lang === id ? TOKENS.gold : TOKENS.muted,
          }}
        >
          {text}
        </button>
      ))}
    </div>
  );

  useEffect(() => {
    setSeen((prev) => {
      if (prev.has(name.n)) return prev;
      const next = new Set(prev).add(name.n);
      saveSeen(next);
      return next;
    });
    // A Name you have not opened before waters the rose.
    if (!openedBefore.current.has(name.n)) {
      openedBefore.current.add(name.n);
      water("rose");
    }
  }, [name.n]);

  const go = (delta) => {
    setDir(delta);
    setIndex((i) => (i + delta + NAMES.length) % NAMES.length);
  };

  const jump = (i) => {
    setDir(i > index ? 1 : -1);
    setIndex(i);
    setShowIndex(false);
  };

  const random = () => {
    let next = index;
    while (next === index) next = Math.floor(Math.random() * NAMES.length);
    setDir(1);
    setIndex(next);
  };

  if (showIndex) {
    return (
      <div className="w-full flex flex-col items-center">
        <p style={{ color: TOKENS.muted, fontSize: 13, textAlign: "center" }} className="mb-1">
          {t.all}
        </p>
        <p style={{ color: TOKENS.muted, fontSize: 11.5, textAlign: "center" }} className="mb-5">
          {t.opened(seen.size, NAMES.length)}
        </p>
        <div className="w-full flex gap-1.5 mb-4">
          {[["all", t.allTab], ["liked", t.likedTab(likedList.length)]].map(([id, text]) => (
            <button
              key={id}
              onClick={() => setGridView(id)}
              style={{
                flex: 1,
                height: 34,
                borderRadius: 9999,
                fontSize: 11.5,
                fontWeight: 700,
                border: `1px solid ${gridView === id ? alpha(TOKENS.gold, "66") : TOKENS.line}`,
                color: gridView === id ? TOKENS.gold : TOKENS.muted,
              }}
              className="flex items-center justify-center gap-1.5"
            >
              {id === "liked" && <Heart size={12} fill={gridView === id ? "currentColor" : "none"} />} {text}
            </button>
          ))}
        </div>

        {gridView === "liked" && likedList.length === 0 && (
          <p style={{ color: TOKENS.muted, fontSize: 12.5, textAlign: "center" }} className="mb-5">
            {t.likedEmpty}
          </p>
        )}

        {gridView === "liked" && likedList.length > 0 && (
          <div className="w-full flex flex-col gap-1.5 mb-5">
            {likedList.map((i) => (
              <motion.button
                key={NAMES[i].n}
                onClick={() => jump(i)}
                whileTap={{ scale: 0.99 }}
                style={{
                  width: "100%",
                  background: `linear-gradient(160deg, ${TOKENS.bgCard}, ${TOKENS.bgCardEdge})`,
                  border: `1px solid ${TOKENS.line}`,
                  borderRadius: 12,
                  padding: "9px 13px",
                  display: "flex",
                  alignItems: "center",
                  gap: 11,
                }}
              >
                <span style={{ color: TOKENS.muted, fontSize: 11, fontWeight: 700, width: 22, flexShrink: 0, textAlign: "left" }}>
                  {NAMES[i].n}
                </span>
                <span style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
                  <span style={{ display: "block", color: TOKENS.cream, fontFamily: "'Fraunces', serif", fontSize: 14 }}>
                    {lang === "az" ? NAMES_AZ[i].name : NAMES[i].tr}
                  </span>
                  <span style={{ display: "block", color: TOKENS.muted, fontSize: 11 }}>
                    {lang === "az" ? NAMES_AZ[i].meaning : NAMES[i].meaning}
                  </span>
                </span>
                <span dir="rtl" lang="ar" style={{ color: TOKENS.gold, fontFamily: "'Amiri', serif", fontSize: 17, flexShrink: 0 }}>
                  {NAMES[i].ar}
                </span>
              </motion.button>
            ))}
          </div>
        )}

        {gridView === "all" && (
        <div
          style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(58px, 1fr))", gap: 7, width: "100%" }}
          className="mb-5"
        >
          {NAMES.map((nm, i) => (
            <motion.button
              key={nm.n}
              onClick={() => jump(i)}
              whileTap={{ scale: 0.94 }}
              aria-label={`${nm.n}. ${lang === "az" ? NAMES_AZ[i].name : nm.tr}`}
              style={{
                aspectRatio: "1",
                borderRadius: 10,
                border: `1px solid ${seen.has(nm.n) ? `${alpha(TOKENS.gold, "66")}` : TOKENS.line}`,
                background: seen.has(nm.n)
                  ? `linear-gradient(160deg, ${TOKENS.bgCard}, ${TOKENS.bgCardEdge})`
                  : "transparent",
                color: seen.has(nm.n) ? TOKENS.gold : TOKENS.muted,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
                fontWeight: 700,
                position: "relative",
              }}
            >
              {nm.n}
              {likes[nm.n] && (
                <Heart size={9} fill={LIKE_COLOR} style={{ color: LIKE_COLOR, position: "absolute", top: 5, right: 5 }} />
              )}
            </motion.button>
          ))}
        </div>
        )}
        <button
          onClick={() => setShowIndex(false)}
          style={{ color: TOKENS.muted, fontSize: 12.5 }}
          className="flex items-center gap-1.5"
        >
          <X size={13} /> {t.back}
        </button>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-center">
      <p style={{ color: TOKENS.muted, fontSize: 13, textAlign: "center" }} className="mb-1">
        {t.title}
      </p>
      <p style={{ color: TOKENS.muted, fontSize: 11.5, textAlign: "center" }} className="mb-3">
        {t.hint}
      </p>
      {langToggle}

      <div style={{ position: "relative", width: "100%", height: 300, marginBottom: 18 }}>
        <AnimatePresence initial={false} custom={dir} mode="popLayout">
          <motion.div
            key={name.n}
            custom={dir}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.18}
            onDragEnd={(_, info) => {
              if (info.offset.x < -70 || info.velocity.x < -450) go(1);
              else if (info.offset.x > 70 || info.velocity.x > 450) go(-1);
            }}
            initial={(d) => ({ opacity: 0, x: d > 0 ? 90 : -90, scale: 0.96 })}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={(d) => ({ opacity: 0, x: d > 0 ? -90 : 90, scale: 0.96 })}
            transition={{ type: "spring", stiffness: 260, damping: 28 }}
            style={{
              position: "absolute",
              inset: 0,
              background: `linear-gradient(160deg, ${TOKENS.bgCard}, ${TOKENS.bgCardEdge})`,
              border: `1px solid ${alpha(TOKENS.gold, "44")}`,
              borderRadius: 20,
              boxShadow: "0 18px 40px rgba(0,0,0,0.45)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "26px 22px",
              cursor: "grab",
              touchAction: "pan-y",
            }}
          >
            <span
              style={{
                color: TOKENS.muted,
                fontSize: 10.5,
                fontWeight: 700,
                letterSpacing: 1.6,
                marginBottom: 18,
              }}
            >
              {String(name.n).padStart(2, "0")} / {NAMES.length}
            </span>
            <button
              onClick={() => toggleLike(name.n)}
              onPointerDown={(e) => e.stopPropagation()}
              aria-label={likes[name.n] ? t.unlike : t.like}
              aria-pressed={!!likes[name.n]}
              style={{ position: "absolute", top: 14, right: 14, padding: 6, color: likes[name.n] ? LIKE_COLOR : TOKENS.muted }}
            >
              <Heart size={18} fill={likes[name.n] ? "currentColor" : "none"} />
            </button>

            <p
              dir="rtl"
              lang="ar"
              style={{
                color: TOKENS.gold,
                fontFamily: "'Amiri', serif",
                fontSize: 54,
                lineHeight: 1.5,
                textAlign: "center",
                textShadow: `0 0 26px ${alpha(TOKENS.glow, "33")}`,
                marginBottom: 14,
              }}
            >
              {name.ar}
            </p>

            <div style={{ width: 44, height: 1, background: `${alpha(TOKENS.gold, "55")}`, marginBottom: 14 }} />

            <p
              style={{
                color: TOKENS.cream,
                fontSize: 12.5,
                fontWeight: 700,
                letterSpacing: 1.4,
                textTransform: "uppercase",
                textAlign: "center",
                marginBottom: 8,
              }}
            >
              {label}
            </p>
            <p
              style={{
                color: TOKENS.cream,
                fontFamily: "'Fraunces', serif",
                fontSize: 17,
                lineHeight: 1.4,
                textAlign: "center",
              }}
            >
              {meaning}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex items-center gap-3">
        <motion.button
          onClick={() => go(-1)}
          whileTap={{ scale: 0.94 }}
          aria-label={t.prev}
          style={{
            width: 42,
            height: 42,
            borderRadius: 9999,
            border: `1px solid ${TOKENS.line}`,
            color: TOKENS.cream,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ChevronLeft size={17} />
        </motion.button>
        <motion.button
          onClick={() => {
            setGridView("all");
            setShowIndex(true);
          }}
          whileTap={{ scale: 0.94 }}
          aria-label={t.grid}
          style={{
            height: 42,
            padding: "0 16px",
            borderRadius: 9999,
            border: `1px solid ${TOKENS.line}`,
            color: TOKENS.muted,
            fontSize: 11.5,
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            gap: 7,
          }}
        >
          <Grid3x3 size={14} /> {seen.size}/{NAMES.length}
        </motion.button>
        <motion.button
          onClick={random}
          whileTap={{ scale: 0.94 }}
          aria-label={t.random}
          style={{
            width: 42,
            height: 42,
            borderRadius: 9999,
            border: `1px solid ${TOKENS.line}`,
            color: TOKENS.gold,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Shuffle size={16} />
        </motion.button>
        <motion.button
          onClick={() => go(1)}
          whileTap={{ scale: 0.94 }}
          aria-label={t.next}
          style={{
            width: 42,
            height: 42,
            borderRadius: 9999,
            border: `1px solid ${TOKENS.line}`,
            color: TOKENS.cream,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ChevronRight size={17} />
        </motion.button>
      </div>

      <button
        onClick={() => {
          setGridView("liked");
          setShowIndex(true);
        }}
        style={{ color: likedList.length ? LIKE_COLOR : TOKENS.muted, fontSize: 12, fontWeight: 700 }}
        className="flex items-center gap-1.5 mt-5"
      >
        <Heart size={14} fill={likedList.length ? "currentColor" : "none"} /> {t.likedTab(likedList.length)}
      </button>

      {lang === "az" && (
        <div className="w-full flex flex-col items-center mt-3">
          <button
            onClick={toggleMore}
            aria-expanded={showMore}
            style={{ color: showMore ? TOKENS.gold : TOKENS.muted, fontSize: 12, fontWeight: 700 }}
            className="flex items-center gap-1.5"
          >
            <BookOpenText size={14} /> {showMore ? t.less : t.more}
          </button>
          {showMore && (
            <motion.div
              key={name.n}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              style={{
                width: "100%",
                marginTop: 12,
                background: `linear-gradient(160deg, ${TOKENS.bgCard}, ${TOKENS.bgCardEdge})`,
                border: `1px solid ${TOKENS.line}`,
                borderRadius: 14,
                padding: "14px 16px",
              }}
            >
              <p style={{ color: TOKENS.gold, fontSize: 11, fontWeight: 700, letterSpacing: 0.6, marginBottom: 6 }}>
                {az.name}
              </p>
              <p style={{ color: TOKENS.cream, fontFamily: "'Fraunces', serif", fontSize: 14, lineHeight: 1.6 }}>
                {az.about}
              </p>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}
