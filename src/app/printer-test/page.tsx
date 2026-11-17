"use client";
import { useEffect, useState } from "react";
import { buildReceipt } from "@/lib/escpos";
import { bluetoothSupported, connectPrinter, printBytes, disconnectPrinter, isPrinterConnected } from "@/lib/bluetooth-printer";

export default function PrinterTest() {
  const [log, setLog] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => { setReady(true); }, []);

  function push(s: string) {
    setLog((l) => [...l, `${new Date().toLocaleTimeString("id-ID")} — ${s}`]);
  }
  async function connect() {
    try {
      push("Meminta pilih printer…");
      const name = await connectPrinter();
      push(`TERHUBUNG: ${name}`);
    } catch (e: any) {
      push(`ERROR connect: ${e?.message ?? e}`);
    }
  }
  async function test() {
    try {
      if (!isPrinterConnected()) await connect();
      const text = "\x1B@TES PRINT BLE 123\n\n\n\x1D\x56\x42\x00";
      const bytes = new Uint8Array(text.length);
      for (let i = 0; i < text.length; i++) bytes[i] = text.charCodeAt(i) & 0xff;
      push(`Mengirim ${bytes.length} byte tes…`);
      await printBytes(bytes);
      push("SELESAI kirim tes");
    } catch (e: any) {
      push(`ERROR kirim: ${e?.message ?? e}`);
    }
  }
  async function struk() {
    try {
      if (!isPrinterConnected()) await connect();
      const bytes = buildReceipt({
        widthMm: 58,
        shop: "TEST CABANG",
        date: new Date(),
        service: "Cukur",
        barber: "Barber 01",
        customer: "Tes Print",
        priceRp: 35000,
        discountRp: 5000,
        totalRp: 30000,
        paidRp: 35000,
        changeRp: 5000,
        method: "Tunai",
        footer: "Terima kasih",
      });
      push(`Mengirim ${bytes.length} byte struk…`);
      await printBytes(bytes);
      push("SELESAI kirim struk");
    } catch (e: any) {
      push(`ERROR kirim: ${e?.message ?? e}`);
    }
  }
  function putus() {
    disconnectPrinter();
    push("Koneksi diputus");
  }

  return (
    <main className="main" style={{ maxWidth: 620 }}>
      <div className="card">
        <h2>Tes Printer Bluetooth (BLE)</h2>
        <p style={{ fontSize: 13, color: "var(--muted)" }}>
          {ready ? `Web Bluetooth: ${bluetoothSupported() ? "Didukung" : "TIDAK didukung"} | https: ${window.isSecureContext ? "Ya" : "Tidak"}` : "Memuat…"}
        </p>
        <p style={{ fontSize: 11, color: "var(--muted)", wordBreak: "break-all" }}>
          {ready ? navigator.userAgent : ""}
        </p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "12px 0" }}>
          <button className="btn" onClick={connect}>1. Connect</button>
          <button className="btn t" onClick={test}>2. Print TEST</button>
          <button className="btn t" onClick={struk}>3. Print STRUK</button>
          <button className="btn" onClick={putus}>Putuskan</button>
        </div>
        <pre style={{ background: "var(--card)", padding: 12, borderRadius: 8, fontSize: 12, whiteSpace: "pre-wrap", minHeight: 180 }}>
{log.join("\n") || "Log muncul di sini."}
        </pre>
      </div>
    </main>
  );
}
