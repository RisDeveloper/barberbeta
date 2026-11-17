const asc = (s: unknown) => String(s ?? "").replace(/[^\x20-\x7E]/g, "");
const rp = (n: number) => Number(n || 0).toLocaleString("id-ID");

export type ReceiptData = {
  widthMm: number;
  shop?: string;
  date?: Date;
  service?: string;
  barber?: string;
  customer?: string;
  priceRp: number;
  discountRp: number;
  totalRp: number;
  paidRp: number;
  changeRp: number;
  method: string;
  footer?: string;
};

export function buildReceipt(data: ReceiptData): Uint8Array {
  const W = data.widthMm >= 76 ? 48 : 32;
  const line = () => "-".repeat(W) + "\n";
  const two = (a: unknown, b: unknown) => {
    let left = asc(a);
    const right = asc(b);
    if (left.length + right.length >= W) left = left.slice(0, Math.max(W - right.length - 1, 0));
    return left + " ".repeat(Math.max(W - left.length - right.length, 1)) + right + "\n";
  };
  const ctr = (s: unknown) => {
    let text = asc(s);
    let out = "";
    while (text.length > 0) {
      const part = text.slice(0, W);
      text = text.slice(W);
      out += " ".repeat(Math.floor((W - part.length) / 2)) + part + "\n";
    }
    return out || "\n";
  };
  const wrap = (s: unknown) => {
    let text = asc(s);
    let out = "";
    while (text.length > W) {
      out += text.slice(0, W) + "\n";
      text = text.slice(W);
    }
    return out + text + "\n";
  };
  const INIT = "\x1B\x40", BOLD_ON = "\x1B\x45\x01", BOLD_OFF = "\x1B\x45\x00";
  const tgl = new Date(data.date ?? Date.now()).toLocaleString("id-ID", { dateStyle: "short", timeStyle: "short", timeZone: "Asia/Jakarta" });

  let s = INIT + BOLD_ON + ctr(data.shop || "TheSystem") + BOLD_OFF + ctr("Powered by The System Pos") + line();
  s += asc(tgl) + "\n" + line();
  if (data.service) s += wrap("Layanan: " + data.service);
  if (data.barber) s += wrap("Barber: " + (data.barber || "-"));
  if (data.customer) s += wrap("Pelanggan: " + data.customer);
  s += line();
  s += two("Harga", "Rp" + rp(data.priceRp));
  if (data.discountRp) s += two("Diskon", "-Rp" + rp(data.discountRp));
  s += BOLD_ON + two("TOTAL", "Rp" + rp(data.totalRp)) + BOLD_OFF;
  s += two(data.method || "Tunai", "Rp" + rp(data.paidRp));
  s += two("Kembali", "Rp" + rp(Math.max(data.changeRp, 0))) + line();
  s += ctr(data.footer) + ctr("*** TERIMA KASIH ***") + "\n\n\n" + "\x1D\x56\x42\x00";

  const bytes = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) bytes[i] = s.charCodeAt(i) & 0xff;
  return bytes;
}
