import { redirect } from "next/navigation";
import { getUser } from "@/lib/session";

const HOME: Record<string, string> = { OWNER: "/owner", ADMIN: "/admin", CASHIER: "/cashier", EMPLOYEE: "/employee" };

/** Local/path-based entry point: send signed-in users to their portal, everyone else to login. */
export default async function Home() {
  const u = await getUser();
  redirect(u ? HOME[u.role] ?? "/auth" : "/auth");
}
