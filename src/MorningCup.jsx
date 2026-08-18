import React, { useState, useMemo } from "react";
import { RefreshCw, Sun } from "lucide-react";

const TOKENS = {
  bgDeep: "#170D11",
  bgCard: "#2A1620",
  bgCardEdge: "#3A1E2B",
  cream: "#F3E7DA",
  muted: "#B99A8E",
  line: "rgba(243,231,218,0.14)",
  gold: "#D8A857",
};

const MESSAGES = [
  { cat: "Rəsmi bildiriş", text: "Rəsmi bildiriş: bu gün yaxşı keçmək məcburiyyətindədir." },
  { cat: "Elmi fakt", text: "Elmi fakt: səhər qəhvəsi olmadan verilən qərarlar rəsmən etibarsız sayılır." },
  { cat: "Xəbərdarlıq", text: "Xəbərdarlıq: bu gün gülməli bir şeylə qarşılaşma ehtimalı yüksəkdir." },
  { cat: "Proqnoz", text: "Bugünkü proqnoz: 80% yaxşı əhval, 20% qəhvə ehtiyacı." },
  { cat: "Elmi fakt", text: "Araşdırma göstərir: səhər gülümsəyənlərin günü daha tez keçir (mənbə: bu fincan)." },
  { cat: "Rəsmi bildiriş", text: "Bildiriş: bu gün üçün stress kvotası doldurulub, artıq qəbul edilmir." },
  { cat: "Proqnoz", text: "Bugünkü hava: aydın, əhval-ruhiyyə: sabit yüksək )" },
  { cat: "Xəbərdarlıq", text: "Diqqət: bu fincanı boşaltmadan günə başlamaq tövsiyə olunmur." },
];

const STEPS = 6;

function pickMessage(current) {
  if (!current) return MESSAGES[Math.floor(Math.random() * MESSAGES.length)];
  const rest = MESSAGES.filter((m) => m !== current);
  return rest[Math.floor(Math.random() * rest.length)];
}

function buildSteam() {
  return [
    { left: 42, delay: 0, dur: 2.6 },
    { left: 50, delay: 0.5, dur: 3 },
    { left: 58, delay: 1, dur: 2.8 },
  ];
}

export default function MorningCup() {
  const [fill, setFill] = useState(0);
  const [message, setMessage] = useState(() => pickMessage());
  const steam = useMemo(() => buildSteam(), []);

  const done = fill >= STEPS;
  const pct = (fill / STEPS) * 100;

  const pour = () => {
    if (done) return;
    setFill((f) => f + 1);
  };

  const again = () => {
    setMessage((m) => pickMessage(m));
    setFill(0);
  };

  return (
    <div
      style={{ background: TOKENS.bgDeep, minHeight: "100vh", fontFamily: "'Manrope', sans-serif" }}
      className="w-full flex flex-col items-center px-4 py-8"
    >
      <style>{`
        @keyframes cf-steam {
          0% { transform: translateY(0) scaleX(1); opacity: 0; }
          25% { opacity: 0.55; }
          100% { transform: translateY(-46px) scaleX(1.6); opacity: 0; }
        }
        .cf-steam { animation-name: cf-steam; animation-timing-function: ease-out; animation-iteration-count: infinite; }
        @keyframes cf-fade { 0% { opacity: 0; transform: translateY(6px); } 100% { opacity: 1; transform: translateY(0); } }
        .cf-fade { animation: cf-fade 0.4s ease-out; }
        .cf-cup:active { transform: scale(0.97); }
        @media (prefers-reduced-motion: reduce) {
          .cf-steam, .cf-fade { animation: none; }
        }
      `}</style>

      <div className="w-full max-w-sm flex flex-col items-center">
        <div className="flex items-center gap-2 mb-1">
          <Sun size={15} color={TOKENS.gold} />
          <span style={{ color: TOKENS.muted, fontSize: 12, letterSpacing: 1.5, textTransform: "uppercase" }}>Sabahın xeyir</span>
        </div>
        <h1
          style={{ color: TOKENS.cream, fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 26, textAlign: "center" }}
          className="mb-1"
        >
          Səhər Fincanı
        </h1>
        <p style={{ color: TOKENS.muted, fontSize: 13.5, textAlign: "center" }} className="mb-8">
          {done ? "Fincan hazırdır )" : "Fincanı doldurmaq üçün toxun"}
        </p>

        {/* Cup */}
        <div style={{ position: "relative", width: 200, height: 210, marginBottom: 26 }}>
          {/* Steam */}
          {done && (
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 60, pointerEvents: "none" }}>
              {steam.map((s, i) => (
                <span
                  key={i}
                  className="cf-steam"
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: `${s.left}%`,
                    width: 8,
                    height: 26,
                    borderRadius: 9999,
                    background: "rgba(243,231,218,0.5)",
                    filter: "blur(4px)",
                    animationDuration: `${s.dur}s`,
                    animationDelay: `${s.delay}s`,
                  }}
                />
              ))}
            </div>
          )}

          {/* Handle */}
          <div
            style={{
              position: "absolute",
              right: 2,
              top: 96,
              width: 44,
              height: 54,
              border: `9px solid ${TOKENS.cream}`,
              borderLeft: "none",
              borderRadius: "0 9999px 9999px 0",
              opacity: 0.9,
            }}
          />

          {/* Cup body */}
          <button
            onClick={pour}
            disabled={done}
            aria-label={done ? "Fincan doludur" : `Fincanı doldur, ${fill} / ${STEPS}`}
            className="cf-cup"
            style={{
              position: "absolute",
              left: 22,
              top: 66,
              width: 132,
              height: 128,
              borderRadius: "14px 14px 46px 46px",
              background: TOKENS.cream,
              overflow: "hidden",
              boxShadow: "0 14px 30px rgba(0,0,0,0.45)",
              transition: "transform 0.1s",
              cursor: done ? "default" : "pointer",
              padding: 0,
              border: "none",
            }}
          >
            {/* Coffee */}
            <div
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                bottom: 0,
                height: `${pct * 0.86}%`,
                background: "linear-gradient(180deg,#6B3E22,#3A1F12)",
                transition: "height 0.35s cubic-bezier(.4,1.2,.5,1)",
              }}
            >
              <div
                style={{ position: "absolute", top: -3, left: 0, right: 0, height: 6, background: "rgba(200,150,100,0.45)", borderRadius: "50%" }}
              />
            </div>
            {/* Inner shading */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "linear-gradient(100deg, rgba(0,0,0,0.06), transparent 45%, rgba(0,0,0,0.09))",
                pointerEvents: "none",
              }}
            />
          </button>

          {/* Saucer */}
          <div
            style={{
              position: "absolute",
              left: 4,
              bottom: 0,
              width: 176,
              height: 16,
              borderRadius: "50%",
              background: TOKENS.cream,
              opacity: 0.85,
              boxShadow: "0 8px 18px rgba(0,0,0,0.4)",
            }}
          />
        </div>

        {/* Fill dots */}
        {!done && (
          <div className="flex gap-1.5 mb-2">
            {Array.from({ length: STEPS }).map((_, i) => (
              <span key={i} style={{ width: 7, height: 7, borderRadius: 9999, background: i < fill ? TOKENS.gold : TOKENS.line }} />
            ))}
          </div>
        )}

        {/* Message */}
        {done && (
          <div className="cf-fade w-full">
            <div
              style={{
                background: `linear-gradient(160deg, ${TOKENS.bgCard}, ${TOKENS.bgCardEdge})`,
                border: `1px solid ${TOKENS.gold}55`,
                borderRadius: 18,
                padding: "20px 20px",
                marginBottom: 16,
              }}
            >
              <span style={{ color: TOKENS.gold, fontSize: 10.5, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase" }}>
                {message.cat}
              </span>
              <p style={{ color: TOKENS.cream, fontFamily: "'Fraunces', serif", fontSize: 18, lineHeight: 1.45, marginTop: 8 }}>
                {message.text}
              </p>
            </div>
            <button
              onClick={again}
              style={{ background: TOKENS.gold, color: TOKENS.bgDeep }}
              className="w-full h-11 rounded-full flex items-center justify-center gap-2 text-sm font-bold cursor-pointer"
            >
              <RefreshCw size={15} /> Bir fincan da
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
