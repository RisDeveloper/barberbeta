import type { ReactNode } from "react";
const initials = (n: string) => n.replace(/\[[^\]]*\]/g, " ").split(/\s+/).filter((w) => /[a-z]/i.test(w)).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "?";
export default function ProfileCard({ name, role, email, picture, stats = [], rows = [], note }: {
  name: string; role: string; email?: string | null; picture?: string | null;
  stats?: [string, ReactNode][]; rows?: [string, ReactNode][]; note?: string;
}) {
  return (<div className="card prof">
    <div className="profHead">
      <div className="profAva">{picture ? <img src={picture} alt="" /> : initials(name)}</div>
      <div className="profMeta">
        <div className="profName">{name}</div>
        <span className="pill profRole">{role}</span>
        {email && <div className="profMail">{email}</div>}
      </div>
    </div>
    {!!stats.length && <div className="profStats">{stats.map(([l, v]) => (<div className="profStat" key={l}><b>{v}</b><small>{l}</small></div>))}</div>}
    {!!rows.length && <div className="profRows">{rows.map(([l, v]) => (<div className="row" key={l}><span>{l}</span><b>{v}</b></div>))}</div>}
    {note && <p className="profNote">{note}</p>}
  </div>);
}
