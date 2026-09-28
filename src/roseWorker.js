/**
 * Renders the bouquet's roses ahead of time, off the main thread, as a
 * sequence of still frames from bud to full bloom. The page then plays the
 * bloom back by blending neighbouring frames, which costs next to nothing —
 * drawing the flowers live while they opened was too heavy for a phone.
 *
 * Messages in:
 *   { type: "buds", roses: [{ id, seed, view, px }], bud }
 *       just the closed bud of each (frame 0), so they can appear at once
 *   { type: "bake", roses: [{ id, seed, view, px }], frames, bud, full, low }
 *       frames 1…frames-1; all but the last at `low` × px, the last at full
 *       size with the fine mesh, since that is the one that stays on screen;
 *       the rest with the lightest one, since each is only seen in passing
 * Messages out:
 *   { id, k, bitmap }   one frame (the bitmap is transferred)
 *   { done: true }      a "bake" message has been fully rendered
 */
import { drawRose, makeRose } from "./rose3d.js";

const models = new Map();
const model = (seed) => {
  if (!models.has(seed)) models.set(seed, makeRose(seed));
  return models.get(seed);
};

// One canvas per size, reused: setting up a fresh canvas and context for
// every frame cost far more than drawing the rose into it.
const canvases = new Map();
function render(r, open, px, mesh) {
  let c = canvases.get(px);
  if (!c) {
    const canvas = new OffscreenCanvas(px, px);
    c = { canvas, ctx: canvas.getContext("2d") };
    canvases.set(px, c);
  }
  drawRose(c.ctx, model(r.seed), open, px, r.view, mesh);
  return c.canvas.transferToImageBitmap();
}

self.onmessage = ({ data }) => {
  if (data.type === "buds") {
    for (const r of data.roses) {
      const bitmap = render(r, data.bud, r.px, "coarse");
      self.postMessage({ id: r.id, k: 0, bitmap }, [bitmap]);
    }
  } else if (data.type === "bake") {
    const { frames, bud, full, low } = data;
    for (const r of data.roses) {
      for (let k = 1; k < frames; k++) {
        const last = k === frames - 1;
        const px = last ? r.px : Math.max(32, Math.round(r.px * low));
        const bitmap = render(r, bud + ((full - bud) * k) / (frames - 1), px, last ? "fine" : "draft");
        self.postMessage({ id: r.id, k, bitmap }, [bitmap]);
      }
    }
    self.postMessage({ done: true });
  }
};
