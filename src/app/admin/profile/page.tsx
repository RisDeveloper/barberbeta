import { ctx } from "@/lib/admin"; import { prisma } from "@/lib/db"; import { startOfLocalDay } from "@/lib/time";
import ProfileCard from "@/components/ProfileCard";
export default async function Profile() {
  const { u, b } = await ctx();
  const [barber, tx, svc] = await Promise.all([
    prisma.user.count({ where: { branchId: b.id, role: "EMPLOYEE", deletedAt: null, active: true } }),
    prisma.transaction.count({ where: { branchId: b.id, status: "COMPLETED", createdAt: { gte: startOfLocalDay(b.timezone) } } }),
    prisma.service.count({ where: { deletedAt: null } }) ]);
  return (<><h1>Profil</h1><ProfileCard name={u.name} role="Admin" email={u.email}
    stats={[["Barber", barber], ["Transaksi hari ini", tx], ["Layanan", svc]]}
    rows={[["Cabang", b.name], ["Zona waktu", b.timezone]]} /></>);
}
