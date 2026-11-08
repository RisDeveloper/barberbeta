"use client";
import { useFormState, useFormStatus } from "react-dom";
import { useEffect, useRef } from "react";
import { F } from "@/components/F";
import { addExpense, addEmployeePay } from "../actions";

type S = { ok?: boolean; error?: string };
function Save({ children }: { children: string }) {
  const { pending } = useFormStatus();
  return <button className="btn s" disabled={pending}>{pending ? "Menyimpan…" : children}</button>;
}
export function ExpenseForm({ cats }: { cats: string[] }) {
  const [s, act] = useFormState<S, FormData>(addExpense, {}), ref = useRef<HTMLFormElement>(null), busy = useRef(false);
  useEffect(() => { busy.current = false; if (s.ok) ref.current?.reset(); }, [s]);
  return (<form ref={ref} action={act} className="fr" onSubmit={(e) => { if (busy.current) e.preventDefault(); else busy.current = true; }}>
    <F l="Keterangan" n="description" ph="cth: sabun, pewangi" r />
    <F l="Kategori" n="category" d="Operasional lain" o={cats.map((c) => [c, c])} />
    <F l="Jumlah (Rp)" n="amountRp" t="number" r />
    <Save>Simpan</Save>
    {s.error && <div className="err">{s.error}</div>}
  </form>);
}
export function EmployeePayForm({ emps }: { emps: [string, string][] }) {
  const [s, act] = useFormState<S, FormData>(addEmployeePay, {}), ref = useRef<HTMLFormElement>(null), busy = useRef(false);
  useEffect(() => { busy.current = false; if (s.ok) ref.current?.reset(); }, [s]);
  return (<form ref={ref} action={act} className="fr" onSubmit={(e) => { if (busy.current) e.preventDefault(); else busy.current = true; }}>
    <F l="Jenis" n="kind" o={[["Kasbon", "Kasbon"], ["Insentif", "Insentif"], ["Bonus", "Bonus"]]} r />
    <F l="Karyawan" n="userId" o={emps} r />
    <F l="Jumlah (Rp)" n="amountRp" t="number" r />
    <Save>Simpan</Save>
    {s.error && <div className="err">{s.error}</div>}
  </form>);
}
