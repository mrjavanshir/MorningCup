import React, { useState } from "react";
import { Check, Link2, Plus, Sparkles, X } from "lucide-react";
import { TOKENS } from "./messages.js";

const PARTY_A = "Javanshir";
const PARTY_B = "Ganira";
const MAX_ITEMS = 8;

function encodeList(list) {
  return btoa(unescape(encodeURIComponent(JSON.stringify(list))));
}

function decodeList(raw) {
  try {
    const val = JSON.parse(decodeURIComponent(escape(atob(raw))));
    if (!Array.isArray(val) || val.length === 0 || val.some((s) => typeof s !== "string")) return null;
    return val;
  } catch {
    return null;
  }
}

function readParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    a: params.has("a") ? decodeList(params.get("a")) : null,
    b: params.has("b") ? decodeList(params.get("b")) : null,
  };
}

function buildBoard(listA, listB) {
  const norm = (s) => s.trim().toLowerCase();
  const normA = listA.map(norm);
  const normB = listB.map(norm);
  const seen = new Set();
  const rows = [];

  listA.forEach((item, i) => {
    const key = normA[i];
    if (seen.has(key)) return;
    seen.add(key);
    rows.push({ text: item, from: normB.includes(key) ? "both" : "a" });
  });
  listB.forEach((item, i) => {
    const key = normB[i];
    if (seen.has(key)) return;
    seen.add(key);
    rows.push({ text: item, from: "b" });
  });

  rows.sort((x, y) => (x.from === "both") === (y.from === "both") ? 0 : x.from === "both" ? -1 : 1);
  return rows;
}

function ItemInput({ items, setItems, text, setText }) {
  const addItem = () => {
    const t = text.trim();
    if (!t || items.length >= MAX_ITEMS) return;
    setItems((prev) => [...prev, t]);
    setText("");
  };
  const removeItem = (i) => setItems((prev) => prev.filter((_, idx) => idx !== i));

  return (
    <>
      {items.length > 0 && (
        <div className="w-full flex flex-col gap-2 mb-3">
          {items.map((item, i) => (
            <div
              key={i}
              style={{
                background: `linear-gradient(160deg, ${TOKENS.bgCard}, ${TOKENS.bgCardEdge})`,
                border: `1px solid ${TOKENS.line}`,
                borderRadius: 10,
                padding: "8px 12px",
              }}
              className="w-full flex items-center justify-between gap-2"
            >
              <span style={{ color: TOKENS.cream, fontFamily: "'Fraunces', serif", fontSize: 13.5 }}>{item}</span>
              <button onClick={() => removeItem(i)} aria-label="Remove" style={{ color: TOKENS.muted, flexShrink: 0 }}>
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {items.length < MAX_ITEMS && (
        <div className="flex gap-2 w-full mb-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addItem()}
            placeholder="Something you'd want to do together..."
            style={{
              flex: 1, background: TOKENS.bgCard, border: `1px solid ${TOKENS.line}`, borderRadius: 8,
              color: TOKENS.cream, fontFamily: "'Manrope', sans-serif", fontSize: 12.5, padding: "8px 10px",
            }}
          />
          <button
            onClick={addItem}
            disabled={!text.trim()}
            aria-label="Add item"
            style={{
              flexShrink: 0, width: 34, height: 34, borderRadius: 8, border: `1px solid ${TOKENS.line}`,
              color: TOKENS.gold, display: "flex", alignItems: "center", justifyContent: "center",
              opacity: text.trim() ? 1 : 0.4,
            }}
          >
            <Plus size={16} />
          </button>
        </div>
      )}
      <p style={{ color: TOKENS.muted, fontSize: 11 }} className="mb-5">
        {items.length} / {MAX_ITEMS}
      </p>
    </>
  );
}

function Board({ rows }) {
  return (
    <div className="w-full flex flex-col gap-2 mb-5">
      {rows.map((row, i) => (
        <div
          key={i}
          style={{
            background: `linear-gradient(160deg, ${TOKENS.bgCard}, ${TOKENS.bgCardEdge})`,
            border: `1px solid ${row.from === "both" ? TOKENS.gold + "55" : TOKENS.line}`,
            borderRadius: 12,
            padding: "10px 14px",
          }}
          className="w-full flex items-center justify-between gap-2"
        >
          <span style={{ color: TOKENS.cream, fontFamily: "'Fraunces', serif", fontSize: 13.5 }}>{row.text}</span>
          {row.from === "both" ? (
            <span style={{ color: TOKENS.gold, fontSize: 10.5, fontWeight: 700, flexShrink: 0, display: "flex", alignItems: "center", gap: 3 }}>
              <Sparkles size={12} /> Both
            </span>
          ) : (
            <span style={{ color: TOKENS.muted, fontSize: 10.5, flexShrink: 0 }}>{row.from === "a" ? PARTY_A : PARTY_B}</span>
          )}
        </div>
      ))}
    </div>
  );
}

export default function PlansGame() {
  const [{ a: paramA, b: paramB }] = useState(readParams);
  const isReveal = paramA !== null && paramB !== null;
  const isCompareMode = paramA !== null && paramB === null;

  const [items, setItems] = useState([]);
  const [text, setText] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyLink = async (query) => {
    const link = `${window.location.origin}${import.meta.env.BASE_URL}games/plans?${query}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable */
    }
  };

  if (isReveal) {
    const sharedCount = buildBoard(paramA, paramB).filter((r) => r.from === "both").length;
    return (
      <div className="w-full flex flex-col items-center">
        <p style={{ color: TOKENS.muted, fontSize: 13, textAlign: "center" }} className="mb-2">
          Your future plans board
        </p>
        {sharedCount > 0 && (
          <p style={{ color: TOKENS.gold, fontFamily: "'Fraunces', serif", fontSize: 16, fontWeight: 600, textAlign: "center" }} className="mb-6">
            {sharedCount} thing{sharedCount > 1 ? "s" : ""} you both want, without even planning it
          </p>
        )}
        <Board rows={buildBoard(paramA, paramB)} />
      </div>
    );
  }

  if (submitted && isCompareMode) {
    const rows = buildBoard(paramA, items);
    const sharedCount = rows.filter((r) => r.from === "both").length;
    return (
      <div className="w-full flex flex-col items-center">
        <p style={{ color: TOKENS.muted, fontSize: 13, textAlign: "center" }} className="mb-2">
          Your future plans board
        </p>
        {sharedCount > 0 && (
          <p style={{ color: TOKENS.gold, fontFamily: "'Fraunces', serif", fontSize: 16, fontWeight: 600, textAlign: "center" }} className="mb-6">
            {sharedCount} thing{sharedCount > 1 ? "s" : ""} you both want, without even planning it
          </p>
        )}
        <Board rows={rows} />
        <button
          onClick={() => copyLink(`a=${encodeList(paramA)}&b=${encodeList(items)}`)}
          style={{ background: TOKENS.gold, color: TOKENS.bgDeep, fontWeight: 700 }}
          className="w-full h-12 rounded-full flex items-center justify-center gap-2"
        >
          {copied ? <Check size={17} /> : <Link2 size={17} />} {copied ? "Link copied" : "Copy result link to send back"}
        </button>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="w-full flex flex-col items-center">
        <p style={{ color: TOKENS.muted, fontSize: 13, textAlign: "center" }} className="mb-6">
          Your list is locked in — send the link to see what overlaps.
        </p>
        <button
          onClick={() => copyLink(`a=${encodeList(items)}`)}
          style={{ background: TOKENS.gold, color: TOKENS.bgDeep, fontWeight: 700 }}
          className="w-full h-12 rounded-full flex items-center justify-center gap-2"
        >
          {copied ? <Check size={17} /> : <Link2 size={17} />} {copied ? "Link copied" : "Copy link to send"}
        </button>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-center">
      <p style={{ color: TOKENS.muted, fontSize: 13, textAlign: "center" }} className="mb-1">
        {isCompareMode ? `${PARTY_A} already made a list — now make yours` : "List a few things you'd want to do together"}
      </p>
      <p style={{ color: TOKENS.muted, fontSize: 11.5, textAlign: "center" }} className="mb-5">
        {isCompareMode ? "You won't see his list until you're done" : "Trips, restaurants, whatever comes to mind"}
      </p>

      <ItemInput items={items} setItems={setItems} text={text} setText={setText} />

      <button
        onClick={() => setSubmitted(true)}
        disabled={items.length === 0}
        style={{ background: TOKENS.gold, color: TOKENS.bgDeep, fontWeight: 700, opacity: items.length > 0 ? 1 : 0.5 }}
        className="w-full h-12 rounded-full flex items-center justify-center gap-2"
      >
        I'm done ({items.length})
      </button>
    </div>
  );
}
