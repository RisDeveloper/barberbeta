import { notFound } from "next/navigation"; import { prisma } from "@/lib/db"; import { ctx } from "@/lib/admin"; import { dt, rp } from "@/lib/time"; import { st } from "@/lib/labels"; import { voidTransaction } from "../../actions";
export default async function Detail({ params }: { params: { id: string } }) {
  const { tz, branchId } = await ctx();
  const t = await prisma.transaction.findFirst({ where: { publicId: params.id, branchId }, // branch filter: another branch's ID simply 404s
    include: { cashier: { select: { name: true } }, artist: { select: { name: true } }, commissions: { include: { user: { select: { name: true } } } } } });
  if (!t) notFound();
  return (<><h1>{t.publicId}</h1><div className="card" style={{ maxWidth: 560 }}>
    {([["Tanggal", dt(t.createdAt, tz)], ["Status", st(t.status)], ["Kasir", t.cashier.name], ["Barber", t.artist.name], ["Pelanggan", t.customerName ?? "—"], ["Layanan", t.serviceName], ["Harga", rp(t.priceRp)],
      ["Diskon", rp(t.discountRp)], ["Total", rp(t.totalRp)], ["Tunai diterima", rp(t.cashReceivedRp)], ["Kembalian", rp(t.changeRp)]] as const).map(([k, v]) => <div className="row" key={k}><span>{k}</span>{v}</div>)}
    <h2 style={{ marginTop: 16 }}>Komisi</h2>{t.commissions.map((c) => <div className="row" key={c.id}><span>{c.user.name}</span>{rp(c.amountRp)} · {st(c.status)}</div>)}
    {t.status === "COMPLETED" && (<div style={{ marginTop: 16 }}><form action={voidTransaction} className="fr"><input type="hidden" name="id" value={t.publicId} /><input type="hidden" name="kind" value="CANCELLED" /><label>Alasan pembatalan<input name="reason" className="field" required minLength={3} /></label><button className="btn s t">Batalkan</button></form>
    <form action={voidTransaction} className="fr" style={{ marginTop: 8 }}><input type="hidden" name="id" value={t.publicId} /><input type="hidden" name="kind" value="REFUNDED" /><label>Alasan pengembalian<input name="reason" className="field" required minLength={3} /></label><button className="btn s t">Kembalikan</button></form></div>)}</div></>);
}
