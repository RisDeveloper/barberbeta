// Compute the active shift for an employee on a given date, considering rotation.
// Returns { startMin, graceMin, mealAllowanceRp } or null (use branch defaults).
export function activeShift(user: { shiftStartMin: number | null; lateGraceMin: number | null; mealAllowanceRp: number; shiftRotation: any; shiftRotationStart: Date | null }, date: Date): { startMin: number; graceMin: number; mealAllowanceRp: number } | null {
  const rot = user.shiftRotation;
  if (!rot || !Array.isArray(rot) || rot.length === 0 || !user.shiftRotationStart) return null;
  const start = new Date(user.shiftRotationStart);
  const diffDays = Math.floor((date.getTime() - start.getTime()) / 86400000);
  if (diffDays < 0) return null;
  const cycle = rot.reduce((s: number, r: any) => s + (r.days ?? 1), 0);
  if (cycle <= 0) return null;
  let pos = diffDays % cycle;
  for (const seg of rot) {
    const d = seg.days ?? 1;
    if (pos < d) {
      return {
        startMin: seg.startMin ?? user.shiftStartMin ?? 540,
        graceMin: seg.graceMin ?? user.lateGraceMin ?? 10,
        mealAllowanceRp: seg.mealAllowanceRp ?? user.mealAllowanceRp ?? 0,
      };
    }
    pos -= d;
  }
  return null;
}
