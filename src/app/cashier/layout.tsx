import type { ReactNode } from "react"; import { guard } from "@/lib/guard"; import { prisma } from "@/lib/db"; import PortalNav from "@/components/PortalNav";
const items: [string, string, string][] = [["/", "Dasbor", "#C2E7FF"], ["/new", "Transaksi Baru", "#EADDFF"], ["/history", "Riwayat Transaksi", "#C4EED0"], ["/expenses", "Pengeluaran", "#FCE8B2"], ["/attendance", "Absensi", "#FEF3C7"], ["/profile", "Profil", "#F8D7E8"]];
export default async function Shell({ children }: { children: ReactNode }) {
  const u = await guard("CASHIER"); const b = await prisma.branch.findUnique({ where: { id: u.branchId } });
  return (<div className="app"><aside className="side"><div className="brand"><span className="logo">B</span>BarberStory</div>
    <div className="sidecard"><div className="portal">Kasir · {b?.name}</div><PortalNav items={items} prefix="/cashier" /></div></aside><main className="main">{children}</main></div>);
}
