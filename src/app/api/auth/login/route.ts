export const dynamic = "force-dynamic";
import { z } from "zod"; import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db"; import { createSession, handle, HttpError } from "@/lib/session";
const Body = z.object({ email: z.string().trim().email().toLowerCase(), pin: z.string().regex(/^\d{4,8}$/) });
const fails = new Map<string, { n: number; until: number }>(); // NOTE: in-memory; use Redis for multi-instance prod
const DUMMY = bcrypt.hashSync("000000", 12);
const URLS: Record<string, string | undefined> = { OWNER: process.env.PORTAL_OWNER_URL, ADMIN: process.env.PORTAL_ADMIN_URL,
  CASHIER: process.env.PORTAL_CASHIER_URL, EMPLOYEE: process.env.PORTAL_EMPLOYEE_URL };
const PATHS: Record<string, string> = { OWNER: "/owner", ADMIN: "/admin", CASHIER: "/cashier", EMPLOYEE: "/employee" };
export const POST = (req: Request) => handle(async () => {
  const { email, pin } = Body.parse(await req.json());
  const key = `${req.headers.get("x-forwarded-for") ?? "ip"}:${email}`, f = fails.get(key);
  if (f && f.n >= 5 && f.until > Date.now()) throw new HttpError(429, "Terlalu banyak percobaan. Coba lagi nanti.");
  const user = await prisma.user.findUnique({ where: { email } });
  const ok = await bcrypt.compare(pin, user?.pinHash ?? DUMMY);
  if (!user || !ok || !user.active || user.deletedAt) {
    fails.set(key, { n: (f && f.until > Date.now() ? f.n : 0) + 1, until: Date.now() + 15 * 60_000 });
    throw new HttpError(401, "Email atau PIN salah");
  }
  fails.delete(key); await createSession(user.id);
  return Response.json({ redirectTo: URLS[user.role] ?? PATHS[user.role] });
});
