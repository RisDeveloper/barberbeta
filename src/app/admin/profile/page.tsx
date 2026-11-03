import { ctx } from "@/lib/admin";
export default async function Profile() {
  const { u, b } = await ctx();
  return (<><h1>Profil</h1><div className="card" style={{ maxWidth: 480 }}><div className="row"><span>Nama</span>{u.name}</div><div className="row"><span>Email</span>{u.email}</div>
    <div className="row"><span>Peran</span>Admin</div><div className="row"><span>Cabang</span>{b.name}</div><div className="row"><span>Zona waktu</span>{b.timezone}</div></div></>);
}
