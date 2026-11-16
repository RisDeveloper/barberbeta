import { prisma } from "@/lib/db";
import { requireUser, branchScope, handle, HttpError } from "@/lib/session";

export const POST = (req: Request) => handle(async () => {
  const user = await requireUser(["CASHIER"]);
  const branchId = branchScope(user)!;
  const { code } = await req.json().catch(() => ({}));
  const clean = String(code ?? "").trim().toUpperCase();
  if (!clean) throw new HttpError(400, "Kode voucher kosong");
  const v = await prisma.voucher.findUnique({ where: { code: clean }, include: { user: { select: { name: true } } } });
  if (!v) throw new HttpError(404, "Voucher tidak ditemukan");
  if (v.status === "USED") throw new HttpError(409, "Voucher sudah terpakai");
  if (v.status === "EXPIRED") throw new HttpError(409, "Voucher kedaluwarsa");
  const used = await prisma.voucher.updateMany({ where: { id: v.id, status: "ACTIVE" }, data: { status: "USED", usedAt: new Date(), usedByBranchId: branchId } });
  if (!used.count) throw new HttpError(409, "Voucher sudah terpakai");
  return Response.json({ ok: true, code: v.code, name: v.name, discountRp: v.discountRp, member: v.user.name });
});
