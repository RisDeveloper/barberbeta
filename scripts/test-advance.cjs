const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();
(async () => {
  const a = await db.user.findFirst({ where: { role: "EMPLOYEE" } });
  const rec = await db.attendanceRecord.findFirst({ where: { userId: a.id }, orderBy: { checkInAt: "desc" } });
  if (!rec) throw new Error("no record");
  await db.attendanceRecord.update({ where: { id: rec.id }, data: { checkInAt: new Date(Date.now() - 10 * 60 * 1000) } });
  console.log("backdated", rec.id);
  await db.$disconnect();
})();
