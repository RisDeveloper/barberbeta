import Link from "next/link";
export default function NotFound() {
  return (<div className="center"><div className="card login" style={{ textAlign: "center" }}>
    <div className="brand" style={{ justifyContent: "center", padding: 0, marginBottom: 12 }}><span className="logo">B</span>BarberStory</div>
    <h1 style={{ fontSize: 40, margin: "0 0 4px" }}>404</h1>
    <p className="portal" style={{ margin: "0 0 16px" }}>Halaman tidak ditemukan.</p>
    <Link className="btn" href="/" style={{ display: "grid", placeItems: "center", textDecoration: "none" }}>Kembali ke beranda</Link>
  </div></div>);
}
