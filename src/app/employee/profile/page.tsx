import { guard } from "@/lib/guard"; import { prisma } from "@/lib/db";
import { stats } from "@/lib/earnings"; import { startOfLocalMonth, todayLocal, rp } from "@/lib/time";
import ProfileCard from "@/components/ProfileCard";
export default async function Profile() {
  const u = await guard("EMPLOYEE"); const b = await prisma.branch.findUniqueOrThrow({ where: { id: u.branchId } });
  const month = todayLocal(b.timezone).slice(0, 7);
  const [card, m, served, hadir] = await Promise.all([
    prisma.employeeCard.findUnique({ where: { userId: u.id } }),
    stats(u.id, startOfLocalMonth(b.timezone)),
    prisma.transaction.count({ where: { artistId: u.id, status: "COMPLETED" } }),
    prisma.attendanceRecord.count({ where: { userId: u.id, workDate: { startsWith: month } } }) ]);
  return (<><h1>Profil Saya</h1><ProfileCard name={u.name} role="Barber" email={u.email}
    stats={[["Pelanggan", served], ["Komisi bulan ini", rp(m.earningsRp)], ["Hadir bulan ini", hadir]]}
    rows={[["ID Karyawan", u.id.slice(-8).toUpperCase()], ["Cabang", b.name], ["Kartu absensi", card?.active ? "Terdaftar" : "Belum terdaftar"]]}
    note="Peran dan cabang hanya dapat diubah oleh pemilik." /></>);
}
