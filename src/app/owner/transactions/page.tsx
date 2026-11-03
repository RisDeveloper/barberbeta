import { prisma } from "@/lib/db"; import { ownerCtx, TZ } from "@/lib/owner"; import { resolveRange, qs, type SP } from "@/lib/range"; import RangeFilter from "@/components/RangeFilter"; import BranchSel from "@/components/BranchSel"; import { F } from "@/components/F"; import Tbl from "@/components/Tbl"; import { dt, rp } from "@/lib/time"; import { st } from "@/lib/labels";
const ST = ["COMPLETED", "CANCELLED", "REFUNDED"] as const, PAGE = 20;
export default async function All({ searchParams: sp }: { searchParams: SP }) {
  await ownerCtx(); const { gte, lt } = resolveRange(sp, TZ), pg = Math.max(1, +(sp.page ?? 1) || 1), status = ST.find((s) => s === sp.status);
  const where = { createdAt: { gte, lt }, ...(sp.branch && { branchId: sp.branch }), ...(sp.cashier && { cashierId: sp.cashier }), ...(sp.artist && { artistId: sp.artist }), ...(status && { status }),
    ...(sp.service && { serviceName: { contains: sp.service, mode: "insensitive" as const } }), ...(sp.q && { publicId: { contains: sp.q, mode: "insensitive" as const } }) };
  const [total, rows, staff] = await Promise.all([prisma.transaction.count({ where }), prisma.transaction.findMany({ where, orderBy: { createdAt: "desc" }, skip: (pg - 1) * PAGE, take: PAGE,
    include: { branch: { select: { name: true } }, cashier: { select: { name: true } }, artist: { select: { name: true } } } }), prisma.user.findMany({ where: { role: { in: ["CASHIER", "EMPLOYEE"] } }, select: { id: true, name: true, role: true }, orderBy: { name: "asc" } })]);
  const opt = (r: string) => [["", "Semua"], ...staff.filter((s) => s.role === r).map((s) => [s.id, s.name])] as [string, string][];
  return (<><h1>Semua Transaksi</h1><RangeFilter sp={sp}><BranchSel sp={sp} /><F l="Kasir" n="cashier" d={sp.cashier} o={opt("CASHIER")} /><F l="Barber" n="artist" d={sp.artist} o={opt("EMPLOYEE")} /><F l="Layanan" n="service" d={sp.service} />
    <F l="Status" n="status" d={sp.status} o={[["", "Semua"], ...ST.map((s) => [s, st(s)] as [string, string])]} /><F l="Cari ID" n="q" d={sp.q} /></RangeFilter>
    <Tbl head={["ID", "Cabang", "Tanggal", "Kasir", "Barber", "Layanan", "Total", "Tunai", "Kembalian", "Status"]} rows={rows.map((t) => [t.publicId, t.branch.name, dt(t.createdAt, TZ), t.cashier.name, t.artist.name, t.serviceName, rp(t.totalRp), rp(t.cashReceivedRp), rp(t.changeRp),
      <span className={"pill " + (t.status === "COMPLETED" ? "ok" : "bad")}>{st(t.status)}</span>])} empty="Belum ada transaksi." />
    <div style={{ display: "flex", gap: 8, marginTop: 12 }}>{pg > 1 && <a href={qs(sp, { page: String(pg - 1) })}>← Sebelumnya</a>}<span className="portal" style={{ margin: 0 }}>Halaman {pg} dari {Math.max(1, Math.ceil(total / PAGE))} · {total} total</span>{pg * PAGE < total && <a href={qs(sp, { page: String(pg + 1) })}>Berikutnya →</a>}</div></>);
}
