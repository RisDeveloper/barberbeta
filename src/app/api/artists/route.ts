export const dynamic = "force-dynamic";
import { prisma } from "@/lib/db"; import { requireUser, branchScope, handle } from "@/lib/session"; import { todayLocal } from "@/lib/time";
export const GET = () => handle(async () => {
  const u = await requireUser(["CASHIER"]); const branchId = branchScope(u)!;
  const branch = await prisma.branch.findUniqueOrThrow({ where: { id: branchId } });
  const rows = await prisma.user.findMany({ where: { branchId, role: "EMPLOYEE", active: true, deletedAt: null },
    select: { id: true, name: true, attendance: { where: { workDate: todayLocal(branch.timezone) }, select: { checkOutAt: true } } }, orderBy: { name: "asc" } });
  // available = checked in today and not yet checked out
  return Response.json({ artists: rows.map((r) => ({ id: r.id, name: r.name, available: r.attendance.length > 0 && !r.attendance[0].checkOutAt })) });
});
