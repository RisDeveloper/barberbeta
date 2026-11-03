export function localParts(d: Date, tz: string) {
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" })
    .formatToParts(d).map((x) => [x.type, x.value]));
  return { date: `${p.year}-${p.month}-${p.day}`, minutes: +p.hour * 60 + +p.minute };
}
export const todayLocal = (tz: string) => localParts(new Date(), tz).date;
export function startOfLocalDay(tz: string) { const n = new Date(); return new Date(n.getTime() - localParts(n, tz).minutes * 60000 - n.getSeconds() * 1000 - n.getMilliseconds()); }
export const rp = (n: number) => "Rp" + n.toLocaleString("id-ID");
const WD = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const weekdayIdx = (tz: string) => WD.indexOf(new Intl.DateTimeFormat("en-US", { timeZone: tz, weekday: "short" }).format(new Date())); // Mon = 0
export const startOfLocalWeek = (tz: string) => new Date(startOfLocalDay(tz).getTime() - weekdayIdx(tz) * 86400000);
export const startOfLocalMonth = (tz: string) => new Date(startOfLocalDay(tz).getTime() - (+todayLocal(tz).slice(8) - 1) * 86400000);
/** Start (UTC instant) of a local YYYY-MM-DD in the branch timezone. */
export function dayStart(date: string, tz: string) {
  const g = new Date(date + "T00:00:00Z"), p = localParts(g, tz);
  return new Date(g.getTime() - (Date.parse(p.date + "T00:00:00Z") + p.minutes * 60000 - g.getTime()));
}
export const validDate = (s?: string) => (s && /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : undefined);
export const hm = (d: Date | null, tz: string) => (d ? d.toLocaleTimeString("id-ID", { timeZone: tz, hour: "2-digit", minute: "2-digit" }) : "—");
export const dt = (d: Date, tz: string) => d.toLocaleString("id-ID", { timeZone: tz });
