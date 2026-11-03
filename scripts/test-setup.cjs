const { PrismaClient } = require("@prisma/client");
const c = require("crypto");
const db = new PrismaClient();
const sha = (s) => c.createHash("sha256").update(s).digest("hex");
(async () => {
  const b = await db.branch.findFirst();
  const key = "test-kiosk-key-123456";
  await db.device.deleteMany({ where: { keyHash: sha(key) } });
  await db.device.create({ data: { branchId: b.id, keyHash: sha(key) } });
  const a = await db.user.findFirst({ where: { role: "EMPLOYEE" } });
  const uid = "1234567890";
  await db.employeeCard.upsert({
    where: { userId: a.id },
    update: { tokenHash: sha(process.env.CARD_PEPPER + uid), active: true },
    create: { userId: a.id, tokenHash: sha(process.env.CARD_PEPPER + uid) },
  });
  await db.attendanceRecord.deleteMany({ where: { userId: a.id } });
  console.log(JSON.stringify({ key, uid, artist: a.id, branch: b.id }));
  await db.$disconnect();
})();
