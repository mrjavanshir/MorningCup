/**
 * Renders a verse or ayah as a shareable image.
 *
 * Canvas draws whatever fonts happen to be loaded, so the webfonts are awaited
 * explicitly — otherwise the Arabic silently falls back to a system face and
 * the card looks nothing like the app.
 */

const W = 1080;
const H = 1350;
const PAD = 96;

export const THEMES = [
  {
    id: "paper",
    label: "Paper",
    top: "#F6EEDE",
    bottom: "#E7DAC0",
    ink: "#2A1620",
    body: "#3B2A1E",
    muted: "#8C7355",
    accent: "#B08637",
    frame: "rgba(140,115,85,0.45)",
    vignette: "rgba(120,95,60,0.13)",
  },
  {
    id: "night",
    label: "Night",
    top: "#241521",
    bottom: "#140A10",
    ink: "#F3E7DA",
    body: "#E4D3C4",
    muted: "#B99A8E",
    accent: "#D8A857",
    frame: "rgba(216,168,87,0.35)",
    vignette: "rgba(0,0,0,0.4)",
  },
  {
    id: "emerald",
    label: "Emerald",
    top: "#123A31",
    bottom: "#08201B",
    ink: "#EAF3EC",
    body: "#CFE3D6",
    muted: "#8FB3A2",
    accent: "#D9BE7A",
    frame: "rgba(217,190,122,0.35)",
    vignette: "rgba(0,0,0,0.38)",
  },
  {
    id: "dusk",
    label: "Dusk",
    top: "#2B2440",
    bottom: "#151122",
    ink: "#EFEAF6",
    body: "#D6CEE6",
    muted: "#A79BC0",
    accent: "#C9A9E0",
    frame: "rgba(201,169,224,0.32)",
    vignette: "rgba(0,0,0,0.35)",
  },
];

export const themeById = (id) => THEMES.find((t) => t.id === id) || THEMES[0];

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
  for (let scale = 1; scale >= 0.5; scale -= 0.05) {
    const arSize = Math.round(54 * scale);
    const enSize = Math.round(33 * scale);
    const arLead = arSize * 1.9;
    const enLead = enSize * 1.55;

    ctx.font = `400 ${arSize}px Amiri, serif`;
    const arLines = wrap(ctx, verse.arabic, maxWidth);
    ctx.font = `600 ${enSize}px Fraunces, serif`;
    const enLines = wrap(ctx, verse.text, maxWidth);

    const total = arLines.length * arLead + 96 + enLines.length * enLead + 104;
    if (total <= maxHeight) return { arSize, enSize, arLead, enLead, arLines, enLines, total };
  }
  const arSize = 27;
  const enSize = 17;
  ctx.font = `400 ${arSize}px Amiri, serif`;
  const arLines = wrap(ctx, verse.arabic, maxWidth);
  ctx.font = `600 ${enSize}px Fraunces, serif`;
  const enLines = wrap(ctx, verse.text, maxWidth);
  return { arSize, enSize, arLead: arSize * 1.8, enLead: enSize * 1.45, arLines, enLines, total: 0 };
}

/** A small diamond flanked by rules — used instead of a bare dividing line. */
function ornament(ctx, cx, y, color) {
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx - 110, y);
  ctx.lineTo(cx - 26, y);
  ctx.moveTo(cx + 26, y);
  ctx.lineTo(cx + 110, y);
  ctx.stroke();
  ctx.save();
  ctx.translate(cx, y);
  ctx.rotate(Math.PI / 4);
  ctx.fillRect(-7, -7, 14, 14);
  ctx.restore();
}

export async function renderVerseCard(verse, themeId = "paper") {
  await Promise.all([
    document.fonts.load("400 54px Amiri"),
    document.fonts.load("600 33px Fraunces"),
    document.fonts.load("700 22px Manrope"),
  ]);

  const t = themeById(themeId);
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");

  const bg = ctx.createLinearGradient(0, 0, W * 0.4, H);
  bg.addColorStop(0, t.top);
  bg.addColorStop(1, t.bottom);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Vignette: keeps the eye in the middle and stops flat colour looking cheap.
  const vig = ctx.createRadialGradient(W / 2, H / 2, H * 0.25, W / 2, H / 2, H * 0.75);
  vig.addColorStop(0, "rgba(0,0,0,0)");
  vig.addColorStop(1, t.vignette);
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, W, H);

  // Hairline frame, inset — the single biggest thing that makes it read as a card.
  ctx.strokeStyle = t.frame;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(44, 44, W - 88, H - 88, 26);
  ctx.stroke();
  ctx.strokeStyle = `${t.accent}44`;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(58, 58, W - 116, H - 116, 18);
  ctx.stroke();

  const maxWidth = W - PAD * 2 - 40;
  const layout = fit(ctx, verse, maxWidth, H - PAD * 2 - 190);

  let y = (H - layout.total) / 2 + layout.arSize;
  ctx.textAlign = "center";

  ctx.direction = "rtl";
  ctx.fillStyle = t.ink;
  ctx.font = `400 ${layout.arSize}px Amiri, serif`;
  for (const line of layout.arLines) {
    ctx.fillText(line, W / 2, y);
    y += layout.arLead;
  }

  ctx.direction = "ltr";
  y += 26;
  ornament(ctx, W / 2, y, `${t.accent}aa`);
  y += 52 + layout.enSize;

  ctx.fillStyle = t.body;
  ctx.font = `600 ${layout.enSize}px Fraunces, serif`;
  for (const line of layout.enLines) {
    ctx.fillText(line, W / 2, y);
    y += layout.enLead;
  }

  y += 52;
  ctx.fillStyle = t.accent;
  ctx.font = "700 25px Manrope, sans-serif";
  ctx.letterSpacing = "3px";
  ctx.fillText(verse.ref.toUpperCase(), W / 2, y);
  ctx.letterSpacing = "0px";

  if (verse.label) {
    ctx.fillStyle = t.muted;
    ctx.font = "400 21px Manrope, sans-serif";
    ctx.fillText(verse.label, W / 2, H - PAD + 6);
  }

  return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
}

/**
 * Hands the image to the OS share sheet where that exists (phones), and falls
 * back to a download everywhere else. Returns how it was delivered so the UI
 * can say the right thing.
 */
export async function deliverCard(blob, ref) {
  if (!blob) return "failed";
  const filename = `${ref.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.png`;
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
