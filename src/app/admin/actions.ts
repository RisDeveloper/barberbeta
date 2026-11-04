"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { guard } from "@/lib/guard";
import { HttpError } from "@/lib/session";

const SvcSchema = z.object({ id: z.string().optional(), name: z.string().trim().min(2), priceRp: z.coerce.number().int().min(1), description: z.string().trim().optional(), active: z.boolean().optional() });

export async function saveService(fd: FormData) {
  const u = await guard("ADMIN");
  const d = SvcSchema.parse({ id: fd.get("id") || undefined, name: fd.get("name"), priceRp: fd.get("priceRp"), description: fd.get("description") || undefined, active: fd.get("active") === "on" });
  const data = { name: d.name, priceRp: d.priceRp, description: d.description ?? null, branchId: u.branchId, active: d.active ?? true };
  if (d.id) {
    const s = await prisma.service.findFirst({ where: { id: d.id, branchId: u.branchId } });
    if (!s) throw new HttpError(404, "Layanan tidak ditemukan");
    await prisma.service.update({ where: { id: d.id }, data });
  } else {
    await prisma.service.create({ data });
  }
  revalidatePath("/admin/services");
}

export async function deleteService(fd: FormData) {
  const u = await guard("ADMIN");
  const id = String(fd.get("id"));
  const s = await prisma.service.findFirst({ where: { id } });
  if (!s) throw new HttpError(404, "Layanan tidak ditemukan");
  await prisma.service.update({ where: { id }, data: { deletedAt: new Date(), active: false } });
  revalidatePath("/admin/services");
}