import { guard } from "@/lib/guard"; import { prisma } from "@/lib/db"; import { stats } from "@/lib/earnings";
import { startOfLocalDay, startOfLocalWeek, startOfLocalMonth, localParts, dayStart, validDate, rp } from "@/lib/time"; import { st } from "@/lib/labels";
export default async function Earnings({ searchParams }: { searchParams: { from?: string; to?: string } }) {
  const u = await guard("EMPLOYEE"); const b = await prisma.branch.findUniqueOrThrow({ where: { id: u.branchId } }), tz = b.timezone;
  const from = validDate(searchParams.from), to = validDate(searchParams.to);
  const range = { ...(from && { gte: dayStart(from, tz) }), ...(to && { lt: new Date(dayStart(to, tz).getTime() + 86400000) }) };
  const base = { userId: u.id, transaction: { status: "COMPLETED" as const } };
  const day0 = startOfLocalDay(tz), weekAgo = new Date(day0.getTime() - 6 * 86400000);
  const [today, week, month, served, byStatus, recent, rows] = await Promise.all([
    stats(u.id, day0), stats(u.id, startOfLocalWeek(tz)), stats(u.id, startOfLocalMonth(tz)),
    prisma.transaction.count({ where: { artistId: u.id, status: "COMPLETED" } }),
    prisma.commission.groupBy({ by: ["status"], where: base, _sum: { amountRp: true } }),
    prisma.commission.findMany({ where: { ...base, status: { not: "REVERSED" }, createdAt: { gte: weekAgo } }, select: { createdAt: true, amountRp: true } }),
    prisma.commission.findMany({ where: { ...base, createdAt: range }, orderBy: { createdAt: "desc" }, take: 100, include: { transaction: { select: { publicId: true, serviceName: true } } } }) ]);
  const sum = (...s: string[]) => byStatus.filter((x) => s.includes(x.status)).reduce((a, x) => a + (x._sum.amountRp ?? 0), 0);
  const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(weekAgo.getTime() + i * 86400000); return { key: localParts(d, tz).date, label: d.toLocaleDateString("id-ID", { timeZone: tz, weekday: "short" }), v: 0 }; });
  for (const c of recent) { const d = days.find((x) => x.key === localParts(c.createdAt, tz).date); if (d) d.v += c.amountRp; }
  const max = Math.max(1, ...days.map((d) => d.v)), periodTotal = rows.filter((r) => r.status !== "REVERSED").reduce((a, r) => a + r.amountRp, 0);
  return (<><h1>Pendapatan Saya</h1>
    <div className="grid stats">
      <div className="card stat"><small>Hari ini</small><b>{rp(today.earningsRp)}</b></div><div className="card stat"><small>Minggu ini</small><b>{rp(week.earningsRp)}</b></div>
      <div className="card stat"><small>Bulan ini</small><b>{rp(month.earningsRp)}</b></div><div className="card stat"><small>Pelanggan dilayani (total)</small><b>{served}</b></div>
      <div className="card stat"><small>Total komisi yang memenuhi syarat</small><b>{rp(sum("PENDING", "APPROVED", "PAID"))}</b></div><div className="card stat"><small>Menunggu / disetujui</small><b>{rp(sum("PENDING", "APPROVED"))}</b></div>
      <div className="card stat"><small>Dibayar</small><b>{rp(sum("PAID"))}</b></div></div>
    <div className="card" style={{ marginTop: 16 }}><h2>Pendapatan · 7 hari terakhir</h2><div className="bars">{days.map((d, i) => <i key={d.key} className={i === 6 ? "hi" : ""} style={{ height: Math.max(2, (d.v / max) * 100) + "%" }} title={rp(d.v)} />)}</div>
      <div className="lbl">{days.map((d) => <span key={d.key}>{d.label}</span>)}</div></div>
    <div className="card" style={{ marginTop: 16 }}><h2>Riwayat pendapatan</h2>
      <form style={{ display: "flex", gap: 8, alignItems: "end", marginBottom: 12, flexWrap: "wrap" }}>
        <div><label htmlFor="f">Dari</label><input id="f" name="from" type="date" className="field" style={{ margin: 0 }} defaultValue={from} /></div>
        <div><label htmlFor="t">Sampai</label><input id="t" name="to" type="date" className="field" style={{ margin: 0 }} defaultValue={to} /></div>
        <button className="btn" style={{ width: 120 }}>Saring</button></form>
      <table><thead><tr><th>Tanggal</th><th>Transaksi</th><th>Layanan</th><th>Komisi</th><th>Status</th></tr></thead><tbody>
        {rows.map((r) => (<tr key={r.id}><td>{r.createdAt.toLocaleDateString("id-ID", { timeZone: tz })}</td><td>{r.transaction.publicId}</td><td>{r.transaction.serviceName}</td><td>{rp(r.amountRp)}</td><td><span className={"pill " + (r.status === "PAID" ? "ok" : r.status === "REVERSED" ? "bad" : "late")}>{st(r.status)}</span></td></tr>))}
        {!rows.length && <tr><td colSpan={5}>Belum ada pendapatan pada periode ini.</td></tr>}</tbody></table>
      <div className="portal" style={{ margin: "10px 0 0" }}>Total periode (tanpa yang dibatalkan): <b>{rp(periodTotal)}</b> · 100 terbaru ditampilkan</div></div></>);
}
