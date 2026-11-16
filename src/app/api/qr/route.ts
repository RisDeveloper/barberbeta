import QRCode from "qrcode";

export const dynamic = "force-dynamic";

export const GET = async (req: Request) => {
  const text = new URL(req.url).searchParams.get("text") ?? "";
  if (!text || text.length > 200) return new Response("Bad request", { status: 400 });
  const buf = await QRCode.toBuffer(text, { scale: 8, margin: 2, type: "png" });
  return new Response(buf, { headers: { "Content-Type": "image/png", "Cache-Control": "no-store" } });
};
