import { PrismaClient } from "@prisma/client"; import bcrypt from "bcryptjs";
const db = new PrismaClient();
async function main() {
  const email = process.env.OWNER_EMAIL, pin = process.env.OWNER_PIN;
  if (!email || !pin) throw new Error("Set OWNER_EMAIL and OWNER_PIN in .env");
  await db.user.upsert({ where: { email }, update: {}, create: { email, name: "Pemilik", role: "OWNER", pinHash: await bcrypt.hash(pin, 12) } });
}
main().finally(() => db.$disconnect());
