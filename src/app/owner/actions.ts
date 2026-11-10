"use server";
import { z } from "zod"; import bcrypt from "bcryptjs"; import { revalidatePath } from "next/cache"; import { cookies } from "next/headers";
import { prisma } from "@/lib/db"; import { requireUser, HttpError } from "@/lib/session"; import { dayStart } from "@/lib/time"; import { TZ } from "@/lib/owner";
const toast = (type: "ok" | "err", msg: string) => { try { cookies().set("toast", `${type}:${msg}`, { path: "/", maxAge: 10 }); } catch {} };
const me = () => requireUser(["OWNER"]);
const os = z.string().transform((v) => v.trim() || undefined).optional();
const int = z.coerce.number().int().min(0), pos = z.coerce.number().int().min(1);
const get = <T extends z.ZodTypeAny>(s: T, fd: FormData) => s.parse(Object.fromEntries(fd)) as z.infer<T>;
const done = () => revalidatePath("/owner", "layout");
const audit = (actorId: string, action: string, entity: string, entityId: string, meta?: object) => prisma.auditLog.create({ data: { actorId, action, entity, entityId, meta: meta as any } });
const hhmm = (s: string) => { const [h, m] = s.split(":").map(Number); return h * 60 + m; };
async function adminTaken(branchId: string, except?: string) { if (await prisma.user.findFirst({ where: { role: "ADMIN", branchId, active: true, deletedAt: null, id: { not: except } } })) throw new HttpError(409, "Cabang ini sudah memiliki admin aktif"); }
const ROLE = z.enum(["ADMIN", "CASHIER", "EMPLOYEE"]);
const logoOf = (fd: FormData) => {
  const raw = fd.get("logo"), v = raw === null ? null : String(raw);
  if (v !== null && v !== "" && (!/^data:image\/(png|jpeg|webp);base64,/.test(v) || v.length > 400_000)) throw new HttpError(400, "Format logo tidak valid");
  return v;
};

export async function saveOwnerLogo(fd: FormData) {
  const o = await me(), logo = logoOf(fd);
  await prisma.user.update({ where: { id: o.id }, data: { logoUrl: logo || null } }); toast("ok", "Berhasil"); done();
}

export async function saveShift(fd: FormData) {
  const o = await me(), d = get(z.object({ branchId: z.string().min(1), name: z.string().min(2), start: z.string().regex(/^\d{2}:\d{2}$/), end: z.string().regex(/^\d{2}:\d{2}$/), grace: int, meal: z.coerce.number().int().min(0).default(0) }), fd);
  const s = await prisma.shift.upsert({ where: { branchId_name: { branchId: d.branchId, name: d.name } }, create: { branchId: d.branchId, name: d.name, startMin: hhmm(d.start), endMin: hhmm(d.end), graceMin: d.grace, mealAllowanceRp: d.meal }, update: { startMin: hhmm(d.start), endMin: hhmm(d.end), graceMin: d.grace, mealAllowanceRp: d.meal, active: true } });
  await audit(o.id, "SHIFT_SAVE", "Shift", s.id, d); toast("ok", "Berhasil"); done();
}
export async function deleteShift(fd: FormData) {
  const o = await me(), id = String(fd.get("id"));
  const s = await prisma.shift.findFirst({ where: { id } });
  if (!s) throw new HttpError(404, "Shift tidak ditemukan");
  await prisma.shift.update({ where: { id }, data: { active: false } });
  await audit(o.id, "SHIFT_DELETE", "Shift", id, { name: s.name }); toast("ok", "Berhasil"); done();
}
export async function saveBranch(fd: FormData) {
  const o = await me(), d = get(z.object({ id: os, name: z.string().min(2), timezone: z.string().min(3), shiftStart: z.string().regex(/^\d{2}:\d{2}$/), lateGraceMin: int }), fd);
  const logo = logoOf(fd);
  const data = { name: d.name, timezone: d.timezone, shiftStartMin: hhmm(d.shiftStart), lateGraceMin: d.lateGraceMin, active: fd.get("active") === "on" || !d.id, ...(logo === null ? {} : { logoUrl: logo || null }) };
  const b = d.id ? await prisma.branch.update({ where: { id: d.id }, data }) : await prisma.branch.create({ data });
  await audit(o.id, d.id ? "BRANCH_UPDATE" : "BRANCH_CREATE", "Branch", b.id, data); toast("ok", "Berhasil"); done();
}
export async function deleteBranch(fd: FormData) {
  const o = await me(), id = String(fd.get("id"));
  const b = await prisma.branch.findFirst({ where: { id, deletedAt: null } });
  if (!b) throw new HttpError(404, "Cabang tidak ditemukan");
  const now = new Date();
  // soft delete: history (transactions, attendance, finance) stays intact
  await prisma.$transaction([
    prisma.branch.update({ where: { id }, data: { deletedAt: now, active: false } }),
    prisma.user.updateMany({ where: { branchId: id, deletedAt: null }, data: { active: false } }),
    prisma.session.deleteMany({ where: { user: { branchId: id } } }),
    prisma.service.updateMany({ where: { branchId: id, deletedAt: null }, data: { deletedAt: now, active: false } }),
    prisma.device.updateMany({ where: { branchId: id }, data: { active: false } }),
  ]);
  await audit(o.id, "BRANCH_DELETE", "Branch", id, { name: b!.name }); toast("ok", "Berhasil"); done();
}
export async function assignAdmin(fd: FormData) {
  const o = await me(), d = get(z.object({ userId: z.string(), branchId: z.string() }), fd); await adminTaken(d.branchId, d.userId);
  await prisma.user.update({ where: { id: d.userId, role: "ADMIN" }, data: { branchId: d.branchId } }); await prisma.session.deleteMany({ where: { userId: d.userId } }); await audit(o.id, "ADMIN_ASSIGN", "User", d.userId, d); toast("ok", "Berhasil"); done();
}
export async function createUser(fd: FormData) {
  const o = await me(), d = get(z.object({ name: z.string().min(2), email: z.string().email().toLowerCase(), pin: z.string().regex(/^\d{4,8}$/), role: ROLE, branchId: z.string().min(1) }), fd);
  if (d.role === "ADMIN") await adminTaken(d.branchId);
  const workDays = [0,1,2,3,4,5,6].filter((i) => fd.get(`wd_${i}`) === "on").join(",");
  const u = await prisma.user.create({ data: { name: d.name, email: d.email, role: d.role, branchId: d.branchId, pinHash: await bcrypt.hash(d.pin, 12), workDays: workDays || "0,1,2,3,4,5,6" } });
  const shiftIds = [...fd.keys()].filter((k) => k.startsWith("shift_"));
  for (const sid of shiftIds) { if (fd.get(sid) === "on") await prisma.userShift.create({ data: { userId: u.id, shiftId: sid.replace("shift_", "") } }).catch(() => {}); }
  await audit(o.id, "USER_CREATE", "User", u.id, { role: d.role, branchId: d.branchId }); toast("ok", "Berhasil"); done();
}
export async function updateUser(fd: FormData) {
  const o = await me(), d = get(z.object({ id: z.string(), name: z.string().min(2), role: ROLE, branchId: z.string().min(1) }), fd), active = fd.get("active") === "on";
  if (d.id === o.id) throw new HttpError(400, "Tidak dapat mengubah akun Anda sendiri di sini");
  if (d.role === "ADMIN" && active) await adminTaken(d.branchId, d.id);
  const workDays = [0,1,2,3,4,5,6].filter((i) => fd.get(`wd_${i}`) === "on").join(",");
  await prisma.user.update({ where: { id: d.id }, data: { name: d.name, role: d.role, branchId: d.branchId, active, workDays: workDays || "0,1,2,3,4,5,6" } });
  // sync shifts
  await prisma.userShift.deleteMany({ where: { userId: d.id } });
  const shiftIds = [...fd.keys()].filter((k) => k.startsWith("shift_"));
  for (const sid of shiftIds) { if (fd.get(sid) === "on") await prisma.userShift.create({ data: { userId: d.id, shiftId: sid.replace("shift_", "") } }).catch(() => {}); }
  await prisma.session.deleteMany({ where: { userId: d.id } }); await audit(o.id, "USER_UPDATE", "User", d.id, { ...d, active }); toast("ok", "Berhasil"); done();
}
export async function resetPin(fd: FormData) {
  const o = await me(), d = get(z.object({ id: z.string(), pin: z.string().regex(/^\d{4,8}$/) }), fd);
  await prisma.user.update({ where: { id: d.id }, data: { pinHash: await bcrypt.hash(d.pin, 12) } }); await prisma.session.deleteMany({ where: { userId: d.id } }); await audit(o.id, "PIN_RESET", "User", d.id); toast("ok", "Berhasil"); done();
}
export async function deleteService(fd: FormData) {
  const o = await me(), id = String(fd.get("id"));
  const s = await prisma.service.findFirst({ where: { id, deletedAt: null } });
  if (!s) throw new HttpError(404, "Layanan tidak ditemukan");
  await prisma.service.update({ where: { id }, data: { deletedAt: new Date(), active: false } });
  await audit(o.id, "SERVICE_DELETE", "Service", id, { name: s!.name }); toast("ok", "Berhasil"); done();
}
export async function deleteUser(fd: FormData) {
  const o = await me(), id = String(fd.get("id"));
  const u = await prisma.user.findFirst({ where: { id, deletedAt: null } });
  if (!u) throw new HttpError(404, "Karyawan tidak ditemukan");
  if (u.id === o.id) throw new HttpError(400, "Tidak dapat menghapus akun Anda sendiri");
  if (u.role === "OWNER") throw new HttpError(403, "Tidak dapat menghapus akun pemilik");
  await prisma.$transaction([
    prisma.user.update({ where: { id }, data: { deletedAt: new Date(), active: false } }),
    prisma.session.deleteMany({ where: { userId: id } }),
  ]);
  await audit(o.id, "USER_DELETE", "User", id, { name: u!.name, role: u!.role }); toast("ok", "Berhasil"); done();
}
export async function saveService(fd: FormData) {
  const o = await me(), d = get(z.object({ id: os, name: z.string().min(2), priceRp: pos, commissionRp: z.coerce.number().int().min(0).default(0), branchId: os }), fd);
  const data = { name: d.name, priceRp: d.priceRp, commissionRp: d.commissionRp, branchId: d.branchId ?? null, active: fd.get("active") === "on" || !d.id }; // past transactions keep their price snapshot
  const s = d.id ? await prisma.service.update({ where: { id: d.id }, data }) : await prisma.service.create({ data });
  // per-employee commission overrides
  if (d.id) {
    const emps = await prisma.user.findMany({ where: { role: "EMPLOYEE", deletedAt: null } });
    for (const e of emps) {
      const raw = fd.get(`comm_${e.id}`);
      const val = raw === null ? null : String(raw).trim();
      if (val === "" || val === null) {
        await prisma.serviceCommission.deleteMany({ where: { serviceId: s.id, userId: e.id } });
      } else {
        const n = Number(val);
        if (Number.isInteger(n) && n >= 0) {
          await prisma.serviceCommission.upsert({ where: { serviceId_userId: { serviceId: s.id, userId: e.id } }, create: { serviceId: s.id, userId: e.id, commissionRp: n }, update: { commissionRp: n } });
        }
      }
    }
  }
  await audit(o.id, "SERVICE_SAVE", "Service", s.id, data); toast("ok", "Berhasil"); done();
}
const bp = (s: string) => { const m = s.trim().match(/^(\d{1,3})(?:\.(\d{1,2}))?$/); if (!m) { throw new HttpError(400, "Persentase tidak valid"); } return +m![1] * 100 + +((m![2] ?? "").padEnd(2, "0") || 0); }; // "2.5" -> 250, integer only
export async function saveRule(fd: FormData) {
  const o = await me(), d = get(z.object({ role: ROLE, type: z.enum(["FIXED", "PERCENT_BP"]), value: z.string(), branchId: os, userId: os, from: os, to: os }), fd);
  const value = d.type === "FIXED" ? pos.parse(d.value) : bp(d.value);
  const r = await prisma.commissionRule.create({ data: { role: d.role, type: d.type, value, branchId: d.branchId, userId: d.userId, effectiveFrom: d.from ? dayStart(d.from, TZ) : new Date(), effectiveTo: d.to ? dayStart(d.to, TZ) : null } });
  await audit(o.id, "RULE_CREATE", "CommissionRule", r.id, d); toast("ok", "Berhasil"); done(); // new rules only affect future transactions; old commissions are snapshots
}
export async function endRule(fd: FormData) { const o = await me(), id = String(fd.get("id")); await prisma.commissionRule.update({ where: { id }, data: { effectiveTo: new Date() } }); await audit(o.id, "RULE_END", "CommissionRule", id); toast("ok", "Berhasil"); done(); }
export async function setCommission(fd: FormData) {
  const o = await me(), d = get(z.object({ id: z.string(), to: z.enum(["APPROVED", "PAID"]) }), fd);
  const r = await prisma.commission.updateMany({ where: { id: d.id, status: d.to === "APPROVED" ? "PENDING" : "APPROVED" }, data: { status: d.to } }); if (r.count) await audit(o.id, "COMMISSION_" + d.to, "Commission", d.id); toast("ok", "Berhasil"); done();
}
const model = (k: string) => (prisma as any)[k === "income" ? "incomeRecord" : "expenseRecord"];
const REC = { kind: z.enum(["income", "expense"]), date: z.string(), category: z.string().min(2), description: z.string().min(2), amountRp: pos, branchId: os, paymentMethod: z.string(), attachment: os, userId: os };
export async function addRecord(fd: FormData) {
  const o = await me(), { kind, date, ...d } = get(z.object(REC), fd);
  const payCats = ["Kasbon", "Insentif", "Bonus"];
  const data: any = { ...d, date: dayStart(date, TZ), createdById: o.id, userId: (kind === "expense" && payCats.includes(d.category)) ? (d.userId ?? null) : null };
  const r = await model(kind).create({ data }); await audit(o.id, "FIN_CREATE", kind, r.id, data); toast("ok", "Berhasil"); done();
}
export async function editRecord(fd: FormData) {
  const o = await me(), raw = get(z.object({ id: z.string(), reason: z.string().min(3), ...REC }), fd) as any;
  const { id, reason, kind, date, ...data } = raw, before = await model(kind).findUnique({ where: { id } });
  if (!before || before.voidedAt) throw new HttpError(400, "Catatan tidak dapat diubah");
  const payCats = ["Kasbon", "Insentif", "Bonus"];
  const clean = { ...data, branchId: data.branchId ?? null, attachment: data.attachment ?? null, date: dayStart(date, TZ), userId: (kind === "expense" && payCats.includes(data.category)) ? (data.userId ?? null) : null };
  await model(kind).update({ where: { id }, data: clean }); await audit(o.id, "FIN_EDIT", kind, id, { reason, before, after: clean }); toast("ok", "Berhasil"); done();
}
export async function voidRecord(fd: FormData) {
  const o = await me(), d = get(z.object({ id: z.string(), kind: z.enum(["income", "expense"]), reason: z.string().min(3) }), fd);
  await model(d.kind).update({ where: { id: d.id }, data: { voidedAt: new Date(), voidReason: d.reason } }); await audit(o.id, "FIN_VOID", d.kind, d.id, { reason: d.reason }); toast("ok", "Berhasil"); done();
}
