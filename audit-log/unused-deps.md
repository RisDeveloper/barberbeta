# Audit — Dependency Tidak Terpakai

Tanggal: 2026-11-09. Read-only.

## Hasil

Semua dependency di `package.json` dipakai secara langsung atau tidak langsung. Tidak ada paket yang bisa dihapus aman.

| paket | status | catatan |
|-------|--------|---------|
| @prisma/client | dipakai | semua akses DB |
| bcryptjs | dipakai | hash PIN login |
| next | dipakai | framework |
| qrcode | dipakai | `src/app/cashier/new/pos.tsx` (QRIS dinamis) |
| react / react-dom | dipakai | UI |
| zod | dipakai | validasi login |
| @types/* | dev, dipakai | tipe TS |
| prisma | dev, dipakai | migrate/generate |
| tsx | dev, dipakai | seed & script |
| typescript | dev, dipakai | tsc |

## Dipakai tidak langsung (jangan hapus)
- `prisma` (dev) — generate client, migrate.
- Tidak ada tailwind/postcss (styling via CSS manual di `globals.css`).

## Rekomendasi
- `qrcode` (~1.5MB unpacked) hanya dipakai di POS; kandidat `next/dynamic` (lihat heavy.md).
- Tidak ada dependency yang bisa dihapus.
