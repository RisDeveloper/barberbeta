export const dynamic = "force-dynamic";
import { prisma } from "@/lib/db"; import { requireUser, branchScope, handle } from "@/lib/session"; import { resolveRange, csvEsc, type SP } from "@/lib/range"; import { st } from "@/lib/labels";
export const GET = (req: Request) => handle(async () => {
  const u = await requireUser(["ADMIN"]); const branchId = branchScope(u)!; // never taken from the URL
  const sp: SP = Object.fromEntries(new URL(req.url).searchParams); const b = await prisma.branch.findUniqueOrThrow({ where: { id: branchId } });
  const { gte, lt } = resolveRange(sp, b.timezone); let head: string[], data: unknown[][];
  if (sp.type === "attendance") {
    const r = await prisma.attendanceRecord.findMany({ where: { branchId, checkInAt: { gte, lt } }, include: { user: { select: { name: true, role: true } } }, orderBy: { checkInAt: "asc" }, take: 50000 });
    head = ["Karyawan", "Peran", "Tanggal", "Masuk", "Keluar", "Status"]; data = r.map((x) => [x.user.name, x.user.role === "CASHIER" ? "Kasir" : "Barber", x.workDate, x.checkInAt.toISOString(), x.checkOutAt?.toISOString(), st(x.status)]);
  } else if (sp.type === "commissions") {
    const r = await prisma.commission.findMany({ where: { transaction: { branchId, createdAt: { gte, lt } } }, include: { user: { select: { name: true } }, transaction: { select: { publicId: true } } }, orderBy: { createdAt: "asc" }, take: 50000 });
    head = ["Transaksi", "Karyawan", "Jumlah Rp", "Status", "Tanggal"]; data = r.map((x) => [x.transaction.publicId, x.user.name, x.amountRp, st(x.status), x.createdAt.toISOString()]);
  } else {
    const r = await prisma.transaction.findMany({ where: { branchId, createdAt: { gte, lt } }, include: { cashier: { select: { name: true } }, artist: { select: { name: true } } }, orderBy: { createdAt: "asc" }, take: 50000 });
    head = ["ID", "Tanggal", "Kasir", "Barber", "Layanan", "Harga Rp", "Diskon Rp", "Total Rp", "Tunai Rp", "Kembalian Rp", "Status"];
    data = r.map((x) => [x.publicId, x.createdAt.toISOString(), x.cashier.name, x.artist.name, x.serviceName, x.priceRp, x.discountRp, x.totalRp, x.cashReceivedRp, x.changeRp, st(x.status)]);
  }
  const csv = [head, ...data].map((row) => row.map(csvEsc).join(",")).join("\n");
  return new Response(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${sp.type ?? "transactions"}.csv"` } });
});
