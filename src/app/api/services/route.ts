export const dynamic = "force-dynamic";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser, branchScope, handle, HttpError } from "@/lib/session";
const Body = z.object({ name: z.string().trim().min(2), priceRp: z.coerce.number().int().min(1), description: z.string().trim().optional() });

export const GET = () => handle(async () => {
  const u = await requireUser(["CASHIER", "ADMIN", "OWNER"]); const branchId = branchScope(u);
  const services = await prisma.service.findMany({ where: { active: true, deletedAt: null, OR: [{ branchId }, { branchId: null }] },
    select: { id: true, name: true, description: true, priceRp: true }, orderBy: { name: "asc" } });
  return Response.json({ services });
});

export const POST = (req: Request) => handle(async () => {
  const u = await requireUser(["CASHIER", "ADMIN", "OWNER"]); const branchId = branchScope(u);
  if (!branchId) throw new HttpError(400, "Cabang tidak ditemukan");
  const d = Body.parse(await req.json());
  const s = await prisma.service.create({ data: { name: d.name, priceRp: d.priceRp, description: d.description ?? null, branchId } });
  return Response.json({ service: { id: s.id, name: s.name, description: s.description, priceRp: s.priceRp } });
});

export const DELETE = (req: Request) => handle(async () => {
  const u = await requireUser(["CASHIER", "ADMIN", "OWNER"]); const branchId = branchScope(u);
  const id = new URL(req.url).searchParams.get("id");
  if (!id) throw new HttpError(400, "ID layanan wajib");
  const s = await prisma.service.findFirst({ where: { id, branchId: branchId ?? undefined, deletedAt: null } });
  if (!s) throw new HttpError(404, "Layanan tidak ditemukan");
  await prisma.service.update({ where: { id }, data: { deletedAt: new Date(), active: false } });
  return Response.json({ ok: true });
});