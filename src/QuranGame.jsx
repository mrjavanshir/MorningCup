import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { BookmarkCheck, ChevronLeft, ChevronRight, ImageDown, List, Pause, Play } from "lucide-react";
import { TOKENS, alpha } from "./messages.js";
import { SURAHS, TOTAL_AYAHS } from "./surahs.js";
import { cachedDoc, docsAvailable, readDoc, updateDoc } from "./doc.js";
import SharePreview from "./SharePreview.jsx";

const DOC = "reading";
const HIM = "j";
const HER = "g";
const HIS_COLOR = TOKENS.gold;
const HER_COLOR = "#7FB2A6";
const PAPER = "#F6EEDE";
const RECITER = "Alafasy_128kbps";

const LANGS = [
  { id: "en.sahih", label: "English", note: "Saheeh International" },
  { id: "az.mammadaliyev", label: "Azərbaycan", note: "Məmmədəliyev & Bünyadov" },
];
// Only the surah chrome is localised — the translation itself comes from the
// chosen edition, and the transliterated name ("Al-Alaq") reads the same either way.
const STRINGS = {
  en: {
    ayahs: "ayahs", Meccan: "Meccan", Medinan: "Medinan", revealed: "revealed", read: "you've read",
    title: "Read the Qur'an", tagline: "start anywhere — it keeps your place.",
    progress: (n, total) => `${n} of ${total} ayahs read`, begin: "Pick a surah to begin",
    allSurahs: "All surahs", inOrder: "In order", asRevealed: "As revealed",
    continueFrom: (name, s, a) => `Continue from ${name} ${s}:${a}`,
    markAll: (n) => `Mark all ${n} ayahs read`,
    undoRead: (name) => `${name} read — tap to undo`,
    readToHere: "Read to here", youAreHere: "You're here",
    listen: "Listen", stop: "Stop", share: "Share",
    loading: "Loading…",
    failed: "Couldn't load this surah. It needs the network the first time; after that it's saved for offline.",
    you: "You", prev: "Previous surah", next: "Next surah",
    playAyah: (n) => `Play ayah ${n}`, stopAyah: (n) => `Stop ayah ${n}`,
    shareAyah: (n) => `Share ayah ${n} as an image`, markTo: (n) => `Read to ayah ${n}`,
    needStore: "This one needs the store — set VITE_STORE_URL and rebuild.",
    preview: "PREVIEW", sendIt: "Share this", rendering: "Rendering…", saved: "Saved", sent: "Shared", preparing: "Preparing…",
  },
  az: {
    ayahs: "ayə", Meccan: "Məkkə", Medinan: "Mədinə", revealed: "nazil sırası", read: "oxuduğun",
    title: "Quran oxu", tagline: "istədiyin yerdən başla — yerini yadda saxlayır.",
    progress: (n, total) => `${total} ayədən ${n} oxundu`, begin: "Başlamaq üçün surə seç",
    allSurahs: "Bütün surələr", inOrder: "Sıra ilə", asRevealed: "Nazil sırası ilə",
    continueFrom: (name, s, a) => `${name} ${s}:${a} — davam et`,
    markAll: (n) => `Bütün ${n} ayəni oxundu işarələ`,
    undoRead: (name) => `${name} oxundu — geri al`,
    readToHere: "Buraya qədər oxudum", youAreHere: "Buradasan",
    listen: "Dinlə", stop: "Dayandır", share: "Paylaş",
    loading: "Yüklənir…",
    failed: "Bu surə yüklənmədi. İlk dəfə internet lazımdır, sonra oflayn saxlanılır.",
    you: "Sən", prev: "Əvvəlki surə", next: "Növbəti surə",
    playAyah: (n) => `${n}-ci ayəni dinlə`, stopAyah: (n) => `${n}-ci ayəni dayandır`,
    shareAyah: (n) => `${n}-ci ayəni şəkil kimi paylaş`, markTo: (n) => `${n}-ci ayəyə qədər oxudum`,
    needStore: "Bunun üçün store lazımdır — VITE_STORE_URL təyin edib yenidən qur.",
    preview: "ÖNBAXIŞ", sendIt: "Bunu paylaş", rendering: "Hazırlanır…", saved: "Yadda saxlanıldı", sent: "Paylaşıldı", preparing: "Hazırlanır…",
  },
};
const langKey = (id) => (id.startsWith("az") ? "az" : "en");

const LANG_KEY = "quran-lang";
const ORDER_KEY = "quran-order";

const surahOf = (n) => SURAHS.find((s) => s.n === n);

const pad = (x) => String(x).padStart(3, "0");
const ayahAudio = (surah, ayah) => `https://everyayah.com/data/${RECITER}/${pad(surah)}${pad(ayah)}.mp3`;

/** Ayahs actually marked as read, summed across surahs — not a marker position. */
function ayahsRead(readMap) {
  if (!readMap) return 0;
  return Object.entries(readMap).reduce((total, [surah, count]) => {
    const s = surahOf(Number(surah));
    if (!s) return total;
    return total + Math.min(Math.max(count, 0), s.ayahs);
  }, 0);
}

function stored(key, fallback) {
  try {
    return localStorage.getItem(key) || fallback;
  } catch {
    return fallback;
  }
}

async function fetchSurah(n, lang) {
  const res = await fetch(`https://api.alquran.cloud/v1/surah/${n}/editions/quran-uthmani,${lang}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const { data } = await res.json();
  const arabic = data.find((d) => d.edition.identifier === "quran-uthmani");
  const translation = data.find((d) => d.edition.identifier === lang);
  return arabic.ayahs.map((a, i) => ({
    n: a.numberInSurah,
    ar: a.text,
    tr: translation?.ayahs[i]?.text || "",
  }));
}

export default function QuranGame({ identity }) {
  const me = identity === HIM ? HIM : HER;
  const otherName = me === HIM ? "Ganira" : "Javanshir";
  const them = me === HIM ? HER : HIM;

  const [doc, setDoc] = useState(() => cachedDoc(DOC) || {});
  const [openSurah, setOpenSurah] = useState(null);
  const [ayahs, setAyahs] = useState(null);
  const [loadState, setLoadState] = useState("idle");
  const [lang, setLang] = useState(() => stored(LANG_KEY, "en.sahih"));
  const [order, setOrder] = useState(() => stored(ORDER_KEY, "mushaf"));
  const [playing, setPlaying] = useState(null);
  const [shareVerse, setShareVerse] = useState(null);
  const audioRef = useRef(null);

  const L = langKey(lang);
  const t = STRINGS[L];

  const marks = doc.marks || {};
  const readAll = doc.read || {};
  const myRead = readAll[me] || {};
  const mine = marks[me];

  useEffect(() => {
    let cancelled = false;
    readDoc(DOC).then((d) => {
      if (!cancelled && d) setDoc(d);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.onended = null;
      audioRef.current = null;
    }
    setPlaying(null);
  };
  useEffect(() => stopAudio, []);

  const playAyah = (n) => {
    if (playing === n) {
      stopAudio();
      return;
    }
    stopAudio();
    const el = new Audio(ayahAudio(openSurah, n));
    audioRef.current = el;
    el.onended = stopAudio;
    el.onerror = stopAudio;
    setPlaying(n);
    el.play().catch(stopAudio);
  };

  useEffect(() => {
    if (openSurah === null) return undefined;
    let cancelled = false;
    stopAudio();
    setAyahs(null);
    setLoadState("loading");
    fetchSurah(openSurah, lang)
      .then((list) => {
        if (cancelled) return;
        setAyahs(list);
        setLoadState("idle");
      })
      .catch(() => {
        if (!cancelled) setLoadState("failed");
      });
    return () => {
      cancelled = true;
    };
  }, [openSurah, lang]);

  // Opening a surah you are part-way through should land where you stopped,
  // not at the top. Keyed on `ayahs`, which is nulled then refilled on every
  // open — so it runs once per load, and marking an ayah does not re-scroll.
  useEffect(() => {
    if (!ayahs || openSurah === null) return;
    const bookmark = marks[me];
    const resumeAt =
      bookmark && bookmark.surah === openSurah ? bookmark.ayah : (readAll[me] || {})[openSurah] || 0;
    if (resumeAt < 2) return; // the first ayah is already at the top
    const el = document.querySelector(`[data-ayah="${resumeAt}"]`);
    if (el) el.scrollIntoView({ block: "center" });
  }, [ayahs]);

  const pickLang = (id) => {
    setLang(id);
    try {
      localStorage.setItem(LANG_KEY, id);
    } catch {
      /* private mode */
    }
  };
  const pickOrder = (id) => {
    setOrder(id);
    try {
      localStorage.setItem(ORDER_KEY, id);
    } catch {
      /* private mode */
    }
  };

  // Marking ayah N records N ayahs read in THIS surah — so jumping to a late
  // surah adds only what you read there, rather than claiming everything before.
  // `count` of 0 clears the surah; the bookmark only moves when reading forward.
  const setProgress = async (surah, count, bookmark = true) => {
    const optimistic = {
      ...doc,
      marks: bookmark ? { ...marks, [me]: { surah, ayah: count } } : marks,
      read: { ...readAll, [me]: { ...myRead, [surah]: count } },
    };
    setDoc(optimistic);
    const saved = await updateDoc(DOC, (latest) => ({
      ...latest,
      marks: bookmark ? { ...(latest.marks || {}), [me]: { surah, ayah: count } } : latest.marks || {},
      read: { ...(latest.read || {}), [me]: { ...((latest.read || {})[me] || {}), [surah]: count } },
      updated: new Date().toISOString(),
    }));
    if (saved) setDoc(saved);
  };

  const markHere = (surah, ayah) => setProgress(surah, ayah);

  const shareAyah = (a) => {
    const s = surahOf(openSurah);
    setShareVerse({
      arabic: a.ar,
      text: a.tr,
      ref: `${s.en} ${openSurah}:${a.n}`,
      label: s.meaning[L],
    });
  };

  const listed = order === "revelation" ? [...SURAHS].sort((a, b) => a.order - b.order) : SURAHS;

  if (!docsAvailable()) {
    return (
      <p style={{ color: TOKENS.muted, fontSize: 13, textAlign: "center" }} className="mt-6">
        {STRINGS[langKey(stored(LANG_KEY, "en.sahih"))].needStore}
      </p>
    );
  }

  // ---------- reading ----------
  if (openSurah !== null) {
    const s = surahOf(openSurah);
    const readHere = myRead[openSurah] || 0;
    return (
      <div className="w-full flex flex-col items-center">
        <div className="w-full flex items-center justify-between mb-1">
          <button onClick={() => setOpenSurah(openSurah > 1 ? openSurah - 1 : null)} aria-label={t.prev} style={{ color: TOKENS.muted, padding: 6 }}>
            <ChevronLeft size={18} />
          </button>
          <div style={{ textAlign: "center" }}>
            <p dir="rtl" lang="ar" style={{ color: TOKENS.gold, fontFamily: "'Amiri', serif", fontSize: 22 }}>{s.ar}</p>
            <p style={{ color: TOKENS.muted, fontSize: 11 }}>
              {s.en} · {s.meaning[L]} · {s.ayahs} {t.ayahs} · {t[s.place]} · {t.revealed} {s.order}
              {readHere > 0 && ` · ${t.read} ${readHere}`}
            </p>
          </div>
          <button onClick={() => setOpenSurah(openSurah < 114 ? openSurah + 1 : null)} aria-label={t.next} style={{ color: TOKENS.muted, padding: 6 }}>
            <ChevronRight size={18} />
          </button>
        </div>

        <motion.button
          onClick={() => setOpenSurah(null)}
          whileTap={{ scale: 0.98 }}
          style={{
            width: "100%",
            height: 40,
            borderRadius: 9999,
            border: `1px solid ${TOKENS.line}`,
            color: TOKENS.cream,
            fontSize: 12.5,
            fontWeight: 700,
          }}
          className="flex items-center justify-center gap-2 mb-4"
        >
          <List size={14} /> {t.allSurahs}
        </motion.button>

        {loadState === "loading" && <p style={{ color: TOKENS.muted, fontSize: 12.5 }} className="mt-4">{t.loading}</p>}
        {loadState === "failed" && (
          <p style={{ color: TOKENS.muted, fontSize: 12.5, textAlign: "center" }} className="mt-4">
            {t.failed}
          </p>
        )}

        <div className="w-full flex flex-col gap-2.5">
          {(ayahs || []).map((a) => {
            const isMine = mine && mine.surah === openSurah && mine.ayah === a.n;
            const withinRead = a.n <= readHere;
            return (
              <div
                key={a.n}
                data-ayah={a.n}
                style={{
                  width: "100%",
                  background: `linear-gradient(180deg, ${PAPER} 0%, #EDE2CC 100%)`,
                  borderRadius: 12,
                  // Needed in light mode: cream paper on a cream page has almost
                  // no edge without it. Invisible against the dark theme.
                  border: "1px solid rgba(140,115,85,0.22)",
                  borderLeft: `4px solid ${isMine ? HIS_COLOR : withinRead ? alpha(HIS_COLOR, "55") : "transparent"}`,
                  padding: "14px 16px",
                }}
              >
                <p dir="rtl" lang="ar" style={{ color: "#2A1620", fontFamily: "'Amiri', serif", fontSize: 22, lineHeight: 2.05, textAlign: "right" }}>
                  {a.ar}
                </p>

                {/* Rule with a diamond, echoing the share card's divider. */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "12px 0 10px" }}>
                  <span style={{ flex: 1, height: 1, background: "rgba(140,115,85,0.28)" }} />
                  <span style={{ width: 5, height: 5, background: "rgba(140,115,85,0.5)", transform: "rotate(45deg)" }} />
                  <span style={{ flex: 1, height: 1, background: "rgba(140,115,85,0.28)" }} />
                </div>

                <p style={{ color: "#5A4632", fontFamily: "'Fraunces', serif", fontSize: 13.5, lineHeight: 1.55 }}>
                  {a.tr}
                </p>
                <div className="flex items-center justify-between" style={{ marginTop: 12, paddingTop: 10, borderTop: "1px solid rgba(140,115,85,0.18)" }}>
                  {/* The number sits in a medallion, the way an ayah is closed on the page. */}
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      minWidth: 26,
                      height: 26,
                      padding: "0 7px",
                      borderRadius: 9999,
                      border: "1px solid rgba(140,115,85,0.45)",
                      background: "rgba(140,115,85,0.08)",
                      color: "#8C6A3A",
                      fontSize: 10.5,
                      fontWeight: 700,
                    }}
                  >
                    {openSurah}:{a.n}
                  </span>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => playAyah(a.n)}
                      aria-label={playing === a.n ? t.stopAyah(a.n) : t.playAyah(a.n)}
                      style={{ display: "flex", alignItems: "center", gap: 5, color: "#8C7355", fontSize: 10.5, fontWeight: 700 }}
                    >
                      {playing === a.n ? <Pause size={12} /> : <Play size={12} />} {playing === a.n ? t.stop : t.listen}
                    </button>
                    <button
                      onClick={() => shareAyah(a)}
                      aria-label={t.shareAyah(a.n)}
                      style={{ display: "flex", alignItems: "center", gap: 5, color: "#8C7355", fontSize: 10.5, fontWeight: 700 }}
                    >
                      <ImageDown size={12} /> {t.share}
                    </button>
                    <button
                      onClick={() => markHere(openSurah, a.n)}
                      aria-label={t.markTo(a.n)}
                      style={{ display: "flex", alignItems: "center", gap: 5, color: isMine ? HIS_COLOR : "#8C7355", fontSize: 10.5, fontWeight: 700 }}
                    >
                      <BookmarkCheck size={12} /> {isMine ? t.youAreHere : t.readToHere}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <AnimatePresence>
          {shareVerse && <SharePreview verse={shareVerse} labels={t} onClose={() => setShareVerse(null)} />}
        </AnimatePresence>

        {ayahs && ayahs.length > 0 && (
          <div className="w-full flex flex-col items-center mt-5">
            <motion.button
              onClick={() => setProgress(openSurah, readHere >= s.ayahs ? 0 : s.ayahs, readHere < s.ayahs)}
              whileTap={{ scale: 0.98 }}
              style={{
                width: "100%",
                height: 46,
                borderRadius: 9999,
                background: readHere >= s.ayahs ? "transparent" : TOKENS.gold,
                border: readHere >= s.ayahs ? `1px solid ${alpha(TOKENS.gold, "66")}` : "none",
                color: readHere >= s.ayahs ? TOKENS.gold : TOKENS.bgDeep,
                fontWeight: 700,
                fontSize: 13,
              }}
              className="flex items-center justify-center gap-2 mb-3"
            >
              <BookmarkCheck size={15} />
              {readHere >= s.ayahs ? t.undoRead(s.en) : t.markAll(s.ayahs)}
            </motion.button>

            <motion.button
              onClick={() => setOpenSurah(null)}
              whileTap={{ scale: 0.98 }}
              style={{
                width: "100%",
                height: 46,
                borderRadius: 9999,
                border: `1px solid ${TOKENS.line}`,
                color: TOKENS.cream,
                fontWeight: 700,
                fontSize: 13,
              }}
              className="flex items-center justify-center gap-2"
            >
              <List size={15} /> {t.allSurahs}
            </motion.button>
          </div>
        )}
      </div>
    );
  }

  // ---------- index ----------
  const myTotal = ayahsRead(readAll[me]);
  const theirTotal = ayahsRead(readAll[them]);

  return (
    <div className="w-full flex flex-col items-center">
      <p style={{ color: TOKENS.muted, fontSize: 13, textAlign: "center" }} className="mb-1">
        {t.title}
      </p>
      <p style={{ color: TOKENS.gold, fontSize: 11.5, textAlign: "center", opacity: 0.75 }} className="mb-1">
        {t.tagline}
      </p>
      <p style={{ color: TOKENS.muted, fontSize: 11.5, textAlign: "center" }} className="mb-4">
        {myTotal > 0 ? t.progress(myTotal, TOTAL_AYAHS) : t.begin}
      </p>

      <div className="w-full flex flex-col gap-2 mb-2">
        {[[me, HIS_COLOR, myTotal], [them, HER_COLOR, theirTotal]].map(([who, color, total]) => (
          <div key={who} style={{ width: "100%", height: 6, borderRadius: 9999, background: TOKENS.line }}>
            <motion.div
              animate={{ width: `${(total / TOTAL_AYAHS) * 100}%` }}
              transition={{ type: "spring", stiffness: 180, damping: 24 }}
              style={{ height: "100%", borderRadius: 9999, background: color }}
            />
          </div>
        ))}
      </div>
      <div className="flex items-center gap-4 mb-4" style={{ fontSize: 10.5 }}>
        <span style={{ color: HIS_COLOR }}>{t.you} {myTotal}</span>
        <span style={{ color: HER_COLOR }}>{otherName} {theirTotal}</span>
      </div>

      <div className="w-full flex items-center justify-between mb-4" style={{ gap: 8 }}>
        <div className="flex gap-1.5">
          {LANGS.map((l) => (
            <button
              key={l.id}
              onClick={() => pickLang(l.id)}
              title={l.note}
              style={{
                fontSize: 10.5,
                fontWeight: 700,
                padding: "5px 11px",
                borderRadius: 9999,
                border: `1px solid ${lang === l.id ? `${alpha(TOKENS.gold, "66")}` : TOKENS.line}`,
                color: lang === l.id ? TOKENS.gold : TOKENS.muted,
              }}
            >
              {l.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => pickOrder(order === "mushaf" ? "revelation" : "mushaf")}
          style={{ fontSize: 10.5, fontWeight: 700, padding: "5px 11px", borderRadius: 9999, border: `1px solid ${TOKENS.line}`, color: TOKENS.muted }}
        >
          {order === "mushaf" ? t.inOrder : t.asRevealed}
        </button>
      </div>

      {mine && (
        <motion.button
          onClick={() => setOpenSurah(mine.surah)}
          whileTap={{ scale: 0.98 }}
          style={{ background: TOKENS.gold, color: TOKENS.bgDeep, fontWeight: 700 }}
          className="w-full h-11 rounded-full flex items-center justify-center gap-2 mb-5"
        >
          {t.continueFrom(surahOf(mine.surah).en, mine.surah, mine.ayah)}
        </motion.button>
      )}

      <div className="w-full flex flex-col gap-1.5">
        {listed.map((s) => {
          const readHere = Math.min(myRead[s.n] || 0, s.ayahs);
          const finished = readHere >= s.ayahs;
          return (
            <motion.button
              key={s.n}
              onClick={() => setOpenSurah(s.n)}
              whileTap={{ scale: 0.99 }}
              style={{
                width: "100%",
                background: `linear-gradient(160deg, ${TOKENS.bgCard}, ${TOKENS.bgCardEdge})`,
                border: `1px solid ${finished ? `${alpha(HIS_COLOR, "66")}` : TOKENS.line}`,
                borderRadius: 12,
                padding: "9px 13px",
                display: "flex",
                alignItems: "center",
                gap: 11,
              }}
            >
              <span style={{ color: TOKENS.muted, fontSize: 11, fontWeight: 700, width: 24, flexShrink: 0, textAlign: "left" }}>
                {order === "revelation" ? s.order : s.n}
              </span>
              <span style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
                <span style={{ color: TOKENS.cream, fontFamily: "'Fraunces', serif", fontSize: 14 }}>{s.en}</span>
                <span style={{ color: TOKENS.muted, fontSize: 11, marginLeft: 7 }}>
                  {readHere > 0 ? `${readHere}/${s.ayahs}` : s.ayahs}
                </span>
              </span>
              {readHere > 0 && (
                <span style={{ width: 7, height: 7, borderRadius: 9999, background: finished ? HIS_COLOR : `${alpha(HIS_COLOR, "66")}`, flexShrink: 0 }} />
              )}
              <span dir="rtl" lang="ar" style={{ color: TOKENS.gold, fontFamily: "'Amiri', serif", fontSize: 15, flexShrink: 0 }}>
                {s.ar}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
