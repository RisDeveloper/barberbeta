import { prisma } from "@/lib/db"; import { ownerCtx, TZ } from "@/lib/owner"; import { F } from "@/components/F"; import LogoField from "@/components/LogoField"; import Tbl from "@/components/Tbl"; import { rp } from "@/lib/time"; import { saveService, saveOwnerLogo, deleteService } from "../actions";
export default async function Settings() {
  const u = await ownerCtx(); const [bs, sv, emps, comms] = await Promise.all([prisma.branch.findMany({ where: { deletedAt: null }, orderBy: { name: "asc" } }), prisma.service.findMany({ where: { deletedAt: null }, orderBy: { name: "asc" } }), prisma.user.findMany({ where: { role: "EMPLOYEE", deletedAt: null, active: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }), prisma.serviceCommission.findMany()]);
  const B: [string, string][] = [["", "Semua cabang"], ...bs.map((b) => [b.id, b.name] as [string, string])];
  const SF = ({ s }: { s?: any }) => {
    const overrides = Object.fromEntries(comms.filter((c: any) => c.serviceId === s?.id).map((c: any) => [c.userId, c.commissionRp]));
    return (<form action={saveService} className="fr">{s && <input type="hidden" name="id" value={s.id} />}<F l="Nama layanan" n="name" d={s?.name} r /><F l="Harga (Rp)" n="priceRp" t="number" d={s?.priceRp} r /><F l="Komisi dasar (Rp)" n="commissionRp" t="number" d={s?.commissionRp ?? 0} /><div style={{ flex: "1 1 100%" }}><div style={{ fontSize: 12, color: "var(--muted)", margin: "4px 0 8px" }}>Cabang (kosong = semua cabang)</div>{bs.map((b: any) => (<label key={b.id} style={{ display: "inline-flex", gap: 6, marginRight: 12, fontSize: 13 }}><input type="checkbox" name="branchIds" value={b.id} defaultChecked={(s?.branchIds ?? []).includes(b.id) || s?.branchId === b.id} /> {b.name}</label>))}</div>
      {s && emps.length > 0 && (<div style={{ flex: "1 1 100%" }}>
        <div style={{ fontSize: 12, color: "var(--muted)", margin: "4px 0 8px" }}>Komisi per karyawan (kosong = pakai komisi dasar)</div>
        {emps.map((e: any) => (<div key={e.id} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
          <span style={{ flex: 1, fontSize: 13 }}>{e.name}</span>
          <input name={`comm_${e.id}`} type="number" min={0} className="field" style={{ margin: 0, width: 120, flex: "0 0 120px" }} defaultValue={overrides[e.id] ?? ""} placeholder={String(s.commissionRp ?? 0)} />
        </div>))}
      </div>)}
      {s && <label><input type="checkbox" name="active" defaultChecked={s.active} /> Aktif</label>}<button className="btn s">Simpan</button></form>);
  };
  return (<><h1>Pengaturan Sistem</h1><div className="card" style={{ marginBottom: 16 }}><h2>Logo portal pemilik</h2>
    <p style={{ margin: "0 0 12px", fontSize: 13, color: "var(--muted, #5F6368)" }}>Logo tampil di pojok kiri atas portal pemilik.</p>
    <form action={saveOwnerLogo} className="fr"><LogoField current={u.logoUrl} /><button className="btn s">Simpan logo</button></form></div>
    <div className="card" style={{ marginBottom: 16 }}><h2>Nama layanan</h2><SF /></div>
    <div className="card" style={{ marginBottom: 16 }}><Tbl head={["Nama layanan", "Harga", "Komisi", "Nama karyawan", "Cabang", "Status", ""]} rows={sv.map((s) => {
  const ov = comms.filter((c: any) => c.serviceId === s.id);
  const empNames = ov.length ? ov.map((c: any) => emps.find((e: any) => e.id === c.userId)?.name ?? "?").join(", ") : "Semua";
  return [s.name, rp(s.priceRp), rp(s.commissionRp), empNames, (s.branchIds?.length ? s.branchIds.map((id: string) => bs.find((b: any) => b.id === id)?.name).filter(Boolean).join(", ") : (bs.find((b: any) => b.id === s.branchId)?.name ?? "Semua cabang")), <span className={"pill " + (s.active ? "ok" : "mute")}>{s.active ? "Aktif" : "Nonaktif"}</span>, <><details><summary>Ubah</summary><SF s={s} /></details><details><summary className="danger">Hapus</summary><form action={deleteService}><input type="hidden" name="id" value={s.id} /><div style={{ fontSize: 12, color: "var(--muted)", margin: "4px 0 8px" }}>Yakin hapus layanan ini? Riwayat transaksi tetap tersimpan.</div><button className="btn s danger">Hapus layanan</button></form></details></>];
})} /></div>
    <div className="portal" style={{ margin: "6px 0 24px" }}>Perubahan harga hanya berlaku untuk transaksi baru; transaksi lama tetap memakai harga saat itu.</div>
    <div className="card"><h2>Konfigurasi</h2><div className="row"><span>Zona waktu default (laporan pemilik)</span>{TZ}</div><div className="row"><span>Domain portal</span>diatur di variabel lingkungan (.env)</div></div></>);
}
