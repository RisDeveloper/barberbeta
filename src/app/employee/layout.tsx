import type { ReactNode } from "react"; import { guard } from "@/lib/guard"; import { prisma } from "@/lib/db"; import PortalNav from "@/components/PortalNav";
const items: [string, string, string][] = [["/", "Dasbor", "#C2E7FF"], ["/earnings", "Pendapatan Saya", "#EADDFF"], ["/history", "Riwayat Layanan", "#C4EED0"], ["/profile", "Profil Saya", "#F8D7E8"]];
export default async function Shell({ children }: { children: ReactNode }) {
  const u = await guard("EMPLOYEE"); const b = await prisma.branch.findUnique({ where: { id: u.branchId } });
  return (<div className="app"><aside className="side"><div className="brand"><span className="logo">B</span>BarberStory</div>
    <div className="sidecard"><div className="portal">Karyawan · {b?.name}</div><PortalNav items={items} prefix="/employee" /></div></aside><main className="main">{children}</main></div>);
}
