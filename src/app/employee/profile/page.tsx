import { guard } from "@/lib/guard"; import { prisma } from "@/lib/db";
export default async function Profile() {
  const u = await guard("EMPLOYEE"); const b = await prisma.branch.findUniqueOrThrow({ where: { id: u.branchId } });
  const card = await prisma.employeeCard.findUnique({ where: { userId: u.id } });
  return (<><h1>Profil Saya</h1><div className="card" style={{ maxWidth: 480 }}>
    <div className="row"><span>Nama</span>{u.name}</div><div className="row"><span>ID Karyawan</span>{u.id.slice(-8).toUpperCase()}</div>
    <div className="row"><span>Peran</span>Barber</div><div className="row"><span>Cabang</span>{b.name}</div>
    <div className="row"><span>Kartu absensi</span>{card?.active ? "Terdaftar" : "Belum terdaftar"}</div>
    <div className="portal" style={{ margin: "12px 0 0" }}>Peran dan cabang hanya dapat diubah oleh pemilik.</div></div></>);
}
