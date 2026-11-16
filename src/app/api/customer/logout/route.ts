import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { sha256 } from "@/lib/session";

export const POST = async () => {
  const token = cookies().get("bos_session")?.value;
  if (token) await prisma.session.deleteMany({ where: { tokenHash: sha256(token) } });
  cookies().set("bos_session", "", { path: "/", maxAge: 0 });
  return Response.json({ ok: true });
};
