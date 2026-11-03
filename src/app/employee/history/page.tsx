import { guard } from "@/lib/guard"; import { prisma } from "@/lib/db"; import { rp } from "@/lib/time"; import { st } from "@/lib/labels";
export default async function History() {
  const u = await guard("EMPLOYEE"); const b = await prisma.branch.findUniqueOrThrow({ where: { id: u.branchId } });
  const rows = await prisma.transaction.findMany({ where: { artistId: u.id }, orderBy: { createdAt: "desc" }, take: 100, // only the employee's own services
    select: { id: true, createdAt: true, serviceName: true, totalRp: true, status: true, commissions: { where: { userId: u.id }, select: { amountRp: true } } } });
  return (<><h1>Riwayat Layanan</h1><div className="card"><table><thead><tr><th>Tanggal</th><th>Layanan</th><th>Harga</th><th>Komisi</th><th>Status</th></tr></thead><tbody>
    {rows.map((t) => (<tr key={t.id}><td>{t.createdAt.toLocaleString("id-ID", { timeZone: b.timezone })}</td><td>{t.serviceName}</td><td>{rp(t.totalRp)}</td><td>{rp(t.commissions[0]?.amountRp ?? 0)}</td>
      <td><span className={"pill " + (t.status === "COMPLETED" ? "ok" : "bad")}>{st(t.status)}</span></td></tr>))}
    {!rows.length && <tr><td colSpan={5}>Belum ada layanan.</td></tr>}</tbody></table></div></>);
}
