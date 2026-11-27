import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { type Counter, createJob, getJob, getPriceList, type Job, type Leg, type PriceList, updateJob } from '../api';
import { useLeaveWarning } from '../hooks/useLeaveWarning';
import {
  layoutOf, newCounter, newLeg, quoteValidDays, ROOMS, sampleJob, toQuoteJob, toQuotePrices, withLayout, withRoom, withSavedQuote,
} from '../lib/jobEditor';
import { formatMeasurement, parseMeasurement, type Unit } from '../lib/measure';
import type { SideName } from '../lib/outline';
import { CUTOUTS, type CutoutKind, priceJob, type Room } from '../lib/quote';
import { PlanView } from './PlanView';

/** /jobs/new opens a sample Kitchen L; /jobs/:id opens the saved job. */
export function JobEditorPage() {
  const id = Number(useParams().id ?? 0);
  const prices = useQuery({ queryKey: ['priceList'], queryFn: getPriceList, refetchOnWindowFocus: false });
  const job = useQuery({ queryKey: ['jobs', id], queryFn: () => getJob(id), enabled: id > 0, refetchOnWindowFocus: false });

  const error = prices.error ?? job.error;
  if (error) return <p className="errors">{error.message}</p>;
  if (!prices.data || (id > 0 && !job.data)) return <p>Loading…</p>;
  const list = prices.data;
  const saved = id > 0 ? job.data! : sampleJob(list.materials[0]?.id ?? 0, list.edgeProfiles[0]?.id ?? 0);
  return <JobEditor key={id} saved={saved} prices={list} />;
}

const SIDES: SideName[] = ['back', 'front', 'start', 'end'];
const CORNERS = [
  ['startBackRadius', 'Start back'], ['startFrontRadius', 'Start front'], ['endBackRadius', 'End back'], ['endFrontRadius', 'End front'],
] as const;
const LAYOUT_NAMES = { Straight: 'Straight', L: 'L-shape', U: 'U-shape', Custom: 'Custom' } as const;

function JobEditor({ saved, prices }: { saved: Job; prices: PriceList }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [stored, setStored] = useState(saved);
  const [job, setJob] = useState<Job>(structuredClone(saved));
  const [tab, setTab] = useState(0);
  const [unit, setUnit] = useState<Unit>('in');
  const [justSaved, setJustSaved] = useState(false);
  const [blankSizes, setBlankSizes] = useState(false);

  const quotePrices = useMemo(() => toQuotePrices(prices), [prices]);
  const quote = useMemo(() => priceJob(toQuoteJob(job), quotePrices, unit), [job, quotePrices, unit]);
  const unsaved = JSON.stringify(job) !== JSON.stringify(stored);
  useLeaveWarning(unsaved, 'Leave without saving? Your changes to this job will be lost.');

  const save = useMutation({
    mutationFn: (j: Job) => (j.id ? updateJob(j) : createJob(j)),
    onSuccess: (fresh) => {
      queryClient.setQueryData(['jobs', fresh.id], fresh);
      queryClient.invalidateQueries({ queryKey: ['jobs'], exact: true });
      setStored(fresh);
      setJob(structuredClone(fresh));
      setJustSaved(true);
    },
  });
  // a new job moves to its own address once saved (after the render that clears "unsaved", so nothing blocks it)
  useEffect(() => {
    if (saved.id === 0 && stored.id > 0) navigate(`/jobs/${stored.id}`, { replace: true });
  }, [saved.id, stored.id, navigate]);

  const change = (edit: (draft: Job) => void) => {
    const draft = structuredClone(job);
    edit(draft);
    setJob(draft);
    setJustSaved(false);
    setBlankSizes(false);
  };
  const counter = job.counters[tab];
  const editCounter = (edit: (c: Counter) => Counter | void) =>
    change((d) => { d.counters[tab] = edit(d.counters[tab]) ?? d.counters[tab]; });
  const editLeg = (i: number, edit: (l: Leg) => void) => editCounter((c) => { edit(c.legs[i]); });

  const names = quote.counters.map((c) => c.name);
  const name = names[tab];
  const mine = (messages: string[]) => messages.filter((m) => m.startsWith(`${name}: `)).map((m) => m.slice(name.length + 2));
  const errors = mine(quote.errors);
  const warnings = mine(quote.warnings);
  const summary = quote.counters[tab];
  const edgeName = prices.edgeProfiles.find((e) => e.id === counter.edgeProfileId)?.name ?? 'Missing';
  const layout = layoutOf(counter);
  const firstMaterial = prices.materials[0]?.id ?? 0;
  const firstEdge = prices.edgeProfiles[0]?.id ?? 0;

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    // the server can't store a box it couldn't read; a shape that only fails Checks still saves, unpriced
    const blank = job.counters.some((c) => c.legs.some((l) => [l.length, l.depth, l.turnAngle, ...l.cutouts.map((x) => x.centerline)].some(Number.isNaN)));
    setBlankSizes(blank);
    if (!blank) save.mutate(withSavedQuote(job, quote, quoteValidDays(prices), new Date()));
  };
  const removeCounter = () => {
    if (!window.confirm(`Remove ${name}?`)) return;
    change((d) => { d.counters.splice(tab, 1); });
    setTab(Math.max(0, tab - 1));
  };
  const cutouts = counter.legs.flatMap((l, leg) => l.cutouts.map((c, i) => ({ ...c, leg, i })));
  const sideLabel = (leg: number, side: SideName) => (counter.legs.length > 1 || side === 'back' || side === 'front' ? `Leg ${leg + 1} ${side}` : side);

  return (
    <form onSubmit={handleSubmit} className="editor-page">
      <div className="page-title">
        <label className="customer">
          Customer <input required maxLength={200} value={job.customerName} onChange={(e) => change((d) => { d.customerName = e.target.value; })} />
        </label>
        <div className="page-actions">
          {unsaved && <span className="unsaved">Unsaved changes</span>}
          <button type="submit" className="button" disabled={save.isPending}>Save job</button>
        </div>
      </div>
      {blankSizes && <p className="errors">Some sizes are empty or can't be read. Fix the boxes marked in red, then save.</p>}
      {save.error && <p className="errors">{save.error.message}</p>}
      {justSaved && <p className="saved">Saved. The quote is kept as priced today{stored.validUntil && `, valid until ${new Date(stored.validUntil).toLocaleDateString()}`}.</p>}

      <div className="tabs" role="tablist">
        {names.map((n, i) => (
          <button key={i} type="button" role="tab" aria-selected={i === tab} className={i === tab ? 'tab active' : 'tab'} onClick={() => setTab(i)}>{n}</button>
        ))}
        <button type="button" className="link" onClick={() => {
          change((d) => { d.counters.push(newCounter('Kitchen', firstMaterial, firstEdge)); });
          setTab(job.counters.length);
        }}>+ Add counter</button>
      </div>

      <div className="editor">
        <section className="card settings">
          <h2>Counter settings</h2>
          <div className="form">
            <label>Room
              <select value={counter.room} onChange={(e) => editCounter((c) => withRoom(c, e.target.value as Room))}>
                {ROOMS.map((r) => <option key={r}>{r}</option>)}
              </select>
            </label>
            <label>Layout
              <select value={layout} onChange={(e) => editCounter((c) => withLayout(c, e.target.value as 'Straight' | 'L' | 'U'))}>
                {(['Straight', 'L', 'U'] as const).map((l) => <option key={l} value={l}>{LAYOUT_NAMES[l]}</option>)}
                {layout === 'Custom' && <option value="Custom" disabled>Custom</option>}
              </select>
            </label>
            <label>Material
              <select value={counter.materialId} onChange={(e) => editCounter((c) => { c.materialId = Number(e.target.value); })}>
                {!prices.materials.some((m) => m.id === counter.materialId) && <option value={counter.materialId}>No longer in the price list</option>}
                {prices.materials.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </label>
            <div role="group" aria-label="Thickness" className="toggle">
              {([2, 3] as const).map((t) => (
                <button key={t} type="button" aria-pressed={counter.thickness === t} onClick={() => editCounter((c) => { c.thickness = t; })}>{t} cm</button>
              ))}
            </div>
            <label>Edge profile
              <select value={counter.edgeProfileId} onChange={(e) => editCounter((c) => { c.edgeProfileId = Number(e.target.value); })}>
                {!prices.edgeProfiles.some((x) => x.id === counter.edgeProfileId) && <option value={counter.edgeProfileId}>No longer in the price list</option>}
                {prices.edgeProfiles.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
              </select>
            </label>
            <label className="check">
              <input type="checkbox" checked={counter.backsplash} onChange={(e) => editCounter((c) => { c.backsplash = e.target.checked; })} />
              4″ backsplash on covered edges
            </label>
          </div>

          <h3>Legs</h3>
          <div role="group" aria-label="Units" className="toggle">
            <button type="button" aria-pressed={unit === 'in'} onClick={() => setUnit('in')}>ft / in</button>
            <button type="button" aria-pressed={unit === 'm'} onClick={() => setUnit('m')}>metres</button>
          </div>
          {counter.legs.map((l, i) => (
            <fieldset key={i} className="leg">
              <legend>Leg {i + 1}</legend>
              {i > 0 && (
                <label>Turn °
                  <input type="number" className="number" min="45" max="175" value={Number.isNaN(l.turnAngle) ? '' : l.turnAngle}
                    onChange={(e) => editLeg(i, (x) => { x.turnAngle = e.target.valueAsNumber; })} />
                </label>
              )}
              <MeasureInput label={`Leg ${i + 1} length`} inches={l.length} unit={unit} onChange={(n) => editLeg(i, (x) => { x.length = n; })} />
              <MeasureInput label={`Leg ${i + 1} depth`} inches={l.depth} unit={unit} onChange={(n) => editLeg(i, (x) => { x.depth = n; })} />
              {counter.legs.length > 1 && (
                <button type="button" className="link" onClick={() => editCounter((c) => { c.legs.splice(i, 1); })}>Remove leg {i + 1}</button>
              )}
            </fieldset>
          ))}
          <p className="muted">Type 10′ 6″, 126, 23 1/2 or 3.2 m.</p>
          <button type="button" className="link" onClick={() => editCounter((c) => { c.legs.push(newLeg(c.room, 96, c.legs[c.legs.length - 1].depth)); })}>+ Add leg</button>

          <h3>Cutouts</h3>
          {cutouts.length === 0 && <p className="muted">No sink or cooktop on this counter.</p>}
          {cutouts.map((c, n) => {
            const edit = (e: (x: Leg['cutouts'][number]) => void) => editLeg(c.leg, (l) => { e(l.cutouts[c.i]); });
            return (
              <fieldset key={`${c.leg}-${c.i}`} className="leg">
                <legend>{CUTOUTS[c.kind].name} {n + 1}</legend>
                <label>Kind
                  <select value={c.kind} onChange={(e) => edit((x) => { x.kind = e.target.value as CutoutKind; })}>
                    {(Object.keys(CUTOUTS) as CutoutKind[]).map((k) => <option key={k} value={k}>{CUTOUTS[k].name}</option>)}
                  </select>
                </label>
                {counter.legs.length > 1 && (
                  <label>On leg
                    <select value={c.leg} onChange={(e) => editCounter((k) => {
                      const [moved] = k.legs[c.leg].cutouts.splice(c.i, 1);
                      k.legs[Number(e.target.value)].cutouts.push(moved);
                    })}>
                      {counter.legs.map((_, i) => <option key={i} value={i}>Leg {i + 1}</option>)}
                    </select>
                  </label>
                )}
                <MeasureInput label="Centerline from leg start" inches={c.centerline} unit={unit} onChange={(v) => edit((x) => { x.centerline = v; })} />
                {c.kind !== 'cooktop' && (
                  <label>Faucet holes
                    <input type="number" className="number" min="0" max="5" value={c.faucetHoles}
                      onChange={(e) => edit((x) => { x.faucetHoles = Math.max(0, Math.min(5, e.target.valueAsNumber || 0)); })} />
                  </label>
                )}
                <button type="button" className="link" onClick={() => editCounter((k) => { k.legs[c.leg].cutouts.splice(c.i, 1); })}>Remove</button>
              </fieldset>
            );
          })}
          <button type="button" className="link" onClick={() => editLeg(0, (l) => {
            l.cutouts.push({ kind: 'undermount', centerline: Math.round(l.length / 2) || 30, faucetHoles: 1 });
          })}>+ Add cutout</button>

          <h3>Edges and corners</h3>
          <p className="muted">Checked means exposed: polished and charged. Unchecked is covered by a wall or appliance.</p>
          {counter.legs.flatMap((l, i) => SIDES.filter((s) => (s !== 'start' || i === 0) && (s !== 'end' || i === counter.legs.length - 1)).map((s) => (
            <label key={`${i}${s}`} className="check">
              <input type="checkbox" checked={!l[`${s}Covered`]} onChange={(e) => editLeg(i, (x) => { x[`${s}Covered`] = !e.target.checked; })} />
              {sideLabel(i, s)}
            </label>
          )))}
          {CORNERS.map(([key, label]) => {
            const leg = key.startsWith('start') ? 0 : counter.legs.length - 1;
            return (
              <label key={key} className="check">
                <input type="checkbox" checked={counter.legs[leg][key]} onChange={(e) => editLeg(leg, (x) => { x[key] = e.target.checked; })} />
                {label} corner rounded
              </label>
            );
          })}
          {job.counters.length > 1 && <button type="button" className="link danger" onClick={removeCounter}>Remove this counter</button>}
        </section>

        <section className="card">
          <h2>Plan · {name}</h2>
          <PlanView legs={counter.legs} unit={unit} edgeName={edgeName}
            onToggleEdge={(leg, side) => editLeg(leg, (x) => { x[`${side}Covered`] = !x[`${side}Covered`]; })}
            onToggleCorner={(leg, key) => editLeg(leg, (x) => { x[key] = !x[key]; })} />
          <h3>Checks</h3>
          {errors.length + warnings.length === 0 && <p className="saved">Shape looks good.</p>}
          {errors.length > 0 && <ul className="errors">{errors.map((m) => <li key={m}>{m}</li>)}</ul>}
          {warnings.length > 0 && <ul className="warnings">{warnings.map((m) => <li key={m}>{m}</li>)}</ul>}
          {errors.length === 0 && (
            <p className="muted">Area {summary.areaSqFt.toFixed(1)} sq ft · Seams {summary.seams} · Slab estimate {summary.slabEstimate}</p>
          )}
        </section>

        <aside className="card quote">
          <h2>Quote</h2>
          {quote.total == null ? (
            <p className="errors">No price until the shape is fixed. See Checks on: {names.filter((n) => quote.errors.some((m) => m.startsWith(`${n}: `))).join(', ')}.</p>
          ) : (
            <table>
              <tbody>
                {quote.items.map((x, i) => (
                  <tr key={i}>
                    <td>
                      {(i === 0 || quote.items[i - 1].counter !== x.counter) && <strong className="group">{x.counter}</strong>}
                      {x.description}
                      <div className="muted">{x.unit === 'job' ? '' : `${x.quantity} ${x.unit} × $${x.rate.toFixed(2)}`}</div>
                    </td>
                    <td className="amount">${x.amount.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <label className="check">
            <input type="checkbox" checked={job.tearOut} onChange={(e) => change((d) => { d.tearOut = e.target.checked; })} />
            Tear-out of old counters
          </label>
          <fieldset className="leg">
            <legend>Additional requirements</legend>
            {job.additionalRequirements.map((r, i) => (
              <div key={i} className="requirement">
                <input aria-label={`Requirement ${i + 1}`} placeholder="e.g. Extra outlet cutout" maxLength={200} value={r.description}
                  onChange={(e) => change((d) => { d.additionalRequirements[i].description = e.target.value; })} />
                $ <input aria-label={`Requirement ${i + 1} price`} type="number" className="number" min="0" max="1000000" step="0.01"
                  value={Number.isNaN(r.price) ? '' : r.price}
                  onChange={(e) => change((d) => { d.additionalRequirements[i].price = e.target.valueAsNumber; })} />
                <button type="button" className="link" onClick={() => change((d) => { d.additionalRequirements.splice(i, 1); })}>Remove</button>
              </div>
            ))}
            <button type="button" className="link" onClick={() => change((d) => { d.additionalRequirements.push({ description: '', price: NaN }); })}>
              + Add requirement
            </button>
          </fieldset>
          <p className="total">Total <strong>{quote.total == null ? '—' : `$${quote.total.toFixed(2)}`}</strong></p>
        </aside>
      </div>
    </form>
  );
}

const STEP = { in: 1, m: 1 / 2.54 }; // 1″, or 1 cm

/** A size box that takes shop formats; it keeps what is typed and tidies it on leaving the box. A box that can't be read is NaN. */
function MeasureInput({ label, inches, unit, onChange }: { label: string; inches: number; unit: Unit; onChange: (inches: number) => void }) {
  const shown = Number.isNaN(inches) ? '' : formatMeasurement(inches, unit);
  const [text, setText] = useState(shown);
  const [typing, setTyping] = useState(false);
  useEffect(() => { if (!typing) setText(shown); }, [shown, typing]);
  const bump = (by: number) => onChange(Math.max(0.125, Math.round(((Number.isNaN(inches) ? 0 : inches) + by) * 8) / 8));
  return (
    <label>{label.replace(/^Leg \d+ /, '').replace(/^./, (c) => c.toUpperCase())}
      <span className="measure">
        <button type="button" aria-label={`${label} smaller`} onClick={() => bump(-STEP[unit])}>−</button>
        <input aria-label={label} value={text} aria-invalid={Number.isNaN(inches)} className={Number.isNaN(inches) ? 'bad' : undefined}
          onFocus={() => setTyping(true)} onBlur={() => setTyping(false)}
          onChange={(e) => { setText(e.target.value); onChange(parseMeasurement(e.target.value, unit) ?? NaN); }} />
        <button type="button" aria-label={`${label} larger`} onClick={() => bump(STEP[unit])}>+</button>
      </span>
    </label>
  );
}
