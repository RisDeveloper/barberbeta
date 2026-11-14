import crypto from "crypto";

const secret = process.env.PIN_SECRET || process.env.CARD_PEPPER || "barberstory-pin-fallback";
const key = crypto.createHash("sha256").update(secret).digest();

export function encPin(pin: string): string {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv("aes-256-gcm", key, iv);
  const enc = Buffer.concat([c.update(pin, "utf8"), c.final()]);
  const tag = c.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString("base64");
}

export function decPin(enc: string | null | undefined): string {
  if (!enc) return "";
  try {
    const b = Buffer.from(enc, "base64");
    const iv = b.subarray(0, 12), tag = b.subarray(12, 28), data = b.subarray(28);
    const d = crypto.createDecipheriv("aes-256-gcm", key, iv);
    d.setAuthTag(tag);
    return Buffer.concat([d.update(data), d.final()]).toString("utf8");
  } catch {
    return "";
  }
}
