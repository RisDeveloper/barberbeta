export const dynamic = "force-dynamic";
import { prisma } from "@/lib/db"; import { requireUser, handle } from "@/lib/session"; import { resolveRange, csvEsc, type SP } from "@/lib/range"; import { TZ } from "@/lib/owner"; import { st } from "@/lib/labels";
export const GET = (req: Request) => handle(async () => {
  await requireUser(["OWNER"]); const sp: SP = Object.fromEntries(new URL(req.url).searchParams), { gte, lt } = resolveRange(sp, TZ), br = sp.branch ? { branchId: sp.branch } : {}, iso = (d?: Date | null) => d?.toISOString(); let head: string[], data: unknown[][];
  if (sp.type === "attendance") {
    const r = await prisma.attendanceRecord.findMany({ where: { ...br, checkInAt: { gte, lt } }, include: { user: { select: { name: true } }, branch: { select: { name: true } } }, orderBy: { checkInAt: "asc" }, take: 50000 });
    head = ["Cabang", "Karyawan", "Tanggal", "Masuk", "Keluar", "Status"]; data = r.map((x) => [x.branch.name, x.user.name, x.workDate, iso(x.checkInAt), iso(x.checkOutAt), st(x.status)]);
  } else if (sp.type === "commissions") {
    const r = await prisma.commission.findMany({ where: { createdAt: { gte, lt }, ...(sp.branch && { transaction: { branchId: sp.branch } }) }, include: { user: { select: { name: true } }, transaction: { select: { publicId: true, branch: { select: { name: true } } } } }, orderBy: { createdAt: "asc" }, take: 50000 });
    head = ["Cabang", "Transaksi", "Karyawan", "Jumlah Rp", "Status", "Tanggal"]; data = r.map((x) => [x.transaction.branch.name, x.transaction.publicId, x.user.name, x.amountRp, st(x.status), iso(x.createdAt)]);
  } else if (sp.type === "finance") {
    const w = { date: { gte, lt }, ...br }, [i, e] = await Promise.all([prisma.incomeRecord.findMany({ where: w, take: 50000 }), prisma.expenseRecord.findMany({ where: w, take: 50000 })]);
    head = ["Jenis", "Tanggal", "Kategori", "Deskripsi", "Jumlah Rp", "Pembayaran", "Dibatalkan", "Alasan pembatalan"]; data = [...i.map((x) => ["pendapatan", ...f(x)]), ...e.map((x) => ["pengeluaran", ...f(x)])];
    function f(x: any) { return [iso(x.date), x.category, x.description, x.amountRp, x.paymentMethod, x.voidedAt ? "ya" : "", x.voidReason]; }
  } else {
    const r = await prisma.transaction.findMany({ where: { ...br, createdAt: { gte, lt } }, include: { branch: { select: { name: true } }, cashier: { select: { name: true } }, artist: { select: { name: true } } }, orderBy: { createdAt: "asc" }, take: 50000 });
    head = ["ID", "Cabang", "Tanggal", "Kasir", "Barber", "Layanan", "Total Rp", "Tunai Rp", "Kembalian Rp", "Status"]; data = r.map((x) => [x.publicId, x.branch.name, iso(x.createdAt), x.cashier.name, x.artist.name, x.serviceName, x.totalRp, x.cashReceivedRp, x.changeRp, st(x.status)]);
  }
  return new Response([head, ...data].map((r) => r.map(csvEsc).join(",")).join("\n"), { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${sp.type ?? "transactions"}.csv"` } });
});
