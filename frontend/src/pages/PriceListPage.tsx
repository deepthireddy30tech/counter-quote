import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { type FormEvent, type ReactNode, useEffect, useState } from 'react';
import { useBlocker } from 'react-router-dom';
import { getPriceList, type PriceList, savePriceList } from '../api';
import { feeLabel, FEE_LABELS, isDays, priceListProblems } from '../lib/priceList';

export function PriceListPage() {
  const { data, error } = useQuery({ queryKey: ['priceList'], queryFn: getPriceList, refetchOnWindowFocus: false });

  if (error) return <p className="errors">{error.message}</p>;
  if (!data) return <p>Loading…</p>;
  return <PriceListForm saved={data} />;
}

/**
 * A number box that keeps an empty box as NaN, so the check can ask for a value.
 * `was` is the saved value: the box is highlighted when it differs (undefined = a new row).
 */
function NumberInput({ value, was, onChange, label, step = '0.01', unit = '$' }:
  { value: number; was: number | undefined; onChange: (n: number) => void; label: string; step?: string; unit?: string }) {
  const changed = value !== was;
  const before = was === undefined ? 'New' : `Was ${unit === '$' ? `$${was}` : `${was} ${unit}`}`;
  return (
    <>
      <input type="number" min="0" step={step} className={changed ? 'number changed' : 'number'}
        aria-label={changed ? `${label} (changed, ${before.toLowerCase()})` : label}
        value={Number.isNaN(value) ? '' : value} onChange={(e) => onChange(e.target.valueAsNumber)} />
      {changed && <span className="was" aria-hidden>{before}</span>}
    </>
  );
}

type Section = 'priceGroups' | 'materials' | 'edgeProfiles';
type Row = { id: number; name: string };

/** Warns before the page is left with unsaved changes: in-app links ask, closing the tab gets the browser's prompt. */
function useLeaveWarning(unsaved: boolean) {
  const blocker = useBlocker(unsaved);
  useEffect(() => {
    if (blocker.state !== 'blocked') return;
    if (window.confirm('Leave without saving? Your price list changes will be lost.')) blocker.proceed();
    else blocker.reset();
  }, [blocker]);
  useEffect(() => {
    if (!unsaved) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [unsaved]);
}

function PriceListForm({ saved }: { saved: PriceList }) {
  const queryClient = useQueryClient();
  const [stored, setStored] = useState(saved);
  const [list, setList] = useState<PriceList>(structuredClone(saved));
  // saved rows marked for removal stay on the page with an Undo until the save succeeds
  const [removed, setRemoved] = useState<Set<string>>(new Set());
  const [problems, setProblems] = useState<string[]>([]);
  const [justSaved, setJustSaved] = useState(false);

  const isRemoved = (section: Section, row: Row) => row.id !== 0 && removed.has(`${section}:${row.id}`);
  const toSave: PriceList = {
    ...list,
    priceGroups: list.priceGroups.filter((g) => !isRemoved('priceGroups', g)),
    materials: list.materials.filter((m) => !isRemoved('materials', m)),
    edgeProfiles: list.edgeProfiles.filter((e) => !isRemoved('edgeProfiles', e)),
  };
  const unsaved = removed.size > 0 || JSON.stringify(list) !== JSON.stringify(stored);
  useLeaveWarning(unsaved);

  const save = useMutation({
    mutationFn: savePriceList,
    onSuccess: (fresh) => {
      queryClient.setQueryData(['priceList'], fresh);
      setStored(fresh);
      setList(structuredClone(fresh)); // added rows now have their ids, so saving again won't add them twice
      setRemoved(new Set());
      setJustSaved(true);
    },
  });

  // every edit goes through a copy, so React sees a new list
  const change = (edit: (draft: PriceList) => void) => {
    const draft = structuredClone(list);
    edit(draft);
    setList(draft);
    setJustSaved(false);
  };
  /** A new row is dropped at once; a saved one is marked, or unmarked by Undo. */
  const toggleRemove = (section: Section, i: number) => {
    const row = list[section][i];
    if (row.id === 0) return change((d) => { d[section].splice(i, 1); });
    const next = new Set(removed);
    const k = `${section}:${row.id}`;
    if (next.has(k)) next.delete(k);
    else next.add(k);
    setRemoved(next);
    setJustSaved(false);
  };
  const savedGroups = toSave.priceGroups.filter((g) => g.id !== 0);
  // the saved values each box is compared with, to highlight changed prices
  const wasRate = (groupId: number, t: number) => stored.priceGroups.find((g) => g.id === groupId)?.rates.find((r) => r.thickness === t)?.pricePerSqFt;
  const wasMaterial = (id: number) => stored.materials.find((m) => m.id === id);
  const wasEdge = (id: number) => stored.edgeProfiles.find((e) => e.id === id)?.pricePerLinearFt;
  const wasFee = (kind: string) => stored.fees.find((f) => f.kind === kind)?.amount;
  const groupName = (id: number) => stored.priceGroups.find((g) => g.id === id)?.name;
  const fees = Object.keys(FEE_LABELS).flatMap((kind) => list.fees.filter((f) => f.kind === kind));

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const found = priceListProblems(toSave);
    setProblems(found);
    if (found.length === 0) save.mutate(toSave);
  };

  /** One table row: name box, the section's own cells, then Remove or Undo. */
  const row = (section: Section, i: number, label: string, cells: ReactNode) => {
    const r = list[section][i];
    const gone = isRemoved(section, r);
    return (
      <tr key={i} className={gone ? 'removed' : undefined}>
        <td>
          <input aria-label={`${label} name`} value={r.name} disabled={gone}
            onChange={(e) => change((d) => { d[section][i].name = e.target.value; })} />
        </td>
        {gone ? <td colSpan={section === 'priceGroups' ? 2 : 1} className="muted">Removed when you save</td> : cells}
        <td>
          <button type="button" className="link" aria-label={`${gone ? 'Undo removing' : 'Remove'} ${r.name || `new ${label}`}`}
            onClick={() => toggleRemove(section, i)}>{gone ? 'Undo' : 'Remove'}</button>
        </td>
      </tr>
    );
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="page-title">
        <h1>Price list</h1>
        <div className="page-actions">
          {unsaved && <span className="unsaved">Unsaved changes <span className="muted">(highlighted)</span></span>}
          <button type="submit" className="button" disabled={save.isPending}>Save price list</button>
        </div>
      </div>
      {problems.length > 0 && <ul className="errors">{problems.map((p) => <li key={p}>{p}</li>)}</ul>}
      {save.error && <p className="errors">{save.error.message}</p>}
      {justSaved && <p className="saved">Saved. New quotes use these prices; saved quotes keep theirs until re-priced.</p>}

      <section className="card">
        <h2>Price groups</h2>
        <p className="muted">Price per square foot of charged area. Waste is built into the price.</p>
        <table>
          <thead><tr><th>Name</th><th>2 cm</th><th>3 cm</th><th /></tr></thead>
          <tbody>
            {list.priceGroups.map((g, i) => row('priceGroups', i, 'Price group', ([2, 3] as const).map((t) => {
              const r = g.rates.findIndex((x) => x.thickness === t);
              return (
                <td key={t}>
                  $ <NumberInput label={`${g.name} ${t} cm price per sq ft`} value={g.rates[r]?.pricePerSqFt ?? NaN} was={wasRate(g.id, t)}
                    onChange={(n) => change((d) => {
                      const rates = d.priceGroups[i].rates;
                      if (r >= 0) rates[r].pricePerSqFt = n;
                      else rates.push({ thickness: t, pricePerSqFt: n });
                    })} />
                </td>
              );
            })))}
          </tbody>
        </table>
        <button type="button" className="link" onClick={() => change((d) => {
          d.priceGroups.push({ id: 0, name: '', rates: [{ thickness: 2, pricePerSqFt: NaN }, { thickness: 3, pricePerSqFt: NaN }] });
        })}>+ Add price group</button>
      </section>

      <section className="card">
        <h2>Materials</h2>
        <p className="muted">A new price group can be chosen here once it is saved.</p>
        <table>
          <thead><tr><th>Name</th><th>Price group</th><th /></tr></thead>
          <tbody>
            {list.materials.map((m, i) => row('materials', i, 'Material', (
              <td>
                <select aria-label={`${m.name} price group`} value={m.priceGroupId}
                  className={wasMaterial(m.id)?.priceGroupId === m.priceGroupId ? undefined : 'changed'}
                  onChange={(e) => change((d) => { d.materials[i].priceGroupId = Number(e.target.value); })}>
                  <option value={0}>Choose…</option>
                  {savedGroups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
                {wasMaterial(m.id)?.priceGroupId !== m.priceGroupId &&
                  <span className="was">{wasMaterial(m.id) ? `Was ${groupName(wasMaterial(m.id)!.priceGroupId)}` : 'New'}</span>}
              </td>
            )))}
          </tbody>
        </table>
        <button type="button" className="link" onClick={() => change((d) => { d.materials.push({ id: 0, name: '', priceGroupId: 0 }); })}>+ Add material</button>
      </section>

      <section className="card">
        <h2>Edge profiles</h2>
        <p className="muted">Price per linear foot of exposed edge.</p>
        <table>
          <thead><tr><th>Name</th><th>Per linear ft</th><th /></tr></thead>
          <tbody>
            {list.edgeProfiles.map((e, i) => row('edgeProfiles', i, 'Edge profile', (
              <td>$ <NumberInput label={`${e.name} price per linear ft`} value={e.pricePerLinearFt} was={wasEdge(e.id)}
                onChange={(n) => change((d) => { d.edgeProfiles[i].pricePerLinearFt = n; })} /></td>
            )))}
          </tbody>
        </table>
        <button type="button" className="link" onClick={() => change((d) => { d.edgeProfiles.push({ id: 0, name: '', pricePerLinearFt: NaN }); })}>+ Add edge profile</button>
      </section>

      <section className="card">
        <h2>Fees and settings</h2>
        <table>
          <tbody>
            {fees.map((f) => (
              <tr key={f.kind}>
                <td>{feeLabel(f.kind)}</td>
                <td>
                  {!isDays(f.kind) && '$ '}
                  <NumberInput label={feeLabel(f.kind)} step={isDays(f.kind) ? '1' : '0.01'} unit={isDays(f.kind) ? 'days' : '$'}
                    value={f.amount} was={wasFee(f.kind)}
                    onChange={(n) => change((d) => { d.fees.find((x) => x.kind === f.kind)!.amount = n; })} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </form>
  );
}
