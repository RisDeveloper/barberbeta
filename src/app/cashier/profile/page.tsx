import { guard } from "@/lib/guard"; import { prisma } from "@/lib/db";
export default async function Profile() {
  const u = await guard("CASHIER"); const b = await prisma.branch.findUniqueOrThrow({ where: { id: u.branchId } });
  return (<><h1>Profil</h1><div className="card" style={{ maxWidth: 480 }}>
    <div className="row"><span>Nama</span>{u.name}</div><div className="row"><span>Email</span>{u.email}</div><div className="row"><span>Peran</span>Kasir</div><div className="row"><span>Cabang</span>{b.name}</div></div></>);
}
