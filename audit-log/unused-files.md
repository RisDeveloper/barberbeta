# Audit — File Tidak Terpakai

Tanggal: 2026-11-09. Read-only. Tidak ada file yang dihapus.

## Hasil

Telusuri `src/`, `app/`, `components/`, `lib/`, `hooks/`, `utils/`, `public/`. Semua file yang ada direferensikan (import alias `@/`, route Next.js, atau URL public). Tidak ditemukan file yang jelas tidak terpakai.

| path | alasan | keyakinan | ukuran |
|------|--------|-----------|--------|
| (none) | — | — | — |

## Catatan
- `src/qrcode.d.ts` ambient declaration untuk modul `qrcode`, dipakai oleh `src/app/cashier/new/pos.tsx`.
- `src/middleware.ts` dipakai otomatis oleh Next.js.
- `src/app/page.tsx`, `error.tsx`, `not-found.tsx`, `layout.tsx` adalah file khusus Next.js (terpakai).
- `public/applogo.png` (25 KB) direferensikan lewat URL di auth & owner layout.
- Folder `hooks/` dan `utils/` tidak ada di repo; logika ada di `lib/` dan `components/`.

## Kandidat rendah (tidak dihapus tanpa verifikasi)
- `src/app/api/debug/route.ts` — route debug, lihat dead-code.md (bukan file tidak terpakai, tapi dead code berisiko).
