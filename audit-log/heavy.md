# Audit — Yang Berat

Tanggal: 2026-11-09. Read-only.

## A. File public > 200 KB
- Tidak ada. `public/applogo.png` = 25 KB. Tidak ada file di atas 200 KB.

## B. npm run build
- Tidak bisa dijalankan di environment ini: `EPERM: operation not permitted, rename ... query_engine-windows.dll.node` (file terkunci oleh dev server yang sedang jalan). `npx tsc --noEmit` lulus (tanpa error).
- Ukuran route & First Load JS tidak dapat dicatat. Saran: hentikan dev server lalu jalankan `npm run build` di mesin dev.

## C. Dependency terbesar
- `qrcode` (~1.5MB unpacked) — hanya dipakai di `src/app/cashier/new/pos.tsx`. Kandidat `next/dynamic` (lazy load saat pilih QRIS).
- `@prisma/client` besar tapi wajib.
- `next`/`react` standar.

## D. Query Prisma berat
- `take: 20000` di:
  - `src/app/admin/analytics/page.tsx` (line 5) — transaksi 90 hari.
  - `src/app/owner/revenue/page.tsx` (line 5) — transaksi 20000.
  - `src/app/api/admin/export/route.ts` & `owner/export/route.ts` — take 50000 (export, wajar).
- N+1: tidak ditemukan pola N+1 eksplisit; relasi di-include dalam satu query.
- Field difilter tanpa @@index:
  - `Service` (branchId, deletedAt) — tidak ada index.
  - `Branch` (deletedAt) — tidak ada index.
  - `CommissionRule` (branchId, userId, active) — tidak ada index.
  - `AuditLog` (entity, createdAt) — tidak ada index.
  - `User` sudah ada `@@index([branchId, role])`.
  - `Transaction` sudah ada `@@index([branchId, createdAt], [artistId, createdAt])`.
  - `AttendanceRecord` sudah ada `@@index([branchId, workDate])`.
  - `ExpenseRecord`/`IncomeRecord` hanya `@@index([date])` (dan userId untuk Expense). Filter by branchId + date tidak ter-index.

## E. Kandidat next/dynamic
- `qrcode` di POS (lazy).
- `ProfileCard`, `RangeFilter` ringan; tidak perlu.
- Halaman export (CSV) bisa lazy tapi low priority.

## Risiko
- Menambah index: migration baru, downtime minimal. Manfaat query analytics.
- Lazy-load qrcode: perubahan kecil, aman.
- Build tidak dijalankan: angka First Load JS tidak tersedia.
