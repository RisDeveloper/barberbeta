import { guard } from "@/lib/guard"; import { prisma } from "@/lib/db"; import { startOfLocalDay } from "@/lib/time";
import ProfileCard from "@/components/ProfileCard";
export default async function Profile() {
  const u = await guard("CASHIER"); const b = await prisma.branch.findUniqueOrThrow({ where: { id: u.branchId } });
  const since = startOfLocalDay(b.timezone);
  const [tx, exp, svc] = await Promise.all([
    prisma.transaction.count({ where: { branchId: b.id, status: "COMPLETED", createdAt: { gte: since } } }),
    prisma.expenseRecord.count({ where: { branchId: b.id, voidedAt: null, date: { gte: since } } }),
    prisma.service.count({ where: { deletedAt: null } }) ]);
  return (<><h1>Profil</h1><ProfileCard name={u.name} role="Kasir" email={u.email}
    stats={[["Transaksi hari ini", tx], ["Pengeluaran hari ini", exp], ["Layanan", svc]]}
    rows={[["Cabang", b.name], ["Zona waktu", b.timezone]]} /></>);
}
