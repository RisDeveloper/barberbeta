import { startOfLocalDay, startOfLocalWeek, startOfLocalMonth, dayStart, validDate } from "./time";
export type SP = Record<string, string | undefined>;
const D = 86400000;
/** Presets are resolved in the branch timezone. `lt` is exclusive. */
export function resolveRange(sp: SP, tz: string, def = "month") {
  const key = sp.range ?? def, d0 = startOfLocalDay(tz); let gte: Date, lt: Date;
  if (key === "today") { gte = d0; lt = new Date(+d0 + D); }
  else if (key === "yesterday") { gte = new Date(+d0 - D); lt = d0; }
  else if (key === "week") { gte = startOfLocalWeek(tz); lt = new Date(+d0 + D); }
  else if (key === "custom" && validDate(sp.from)) { gte = dayStart(sp.from!, tz); lt = new Date((validDate(sp.to) ? +dayStart(sp.to!, tz) : +gte) + D); }
  else { gte = startOfLocalMonth(tz); lt = new Date(+d0 + D); }
  return { key, gte, lt };
}
export const qs = (sp: SP, over: SP = {}) => { const p = new URLSearchParams(); for (const [k, v] of Object.entries({ ...sp, ...over })) if (v) p.set(k, v); const s = p.toString(); return s ? "?" + s : ""; };
export const csvEsc = (v: unknown) => { let s = String(v ?? ""); if (/^[=+\-@]/.test(s)) s = "'" + s; return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
