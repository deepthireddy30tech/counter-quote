import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { type FormEvent, useState } from 'react';
import { getPriceList, type PriceList, savePriceList } from '../api';
import { FEE_LABELS, priceListProblems } from '../lib/priceList';

export function PriceListPage() {
  const { data, error } = useQuery({ queryKey: ['priceList'], queryFn: getPriceList, refetchOnWindowFocus: false });

  if (error) return <p className="errors">{error.message}</p>;
  if (!data) return <p>Loading…</p>;
  return <PriceListForm saved={data} />;
}

/** A number box that keeps an empty box as NaN, so the check can ask for a value. */
function NumberInput({ value, onChange, label, step = '0.01' }: { value: number; onChange: (n: number) => void; label: string; step?: string }) {
  return (
    <input type="number" min="0" step={step} aria-label={label} className="number"
      value={Number.isNaN(value) ? '' : value} onChange={(e) => onChange(e.target.valueAsNumber)} />
  );
}

function PriceListForm({ saved }: { saved: PriceList }) {
  const queryClient = useQueryClient();
  const [list, setList] = useState<PriceList>(structuredClone(saved));
  const [problems, setProblems] = useState<string[]>([]);
  const [done, setDone] = useState(false);
  const save = useMutation({
    mutationFn: savePriceList,
    onSuccess: (stored) => {
      queryClient.setQueryData(['priceList'], stored);
      setList(structuredClone(stored)); // added rows now have their ids, so saving again won't add them twice
      setDone(true);
    },
  });

  // every edit goes through a copy, so React sees a new list
  const change = (edit: (draft: PriceList) => void) => {
    const draft = structuredClone(list);
    edit(draft);
    setList(draft);
    setDone(false);
  };
  const savedGroups = list.priceGroups.filter((g) => g.id !== 0);
  const fees = Object.keys(FEE_LABELS).flatMap((kind) => list.fees.filter((f) => f.kind === kind));

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const found = priceListProblems(list);
    setProblems(found);
    if (found.length === 0) save.mutate(list);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="page-title">
        <h1>Price list</h1>
        <button type="submit" className="button" disabled={save.isPending}>Save price list</button>
      </div>
      {problems.length > 0 && <ul className="errors">{problems.map((p) => <li key={p}>{p}</li>)}</ul>}
      {save.error && <p className="errors">{save.error.message}</p>}
      {done && <p className="saved">Saved. New quotes use these prices; saved quotes keep theirs until re-priced.</p>}

      <section className="card">
        <h2>Price groups</h2>
        <p className="muted">Price per square foot of charged area. Waste is built into the price.</p>
        <table>
          <thead><tr><th>Name</th><th>2 cm</th><th>3 cm</th><th /></tr></thead>
          <tbody>
            {list.priceGroups.map((g, i) => (
              <tr key={i}>
                <td><input aria-label="Price group name" value={g.name} onChange={(e) => change((d) => { d.priceGroups[i].name = e.target.value; })} /></td>
                {([2, 3] as const).map((t) => {
                  const r = g.rates.findIndex((x) => x.thickness === t);
                  return (
                    <td key={t}>
                      $ <NumberInput label={`${g.name} ${t} cm price per sq ft`} value={g.rates[r]?.pricePerSqFt ?? NaN}
                        onChange={(n) => change((d) => {
                          const rates = d.priceGroups[i].rates;
                          if (r >= 0) rates[r].pricePerSqFt = n;
                          else rates.push({ thickness: t, pricePerSqFt: n });
                        })} />
                    </td>
                  );
                })}
                <td><button type="button" className="link" onClick={() => change((d) => { d.priceGroups.splice(i, 1); })}>Remove</button></td>
              </tr>
            ))}
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
            {list.materials.map((m, i) => (
              <tr key={i}>
                <td><input aria-label="Material name" value={m.name} onChange={(e) => change((d) => { d.materials[i].name = e.target.value; })} /></td>
                <td>
                  <select aria-label={`${m.name} price group`} value={m.priceGroupId}
                    onChange={(e) => change((d) => { d.materials[i].priceGroupId = Number(e.target.value); })}>
                    <option value={0}>Choose…</option>
                    {savedGroups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
                  </select>
                </td>
                <td><button type="button" className="link" onClick={() => change((d) => { d.materials.splice(i, 1); })}>Remove</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        <button type="button" className="link" onClick={() => change((d) => { d.materials.push({ id: 0, name: '', priceGroupId: 0 }); })}>+ Add material</button>
      </section>

      <section className="card">
        <h2>Edge profiles</h2>
        <p className="muted">Price per linear foot of finished edge.</p>
        <table>
          <thead><tr><th>Name</th><th>Per linear ft</th><th /></tr></thead>
          <tbody>
            {list.edgeProfiles.map((e, i) => (
              <tr key={i}>
                <td><input aria-label="Edge profile name" value={e.name} onChange={(ev) => change((d) => { d.edgeProfiles[i].name = ev.target.value; })} /></td>
                <td>$ <NumberInput label={`${e.name} price per linear ft`} value={e.pricePerLinearFt}
                  onChange={(n) => change((d) => { d.edgeProfiles[i].pricePerLinearFt = n; })} /></td>
                <td><button type="button" className="link" onClick={() => change((d) => { d.edgeProfiles.splice(i, 1); })}>Remove</button></td>
              </tr>
            ))}
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
                <td>{FEE_LABELS[f.kind]}</td>
                <td>
                  {f.kind !== 'quoteValidDays' && '$ '}
                  <NumberInput label={FEE_LABELS[f.kind]} step={f.kind === 'quoteValidDays' ? '1' : '0.01'} value={f.amount}
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
