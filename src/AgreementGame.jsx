import React, { useState } from "react";
import { Stamp, RotateCcw, Check, Link2, Plus } from "lucide-react";
import { TOKENS } from "./messages.js";

const PARTY_A = "Javanshir";
const PARTY_B = "Ganira";

const DEFAULT_CLAUSES = [
  { id: "c1", text: "From this day forward, formal titles are no longer required between the parties.", on: true },
  { id: "c2", text: "The titles 'Mr.' and 'Ms.' are hereby retired for good.", on: true },
  { id: "c3", text: "This agreement binds no one — it only offers )", on: true },
  { id: "c4", text: "Both parties reserve the right to joke about late replies.", on: true },
  { id: "c5", text: "This document must cause a smile before it takes effect.", on: true },
  { id: "c6", text: "Voice messages sent while multitasking are accepted without judgment.", on: true },
  { id: "c8", text: "Both parties are encouraged to ask at least one new personal question per conversation.", on: true },
  { id: "c9", text: "Both parties commit to learning one new thing about the other, at a pace that feels natural.", on: true },
  { id: "c10", text: "Curiosity about the other party's day, thoughts, and opinions is always welcome, never intrusive.", on: true },
  { id: "c7", text: "This agreement renews automatically each morning, no signature required.", on: true },
];

function todayLabel() {
  return new Date().toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" });
}

function encodeState(clauses) {
  const json = JSON.stringify(clauses.map((c) => [c.text, c.on ? 1 : 0]));
  return btoa(unescape(encodeURIComponent(json)));
}

function decodeStateFromURL() {
  const raw = new URLSearchParams(window.location.search).get("d");
  if (raw === null) return null;
  try {
    const json = decodeURIComponent(escape(atob(raw)));
    return JSON.parse(json).map(([text, on], i) => ({ id: `v${i}`, text, on: !!on }));
  } catch {
    return null;
  }
}

export default function AgreementGame() {
  const [viewClauses] = useState(decodeStateFromURL);
  const isViewer = viewClauses !== null;

  const [clauses, setClauses] = useState(() => (isViewer ? viewClauses : DEFAULT_CLAUSES));
  const [newClause, setNewClause] = useState("");
  const [stamped, setStamped] = useState(isViewer);
  const [stamping, setStamping] = useState(false);
  const [copied, setCopied] = useState(false);

  const toggleClause = (id) => {
    if (stamped) return;
    setClauses((cs) => cs.map((c) => (c.id === id ? { ...c, on: !c.on } : c)));
  };

  const addClause = () => {
    const text = newClause.trim();
    if (!text) return;
    setClauses((cs) => [...cs, { id: `custom-${Date.now()}`, text, on: true }]);
    setNewClause("");
  };

  const activeClauses = clauses.filter((c) => c.on);

  const doStamp = () => {
    if (activeClauses.length === 0) return;
    setStamping(true);
    setTimeout(() => {
      setStamped(true);
      setStamping(false);
    }, 500);
  };

  const editAgain = () => {
    setStamped(false);
  };

  const copyResultLink = async () => {
    const link = `${window.location.origin}${import.meta.env.BASE_URL}games/agreement?d=${encodeState(activeClauses)}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <div className="w-full flex flex-col items-center">
      <p style={{ color: TOKENS.muted, fontSize: 13, textAlign: "center" }} className="mb-6">
        {isViewer ? "Here's what Ganira confirmed" : "Officially retiring the formalities, one clause at a time"}
      </p>

      <div
        style={{
          width: "100%",
          background: "#F0E6D2",
          borderRadius: 14,
          padding: "22px 20px",
          position: "relative",
          boxShadow: "0 16px 40px rgba(0,0,0,0.45)",
          overflow: "hidden",
        }}
      >
        <div style={{ position: "absolute", inset: 7, border: "1.5px solid #8C6A3A55", borderRadius: 8, pointerEvents: "none" }} />

        <div className="relative">
          <p style={{ color: "#8C6A3A", fontSize: 10.5, fontWeight: 700, letterSpacing: 2, textAlign: "center", textTransform: "uppercase" }}>
            Official Agreement
          </p>
          <h2 style={{ color: "#2A1620", fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 19, textAlign: "center", marginTop: 4, marginBottom: 2 }}>
            Notice of Waived Formalities
          </h2>
          <p style={{ color: "#5A4632", fontSize: 11, textAlign: "center", marginBottom: 16 }}>{todayLabel()}</p>

          <div className="flex gap-2 mb-4">
            <div style={{ flex: 1, borderBottom: "1px solid #8C6A3A66", padding: "4px 2px", textAlign: "center" }}>
              <p style={{ color: "#8C6A3A", fontSize: 9.5, letterSpacing: 1, textTransform: "uppercase", marginBottom: 2 }}>Party 1</p>
              <p style={{ color: "#2A1620", fontFamily: "'Fraunces', serif", fontSize: 14 }}>{PARTY_A}</p>
            </div>
            <div style={{ flex: 1, borderBottom: "1px solid #8C6A3A66", padding: "4px 2px", textAlign: "center" }}>
              <p style={{ color: "#8C6A3A", fontSize: 9.5, letterSpacing: 1, textTransform: "uppercase", marginBottom: 2 }}>Party 2</p>
              <p style={{ color: "#2A1620", fontFamily: "'Fraunces', serif", fontSize: 14 }}>{PARTY_B}</p>
            </div>
          </div>

          <div className="flex flex-col gap-2 mb-4">
            {clauses.map((c, i) => (
              <button
                key={c.id}
                onClick={() => toggleClause(c.id)}
                disabled={stamped}
                style={{ display: "flex", alignItems: "flex-start", gap: 8, textAlign: "left", opacity: c.on ? 1 : 0.35 }}
              >
                <span
                  style={{
                    flexShrink: 0, marginTop: 2, width: 15, height: 15, borderRadius: 4,
                    border: "1.5px solid #8C6A3A", background: c.on ? "#8C6A3A" : "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  {c.on && <Check size={10} color="#F0E6D2" />}
                </span>
                <span style={{ color: "#2A1620", fontFamily: "'Fraunces', serif", fontSize: 13.5, lineHeight: 1.4 }}>
                  Clause {i + 1}: {c.text}
                </span>
              </button>
            ))}
          </div>

          {!stamped && (
            <div className="flex gap-2 mb-4">
              <input
                value={newClause}
                onChange={(e) => setNewClause(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addClause()}
                placeholder="Add your own clause..."
                style={{
                  flex: 1, background: "transparent", border: "1px solid #8C6A3A66", borderRadius: 8,
                  color: "#2A1620", fontFamily: "'Manrope', sans-serif", fontSize: 12.5, padding: "8px 10px",
                }}
              />
              <button
                onClick={addClause}
                disabled={!newClause.trim()}
                aria-label="Add clause"
                style={{
                  flexShrink: 0, width: 34, height: 34, borderRadius: 8, border: "1px solid #8C6A3A66",
                  color: "#8C6A3A", display: "flex", alignItems: "center", justifyContent: "center",
                  opacity: newClause.trim() ? 1 : 0.4,
                }}
              >
                <Plus size={16} />
              </button>
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", borderTop: "1px solid #8C6A3A66", paddingTop: 10 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
              <span style={{ fontFamily: "'Dancing Script', cursive", fontSize: 22, color: "#8C6A3A" }}>{PARTY_A}</span>
              <span
                title="Already agreed"
                style={{
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  width: 18, height: 18, borderRadius: "9999px", border: "1.5px solid #A81E3D",
                  color: "#A81E3D", transform: "rotate(-12deg)", flexShrink: 0,
                }}
              >
                <Check size={10} strokeWidth={3} />
              </span>
            </span>
            <span style={{ fontFamily: "'Dancing Script', cursive", fontSize: 22, color: "#8C6A3A" }}>{PARTY_B}</span>
          </div>

          {stamped && (
            <div
              className="fs-stamp-in"
              style={{
                position: "absolute", bottom: -6, right: -6, width: 90, height: 90,
                borderRadius: "9999px", border: "3px solid #A81E3D", display: "flex",
                alignItems: "center", justifyContent: "center", background: "rgba(168,30,61,0.06)",
              }}
            >
              <span style={{ color: "#A81E3D", fontFamily: "'Manrope', sans-serif", fontWeight: 800, fontSize: 11, textAlign: "center", lineHeight: 1.3, letterSpacing: 0.5 }}>
                OFFICIALLY<br />APPROVED
              </span>
            </div>
          )}
        </div>
      </div>

      {activeClauses.length === 0 && !stamped && (
        <p style={{ color: "#C4184F", fontSize: 12, marginTop: 8 }}>At least one clause must be selected.</p>
      )}

      <div className="mt-5 w-full">
        {isViewer ? (
          <p style={{ color: TOKENS.muted, fontSize: 12, textAlign: "center" }}>This is what she agreed to.</p>
        ) : !stamped ? (
          <button
            onClick={doStamp}
            disabled={activeClauses.length === 0 || stamping}
            style={{
              background: TOKENS.gold, color: TOKENS.bgDeep, fontWeight: 700,
              opacity: activeClauses.length > 0 ? 1 : 0.5,
            }}
            className="w-full h-12 rounded-full flex items-center justify-center gap-2"
          >
            <Stamp size={17} /> Stamp &amp; Confirm
          </button>
        ) : (
          <>
            <button
              onClick={copyResultLink}
              style={{ background: TOKENS.gold, color: TOKENS.bgDeep, fontWeight: 700 }}
              className="w-full h-12 rounded-full flex items-center justify-center gap-2 mb-3"
            >
              {copied ? <Check size={17} /> : <Link2 size={17} />} {copied ? "Link copied" : "Copy result link to send"}
            </button>
            <button
              onClick={editAgain}
              style={{ color: TOKENS.muted, fontSize: 12.5, display: "flex", alignItems: "center", gap: 5, margin: "0 auto" }}
            >
              <RotateCcw size={13} /> Edit again
            </button>
          </>
        )}
      </div>
    </div>
  );
}
