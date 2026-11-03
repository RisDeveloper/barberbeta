import { cookies } from "next/headers"; import { createHash, randomBytes } from "crypto"; import { ZodError } from "zod";
import { prisma } from "./db"; import type { Role } from "@prisma/client";
export const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");
export class HttpError extends Error { constructor(public status: number, msg?: string) { super(msg ?? String(status)); } }
const COOKIE = "bos_session", TTL = 12 * 3600;

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const secure = process.env.COOKIE_SECURE ? process.env.COOKIE_SECURE === "true" : (process.env.AUTH_URL ?? "").startsWith("https://");
  await prisma.session.create({ data: { tokenHash: sha256(token), userId, expiresAt: new Date(Date.now() + TTL * 1000) } });
  cookies().set(COOKIE, token, { httpOnly: true, secure, sameSite: "lax",
    domain: process.env.COOKIE_DOMAIN || undefined, path: "/", maxAge: TTL });
}
export async function getUser() {
  const token = cookies().get(COOKIE)?.value; if (!token) return null;
  const s = await prisma.session.findUnique({ where: { tokenHash: sha256(token) }, include: { user: true } });
  if (!s || s.expiresAt < new Date() || !s.user.active || s.user.deletedAt) return null;
  return s.user;
}
export async function requireUser(roles: Role[]) {
  const u = await getUser(); if (!u) throw new HttpError(401, "Belum masuk");
  if (!roles.includes(u.role)) throw new HttpError(403, "Akses ditolak"); return u;
}
/** Branch isolation: non-owners are ALWAYS pinned to their own branch; any client-supplied branchId is ignored. */
export function branchScope(u: { role: Role; branchId: string | null }, requested?: string | null) {
  if (u.role === "OWNER") return requested || undefined; // undefined = all branches
  if (!u.branchId) throw new HttpError(403, "Cabang belum ditetapkan"); return u.branchId;
}
export async function handle(fn: () => Promise<Response>) {
  try { return await fn(); } catch (e: any) {
    if (e instanceof HttpError) return Response.json({ error: e.message }, { status: e.status });
    if (e instanceof ZodError) return Response.json({ error: "Input tidak valid", issues: e.issues }, { status: 400 });
    if (e?.code === "P2002") return Response.json({ error: "Permintaan duplikat" }, { status: 409 });
    if (e?.code === "P2003") return Response.json({ error: "Data terkait tidak ditemukan" }, { status: 400 });
    if (e?.code === "P2025") return Response.json({ error: "Tidak ditemukan" }, { status: 404 });
    console.error(e); return Response.json({ error: "Kesalahan server" }, { status: 500 });
  }
}
