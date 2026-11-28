import type { Leg } from '../api';
import { formatMeasurement, type Unit } from '../lib/measure';
import { type CornerKey, planDrawing, profilePath, SIDE_NAMES } from '../lib/plan';
import type { SideName } from '../lib/outline';

const W = 640;
const H = 400; // the plan; the edge-profile inset sits below it
const EXPOSED = '#0F5E5A';
const COVERED = '#9AA5B1';
const DIMENSION = '#2F6690';

/** The counter seen from above. Clicking an edge switches it exposed/covered; clicking a corner dot rounds it. */
export function PlanView({ legs, unit, edgeName, onToggleEdge, onToggleCorner }: {
  legs: Leg[]; unit: Unit; edgeName: string;
  onToggleEdge: (leg: number, side: SideName) => void;
  onToggleCorner: (leg: number, key: CornerKey) => void;
}) {
  const plan = planDrawing(legs, W, H, 48);
  if (!plan.outline.length) return <p className="plan-empty muted">Fix the sizes marked in Checks to see the plan.</p>;
  return (
    <>
      <svg viewBox={`0 0 ${W} ${H + 80}`} className="plan" role="img" aria-label="Counter plan">
        <defs>
          <pattern id="wall" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="6" stroke={COVERED} strokeWidth="2" />
          </pattern>
        </defs>
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
            <line x1={e.a.x} y1={e.a.y} x2={e.b.x} y2={e.b.y} stroke="transparent" strokeWidth="16" className="hit"
              onClick={() => onToggleEdge(e.leg, e.side)}>
              <title>{`Leg ${e.leg + 1} ${SIDE_NAMES[e.side]}: ${e.covered ? 'covered' : 'exposed'}`}</title>
            </line>
          </g>
        ))}
        {/* shortcut: a rounded corner is shown by a filled dot, not drawn as an arc; draw arcs with the PDF drawing */}
        {plan.corners.filter((c) => c.available).map((c) => (
          <circle key={c.key} cx={c.at.x} cy={c.at.y} r="8" className="hit" fill={c.on ? EXPOSED : '#fff'} stroke={EXPOSED} strokeWidth="2"
            onClick={() => onToggleCorner(c.leg, c.key)}>
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
