import type { ReactNode } from "react";
export default function Tbl({ head, rows, empty = "Belum ada data." }: { head: string[]; rows: ReactNode[][]; empty?: string }) {
  return (<div className="card"><table><thead><tr>{head.map((h) => <th key={h}>{h}</th>)}</tr></thead><tbody>{rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j}>{c}</td>)}</tr>)}
    {!rows.length && <tr><td colSpan={head.length}>{empty}</td></tr>}</tbody></table></div>);
}
