import { guard } from "./guard"; import { prisma } from "./db";
/** Branch always comes from the admin's session. Every admin page and export starts here. */
export async function ctx() {
  const u = await guard("ADMIN"); const b = await prisma.branch.findUniqueOrThrow({ where: { id: u.branchId } });
  return { u, b, tz: b.timezone, branchId: u.branchId };
}
