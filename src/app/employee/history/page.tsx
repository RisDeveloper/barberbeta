import { guard } from "@/lib/guard"; import { prisma } from "@/lib/db"; import { rp } from "@/lib/time"; import { st } from "@/lib/labels";
export default async function History() {
  const u = await guard("EMPLOYEE"); const b = await prisma.branch.findUniqueOrThrow({ where: { id: u.branchId } });
  const [txs, pays] = await Promise.all([
    prisma.transaction.findMany({ where: { artistId: u.id }, orderBy: { createdAt: "desc" }, take: 100,
      select: { id: true, createdAt: true, serviceName: true, totalRp: true, status: true, commissions: { where: { userId: u.id }, select: { amountRp: true, status: true } } } }),
    prisma.expenseRecord.findMany({ where: { userId: u.id, voidedAt: null, category: { in: ["Kasbon", "Insentif", "Bonus"] } }, orderBy: { date: "desc" }, take: 100 }) ]);
  // unified log sorted by date desc
  type Log = { id: string; date: Date; jenis: string; keterangan: string; amount: number; sign: 1 | -1; status?: string };
  const logs: Log[] = [];
  for (const t of txs) for (const c of t.commissions) logs.push({ id: t.id + c.amountRp, date: t.createdAt, jenis: "Komisi", keterangan: t.serviceName, amount: c.amountRp, sign: 1, status: c.status });
  for (const p of pays) logs.push({ id: p.id, date: p.date, jenis: p.category, keterangan: p.description, amount: p.amountRp, sign: p.category === "Kasbon" ? -1 : 1 });
  logs.sort((a, b) => +b.date - +a.date);
  return (<><h1>Riwayat Lengkap</h1>
    <div className="card"><table><thead><tr><th>Tanggal</th><th>Jenis</th><th>Keterangan</th><th>Jumlah</th><th>Status</th></tr></thead><tbody>
      {logs.map((l) => (<tr key={l.id}><td>{l.date.toLocaleString("id-ID", { timeZone: b.timezone })}</td><td><span className={"pill " + (l.jenis === "Kasbon" ? "bad" : l.jenis === "Komisi" ? "ok" : "late")}>{l.jenis}</span></td><td>{l.keterangan}</td>
        <td style={{ color: l.sign < 0 ? "#A50E0E" : "#0D652D", fontWeight: 600 }}>{l.sign < 0 ? "-" : "+"}{rp(l.amount)}</td>
        <td>{l.status ? <span className={"pill " + (l.status === "PAID" ? "ok" : l.status === "REVERSED" ? "bad" : "late")}>{st(l.status)}</span> : "-"}</td></tr>))}
      {!logs.length && <tr><td colSpan={5}>Belum ada riwayat.</td></tr>}</tbody></table></div></>);
}
