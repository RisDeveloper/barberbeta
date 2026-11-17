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
      if (c) return c;
    } catch {}
  }
  try {
    const services = await server.getPrimaryServices();
    for (const service of services) {
      const c = await writableChar(service);
      if (c) return c;
    }
  } catch {}
  return null;
}

export async function connectPrinter() {
  const bt = (navigator as any).bluetooth;
  if (!bt) throw new Error("Browser tidak mendukung Web Bluetooth. Pakai Chrome di Android.");
  if (!device || !device.gatt?.connected) {
    device = await bt.requestDevice({ acceptAllDevices: true, optionalServices: SERVICES });
    if (!device.gatt) throw new Error("Printer tidak mendukung GATT/BLE");
    const server = await device.gatt.connect();
    chr = await findWritable(server);
    if (!chr) throw new Error("Printer Bluetooth ini bukan BLE (Bluetooth 2.0 klasik) atau tidak punya karakteristik tulis.");
  }
  return device.name || "Printer";
}

export async function printBytes(bytes: Uint8Array) {
  if (!chr || !device?.gatt?.connected) await connectPrinter();
  const chunk = 20;
  for (let i = 0; i < bytes.length; i += chunk) {
    const part = bytes.slice(i, i + chunk);
    if (chr.properties?.writeWithoutResponse) await chr.writeValueWithoutResponse(part);
    else await chr.writeValue(part);
    await new Promise((r) => setTimeout(r, 15));
  }
}

export async function disconnectPrinter() {
  try { device?.gatt?.disconnect(); } catch {}
  device = null;
  chr = null;
}
