# Audit — Kode Mati

Tanggal: 2026-11-09. Read-only.

## Temuan

### 1. Route debug mengekspos env (risiko keamanan) — keyakinan tinggi
- Path: `src/app/api/debug/route.ts` (seluruh file, 52 baris)
- Alasan: route `GET /api/debug` menampilkan 15 karakter awal `DATABASE_URL`/`DIRECT_URL`, status koneksi DB, dan jumlah user. Tidak direferensikan dari UI manapun (grep: 0 referensi). Risiko: kebocoran kredensial DB.
- Rekomendasi: hapus route ini (atau proteksi owner + non-production).

### 2. Fungsi/export yang tidak dipanggil — keyakinan rendah/sedang
- Tidak ditemukan export yang jelas mati. Semua `lib/*` (session, guard, owner, admin, time, range, earnings, commission, attendance, labels, qris) dipakai.
- `portalHome` (guard.ts) dipakai oleh ownerCtx.

### 3. Model Prisma yang mungkin tidak dipakai penuh
- `IncomeRecord` — dipakai di owner/finance dan export. OK.
- `AuditLog` — ditulis? Grep: hanya `findMany` di owner/finance. Tidak ada `create` di kode (audit log tidak pernah ditulis). Keyakinan sedang — kemungkinan dead (tabel selalu kosong). Path: `prisma/schema.prisma` model AuditLog; usage di `src/app/owner/finance/page.tsx` (findMany).
- `Device` — dipakai di schema relasi Branch; grep usage di src: `AttendanceCards.tsx`? Cek: grep "Device" → tidak ditemukan di src. Keyakinan tinggi: model Device tidak dipakai di kode (kiosk attendance mungkin fitur belum dibangun). Path: `prisma/schema.prisma` model Device.

### 4. Route API yang tidak direferensikan dari UI
- `/api/debug` (lihat #1).
- `/api/owner/export`, `/api/admin/export` — direferensikan via `<a href>` di reports page. Terpakai.

## Risiko penghapusan
- Hapus debug route: rendah (tidak ada referensi). Manfaat keamanan tinggi.
- Hapus model Device/AuditLog: sedang (butuh migration; AuditLog kosong, Device tidak dipakai). Sebaiknya buat migration, bukan edit schema langsung.
- Jangan hapus export route (dipakai).
