import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import { BookmarkCheck, ChevronLeft, ChevronRight, X } from "lucide-react";
import { TOKENS } from "./messages.js";
import { SURAHS, TOTAL_AYAHS } from "./surahs.js";
import { cachedDoc, docsAvailable, readDoc, updateDoc } from "./doc.js";

const DOC = "reading";
const HIM = "j";
const HER = "g";
const HIS_COLOR = TOKENS.gold;
const HER_COLOR = "#7FB2A6";
const PAPER = "#F6EEDE";

const surahOf = (n) => SURAHS.find((s) => s.n === n);
const position = (mark) => (mark ? surahOf(mark.surah).before + mark.ayah : 0);

async function fetchSurah(n) {
  const res = await fetch(`https://api.alquran.cloud/v1/surah/${n}/editions/quran-uthmani,en.sahih`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const { data } = await res.json();
  const arabic = data.find((d) => d.edition.identifier === "quran-uthmani");
  const english = data.find((d) => d.edition.identifier === "en.sahih");
  return arabic.ayahs.map((a, i) => ({
    n: a.numberInSurah,
    ar: a.text,
    en: english.ayahs[i]?.text || "",
  }));
}

function ProgressBar({ marks }) {
  const rows = [
    { key: HIM, color: HIS_COLOR },
    { key: HER, color: HER_COLOR },
  ];
  return (
    <div className="w-full flex flex-col gap-2 mb-1">
      {rows.map(({ key, color }) => {
        const pct = (position(marks[key]) / TOTAL_AYAHS) * 100;
        return (
          <div key={key} style={{ width: "100%", height: 6, borderRadius: 9999, background: TOKENS.line }}>
            <motion.div
              animate={{ width: `${pct}%` }}
              transition={{ type: "spring", stiffness: 180, damping: 24 }}
              style={{ height: "100%", borderRadius: 9999, background: color }}
            />
          </div>
        );
      })}
    </div>
  );
}

export default function QuranGame({ isOwner }) {
  const me = isOwner ? HIM : HER;
  const [marks, setMarks] = useState(() => cachedDoc(DOC)?.marks || {});
  const [openSurah, setOpenSurah] = useState(null);
  const [ayahs, setAyahs] = useState(null);
  const [loadState, setLoadState] = useState("idle"); // idle | loading | failed

  useEffect(() => {
    let cancelled = false;
    readDoc(DOC).then((d) => {
      if (!cancelled && d) setMarks(d.marks || {});
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (openSurah === null) return undefined;
    let cancelled = false;
    setAyahs(null);
    setLoadState("loading");
    fetchSurah(openSurah)
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
  }, [openSurah]);

  const setMark = async (surah, ayah) => {
    const next = { ...marks, [me]: { surah, ayah } };
    setMarks(next);
    const saved = await updateDoc(DOC, (latest) => ({
      ...latest,
      marks: { ...(latest.marks || {}), [me]: { surah, ayah } },
      updated: new Date().toISOString(),
    }));
    if (saved) setMarks(saved.marks || next);
  };

  const mine = marks[me];
  const theirs = marks[me === HIM ? HER : HIM];

  if (!docsAvailable()) {
    return (
      <p style={{ color: TOKENS.muted, fontSize: 13, textAlign: "center" }} className="mt-6">
        This one needs the store — set VITE_STORE_URL and rebuild.
      </p>
    );
  }

  // ---------- reading a surah ----------
  if (openSurah !== null) {
    const s = surahOf(openSurah);
    return (
      <div className="w-full flex flex-col items-center">
        <div className="w-full flex items-center justify-between mb-1">
          <button
            onClick={() => setOpenSurah(openSurah > 1 ? openSurah - 1 : null)}
            aria-label="Previous surah"
            style={{ color: TOKENS.muted, padding: 6 }}
          >
            <ChevronLeft size={18} />
          </button>
          <div style={{ textAlign: "center" }}>
            <p dir="rtl" lang="ar" style={{ color: TOKENS.gold, fontFamily: "'Amiri', serif", fontSize: 22 }}>
              {s.ar}
            </p>
            <p style={{ color: TOKENS.muted, fontSize: 11 }}>
              {s.en} · {s.ayahs} ayahs · {s.place}
            </p>
          </div>
          <button
            onClick={() => setOpenSurah(openSurah < 114 ? openSurah + 1 : null)}
            aria-label="Next surah"
            style={{ color: TOKENS.muted, padding: 6 }}
          >
            <ChevronRight size={18} />
          </button>
        </div>

        <button
          onClick={() => setOpenSurah(null)}
          style={{ color: TOKENS.muted, fontSize: 11.5 }}
          className="flex items-center gap-1.5 mb-4"
        >
          <X size={12} /> All surahs
        </button>

        {loadState === "loading" && (
          <p style={{ color: TOKENS.muted, fontSize: 12.5 }} className="mt-4">
            Loading…
          </p>
        )}
        {loadState === "failed" && (
          <p style={{ color: TOKENS.muted, fontSize: 12.5, textAlign: "center" }} className="mt-4">
            Couldn't load this surah. It needs the network the first time; after
            that it's saved for offline.
          </p>
        )}

        <div className="w-full flex flex-col gap-2.5">
          {(ayahs || []).map((a) => {
            const isMine = mine && mine.surah === openSurah && mine.ayah === a.n;
            const isTheirs = theirs && theirs.surah === openSurah && theirs.ayah === a.n;
            return (
              <div
                key={a.n}
                style={{
                  width: "100%",
                  background: `linear-gradient(180deg, ${PAPER} 0%, #EDE2CC 100%)`,
                  borderRadius: 12,
                  borderLeft: isMine ? `4px solid ${HIS_COLOR}` : isTheirs ? `4px solid ${HER_COLOR}` : "4px solid transparent",
                  padding: "14px 16px",
                }}
              >
                <p dir="rtl" lang="ar" style={{ color: "#2A1620", fontFamily: "'Amiri', serif", fontSize: 21, lineHeight: 2, textAlign: "right" }}>
                  {a.ar}
                </p>
                <p style={{ color: "#5A4632", fontFamily: "'Fraunces', serif", fontSize: 13.5, lineHeight: 1.5, marginTop: 8 }}>
                  {a.en}
                </p>
                <div className="flex items-center justify-between" style={{ marginTop: 8 }}>
                  <span style={{ color: "#8C7355", fontSize: 10.5, fontWeight: 700 }}>
                    {openSurah}:{a.n}
                  </span>
                  <button
                    onClick={() => setMark(openSurah, a.n)}
                    aria-label={`Stop at ayah ${a.n}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                      color: isMine ? HIS_COLOR : "#8C7355",
                      fontSize: 10.5,
                      fontWeight: 700,
                    }}
                  >
                    <BookmarkCheck size={12} /> {isMine ? "You're here" : "Stopped here"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ---------- the index ----------
  return (
    <div className="w-full flex flex-col items-center">
      <p style={{ color: TOKENS.muted, fontSize: 13, textAlign: "center" }} className="mb-1">
        Read the Qur'an
      </p>
      <p style={{ color: TOKENS.muted, fontSize: 11.5, textAlign: "center" }} className="mb-4">
        {mine ? `You're at ${surahOf(mine.surah).en} ${mine.surah}:${mine.ayah}` : "Pick a surah to begin"}
      </p>

      <ProgressBar marks={marks} />
      <div className="flex items-center gap-4 mb-5" style={{ fontSize: 10.5 }}>
        <span style={{ color: HIS_COLOR }}>
          {isOwner ? "You" : "Javanshir"} {Math.round((position(marks[HIM]) / TOTAL_AYAHS) * 100)}%
        </span>
        <span style={{ color: HER_COLOR }}>
          {isOwner ? "Ganira" : "You"} {Math.round((position(marks[HER]) / TOTAL_AYAHS) * 100)}%
        </span>
      </div>

      {mine && (
        <motion.button
          onClick={() => setOpenSurah(mine.surah)}
          whileTap={{ scale: 0.98 }}
          style={{ background: TOKENS.gold, color: TOKENS.bgDeep, fontWeight: 700 }}
          className="w-full h-11 rounded-full flex items-center justify-center gap-2 mb-5"
        >
          Continue from {surahOf(mine.surah).en} {mine.surah}:{mine.ayah}
        </motion.button>
      )}

      <div className="w-full flex flex-col gap-1.5">
        {SURAHS.map((s) => {
          const mineHere = mine && mine.surah === s.n;
          const theirsHere = theirs && theirs.surah === s.n;
          return (
            <motion.button
              key={s.n}
              onClick={() => setOpenSurah(s.n)}
              whileTap={{ scale: 0.99 }}
              style={{
                width: "100%",
                background: `linear-gradient(160deg, ${TOKENS.bgCard}, ${TOKENS.bgCardEdge})`,
                border: `1px solid ${mineHere ? `${HIS_COLOR}66` : theirsHere ? `${HER_COLOR}66` : TOKENS.line}`,
                borderRadius: 12,
                padding: "9px 13px",
                display: "flex",
                alignItems: "center",
                gap: 11,
              }}
            >
              <span style={{ color: TOKENS.muted, fontSize: 11, fontWeight: 700, width: 24, flexShrink: 0, textAlign: "left" }}>
                {s.n}
              </span>
              <span style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
                <span style={{ color: TOKENS.cream, fontFamily: "'Fraunces', serif", fontSize: 14 }}>{s.en}</span>
                <span style={{ color: TOKENS.muted, fontSize: 11, marginLeft: 7 }}>{s.ayahs}</span>
              </span>
              {mineHere && <span style={{ width: 7, height: 7, borderRadius: 9999, background: HIS_COLOR }} />}
              {theirsHere && <span style={{ width: 7, height: 7, borderRadius: 9999, background: HER_COLOR }} />}
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
