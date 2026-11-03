"use client";
import { useFormState } from "react-dom"; import { createDevice } from "@/app/owner/actions";
export default function DeviceForm({ branches }: { branches: [string, string][] }) {
  const [s, act] = useFormState(createDevice, {} as { key?: string });
  return (<form action={act} style={{ display: "flex", gap: 8, alignItems: "end", flexWrap: "wrap" }}>
    <label>Cabang<select name="branchId" className="field" style={{ margin: 0 }}>{branches.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
    <button className="btn" style={{ width: 160 }}>Buat kunci kiosk</button>{s.key && <div className="ok pill">Salin sekarang, hanya ditampilkan sekali: <b>{s.key}</b></div>}</form>);
}
