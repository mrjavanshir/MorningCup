import React, { useState } from "react";
import { Bird, RefreshCw, Rose } from "lucide-react";
import { TOKENS, ORIGAMI_MESSAGES } from "./messages.js";

const CLIP = {
  square: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
  rectHalf: "polygon(0% 0%, 100% 0%, 100% 50%, 0% 50%)",
  triangle: "polygon(0% 0%, 100% 0%, 0% 100%)",
  smallTriangle: "polygon(0% 0%, 50% 0%, 0% 50%)",
  pentagonPoint: "polygon(0% 0%, 100% 0%, 100% 40%, 50% 100%, 0% 40%)",
  house: "polygon(0% 40%, 50% 0%, 100% 40%, 100% 100%, 0% 100%)",
  diamond: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
  kite: "polygon(50% 0%, 85% 50%, 50% 100%, 15% 50%)",
};

const GUIDES = {
  diagonalTLBR: { lines: [[0, 0, 100, 100]], arrow: { top: 50, left: 50, rotate: 45 } },
  diagonalTRBL: { lines: [[100, 0, 0, 100]], arrow: { top: 50, left: 50, rotate: -45 } },
  horizontal: { lines: [[0, 50, 100, 50]], arrow: { top: 50, left: 50, rotate: 90 } },
  vertical: { lines: [[50, 0, 50, 100]], arrow: { top: 50, left: 50, rotate: 0 } },
  cornersIn: { lines: [[0, 0, 50, 50], [100, 0, 50, 50]], arrow: { top: 25, left: 50, rotate: 90 } },
};

const MODELS = [
  {
    id: "flower",
    icon: Rose,
    steps: [
      { caption: "Fold in half diagonally", guide: "diagonalTLBR", clip: CLIP.triangle },
      { caption: "Fold the corners up to the top", guide: "cornersIn", clip: CLIP.pentagonPoint },
      { caption: "Curl the petals outward", guide: "vertical", clip: CLIP.diamond },
      { caption: "Twist the base to open the bloom", guide: "horizontal", clip: CLIP.kite },
    ],
  },
  {
    id: "swan",
    icon: Bird,
    steps: [
      { caption: "Fold in half diagonally", guide: "diagonalTLBR", clip: CLIP.triangle },
      { caption: "Fold the sides in to the center", guide: "cornersIn", clip: CLIP.house },
      { caption: "Fold up to form the neck", guide: "vertical", clip: CLIP.diamond },
      { caption: "Curve the neck and shape the tail", guide: "diagonalTRBL", clip: CLIP.kite },
    ],
  },
];

function pickModel() {
  return MODELS[Math.floor(Math.random() * MODELS.length)];
}

function FoldGuide({ guideKey }) {
  const guide = GUIDES[guideKey];
  return (
    <svg viewBox="0 0 100 100" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
      {guide.lines.map(([x1, y1, x2, y2], i) => (
        <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={TOKENS.gold} strokeWidth="1.2" strokeDasharray="4 3" opacity="0.75" />
      ))}
      <polygon
        points="-5,-4 5,0 -5,4"
        fill={TOKENS.gold}
        opacity="0.85"
        transform={`translate(${guide.arrow.left} ${guide.arrow.top}) rotate(${guide.arrow.rotate})`}
      />
    </svg>
  );
}

export default function OrigamiGame() {
  const [model, setModel] = useState(pickModel);
  const [step, setStep] = useState(0);
  const [folded, setFolded] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [messageIndex, setMessageIndex] = useState(() => Math.floor(Math.random() * ORIGAMI_MESSAGES.length));

  const totalSteps = model.steps.length;

  const fold = () => {
    if (step >= totalSteps) return;
    const next = step + 1;
    setStep(next);
    if (next === totalSteps) setTimeout(() => setFolded(true), 350);
  };

  const foldAgain = () => {
    setModel(pickModel());
    setStep(0);
    setFolded(false);
    setRevealed(false);
    setMessageIndex((i) => {
      if (ORIGAMI_MESSAGES.length <= 1) return i;
      let next = Math.floor(Math.random() * ORIGAMI_MESSAGES.length);
      while (next === i) next = Math.floor(Math.random() * ORIGAMI_MESSAGES.length);
      return next;
    });
  };

  const message = ORIGAMI_MESSAGES[messageIndex];
  const Icon = model.icon;
  const currentClip = step === 0 ? CLIP.square : model.steps[step - 1].clip;
  const nextGuide = step < totalSteps ? model.steps[step].guide : null;

  if (revealed) {
    return (
      <div className="w-full flex flex-col items-center">
        <div className="og-unfold-in flex flex-col items-center w-full">
          <div className="flex items-center gap-2 mb-3">
            <Icon size={16} color={TOKENS.gold} />
            <span style={{ color: TOKENS.gold, fontSize: 12, fontWeight: 700 }}>{message.cat}</span>
          </div>
          <div
            style={{
              background: `linear-gradient(160deg, ${TOKENS.bgCard}, ${TOKENS.bgCardEdge})`,
              border: `1px solid ${TOKENS.gold}55`,
              borderRadius: 16,
              padding: "18px 20px",
              marginBottom: 12,
            }}
            className="w-full"
          >
            <p style={{ color: TOKENS.cream, fontFamily: "'Fraunces', serif", fontSize: 17, lineHeight: 1.45 }}>{message.text}</p>
          </div>
          <div style={{ border: `1px dashed ${TOKENS.line}`, borderRadius: 12, padding: "10px 14px", marginBottom: 16 }} className="w-full">
            <span style={{ color: TOKENS.gold, fontSize: 10.5, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>Try this</span>
            <p style={{ color: TOKENS.muted, fontSize: 12.5, marginTop: 4 }}>
              Fold a real one — it's oddly calming, and you'll have something to show for it after.
            </p>
          </div>
        </div>
        <button
          onClick={foldAgain}
          style={{ background: TOKENS.gold, color: TOKENS.bgDeep, fontWeight: 700 }}
          className="w-full h-12 rounded-full flex items-center justify-center gap-2"
        >
          <RefreshCw size={15} /> Fold another
        </button>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-center">
      <p style={{ color: TOKENS.muted, fontSize: 13, textAlign: "center" }} className="mb-1">
        {folded ? "All folded — tap to unfold" : nextGuide ? model.steps[step].caption : ""}
      </p>
      <p style={{ color: TOKENS.muted, fontSize: 11.5, textAlign: "center" }} className="mb-6">
        {folded ? " " : `${step} / ${totalSteps} folds`}
      </p>

      <button
        onClick={folded ? () => setRevealed(true) : fold}
        aria-label={folded ? "Unfold" : "Fold"}
        style={{
          width: 180, height: 180, position: "relative", display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >
        {!folded ? (
          <div style={{ position: "relative", width: "100%", height: "100%" }}>
            <div
              style={{
                width: "100%", height: "100%",
                background: "linear-gradient(160deg, #F0E6D2, #E4D5B8)",
                boxShadow: "0 10px 26px rgba(0,0,0,0.35)",
                clipPath: currentClip,
                transition: "clip-path 0.4s ease",
              }}
            />
            {nextGuide && <FoldGuide guideKey={nextGuide} />}
          </div>
        ) : (
          <Icon size={72} color={TOKENS.gold} className="og-crane-pop" />
        )}
      </button>

      <p style={{ color: TOKENS.muted, fontSize: 12 }} className="mt-4">
        {folded ? "Tap to see what's inside" : "Tap the paper to fold it"}
      </p>
    </div>
  );
}
