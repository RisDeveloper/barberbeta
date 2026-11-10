import { guard } from "@/lib/guard"; import { prisma } from "@/lib/db"; import { stats } from "@/lib/earnings"; import { todayState } from "@/lib/attendance"; import { startOfLocalDay, startOfLocalMonth, hm, rp } from "@/lib/time";
export default async function Dashboard() {
  const u = await guard("EMPLOYEE"); const b = await prisma.branch.findUniqueOrThrow({ where: { id: u.branchId } });
  const day0 = startOfLocalDay(b.timezone), month0 = startOfLocalMonth(b.timezone), tomorrow = new Date(+day0 + 86400000);
  const [t, m, monthPay, allKasbon] = await Promise.all([stats(u.id, day0), stats(u.id, month0),
    prisma.expenseRecord.groupBy({ by: ["category"], where: { userId: u.id, voidedAt: null, category: { in: ["Kasbon", "Insentif", "Bonus"] }, date: { gte: month0 } }, _sum: { amountRp: true } }),
    prisma.expenseRecord.aggregate({ where: { userId: u.id, voidedAt: null, category: "Kasbon" }, _sum: { amountRp: true } })]);
  const payAmt = (rows: any[], k: string) => rows.find((r) => r.category === k)?._sum.amountRp ?? 0;
  const monthIns = payAmt(monthPay, "Insentif"), monthBon = payAmt(monthPay, "Bonus"), monthKas = payAmt(monthPay, "Kasbon");
  const totalKasbon = allKasbon._sum.amountRp ?? 0;
  const monthNet = m.earningsRp + monthIns + monthBon - monthKas;
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
      <div className="card stat"><small>Komisi hari ini</small><b>{rp(t.earningsRp)}</b></div>
      <div className="card stat"><small>Pelanggan hari ini</small><b>{t.customers}</b></div>
      <div className="card stat"><small>Kasbon (total)</small><b>{rp(totalKasbon)}</b></div>
      <div className="card stat"><small>Pendapatan bulan ini</small><b>{rp(m.earningsRp)}</b></div>
      <div className="card stat"><small>Pendapatan bersih (bulan ini)</small><b>{rp(monthNet)}</b></div></div></>);
}
