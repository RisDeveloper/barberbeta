export const dynamic = "force-dynamic";
import { cookies } from "next/headers"; import { prisma } from "@/lib/db"; import { sha256, handle } from "@/lib/session";
export const POST = () => handle(async () => {
  const c = cookies(), t = c.get("bos_session")?.value;
  if (t) await prisma.session.deleteMany({ where: { tokenHash: sha256(t) } });
  c.set("bos_session", "", { maxAge: 0, path: "/", domain: process.env.COOKIE_DOMAIN || undefined });
  return Response.json({ ok: true });
});
