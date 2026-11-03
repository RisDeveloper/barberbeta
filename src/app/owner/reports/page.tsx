import { prisma } from "@/lib/db"; import { ownerCtx, finance, TZ } from "@/lib/owner"; import { resolveRange, qs, type SP } from "@/lib/range"; import RangeFilter from "@/components/RangeFilter"; import BranchSel from "@/components/BranchSel"; import Tbl from "@/components/Tbl"; import { rp } from "@/lib/time";
export default async function Reports({ searchParams: sp }: { searchParams: SP }) {
  await ownerCtx(); const { gte, lt } = resolveRange(sp, TZ), bs = await prisma.branch.findMany({ where: { deletedAt: null }, orderBy: { name: "asc" } });
  const [total, ...per] = await Promise.all([finance(gte, lt, sp.branch || undefined), ...bs.map((b) => finance(gte, lt, b.id))]);
  const row = (n: string, f: typeof total) => [n, rp(f.revenue), rp(f.income), rp(f.expense), rp(f.commission), <b>{rp(f.net)}</b>];
  return (<><h1>Laporan Keuangan</h1><RangeFilter sp={sp}><BranchSel sp={sp} /></RangeFilter>
    <Tbl head={["", "Penjualan bersih", "Pendapatan tambahan", "Pengeluaran", "Komisi", "Hasil operasional"]} rows={[row(sp.branch ? "Cabang terpilih" : "Semua cabang", total), ...bs.map((b, i) => row(b.name, per[i]))]} />
    <div className="card" style={{ marginTop: 16 }}><h2>Unduh CSV</h2><div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{([["transactions", "Transaksi"], ["finance", "Keuangan"], ["commissions", "Komisi"], ["attendance", "Absensi"]] as const).map(([k, l]) => <a key={k} className="btn t" style={{ width: "auto", display: "inline-grid", placeItems: "center", textDecoration: "none" }} href={"/api/owner/export" + qs({ range: sp.range ?? "month", from: sp.from, to: sp.to, branch: sp.branch }, { type: k })}>{l}</a>)}</div>
      <div className="portal" style={{ margin: "10px 0 0" }}>Hasil operasional = penjualan bersih + pendapatan tambahan − pengeluaran − komisi. Penjualan yang dibatalkan/dikembalikan tidak dihitung. Ekspor PDF belum tersedia.</div></div></>);
}
