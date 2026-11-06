import type { ReactNode } from "react"; import { ownerCtx } from "@/lib/owner"; import PortalNav from "@/components/PortalNav";
const items: [string, string, string][] = [["/", "Ringkasan Bisnis", "#C2E7FF"], ["/branches", "Manajemen Cabang", "#EADDFF"], ["/revenue", "Analisis Pendapatan", "#C4EED0"], ["/transactions", "Semua Transaksi", "#F8D7E8"],
  ["/employees", "Manajemen Karyawan", "#FEF3C7"], ["/artists", "Barber", "#C2E7FF"], ["/attendance", "Absensi Karyawan", "#EADDFF"], ["/commissions", "Manajemen Komisi", "#C4EED0"],
  ["/finance", "Pendapatan & Pengeluaran", "#F8D7E8"], ["/reports", "Laporan Keuangan", "#FEF3C7"], ["/settings", "Pengaturan Sistem", "#C2E7FF"]];
export default async function Shell({ children }: { children: ReactNode }) {
  await ownerCtx();
  return (<div className="app"><aside className="side"><div className="brand"><span className="logo">B</span>BarberStory</div><div className="sidecard"><div className="portal">Pemilik</div><PortalNav items={items} prefix="/owner" /></div></aside><main className="main">{children}</main></div>);
}
