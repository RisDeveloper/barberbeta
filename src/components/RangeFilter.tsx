import type { ReactNode } from "react"; import type { SP } from "@/lib/range";
const P = [["today", "Hari ini"], ["yesterday", "Kemarin"], ["week", "Minggu ini"], ["month", "Bulan ini"], ["custom", "Rentang khusus"]];
export default function RangeFilter({ sp, def = "month", children }: { sp: SP; def?: string; children?: ReactNode }) {
  return (<form style={{ display: "flex", gap: 8, alignItems: "end", flexWrap: "wrap", marginBottom: 16 }}>
    <div><label htmlFor="range">Periode</label><select id="range" name="range" className="field" style={{ margin: 0 }} defaultValue={sp.range ?? def}>{P.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
    <div><label htmlFor="from">Dari</label><input id="from" name="from" type="date" className="field" style={{ margin: 0 }} defaultValue={sp.from} /></div>
    <div><label htmlFor="to">Sampai</label><input id="to" name="to" type="date" className="field" style={{ margin: 0 }} defaultValue={sp.to} /></div>
    {children}<button className="btn" style={{ width: 110 }}>Terapkan</button></form>);
}
