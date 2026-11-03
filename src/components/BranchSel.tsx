import { prisma } from "@/lib/db"; import { F } from "./F"; import type { SP } from "@/lib/range";
export default async function BranchSel({ sp }: { sp: SP }) {
  const bs = await prisma.branch.findMany({ where: { deletedAt: null }, orderBy: { name: "asc" } });
  return <F l="Cabang" n="branch" d={sp.branch ?? ""} o={[["", "Semua cabang"], ...bs.map((b) => [b.id, b.name] as [string, string])]} />;
}
