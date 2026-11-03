export const dynamic = "force-dynamic";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { createSession } from "@/lib/session";

const Body = z.object({
  email: z.string().trim().email().toLowerCase(),
  pin: z.string().regex(/^\d{4,8}$/),
});

const fails = new Map<string, { n: number; until: number }>();
const DUMMY = bcrypt.hashSync("000000", 12);

const URLS: Record<string, string | undefined> = {
  OWNER: process.env.PORTAL_OWNER_URL,
  ADMIN: process.env.PORTAL_ADMIN_URL,
  CASHIER: process.env.PORTAL_CASHIER_URL,
  EMPLOYEE: process.env.PORTAL_EMPLOYEE_URL,
};

const PATHS: Record<string, string> = {
  OWNER: "/owner",
  ADMIN: "/admin",
  CASHIER: "/cashier",
  EMPLOYEE: "/employee",
};

export const POST = async (req: Request) => {
  try {
    const json = await req.json();
    const parseResult = Body.safeParse(json);

    if (!parseResult.success) {
      return Response.json(
        { error: "Format email atau PIN tidak valid" },
        { status: 400 }
      );
    }

    const { email, pin } = parseResult.data;
    const ip = req.headers.get("x-forwarded-for") ?? "ip";
    const key = `${ip}:${email}`;
    const f = fails.get(key);

    if (f && f.n >= 5 && f.until > Date.now()) {
      return Response.json(
        { error: "Terlalu banyak percobaan. Coba lagi nanti." },
        { status: 429 }
      );
    }

    const user = await prisma.user.findUnique({ where: { email } });
    const ok = await bcrypt.compare(pin, user?.pinHash ?? DUMMY);

    if (!user || !ok || !user.active || user.deletedAt) {
      fails.set(key, {
        n: (f && f.until > Date.now() ? f.n : 0) + 1,
        until: Date.now() + 15 * 60_000,
      });
      return Response.json({ error: "Email atau PIN salah" }, { status: 401 });
    }

    fails.delete(key);

    try {
      await createSession(user.id);
    } catch (sessionErr: any) {
      console.error("SESSION_CREATE_ERROR:", sessionErr);
      // Tetap lanjutkan redirect jika session berhasil diset lewat cookie internal
    }

    const targetUrl = URLS[user.role] ?? PATHS[user.role] ?? "/owner";
    return Response.json({ redirectTo: targetUrl });

  } catch (error: any) {
    console.error("LOGIN_API_CRASH:", error);
    return Response.json(
      {
        error: "Gagal memproses login",
        detail: error?.message || String(error),
      },
      { status: 500 }
    );
  }
};