/**
 * Renders a verse as a shareable image.
 *
 * Canvas draws whatever fonts happen to be loaded, so the webfonts are awaited
 * explicitly — otherwise the Arabic silently falls back to a system face and
 * the card looks nothing like the paper in the app.
 */

const W = 1080;
const H = 1350;
const PAD = 96;
const PAPER_TOP = "#F6EEDE";
const PAPER_BOTTOM = "#EDE2CC";
const INK = "#2A1620";
const MUTED = "#8C7355";

function wrap(ctx, text, maxWidth) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (ctx.measureText(candidate).width <= maxWidth || !line) {
      line = candidate;
    } else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/**
 * Long ayahs (Al-Baqarah 2:286 is ~550 characters) would overflow a fixed
 * layout, so the type shrinks a step at a time until the whole card fits.
 */
function fit(ctx, verse, maxWidth, maxHeight) {
  for (let scale = 1; scale >= 0.55; scale -= 0.05) {
    const arSize = Math.round(52 * scale);
    const enSize = Math.round(34 * scale);
    const arLead = arSize * 1.85;
    const enLead = enSize * 1.5;

    ctx.font = `400 ${arSize}px Amiri, serif`;
    const arLines = wrap(ctx, verse.arabic, maxWidth);
    ctx.font = `600 ${enSize}px Fraunces, serif`;
    const enLines = wrap(ctx, verse.text, maxWidth);

    const total = arLines.length * arLead + 64 + enLines.length * enLead + 92;
    if (total <= maxHeight) return { arSize, enSize, arLead, enLead, arLines, enLines, total };
  }
  // Nothing fit even at the smallest step: return the smallest and let it clip.
  const arSize = 28;
  const enSize = 19;
  ctx.font = `400 ${arSize}px Amiri, serif`;
  const arLines = wrap(ctx, verse.arabic, maxWidth);
  ctx.font = `600 ${enSize}px Fraunces, serif`;
  const enLines = wrap(ctx, verse.text, maxWidth);
  return {
    arSize,
    enSize,
    arLead: arSize * 1.8,
    enLead: enSize * 1.45,
    arLines,
    enLines,
    total: 0,
  };
}

export async function renderVerseCard(verse) {
  await Promise.all([
    document.fonts.load("400 52px Amiri"),
    document.fonts.load("600 34px Fraunces"),
    document.fonts.load("700 22px Manrope"),
  ]);

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");

  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, PAPER_TOP);
  bg.addColorStop(1, PAPER_BOTTOM);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = verse.color;
  ctx.fillRect(0, 0, W, 20);

  const maxWidth = W - PAD * 2;
  const layout = fit(ctx, verse, maxWidth, H - PAD * 2 - 120);

  let y = (H - layout.total) / 2 + layout.arSize;
  ctx.textAlign = "center";

  // Arabic: direction has to be set for the shaping to come out right.
  ctx.direction = "rtl";
  ctx.fillStyle = INK;
  ctx.font = `400 ${layout.arSize}px Amiri, serif`;
  for (const line of layout.arLines) {
    ctx.fillText(line, W / 2, y);
    y += layout.arLead;
  }

  ctx.direction = "ltr";
  y += 18;
  ctx.strokeStyle = `${verse.color}66`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(W / 2 - 60, y);
  ctx.lineTo(W / 2 + 60, y);
  ctx.stroke();
  y += 46 + layout.enSize;

  ctx.fillStyle = INK;
  ctx.font = `600 ${layout.enSize}px Fraunces, serif`;
  for (const line of layout.enLines) {
    ctx.fillText(line, W / 2, y);
    y += layout.enLead;
  }

  y += 40;
  ctx.fillStyle = verse.color;
  ctx.font = "700 24px Manrope, sans-serif";
  ctx.fillText(verse.ref.toUpperCase(), W / 2, y);

  ctx.fillStyle = MUTED;
  ctx.font = "400 20px Manrope, sans-serif";
  ctx.fillText(verse.label, W / 2, H - PAD / 2);

  return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
}

/**
 * Hands the image to the OS share sheet where that exists (phones), and falls
 * back to a download everywhere else. Returns how it was delivered so the UI
 * can say the right thing.
 */
export async function shareVerseCard(verse) {
  const blob = await renderVerseCard(verse);
  if (!blob) return "failed";

  const filename = `${verse.ref.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.png`;
  const file = new File([blob], filename, { type: "image/png" });

  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file] });
      return "shared";
    } catch (err) {
      // A cancelled share sheet is not a failure worth falling back from.
      if (err && err.name === "AbortError") return "cancelled";
    }
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return "downloaded";
}
