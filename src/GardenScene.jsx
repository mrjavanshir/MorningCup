import React from "react";

/**
 * The three plants, drawn from their stage alone. Every leaf, flower and fruit
 * is placed by a seeded random, so a plant looks the same on every visit and
 * only changes when it actually grows. Each plant is drawn in a 200×240 box
 * standing on the ground at y = 220.
 */

const GROUND = 220;
// Height of the plant at each stage (seed … full grown).
const HEIGHT = [0, 26, 70, 112, 142, 162];

function seeded(seed) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rad = (deg) => (deg * Math.PI) / 180;
// 0° points straight up, positive leans right.
const toward = (x, y, deg, len) => [x + Math.sin(rad(deg)) * len, y - Math.cos(rad(deg)) * len];

/** A branch as a gentle curve, and points along it for leaves to sit on. */
function branch(x, y, deg, len, bend) {
  const [ex, ey] = toward(x, y, deg, len);
  const [cx, cy] = toward(x, y, deg + bend, len * 0.55);
  const at = (t) => {
    const u = 1 - t;
    return [u * u * x + 2 * u * t * cx + t * t * ex, u * u * y + 2 * u * t * cy + t * t * ey];
  };
  return { d: `M${x},${y} Q${cx},${cy} ${ex},${ey}`, at, end: [ex, ey], deg };
}

function Leaf({ x, y, deg, rx, ry, fill, vein }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${deg - 90})`}>
      <ellipse cx={rx} cy={0} rx={rx} ry={ry} fill={fill} />
      {vein && <line x1={1} y1={0} x2={rx * 1.7} y2={0} stroke={vein} strokeWidth={0.6} opacity={0.6} />}
    </g>
  );
}

function Seed() {
  return (
    <g>
      <path d={`M76,${GROUND} Q100,${GROUND - 16} 124,${GROUND} Z`} fill="#6B4A33" />
      <ellipse cx={100} cy={GROUND - 9} rx={6} ry={4.2} fill="#A7824F" transform={`rotate(-20 100 ${GROUND - 9})`} />
      <ellipse cx={98.5} cy={GROUND - 10} rx={2} ry={1.2} fill="#C9A66E" transform={`rotate(-20 100 ${GROUND - 9})`} />
    </g>
  );
}

function Sprout({ color }) {
  return (
    <g>
      <path d={`M100,${GROUND} Q98,${GROUND - 14} 100,${GROUND - 24}`} stroke="#6E8F4E" strokeWidth={2.2} fill="none" strokeLinecap="round" />
      <Leaf x={100} y={GROUND - 22} deg={-55} rx={8} ry={4} fill={color} />
      <Leaf x={100} y={GROUND - 22} deg={55} rx={8} ry={4} fill={color} />
    </g>
  );
}

/** Trunk, then a crown of branches with leaves, flowers and fruit by stage. */
function Tree({ stage, seed, trunk, leaf, leafAlt, leafShape, crown, angles, flower, fruit }) {
  const rand = seeded(seed);
  const h = HEIGHT[stage];
  const trunkTop = GROUND - h * 0.5;
  const width = 2 + stage * 1.4;
  const shown = angles.slice(0, stage === 2 ? 2 : stage === 3 ? angles.length - 1 : angles.length);
  const branches = shown.map((deg, i) => branch(100 + (i - shown.length / 2) * 1.5, trunkTop + 4, deg, h * (0.42 + rand() * 0.12), deg > 0 ? -12 : 12));
  const perBranch = [0, 0, 5, 8, 10, 11][stage];
  const leaves = [];
  branches.forEach((b) => {
    for (let i = 0; i < perBranch; i++) {
      const t = 0.3 + (i / perBranch) * 0.72;
      const [x, y] = b.at(Math.min(t, 1));
      const side = i % 2 ? 1 : -1;
      leaves.push({ x, y, deg: b.deg + side * (35 + rand() * 30), alt: rand() < 0.35 });
    }
  });
  const tips = branches.flatMap((b) => [b.at(0.95), b.at(0.7), b.at(0.5)]);
  return (
    <g>
      {stage >= 3 && crown && (
        <g opacity={0.55}>
          {branches.map((b, i) => (
            <circle key={i} cx={b.at(0.75)[0]} cy={b.at(0.75)[1]} r={h * 0.2} fill={crown} />
          ))}
        </g>
      )}
      <path
        d={`M${100 - width},${GROUND} Q${100 - width * 0.6},${GROUND - h * 0.25} ${100 - 1},${trunkTop} L${100 + 1},${trunkTop} Q${100 + width * 0.8},${GROUND - h * 0.25} ${100 + width},${GROUND} Z`}
        fill={trunk}
      />
      {branches.map((b, i) => (
        <path key={i} d={b.d} stroke={trunk} strokeWidth={Math.max(1.4, width * 0.45)} fill="none" strokeLinecap="round" />
      ))}
      {leaves.map((l, i) => (
        <Leaf key={i} x={l.x} y={l.y} deg={l.deg} rx={leafShape[0]} ry={leafShape[1]} fill={l.alt ? leafAlt : leaf} />
      ))}
      {stage === 4 && flower && tips.slice(0, 9).map(([x, y], i) => flower(x, y, i, rand))}
      {stage === 5 && fruit && tips.slice(0, 10).map(([x, y], i) => fruit(x, y, i, rand))}
      {stage === 5 && flower && tips.slice(10, 13).map(([x, y], i) => flower(x, y, i + 20, rand))}
    </g>
  );
}

const olive = (stage) => (
  <Tree
    stage={stage}
    seed={11}
    trunk="#7C6B5A"
    leaf="#7E9A6A"
    leafAlt="#B3C4A6"
    leafShape={[9, 2.4]}
    crown="#9DB38C"
    angles={[-58, -28, 4, 30, 60]}
    flower={(x, y, i) => (
      <g key={`f${i}`}>
        <circle cx={x - 2} cy={y} r={1.8} fill="#F4EDD2" />
        <circle cx={x + 1.5} cy={y - 1.5} r={1.6} fill="#F4EDD2" />
        <circle cx={x + 1} cy={y + 2} r={1.5} fill="#EBDDB0" />
      </g>
    )}
    fruit={(x, y, i, rand) => (
      <ellipse key={`o${i}`} cx={x} cy={y + 3} rx={2.8} ry={3.8} fill={rand() < 0.5 ? "#4A3A55" : "#6C7A36"} />
    )}
  />
);

const pomegranate = (stage) => (
  <Tree
    stage={stage}
    seed={29}
    trunk="#6E4B39"
    leaf="#4F8A3D"
    leafAlt="#6BA553"
    leafShape={[7, 3]}
    crown="#5FA24A"
    angles={[-50, -22, 8, 34, 58]}
    flower={(x, y, i) => (
      <g key={`f${i}`} transform={`translate(${x} ${y})`}>
        <path d="M-3.5,-1 L0,-6 L3.5,-1 L2.5,3 L-2.5,3 Z" fill="#E4472C" />
        <path d="M-2.5,-1 L0,-3.5 L2.5,-1" fill="#F07A4C" />
      </g>
    )}
    fruit={(x, y, i) => (
      <g key={`p${i}`} transform={`translate(${x} ${y + 5})`}>
        <circle r={i % 3 === 0 ? 7.5 : 6} fill="#C0392B" />
        <circle cx={-2.2} cy={-2.2} r={2} fill="#E0604E" opacity={0.7} />
        <path d="M-2.5,-6 L-1.5,-9 L0,-6.5 L1.5,-9 L2.5,-6 Z" fill="#8E2A1F" />
      </g>
    )}
  />
);

/** A bush of arching canes rather than a trunk, with roses at the tips. */
function Rose({ stage }) {
  const rand = seeded(47);
  const h = HEIGHT[stage];
  const angles = [-30, -14, 2, 17, 31].slice(0, stage === 2 ? 2 : stage === 3 ? 4 : 5);
  const canes = angles.map((deg, i) => branch(96 + i * 2, GROUND, deg, h * (0.75 + rand() * 0.25), deg > 0 ? -18 : 18));
  const perCane = [0, 0, 3, 5, 6, 6][stage];
  return (
    <g>
      {canes.map((c, i) => (
        <path key={i} d={c.d} stroke="#4E7A38" strokeWidth={1.8 + stage * 0.2} fill="none" strokeLinecap="round" />
      ))}
      {canes.map((c, ci) =>
        Array.from({ length: perCane }, (_, i) => {
          const [x, y] = c.at(0.25 + (i / perCane) * 0.65);
          const side = i % 2 ? 1 : -1;
          return (
            <g key={`${ci}-${i}`}>
              <Leaf x={x} y={y} deg={c.deg + side * 50} rx={6.5} ry={3.6} fill="#5E8F48" vein="#3E6B2E" />
              <Leaf x={x} y={y} deg={c.deg + side * 85} rx={5} ry={3} fill="#6FA055" />
            </g>
          );
        })
      )}
      {stage >= 4 &&
        canes.map((c, i) => {
          const [x, y] = c.end;
          const open = stage === 5 || i % 2 === 0;
          const tone = i % 3 === 0 ? ["#C2405A", "#E0607A"] : ["#D6455F", "#EE8A9C"];
          return open ? (
            <g key={`r${i}`} transform={`translate(${x} ${y})`}>
              <circle r={stage === 5 ? 11 : 8.5} fill={tone[0]} />
              <circle r={stage === 5 ? 7.5 : 6} fill={tone[1]} />
              <path d="M-3.5,0 A3.5,3.5 0 1,1 3.5,0 A2.2,2.2 0 1,1 -0.8,0" stroke={tone[0]} strokeWidth={1.4} fill="none" />
            </g>
          ) : (
            <g key={`b${i}`} transform={`translate(${x} ${y}) rotate(${c.deg})`}>
              <path d="M0,-10 C5.5,-4 4,3 0,4 C-4,3 -5.5,-4 0,-10 Z" fill={tone[0]} />
              <path d="M-3,1 L0,4 L3,1" stroke="#4E7A38" strokeWidth={1.4} fill="none" />
            </g>
          );
        })}
      {stage === 5 &&
        canes.slice(0, 3).map((c, i) => {
          const [x, y] = c.at(0.62);
          return (
            <g key={`s${i}`} transform={`translate(${x + 7} ${y})`}>
              <circle r={7} fill="#E0607A" />
              <circle r={4.5} fill="#F2A3B1" />
            </g>
          );
        })}
    </g>
  );
}

const DRAW = {
  olive: (stage) => olive(stage),
  pomegranate: (stage) => pomegranate(stage),
  rose: (stage) => <Rose stage={stage} />,
};
const SPROUT = { olive: "#8FAA7A", pomegranate: "#5E9A48", rose: "#6FA055" };

/**
 * One plant. `thirsty` bends it, drains its colour and drops a leaf on the
 * soil — it never takes growth away.
 */
export function Plant({ type, stage, thirsty }) {
  const body = stage === 0 ? <Seed /> : stage === 1 ? <Sprout color={SPROUT[type]} /> : DRAW[type](stage);
  return (
    <g>
      <ellipse cx={100} cy={GROUND + 2} rx={52} ry={7} fill="#4A3426" opacity={0.9} />
      <g
        style={{
          transformOrigin: `100px ${GROUND}px`,
          transform: thirsty ? "rotate(-5deg) scaleY(0.96)" : "none",
          filter: thirsty ? "saturate(0.35) sepia(0.45)" : "none",
          transition: "transform 1.2s ease, filter 1.2s ease",
        }}
      >
        {body}
      </g>
      {thirsty && stage >= 2 && (
        <g transform={`translate(128 ${GROUND - 1}) rotate(-20)`}>
          <ellipse rx={6} ry={2.4} fill="#B89A4A" />
        </g>
      )}
    </g>
  );
}

// Frames the scene to the tallest plant, so a young garden is not a strip of
// soil under an empty sky — but never so tight that seeds look enormous.
const MIN_VIEW = 110;
const PAD_TOP = 26;

// Plants stand this far apart; a full-grown crown is about 140 wide.
const SPACING = 180;
const WIDTH = SPACING * 2 + 200;

/**
 * The three plants side by side on one bed of soil. Without a `height` the
 * scene takes its height from its width.
 */
export default function GardenScene({ plants, height }) {
  const tallest = Math.max(...plants.map((p) => HEIGHT[p.stage] || 0));
  const top = Math.min(GROUND - MIN_VIEW, GROUND - tallest - PAD_TOP);
  const bottom = GROUND + 16;
  return (
    <svg
      viewBox={`0 ${top} ${WIDTH} ${bottom - top}`}
      width="100%"
      height={height || undefined}
      role="img"
      aria-label="Our garden"
      // Any spare room goes above the plants, as sky, never below the soil.
      preserveAspectRatio="xMidYMax meet"
      style={{ display: "block" }}
    >
      <rect x={0} y={GROUND - 2} width={WIDTH} height={40} fill="#3E2B1F" opacity={0.35} />
      {plants.map((p, i) => (
        <g key={p.id} transform={`translate(${i * SPACING} 0)`}>
          <Plant type={p.id} stage={p.stage} thirsty={p.thirsty} />
        </g>
      ))}
    </svg>
  );
}
