import type { Counter } from '../api';
import { formatMeasurement, type Unit } from '../lib/measure';
import { type CornerKey, planDrawing, profilePath, SIDE_NAMES } from '../lib/plan';
import type { SideName } from '../lib/outline';

const W = 640;
const H = 400; // the plan; the edge-profile inset sits below it
const PLAN_MARGIN = 76; // px, room for a size label beside an upright end
const EXPOSED = '#0F5E5A';
const COVERED = '#9AA5B1';
const DIMENSION = '#2F6690';

const DEFS = (
  <defs>
    <pattern id="wall" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <line x1="0" y1="0" x2="0" y2="6" stroke={COVERED} strokeWidth="2" />
    </pattern>
  </defs>
);

/** The counter seen from above. Clicking an edge switches it exposed/covered; clicking a corner dot rounds it. */
export function PlanView({ counter, unit, edgeName, onToggleEdge, onToggleCorner }: {
  counter: Counter; unit: Unit; edgeName: string;
  onToggleEdge: (leg: number, side: SideName) => void;
  onToggleCorner: (leg: number, key: CornerKey) => void;
}) {
  if (!planDrawing(counter.legs, counter, W, H, PLAN_MARGIN).outline.length) return <p className="plan-empty muted">Fix the sizes marked in Checks to see the plan.</p>;
  return (
    <>
      <svg viewBox={`0 0 ${W} ${H + 80}`} className="plan" role="img" aria-label="Counter plan">
        {DEFS}
        <PlanShapes counter={counter} unit={unit} edgeName={edgeName} onToggleEdge={onToggleEdge} onToggleCorner={onToggleCorner} />
      </svg>
      <ul className="legend muted">
        <li><span style={{ background: EXPOSED }} />Exposed edge</li>
        <li><span style={{ background: COVERED }} />Covered edge</li>
        <li><span style={{ background: DIMENSION }} />Dimension</li>
        <li>Click an edge to switch it, or a corner dot to make it a radius corner.</li>
      </ul>
    </>
  );
}

const TITLE = 28; // room for a counter's name above its plan in the quote drawing
const CELL_H = TITLE + H + 80;
const LEGEND_H = 56;

/** Every counter's plan in one SVG, two to a row, for the saved quote's PDF. Nothing in it is clickable. */
export function QuoteDrawing({ counters, unit }: { counters: { name: string; counter: Counter; edgeName: string }[]; unit: Unit }) {
  const columns = Math.min(2, counters.length);
  const rows = Math.ceil(counters.length / 2);
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox={`0 0 ${W * columns} ${CELL_H * rows + LEGEND_H}`}>
      {DEFS}
      {counters.map((c, i) => (
        <g key={i} transform={`translate(${(i % 2) * W} ${Math.floor(i / 2) * CELL_H})`}>
          <text x="12" y="20" fontSize="16" fontWeight="bold" fill="#1f2933">{c.name}</text>
          <g transform={`translate(0 ${TITLE})`}><PlanShapes counter={c.counter} unit={unit} edgeName={c.edgeName} /></g>
        </g>
      ))}
      <g transform={`translate(12 ${CELL_H * rows + 8})`}><Legend unit={unit} /></g>
    </svg>
  );
}

/** What the PDF drawing's marks mean, in two rows so it fits one plan's width. */
function Legend({ unit }: { unit: Unit }) {
  return (
    <g fontSize="12" fill="#1f2933">
      <line x1="0" y1="10" x2="28" y2="10" stroke={EXPOSED} strokeWidth="4" />
      <text x="36" y="14">Exposed edge (polished, charged)</text>
      <line x1="240" y1="10" x2="268" y2="10" stroke="url(#wall)" strokeWidth="10" />
      <line x1="240" y1="10" x2="268" y2="10" stroke={COVERED} strokeWidth="2" />
      <text x="276" y="14">Covered edge</text>
      <circle cx="400" cy="10" r="6" fill={EXPOSED} />
      <text x="414" y="14">Radius corner</text>
      <rect x="0" y="28" width="28" height="16" rx="5" fill="#fff" stroke="#66727f" />
      <text x="36" y="40">Sink</text>
      <rect x="90" y="28" width="28" height="16" rx="2" fill="#fff" stroke="#66727f" strokeDasharray="4 3" />
      <text x="126" y="40">Cooktop</text>
      <text x="190" y="40" fill={DIMENSION}>{formatMeasurement(96, unit)}</text>
      <text x="240" y="40">Length, along the back edge into the corner</text>
    </g>
  );
}

/** The plan's shapes. Without the click handlers it's for print: no hit areas, and only rounded corners get a dot. */
function PlanShapes({ counter, unit, edgeName, onToggleEdge, onToggleCorner }: {
  counter: Counter; unit: Unit; edgeName: string;
  onToggleEdge?: (leg: number, side: SideName) => void;
  onToggleCorner?: (leg: number, key: CornerKey) => void;
}) {
  const plan = planDrawing(counter.legs, counter, W, H, PLAN_MARGIN);
  return (
    <>
      <polygon points={plan.outline.map((p) => `${p.x},${p.y}`).join(' ')} fill="#E9E4DA" />
      {plan.cutouts.map((c, i) => (
        <g key={i} transform={`translate(${c.center.x} ${c.center.y}) rotate(${c.angle})`}>
          <rect x={-c.width / 2} y={-c.depth / 2} width={c.width} height={c.depth} rx={c.kind === 'cooktop' ? 2 : 8}
            fill="#fff" stroke="#66727f" strokeDasharray={c.kind === 'cooktop' ? '4 3' : undefined} />
        </g>
      ))}
      {plan.edges.map((e) => (
        <g key={`${e.leg}${e.side}`}>
          {e.covered && <line x1={e.a.x} y1={e.a.y} x2={e.b.x} y2={e.b.y} stroke="url(#wall)" strokeWidth="10" />}
          <line x1={e.a.x} y1={e.a.y} x2={e.b.x} y2={e.b.y} stroke={e.covered ? COVERED : EXPOSED} strokeWidth={e.covered ? 2 : 4} />
          {/* a wide invisible line, so the edge is easy to hit */}
          {onToggleEdge && <line x1={e.a.x} y1={e.a.y} x2={e.b.x} y2={e.b.y} stroke="transparent" strokeWidth="16" className="hit"
            onClick={() => onToggleEdge(e.leg, e.side)}>
            <title>{`Leg ${e.leg + 1} ${SIDE_NAMES[e.side]}: ${e.covered ? 'covered' : 'exposed'}`}</title>
          </line>}
        </g>
      ))}
      {/* shortcut: a rounded corner is shown by a filled dot, not drawn as an arc, in the PDF too; draw arcs if shops find dots unclear */}
      {plan.corners.filter((c) => c.available && (onToggleCorner || c.on)).map((c) => (
        <circle key={c.key} cx={c.at.x} cy={c.at.y} r="8" className={onToggleCorner && 'hit'} fill={c.on ? EXPOSED : '#fff'} stroke={EXPOSED} strokeWidth="2"
          onClick={onToggleCorner && (() => onToggleCorner(c.leg, c.key))}>
          <title>{c.on ? 'Radius corner' : 'Square corner'}</title>
        </circle>
      ))}
      {plan.dimensions.map((d, i) => (
        <text key={i} x={d.at.x} y={d.at.y} fill={DIMENSION} fontSize="13" textAnchor="middle" dominantBaseline="middle">
          {formatMeasurement(d.inches, unit)}
        </text>
      ))}
      <g transform={`translate(12 ${H + 4})`}>
        <rect width="132" height="70" rx="4" fill="#fff" stroke="#e1e5ea" />
        <path d={profilePath(edgeName)} transform="translate(36 12) scale(1)" fill="#E9E4DA" stroke="#66727f" />
        <text x="66" y="60" fontSize="11" textAnchor="middle" fill="#66727f">Edge: {edgeName}</text>
      </g>
    </>
  );
}
