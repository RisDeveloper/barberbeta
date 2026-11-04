import { guard } from "@/lib/guard"; import { prisma } from "@/lib/db"; import { rp } from "@/lib/time"; import { st } from "@/lib/labels"; import { requestCancel, approveCancel, rejectCancel } from "../actions";
export default async function History() {
  const u = await guard("CASHIER"); const b = await prisma.branch.findUniqueOrThrow({ where: { id: u.branchId } });
  const rows = await prisma.transaction.findMany({ where: { branchId: u.branchId, cashierId: u.id }, orderBy: { createdAt: "desc" }, take: 50, include: { artist: { select: { name: true } } } });
  return (<><h1>Riwayat Transaksi</h1><div className="card"><table><thead><tr><th>ID</th><th>Waktu</th><th>Layanan</th><th>Barber</th><th>Total</th><th>Status</th><th>Aksi</th></tr></thead><tbody>
    {rows.map((t) => (<tr key={t.id}><td>{t.publicId}</td><td>{t.createdAt.toLocaleString("id-ID", { timeZone: b.timezone })}</td><td>{t.serviceName}</td><td>{t.artist.name}</td><td>{rp(t.totalRp)}</td>
      <td><span className={"pill " + (t.status === "COMPLETED" ? "ok" : "bad")}>{st(t.status)}</span>{t.cancelRequested && <div className="portal">Pengajuan: {t.cancelReason ?? "—"}</div>}</td>
      <td>{t.status === "COMPLETED" && !t.cancelRequested && (<form action={requestCancel} className="fr"><input type="hidden" name="id" value={t.publicId} /><select name="kind" className="field" style={{ margin: 0 }}><option value="CANCELLED">Batalkan</option><option value="REFUNDED">Refund</option></select><input name="reason" className="field" placeholder="Alasan" required minLength={3} style={{ margin: 0 }} /><button className="btn s t">Ajukan</button></form>)}
        {t.cancelRequested && (<div className="fr"><form action={approveCancel}><input type="hidden" name="id" value={t.publicId} /><button className="btn s">Setujui</button></form><form action={rejectCancel}><input type="hidden" name="id" value={t.publicId} /><button className="btn s t">Tolak</button></form></div>)}</td></tr>))}
    {!rows.length && <tr><td colSpan={7}>Belum ada transaksi.</td></tr>}</tbody></table><div className="portal" style={{ margin: "10px 0 0" }}>Menampilkan 50 transaksi terbaru Anda.</div></div></>);
}
