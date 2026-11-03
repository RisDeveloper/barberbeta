import { redirect } from "next/navigation"; import { getUser } from "./session"; import type { Role } from "@prisma/client";
const URLS: Record<string, string | undefined> = { OWNER: process.env.PORTAL_OWNER_URL, ADMIN: process.env.PORTAL_ADMIN_URL,
  CASHIER: process.env.PORTAL_CASHIER_URL, EMPLOYEE: process.env.PORTAL_EMPLOYEE_URL };
const PATHS: Record<string, string> = { OWNER: "/owner", ADMIN: "/admin", CASHIER: "/cashier", EMPLOYEE: "/employee" };
/** Where a signed-in user belongs (subdomain URL in production, path on localhost). */
export const portalHome = (role: Role) => URLS[role] ?? PATHS[role] ?? "/";
// Every page calls this itself: Next layouts do NOT protect their child pages.
export async function guard(role: Role) {
  const u = await getUser();
  if (!u) redirect(process.env.AUTH_URL ?? "/auth");
  if (u.role !== role || !u.branchId) redirect(portalHome(u.role));
  return u as Omit<typeof u, "branchId"> & { branchId: string };
}
