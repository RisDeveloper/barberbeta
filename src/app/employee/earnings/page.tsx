import { guard } from "@/lib/guard"; import { prisma } from "@/lib/db"; import { net } from "@/lib/earnings";
import { startOfLocalDay, startOfLocalMonth, localParts, rp } from "@/lib/time"; import { st } from "@/lib/labels";
import { resolveRange, type SP } from "@/lib/range"; import RangeFilter from "@/components/RangeFilter";
const PAY = ["Kasbon", "Insentif", "Bonus"];
export default async function Earnings({ searchParams }: { searchParams: SP }) {
  const u = await guard("EMPLOYEE"); const b = await prisma.branch.findUniqueOrThrow({ where: { id: u.branchId } }), tz = b.timezone;
  const { gte, lt } = resolveRange(searchParams, tz), base = { userId: u.id, transaction: { status: "COMPLETED" as const } };
  const day0 = startOfLocalDay(tz), tomorrow = new Date(+day0 + 86400000);
  const [todayNet, monthNet, served, byStatus, rows, pays] = await Promise.all([
    net(u.id, day0, tomorrow), net(u.id, startOfLocalMonth(tz), tomorrow),
    prisma.transaction.count({ where: { artistId: u.id, status: "COMPLETED" } }),
    prisma.commission.groupBy({ by: ["status"], where: base, _sum: { amountRp: true } }),
    prisma.commission.findMany({ where: { ...base, createdAt: { gte, lt } }, orderBy: { createdAt: "desc" }, take: 100, include: { transaction: { select: { publicId: true, serviceName: true } } } }),
    prisma.expenseRecord.findMany({ where: { userId: u.id, voidedAt: null, category: { in: PAY }, date: { gte, lt } }, orderBy: { date: "desc" }, take: 100 }) ]);
  const sum = (...s: string[]) => byStatus.filter((x) => s.includes(x.status)).reduce((a, x) => a + (x._sum.amountRp ?? 0), 0);
  const paid = (c: string) => pays.filter((x) => x.category === c).reduce((a, x) => a + x.amountRp, 0);
  const commission = rows.filter((r) => r.status !== "REVERSED").reduce((a, r) => a + r.amountRp, 0);
  const incentive = paid("Insentif"), bonus = paid("Bonus"), kasbon = paid("Kasbon");
  const n = Math.max(1, Math.min(92, Math.round((+lt - +gte) / 86400000)));
  const days = Array.from({ length: n }, (_, i) => { const d = new Date(+gte + i * 86400000); return { key: localParts(d, tz).date, v: 0 }; });
  for (const r of rows) { const d = days.find((x) => x.key === localParts(r.createdAt, tz).date); if (d && r.status !== "REVERSED") d.v += r.amountRp; }
  const max = Math.max(1, ...days.map((d) => d.v));
  return (<><h1>Pendapatan Saya</h1><RangeFilter sp={searchParams} />
    <details style={{ marginTop: 16 }}><summary className="btn s t" style={{ listStyle: "none", display: "inline-flex", alignItems: "center" }}>Lihat pendapatan harian &amp; bulanan</summary>
      <div className="grid stats" style={{ marginTop: 12, gridTemplateColumns: "1fr 1fr" }}>
        <div className="card stat"><small>Penghasilan hari ini</small><b>{rp(todayNet)}</b></div><div className="card stat"><small>Penghasilan bulan ini</small><b>{rp(monthNet)}</b></div>
        <div className="card stat"><small>Insentif</small><b>{rp(incentive)}</b></div><div className="card stat"><small>Bonus</small><b>{rp(bonus)}</b></div>
        <div className="card stat"><small>Kasbon (dipotong)</small><b>{rp(kasbon)}</b></div><div className="card stat"><small>Pelanggan dilayani (total)</small><b>{served}</b></div>
        <div className="card stat"><small>Menunggu / disetujui</small><b>{rp(sum("PENDING", "APPROVED"))}</b></div><div className="card stat"><small>Dibayar</small><b>{rp(sum("PAID"))}</b></div></div></details>
    <div className="card" style={{ marginTop: 16 }}><h2>Komisi harian</h2><div className="bars">{days.map((d) => <i key={d.key} style={{ height: Math.max(2, (d.v / max) * 100) + "%" }} title={rp(d.v)} />)}</div></div>
    <div className="card" style={{ marginTop: 16 }}><h2>Riwayat pendapatan</h2>
      <table><thead><tr><th>Tanggal</th><th>Transaksi</th><th>Layanan</th><th>Komisi</th><th>Status</th></tr></thead><tbody>
        {rows.map((r) => (<tr key={r.id}><td>{r.createdAt.toLocaleDateString("id-ID", { timeZone: tz })}</td><td>{r.transaction.publicId}</td><td>{r.transaction.serviceName}</td><td>{rp(r.amountRp)}</td><td><span className={"pill " + (r.status === "PAID" ? "ok" : r.status === "REVERSED" ? "bad" : "late")}>{st(r.status)}</span></td></tr>))}
        {!rows.length && <tr><td colSpan={5}>Belum ada pendapatan pada periode ini.</td></tr>}</tbody></table>
      <div className="portal" style={{ margin: "10px 0 0" }}>Total komisi periode: <b>{rp(commission)}</b> · 100 terbaru ditampilkan</div></div>
    {!!pays.length && <div className="card" style={{ marginTop: 16 }}><h2>Kasbon, insentif &amp; bonus</h2>
      <table><thead><tr><th>Tanggal</th><th>Jenis</th><th>Jumlah</th></tr></thead><tbody>
        {pays.map((p) => (<tr key={p.id}><td>{p.date.toLocaleDateString("id-ID", { timeZone: tz })}</td><td><span className={"pill " + (p.category === "Kasbon" ? "bad" : "ok")}>{p.category}</span></td><td>{rp(p.amountRp)}</td></tr>))}
      </tbody></table></div>}</>);
}
