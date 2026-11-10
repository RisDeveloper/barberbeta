import { guard } from "@/lib/guard"; import { prisma } from "@/lib/db"; import { stats } from "@/lib/earnings"; import { todayState } from "@/lib/attendance"; import { startOfLocalDay, startOfLocalWeek, hm, rp } from "@/lib/time";
export default async function Dashboard() {
  const u = await guard("EMPLOYEE"); const b = await prisma.branch.findUniqueOrThrow({ where: { id: u.branchId } });
  const day0 = startOfLocalDay(b.timezone), week0 = startOfLocalWeek(b.timezone), tomorrow = new Date(+day0 + 86400000);
  const [t, w, todayPay, weekPay] = await Promise.all([stats(u.id, day0), stats(u.id, week0),
    prisma.expenseRecord.groupBy({ by: ["category"], where: { userId: u.id, voidedAt: null, category: { in: ["Kasbon", "Insentif", "Bonus"] }, date: { gte: day0, lt: tomorrow } }, _sum: { amountRp: true } }),
    prisma.expenseRecord.groupBy({ by: ["category"], where: { userId: u.id, voidedAt: null, category: { in: ["Kasbon", "Insentif", "Bonus"] }, date: { gte: week0 } }, _sum: { amountRp: true } })]);
  const payAmt = (rows: any[], k: string) => rows.find((r) => r.category === k)?._sum.amountRp ?? 0;
  const todayIns = payAmt(todayPay, "Insentif"), todayBon = payAmt(todayPay, "Bonus"), todayKas = payAmt(todayPay, "Kasbon");
  const weekIns = payAmt(weekPay, "Insentif"), weekBon = payAmt(weekPay, "Bonus"), weekKas = payAmt(weekPay, "Kasbon");
  const todayNet = t.earningsRp + todayIns + todayBon - todayKas;
  const weekNet = w.earningsRp + weekIns + weekBon - weekKas;
  const att = await todayState(u.id, b.timezone);
  const today = new Date().toLocaleDateString("id-ID", { timeZone: b.timezone, weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const displayName = u.name.replace(/^\[.*?\]\s*/, "").trim() || u.name;
  const late = att.rec?.status === "LATE";
  const badge = !att.rec ? "Belum absen" : late ? "Terlambat" : att.rec.checkOutAt ? "Selesai" : "Hadir";
  const checkIn = att.rec ? hm(att.rec.checkInAt, b.timezone) : "-- : --";
  const checkOut = att.rec?.checkOutAt ? hm(att.rec.checkOutAt, b.timezone) : "-- : --";
  const masukNote = !att.rec ? "Belum absen" : att.rec.status === "LATE" ? "Terlambat" : "Tepat waktu";
  return (<><div className="attWrap"><div className="attCard">
    <div className="attHead">
      <div className="attPerson">
        <span className="attAvatar">{(displayName[0] ?? "B").toUpperCase()}</span>
        <div className="attIdentity">
          <div className="attNameRow"><b className="attName">{u.name}</b><span className={"attBadge " + (!att.rec ? "off" : late ? "late" : "on")}><i />{badge}</span></div>
          <span className="attRole">Barber</span>
        </div>
      </div>
      <div className="attMeta">
        <span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>{today}</span>
        <span className="attBranch">{b.name}</span>
      </div>
    </div>
    <div className="attBottom">
      <div className={"attTile" + (late ? " late" : "")}>
        <div className="attTileHead"><span>Jam Masuk</span><i className={att.rec && !late ? "on" : ""} /></div>
        <b className="attTimeBig">{checkIn}</b>
        <span className={"attNote" + (late ? "" : att.rec ? " ok" : "")}>{masukNote}</span>
      </div>
      <div className="attTile">
        <div className="attTileHead"><span>Jam Pulang</span><i className={att.rec?.checkOutAt ? "on" : ""} /></div>
        <b className={"attTimeBig" + (att.rec?.checkOutAt ? "" : " muted")}>{checkOut}</b>
        <span className={"attNote" + (att.rec?.checkOutAt ? " ok" : "")}>{att.rec?.checkOutAt ? "Selesai" : "Belum tercatat"}</span>
      </div>
    </div>
  </div></div>
    <div className="grid stats">
      <div className="card stat"><small>Pelanggan hari ini</small><b>{t.customers}</b></div><div className="card stat"><small>Komisi hari ini</small><b>{rp(t.earningsRp)}</b></div>
      <div className="card stat"><small>Insentif hari ini</small><b>{rp(todayIns)}</b></div><div className="card stat"><small>Bonus hari ini</small><b>{rp(todayBon)}</b></div>
      <div className="card stat"><small>Kasbon hari ini</small><b>{rp(todayKas)}</b></div><div className="card stat"><small>Bersih hari ini</small><b>{rp(todayNet)}</b></div>
      <div className="card stat"><small>Pelanggan minggu ini</small><b>{w.customers}</b></div><div className="card stat"><small>Komisi minggu ini</small><b>{rp(w.earningsRp)}</b></div>
      <div className="card stat"><small>Insentif minggu ini</small><b>{rp(weekIns)}</b></div><div className="card stat"><small>Bonus minggu ini</small><b>{rp(weekBon)}</b></div>
      <div className="card stat"><small>Kasbon minggu ini</small><b>{rp(weekKas)}</b></div><div className="card stat"><small>Bersih minggu ini</small><b>{rp(weekNet)}</b></div></div></>);
}
