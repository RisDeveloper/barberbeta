import type { ReactNode } from "react"; import { ctx } from "@/lib/admin"; import PortalNav from "@/components/PortalNav";
const items: [string, string, string][] = [["/", "Ringkasan", "#C2E7FF"], ["/analytics", "Analisis", "#EADDFF"], ["/transactions", "Transaksi", "#C4EED0"], ["/cashiers", "Kasir", "#F8D7E8"],
  ["/artists", "Barber", "#FEF3C7"], ["/attendance", "Absensi Karyawan", "#C2E7FF"], ["/services", "Layanan", "#C4EED0"], ["/reports", "Laporan", "#EADDFF"], ["/profile", "Profil", "#C4EED0"]];
export default async function Shell({ children }: { children: ReactNode }) {
  const { b } = await ctx();
  return (<div className="app"><aside className="side"><div className="brand"><span className="logo">B</span>BarberStory</div>
    <div className="portal">Admin · {b.name}</div><PortalNav items={items} prefix="/admin" /></aside><main className="main">{children}</main></div>);
}
