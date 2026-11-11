const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const db = new PrismaClient();
(async () => {
  const owner = await db.user.findFirst({ where: { role: "OWNER" } });
  if (!owner) { console.log("NO OWNER FOUND"); await db.$disconnect(); return; }
  const newEmail = "ilham@dev.id";
  const newPin = "20011";
  // check unique
  const existing = await db.user.findUnique({ where: { email: newEmail } });
  if (existing && existing.id !== owner.id) {
    console.log("EMAIL TAKEN by", existing.id);
    await db.$disconnect(); return;
  }
  await db.user.update({ where: { id: owner.id }, data: { email: newEmail, pinHash: await bcrypt.hash(newPin, 12) } });
  // delete sessions for this user
  await db.session.deleteMany({ where: { userId: owner.id } });
  console.log("OWNER UPDATED", owner.id, "->", newEmail);
  await db.$disconnect();
})().catch((e) => { console.error(e); process.exit(1); });
