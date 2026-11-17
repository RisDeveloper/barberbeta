import { printerLog } from "./printer-log";

const SERVICES = [
  "000018f0-0000-1000-8000-00805f9b34fb",
  "0000ff00-0000-1000-8000-00805f9b34fb",
  "0000ff10-0000-1000-8000-00805f9b34fb",
  "0000ffe0-0000-1000-8000-00805f9b34fb",
  "0000fff0-0000-1000-8000-00805f9b34fb",
  "0000ffb0-0000-1000-8000-00805f9b34fb",
  "0000fee7-0000-1000-8000-00805f9b34fb",
  "0000ae30-0000-1000-8000-00805f9b34fb",
  "49535343-fe7d-4ae5-8fa9-9fafd205e455",
  "e7810a71-73ae-499d-8c15-faa9aef0c3f2",
  "bef8d6c9-9c21-4c9e-b632-bd58c1009f9f",
];

let device: any = null;
let chr: any = null;

export function bluetoothSupported() {
  return typeof navigator !== "undefined" && !!(navigator as any).bluetooth;
}

export function isPrinterConnected() {
  return !!(device && device.gatt?.connected && chr);
}

async function writableChar(service: any) {
  const chars = await service.getCharacteristics();
  return chars.find((c: any) => c.properties?.write || c.properties?.writeWithoutResponse) ?? null;
}

async function findWritable(server: any) {
  for (const uuid of SERVICES) {
    try {
      const service = await server.getPrimaryService(uuid);
      const c = await writableChar(service);
      if (c) {
        printerLog(`Ketemu karakteristik tulis: ${c.uuid} (${JSON.stringify(c.properties)}) di service ${uuid}`);
        return c;
      }
    } catch {}
  }
  try {
    const services = await server.getPrimaryServices();
    printerLog(`Service tersedia: ${services.map((s: any) => s.uuid).join(", ") || "tidak ada"}`);
    for (const service of services) {
      const c = await writableChar(service);
      if (c) {
        printerLog(`Ketemu karakteristik tulis: ${c.uuid} (${JSON.stringify(c.properties)})`);
        return c;
      }
    }
  } catch (e: any) {
    printerLog(`Gagal baca daftar service: ${e?.message ?? e}`, "err");
  }
  return null;
}

export async function connectPrinter() {
  printerLog(`Mulai connect. https=${window.isSecureContext}, WebBluetooth=${bluetoothSupported()}, UA=${navigator.userAgent.slice(0, 90)}`);
  if (!window.isSecureContext) {
    printerLog("Gagal: alamat bukan https", "err");
    throw new Error("Cetak Bluetooth butuh alamat https.");
  }
  const bt = (navigator as any).bluetooth;
  if (!bt) {
    printerLog("Gagal: navigator.bluetooth tidak ada (bukan Chrome Android / Safari)", "err");
    throw new Error("Browser tidak mendukung Web Bluetooth. Pakai Chrome Android + https (Safari/iOS tidak bisa).");
  }
  if (!device || !device.gatt?.connected) {
    printerLog("Buka popup pilih printer…");
    try {
      device = await bt.requestDevice({ acceptAllDevices: true, optionalServices: SERVICES });
    } catch (e: any) {
      printerLog(`Pemilihan printer gagal/dibatalkan: ${e?.message ?? e}`, "err");
      throw new Error(`Pemilihan printer gagal: ${e?.message ?? e}`);
    }
    printerLog(`Printer dipilih: ${device.name || "(tanpa nama)"}`);
    if (!device.gatt) {
      printerLog("Gagal: printer tidak punya GATT/BLE", "err");
      throw new Error("Printer tidak mendukung GATT/BLE (kemungkinan Bluetooth klasik).");
    }
    try {
      const server = await device.gatt.connect();
      printerLog("GATT tersambung, cari karakteristik tulis…");
      chr = await findWritable(server);
    } catch (e: any) {
      const why = e?.name === "NetworkError"
        ? "printer masih dipakai tab/browser/app lain (Web Bluetooth cuma 1 koneksi)"
        : e?.message ?? String(e);
      printerLog(`Gagal connect GATT: ${why}`, "err");
      throw new Error(`Gagal connect ke printer: ${why}. Tutup tab demo, matikan–nyalakan printer, lalu coba lagi.`);
    }
    if (!chr) {
      printerLog("Gagal: tidak ada karakteristik tulis (bukan BLE / service tidak dikenal)", "err");
      throw new Error("Printer tidak punya karakteristik tulis BLE. Kemungkinan Bluetooth 2.0 klasik atau service tidak dikenal.");
    }
  } else {
    printerLog(`Pakai koneksi existing: ${device.name || "Printer"}`);
  }
  return device.name || "Printer";
}

export async function printBytes(bytes: Uint8Array) {
  if (!chr || !device?.gatt?.connected) await connectPrinter();
  printerLog(`Kirim ${bytes.length} byte (${Math.ceil(bytes.length / 200)} paket)`);
  let onlyNoResponse = false;
  let i = 0;
  while (i < bytes.length) {
    const size = onlyNoResponse ? 20 : 200;
    const part = bytes.slice(i, i + size);
    if (onlyNoResponse) {
      try {
        await chr.writeValueWithoutResponse(part);
      } catch (e: any) {
        printerLog(`Gagal tulis (without response) offset ${i}: ${e?.message ?? e}`, "err");
        throw e;
      }
    } else {
      try {
        await chr.writeValue(part);
      } catch (e: any) {
        if (e?.name === "NotSupportedError") {
          printerLog("Characteristic tidak support writeValue, fallback ke 20 byte tanpa response");
          onlyNoResponse = true;
          continue;
        }
        printerLog(`Gagal tulis offset ${i}: ${e?.name ?? ""} ${e?.message ?? e}`, "err");
        throw e;
      }
    }
    i += part.length;
    await new Promise((r) => setTimeout(r, 15));
  }
  printerLog("Semua byte berhasil dikirim");
}

export async function disconnectPrinter() {
  try { device?.gatt?.disconnect(); } catch {}
  printerLog("Koneksi diputus");
  device = null;
  chr = null;
}
