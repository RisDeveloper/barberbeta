import { guard } from "@/lib/guard"; import { prisma } from "@/lib/db"; import { rp } from "@/lib/time"; import { saveService, deleteService } from "../actions";
export default async function Services() {
  const u = await guard("ADMIN");
  const services = await prisma.service.findMany({ where: { deletedAt: null, OR: [{ branchId: u.branchId }, { branchId: null }] }, orderBy: { name: "asc" } });
  return (<><h1>Layanan</h1>
    <div className="card" style={{ marginBottom: 16 }}><h2>Tambah layanan</h2>
      <form action={saveService} style={{ display: "grid", gap: 10 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <label>Nama<input name="name" className="field" required minLength={2} style={{ margin: 0 }} /></label>
          <label>Harga (Rp)<input name="priceRp" type="number" min={1} className="field" required style={{ margin: 0 }} /></label>
        </div>
        <label>Deskripsi<input name="description" className="field" style={{ margin: 0, minHeight: 80 }} /></label>
        <button className="btn" style={{ width: "100%" }}>Simpan</button>
      </form></div>
    <div className="card"><table><thead><tr><th>Nama</th><th>Harga</th><th>Cakupan</th><th></th></tr></thead><tbody>
      {services.map((s) => (<tr key={s.id}><td>{s.name}</td><td>{rp(s.priceRp)}</td><td>{s.branchId === u.branchId ? "Cabang ini" : "Semua cabang"}</td><td>
        <form action={deleteService} style={{ display: "inline" }}><input type="hidden" name="id" value={s.id} /><button className="btn s t">Hapus</button></form>
      </td></tr>))}
      {!services.length && <tr><td colSpan={4}>Belum ada layanan.</td></tr>}</tbody></table></div></>);
}