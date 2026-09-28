/**
 * Draws some of the bouquet's roses off the main thread. Each rose's canvas
 * is handed over as an OffscreenCanvas; this worker runs its own frame loop,
 * works out from the shared bloom start time how open each of its roses
 * should be, and repaints the ones that changed — so eleven flowers opening
 * together never hold up the page's own animations or a tap.
 *
 * Messages in:
 *   { type: "add", id, canvas, seed, view, delay, dur, bud, full }
 *   { type: "size", id, px }
 *   { type: "bloom", at }   // epoch ms (timeOrigin + now) the bloom started
 */
import { drawRose, makeRose } from "./rose3d.js";

const roses = new Map();
let bloomAt = null;

const easeInOut = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const epochNow = () => performance.timeOrigin + performance.now();

function openOf(r, now) {
  if (bloomAt === null) return r.bud;
  const x = (now - bloomAt - r.delay) / r.dur;
  return r.bud + (r.full - r.bud) * easeInOut(Math.min(1, Math.max(0, x)));
}

const nextFrame = self.requestAnimationFrame
  ? (fn) => self.requestAnimationFrame(fn)
  : (fn) => setTimeout(fn, 16);

let running = false;
function tick() {
  const now = epochNow();
  let busy = false;
  for (const r of roses.values()) {
    if (!r.canvas.width) continue;
    const open = openOf(r, now);
    if (Math.abs(open - r.last) > 0.0004) {
      drawRose(r.ctx, r.model, open, r.canvas.width, r.view);
      r.last = open;
      r.fineDone = false;
      r.movedAt = now;
      busy = true;
    } else if (!r.fineDone && now - r.movedAt > 150) {
      drawRose(r.ctx, r.model, open, r.canvas.width, r.view, true);
      r.fineDone = true;
    }
    if (!r.fineDone) busy = true;
  }
  const waiting = bloomAt !== null && [...roses.values()].some((r) => now < bloomAt + r.delay + r.dur);
  if (busy || waiting) nextFrame(tick);
  else running = false;
}

function wake() {
  if (running) return;
  running = true;
  nextFrame(tick);
}

self.onmessage = ({ data }) => {
  if (data.type === "add") {
    const { id, canvas, seed, view, delay, dur, bud, full } = data;
    roses.set(id, {
      canvas,
      ctx: canvas.getContext("2d"),
      model: makeRose(seed),
      view,
      delay,
      dur,
      bud,
      full,
      last: -1,
      fineDone: false,
      movedAt: 0,
    });
  } else if (data.type === "size") {
    const r = roses.get(data.id);
    if (r && data.px > 0 && data.px !== r.canvas.width) {
      r.canvas.width = data.px;
      r.canvas.height = data.px;
      r.last = -1;
    }
  } else if (data.type === "bloom") {
    bloomAt = data.at;
  }
  wake();
};
