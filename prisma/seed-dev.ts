// DEV ONLY sample data (clearly fake). Refuses to run in production.
import { PrismaClient } from "@prisma/client"; import bcrypt from "bcryptjs";
const db = new PrismaClient();
async function main() {
  if (process.env.NODE_ENV === "production") throw new Error("Dev seed disabled in production");
  const pinHash = await bcrypt.hash("123456", 10);
  const branch = await db.branch.create({ data: { name: "[DEV] Cabang 01" } });
  await db.user.create({ data: { email: "kasir01@dev.local", name: "[DEV] Kasir 01", role: "CASHIER", branchId: branch.id, pinHash } });
  await db.user.create({ data: { email: "admin01@dev.local", name: "[DEV] Admin 01", role: "ADMIN", branchId: branch.id, pinHash } });
  for (const n of ["01", "02", "03"]) await db.user.create({ data: { email: `artist${n}@dev.local`, name: `[DEV] Barber ${n}`, role: "EMPLOYEE", branchId: branch.id, pinHash } });
  for (const [name, priceRp] of [["Cukur", 35000], ["Cukur + Cuci", 50000], ["Rapikan Jenggot", 20000]] as const) await db.service.create({ data: { name, priceRp } });
  const from = new Date(Date.now() - 86400000);
  await db.commissionRule.create({ data: { role: "EMPLOYEE", type: "FIXED", value: 10000, effectiveFrom: from } });
  await db.commissionRule.create({ data: { role: "CASHIER", type: "PERCENT_BP", value: 200, effectiveFrom: from } });
  console.log("Dev login: kasir01@dev.local / 123456");
}
main().finally(() => db.$disconnect());
