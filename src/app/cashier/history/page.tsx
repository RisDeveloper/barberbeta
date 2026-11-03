import { guard } from "@/lib/guard"; import { prisma } from "@/lib/db"; import { rp } from "@/lib/time"; import { st } from "@/lib/labels";
export default async function History() {
  const u = await guard("CASHIER"); const b = await prisma.branch.findUniqueOrThrow({ where: { id: u.branchId } });
  const rows = await prisma.transaction.findMany({ where: { branchId: u.branchId, cashierId: u.id }, orderBy: { createdAt: "desc" }, take: 50, include: { artist: { select: { name: true } } } });
  return (<><h1>Riwayat Transaksi</h1><div className="card"><table><thead><tr><th>ID</th><th>Waktu</th><th>Layanan</th><th>Barber</th><th>Total</th><th>Status</th></tr></thead><tbody>
    {rows.map((t) => (<tr key={t.id}><td>{t.publicId}</td><td>{t.createdAt.toLocaleString("id-ID", { timeZone: b.timezone })}</td><td>{t.serviceName}</td><td>{t.artist.name}</td><td>{rp(t.totalRp)}</td>
      <td><span className={"pill " + (t.status === "COMPLETED" ? "ok" : "bad")}>{st(t.status)}</span></td></tr>))}
    {!rows.length && <tr><td colSpan={6}>Belum ada transaksi.</td></tr>}</tbody></table><div className="portal" style={{ margin: "10px 0 0" }}>Menampilkan 50 transaksi terbaru Anda.</div></div></>);
}
