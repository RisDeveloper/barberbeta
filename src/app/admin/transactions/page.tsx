import { prisma } from "@/lib/db"; import { ctx } from "@/lib/admin"; import { resolveRange, qs, type SP } from "@/lib/range"; import RangeFilter from "@/components/RangeFilter"; import { dt, rp } from "@/lib/time"; import { st } from "@/lib/labels";
const ST = ["COMPLETED", "CANCELLED", "REFUNDED"] as const, PAGE = 20;
export default async function Transactions({ searchParams: sp }: { searchParams: SP }) {
  const { tz, branchId } = await ctx(); const { gte, lt } = resolveRange(sp, tz), pg = Math.max(1, +(sp.page ?? 1) || 1);
  const status = ST.find((s) => s === sp.status);
  const where = { branchId, createdAt: { gte, lt }, ...(status && { status }), ...(sp.q && { publicId: { contains: sp.q, mode: "insensitive" as const } }) };
  const [total, rows] = await Promise.all([prisma.transaction.count({ where }), prisma.transaction.findMany({ where, orderBy: { createdAt: "desc" }, skip: (pg - 1) * PAGE, take: PAGE,
    include: { cashier: { select: { name: true } }, artist: { select: { name: true } } } })]);
  return (<><h1>Transaksi</h1><RangeFilter sp={sp}>
    <div><label htmlFor="q">Cari ID</label><input id="q" name="q" className="field" style={{ margin: 0 }} defaultValue={sp.q} /></div>
    <div><label htmlFor="status">Status</label><select id="status" name="status" className="field" style={{ margin: 0 }} defaultValue={sp.status ?? ""}><option value="">Semua</option>{ST.map((s) => <option key={s} value={s}>{st(s)}</option>)}</select></div></RangeFilter>
    <div className="card"><table><thead><tr><th>ID</th><th>Tanggal &amp; waktu</th><th>Kasir</th><th>Barber</th><th>Layanan</th><th>Total</th><th>Tunai</th><th>Kembalian</th><th>Pembayaran</th><th>Status</th></tr></thead><tbody>
      {rows.map((t) => (<tr key={t.id}><td><a href={"/admin/transactions/" + t.publicId}>{t.publicId}</a></td><td>{dt(t.createdAt, tz)}</td><td>{t.cashier.name}</td><td>{t.artist.name}</td><td>{t.serviceName}</td>
        <td>{rp(t.totalRp)}</td><td>{rp(t.cashReceivedRp)}</td><td>{rp(t.changeRp)}</td><td>Tunai</td><td><span className={"pill " + (t.status === "COMPLETED" ? "ok" : "bad")}>{st(t.status)}</span></td></tr>))}
      {!rows.length && <tr><td colSpan={10}>Belum ada transaksi.</td></tr>}</tbody></table>
      <div style={{ display: "flex", gap: 8, marginTop: 12, alignItems: "center" }}>{pg > 1 && <a href={qs(sp, { page: String(pg - 1) })}>← Sebelumnya</a>}<span className="portal" style={{ margin: 0 }}>Halaman {pg} dari {Math.max(1, Math.ceil(total / PAGE))} · {total} total</span>{pg * PAGE < total && <a href={qs(sp, { page: String(pg + 1) })}>Berikutnya →</a>}</div></div></>);
}
