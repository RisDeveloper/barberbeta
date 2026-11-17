export type PrinterLogEntry = { at: string; level: "info" | "err"; msg: string };

let entries: PrinterLogEntry[] = [];
const listeners = new Set<(all: PrinterLogEntry[]) => void>();

export function printerLog(msg: string, level: "info" | "err" = "info") {
  entries = [...entries, { at: new Date().toLocaleTimeString("id-ID"), level, msg }];
  listeners.forEach((fn) => fn(entries));
}

export function getPrinterLog() {
  return entries;
}

export function subscribePrinterLog(fn: (all: PrinterLogEntry[]) => void) {
  listeners.add(fn);
  fn(entries);
  return () => { listeners.delete(fn); };
}

export function clearPrinterLog() {
  entries = [];
  listeners.forEach((fn) => fn(entries));
}
