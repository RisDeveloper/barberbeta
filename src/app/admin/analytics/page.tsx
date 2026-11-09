import { prisma } from "@/lib/db"; import { ctx } from "@/lib/admin"; import { resolveRange, type SP } from "@/lib/range"; import RangeFilter from "@/components/RangeFilter"; import { localParts, rp } from "@/lib/time";
export default async function Analytics({ searchParams: sp }: { searchParams: SP }) {
  const { tz, branchId } = await ctx(); const { gte, lt } = resolveRange(sp, tz, "week"), len = +lt - +gte;
  const where = (a: Date, b: Date) => ({ branchId, status: "COMPLETED" as const, createdAt: { gte: a, lt: b } });
  const rows: { createdAt: Date; totalRp: number }[] = []; const PAGE = 1000; let skip = 0;
  while (true) { const batch = await prisma.transaction.findMany({ where: where(gte, lt), select: { createdAt: true, totalRp: true }, take: PAGE, skip }); rows.push(...batch); if (batch.length < PAGE) break; skip += PAGE; }
  const prev = await prisma.transaction.aggregate({ where: where(new Date(+gte - len), gte), _sum: { totalRp: true } });
  const days = Array.from({ length: Math.min(92, Math.round(len / 86400000)) }, (_, i) => ({ k: localParts(new Date(+gte + i * 86400000), tz).date, v: 0 }));
  for (const r of rows) { const d = days.find((x) => x.k === localParts(r.createdAt, tz).date); if (d) d.v += r.totalRp; }
  const cur = rows.reduce((a, r) => a + r.totalRp, 0), old = prev._sum.totalRp ?? 0, max = Math.max(1, ...days.map((d) => d.v));
  return (<><h1>Analisis</h1><RangeFilter sp={sp} def="week" />
    <div className="grid stats"><div className="card stat"><small>Pendapatan (periode terpilih)</small><b>{rp(cur)}</b></div>
      <div className="card stat"><small>Periode sebelumnya (durasi sama)</small><b>{rp(old)}</b></div><div className="card stat"><small>Perubahan</small><b>{old ? Math.round(((cur - old) * 100) / old) + "%" : "—"}</b></div></div>
    <div className="card" style={{ marginTop: 16 }}><h2>Pendapatan harian</h2><div className="bars">{days.map((d) => <i key={d.k} title={`${d.k}: ${rp(d.v)}`} style={{ height: Math.max(2, (d.v / max) * 100) + "%" }} />)}</div>
      <div className="lbl"><span style={{ textAlign: "left" }}>{days[0]?.k}</span><span style={{ textAlign: "right" }}>{days[days.length - 1]?.k}</span></div></div></>);
}
