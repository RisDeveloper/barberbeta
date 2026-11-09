import { prisma } from "@/lib/db"; import { ownerCtx, TZ } from "@/lib/owner"; import { F } from "@/components/F"; import LogoField from "@/components/LogoField"; import Tbl from "@/components/Tbl"; import { rp } from "@/lib/time"; import { saveService, saveOwnerLogo } from "../actions";
export default async function Settings() {
  const u = await ownerCtx(); const [bs, sv] = await Promise.all([prisma.branch.findMany({ where: { deletedAt: null }, orderBy: { name: "asc" } }), prisma.service.findMany({ where: { deletedAt: null }, orderBy: { name: "asc" } })]);
  const B: [string, string][] = [["", "Semua cabang"], ...bs.map((b) => [b.id, b.name] as [string, string])];
  const SF = ({ s }: { s?: any }) => (<form action={saveService} className="fr">{s && <input type="hidden" name="id" value={s.id} />}<F l="Nama" n="name" d={s?.name} r /><F l="Harga (Rp)" n="priceRp" t="number" d={s?.priceRp} r /><F l="Komisi karyawan (Rp)" n="commissionRp" t="number" d={s?.commissionRp ?? 0} /><F l="Cabang" n="branchId" d={s?.branchId} o={B} />
    {s && <label><input type="checkbox" name="active" defaultChecked={s.active} /> Aktif</label>}<button className="btn s">Simpan</button></form>);
  return (<><h1>Pengaturan Sistem</h1><div className="card" style={{ marginBottom: 16 }}><h2>Logo portal pemilik</h2>
    <p style={{ margin: "0 0 12px", fontSize: 13, color: "var(--muted, #5F6368)" }}>Logo tampil di pojok kiri atas portal pemilik.</p>
    <form action={saveOwnerLogo} className="fr"><LogoField current={u.logoUrl} /><button className="btn s">Simpan logo</button></form></div>
    <div className="card" style={{ marginBottom: 16 }}><h2>Tambah layanan</h2><SF /></div>
    <div className="card" style={{ marginBottom: 16 }}><Tbl head={["Layanan", "Harga", "Komisi", "Cakupan", "Status", ""]} rows={sv.map((s) => [s.name, rp(s.priceRp), rp(s.commissionRp), bs.find((b) => b.id === s.branchId)?.name ?? "Semua cabang", <span className={"pill " + (s.active ? "ok" : "mute")}>{s.active ? "Aktif" : "Nonaktif"}</span>, <details><summary>Ubah</summary><SF s={s} /></details>])} /></div>
    <div className="portal" style={{ margin: "6px 0 24px" }}>Perubahan harga hanya berlaku untuk transaksi baru; transaksi lama tetap memakai harga saat itu.</div>
    <div className="card"><h2>Konfigurasi</h2><div className="row"><span>Zona waktu default (laporan pemilik)</span>{TZ}</div><div className="row"><span>Domain portal</span>diatur di variabel lingkungan (.env)</div></div></>);
}
