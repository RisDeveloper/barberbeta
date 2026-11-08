/** Build a dynamic QRIS payload (with amount) from a static merchant payload. */
export function buildQris(staticQris: string, amount: number) {
  if (!staticQris || amount <= 0) return "";
  const s = staticQris.trim(), fields: [string, string][] = [];
  for (let i = 0; i < s.length; ) {
    const tag = s.slice(i, i + 2), len = Number(s.slice(i + 2, i + 4));
    if (!/^\d{2}$/.test(tag) || !Number.isInteger(len) || i + 4 + len > s.length) return "";
    const val = s.slice(i + 4, i + 4 + len);
    i += 4 + len;
    if (tag === "63" || tag === "54") continue; // CRC is recomputed; amount is replaced
    fields.push([tag, tag === "01" ? "12" : val]);
  }
  const at = fields.findIndex(([t]) => t === "58");
  fields.splice(at < 0 ? fields.length : at, 0, ["54", String(amount)]);
  const out = fields.map(([t, v]) => t + String(v.length).padStart(2, "0") + v).join("");
  const crcInput = out + "6304";
  let crc = 0xffff;
  for (let c = 0; c < crcInput.length; c++) {
    crc ^= crcInput.charCodeAt(c) << 8;
    for (let j = 0; j < 8; j++) crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
  }
  return crcInput + crc.toString(16).toUpperCase().padStart(4, "0");
}
