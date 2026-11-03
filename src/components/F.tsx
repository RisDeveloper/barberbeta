export function F({ l, n, t = "text", d, o, r, ph }: { l: string; n: string; t?: string; d?: string | number | null; o?: [string, string][]; r?: boolean; ph?: string }) {
  return (<label style={{ display: "block" }}>{l}{o
    ? <select name={n} className="field" style={{ margin: 0 }} defaultValue={d ?? ""} required={r}>{o.map(([v, x]) => <option key={v} value={v}>{x}</option>)}</select>
    : <input name={n} type={t} className="field" style={{ margin: 0 }} defaultValue={d ?? undefined} required={r} placeholder={ph} />}</label>);
}
