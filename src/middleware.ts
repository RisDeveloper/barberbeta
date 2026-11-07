import { NextResponse, type NextRequest } from "next/server";
const PORTALS: Record<string, string> = { auth: "auth", kasir: "cashier", admin: "admin", owner: "owner", employee: "employee" };
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname.startsWith("/api") || pathname.startsWith("/_next")) return NextResponse.next();
  if (pathname.startsWith("/cashier/attendance") || pathname.startsWith("/employee/attendance")) {
    const r = NextResponse.next();
    r.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    r.headers.set("Pragma", "no-cache");
    r.headers.set("Expires", "0");
    return r;
  }
  const portal = PORTALS[(req.headers.get("host") ?? "").split(".")[0]]; if (!portal) return NextResponse.next();
  // Cheap gate only; real role + branch validation happens server-side in every layout/API via requireUser().
  if (portal !== "auth" && !req.cookies.has("bos_session")) return NextResponse.redirect(process.env.AUTH_URL ?? "/");
  // Already on the portal prefix (path-based access, e.g. localhost:3000/cashier) — don't prefix twice.
  if (pathname === `/${portal}` || pathname.startsWith(`/${portal}/`)) return NextResponse.next();
  return NextResponse.rewrite(new URL(`/${portal}${pathname === "/" ? "" : pathname}`, req.url));
}
