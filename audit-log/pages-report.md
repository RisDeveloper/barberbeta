# Laporan Semua Halaman — TheSystem (BarberStory)

Tanggal: 2026-11-12
URL Production: https://thesystempos.my.id
Total halaman: ~35 (owner 11, admin 9, cashier 6, employee 5, auth 1, error 2)

---

## AUTH

### /auth — Login
- Form email + PIN (4-8 digit).
- Validasi: email format, PIN regex.
- Rate limit: 5 percobaan → lockout 15 menit per IP+email.
- Redirect berdasarkan role (OWNER→/owner, ADMIN→/admin, CASHIER→/cashier, EMPLOYEE→/employee).
- Error handling: "Email atau PIN salah", "Terlalu banyak percobaan".
- Theme: dark mode login dengan border kuning + glow.

---

## OWNER PORTAL (/owner)

### /owner — Ringkasan Bisnis (Dashboard)
- KPI: Total pendapatan, Total transaksi, Cabang aktif, Karyawan aktif, Total komisi, Pendapatan tambahan, Total pengeluaran, Hasil operasional bersih.
- Filter: RangeFilter (Hari/Minggu/Bulan/Per Hari) + BranchSel.
- Data dari `finance()` function (aggregate transaction + income + expense + commission).

### /owner/branches — Manajemen Cabang
- Tabel: Cabang, Admin, Kasir, Barber, Pendapatan (bulan), Transaksi, Status, Aksi.
- Form tambah cabang: Nama, Zona waktu, Awal shift, Logo.
- Edit: inline form (details/summary).
- Hapus: soft delete (deletedAt, active=false). Karyawan & layanan cabang ikut dinonaktifkan.
- Admin assignment: dropdown admin → cabang.
- Shift management: Kelola shift cabang (tambah/hapus shift: nama, mulai, selesai, toleransi, uang makan).
- Toast notifikasi (hijau/merah).

### /owner/employees — Manajemen Karyawan
- Tabel: Nama, Email, Peran, Cabang, Kasbon, Bersih, Status, Kelola.
- Form tambah: Nama, Email, PIN, Peran, Cabang, Awal shift, Jam selesai, Toleransi, Uang makan, Hari kerja (checkbox), Shift (checkbox per hari dengan radio Libur/Pagi/Malam + jam masuk/keluar).
- Edit: inline form (updateUser, resetPin).
- Hapus: soft delete (deletedAt, active=false, session dihapus).
- Filter: cari nama, peran, cabang.
- Kasbon & Bersih: aggregate dari expense record + commission.

### /owner/settings — Pengaturan Sistem
- Logo portal pemilik (LogoField).
- Layanan: form tambah/edit (Nama layanan, Harga, Komisi dasar, Cabang, Aktif).
- Per-karyawan komisi: override per layanan per karyawan (input per employee).
- Tabel layanan: Nama layanan, Harga, Komisi, Nama karyawan, Cabang, Status, edit/hapus.
- Konfigurasi: zona waktu default, domain portal.

### /owner/transactions — Semua Transaksi
- List transaksi (take 200).
- Status: COMPLETED, CANCELLED, REFUNDED.
- Cancel request flow (approve/reject).

### /owner/revenue — Analisis Pendapatan
- Revenue per periode, per cabang.
- Filter: RangeFilter + BranchSel.

### /owner/reports — Laporan Keuangan
- Ringkasan keuangan.

### /owner/finance — Pendapatan & Pengeluaran
- Tab: Pendapatan / Pengeluaran.
- Form tambah: Tanggal, Kategori, Deskripsi, Jumlah, Cabang, Pembayaran, Bukti, Karyawan (untuk kasbon/insentif/bonus).
- Edit & void (batalkan) dengan alasan.
- Tabel: Tanggal, Kategori, Deskripsi, Karyawan, Cabang, Pembayaran, Jumlah, Status, edit/batalkan.
- Audit log terbaru (15 record).

### /owner/commissions — Manajemen Komisi
- Aturan baru: Peran, Jenis (Tetap/Persen), Nilai, Cabang, Karyawan, Berlaku dari/sampai.
- Daftar aturan: Peran, Cakupan, Jenis, Nilai, Dari, Sampai, Status, Akhiri.
- Komisi: Tanggal, Transaksi, Cabang, Karyawan, Jumlah, Status, Setujui/Tandai dibayar.
- Filter: RangeFilter + BranchSel + Status.

### /owner/attendance — Absensi Karyawan
- View absensi per cabang.

### /owner/artists — Barber (Performa)
- Tabel: Barber, Ketersediaan, Pelanggan hari ini/minggu/periode, Pendapatan hari ini/minggu/periode.

---

## ADMIN PORTAL (/admin)

### /admin — Ringkasan
- KPI: Pendapatan harian/mingguan/bulanan, Transaksi hari ini, Rata-rata transaksi, Layanan cukur selesai.

### /admin/analytics — Analisis
- Analytics per cabang.

### /admin/artists — Barber
- Performa barber per cabang.

### /admin/attendance — Absensi
- Absensi per cabang.

### /admin/cashiers — Kasir
- Daftar kasir per cabang.

### /admin/profile — Profil
- Profil admin.

### /admin/reports — Laporan
- Laporan per cabang.

### /admin/transactions — Transaksi
- Daftar transaksi per cabang.

### /admin/transactions/[id] — Detail Transaksi
- Detail transaksi individual.

---

## CASHIER PORTAL (/cashier)

### /cashier — Dasbor
- Filter: Harian/Mingguan/Bulanan/Per Hari.
- KPI: Pendapatan, Pengeluaran, Kasbon, Pendapatan bersih, Tunai, QRIS, Transaksi.
- Branch name display.

### /cashier/new — POS (Transaksi Baru)
- Pilih layanan (grid 4 kolom, 2 di mobile).
- Pilih barber (tile, filter tersedia).
- Ringkasan: pelanggan, diskon, total.
- Pembayaran: Tunai (input + quick buttons + kembalian) / QRIS (dynamic QR).
- Konfirmasi transaksi → struk auto-print.
- Toast notifikasi.

### /cashier/history — Riwayat Transaksi
- Daftar transaksi kasir.
- Request pembatalan (CANCELLED/REFUNDED) dengan alasan.
- Approve/reject pembatalan.

### /cashier/expenses — Pengeluaran
- Form catat pengeluaran (deskripsi, kategori, jumlah).
- Form kasbon/insentif/bonus (karyawan, jenis, jumlah).
- Riwayat pengeluaran & kasbon (tabel).
- Toast notifikasi (useFormState).

### /cashier/attendance — Absensi Karyawan
- Grid karyawan (card per karyawan).
- Modal check-in (PIN) / check-out (one click).
- Status: Belum absen / Hadir / Terlambat / Selesai.
- Toast notifikasi.

### /cashier/profile — Profil
- Profil kasir (stats: transaksi hari ini, pengeluaran hari ini, layanan).

---

## EMPLOYEE PORTAL (/employee)

### /employee — Dashboard
- Absensi hari ini (jam masuk, jam keluar, status, uang makan).
- Stats: Pelanggan hari ini, Komisi hari ini, Kasbon (total), Pendapatan bulan ini, Pendapatan bersih (bulan ini).
- Branch name display.

### /employee/attendance — Absensi Saya
- Status hari ini (masuk, keluar, status, uang makan).
- Total jam kerja + total uang makan (periode).
- Tabel riwayat absensi (tanggal, masuk, keluar, status, jam, uang makan).
- Filter periode (RangeFilter).

### /employee/earnings — Pendapatan Saya
- Range filter.
- Stats: Pendapatan hari ini/bulan ini, Insentif, Bonus, Kasbon, Menunggu/Disetujui, Dibayar, Pelanggan dilayani.
- Grafik komisi harian (bar chart).
- Riwayat pendapatan (tabel: tanggal, transaksi, layanan, komisi, status).
- Kasbon, insentif & bonus (tabel).

### /employee/history — Riwayat Lengkap
- Unified log: komisi, kasbon, insentif, bonus (sorted by date desc).
- Kolom: Tanggal, Jenis (pill), Keterangan, Jumlah (+/-), Status.

### /employee/profile — Profil Saya
- Profil barber (social-media style card).
- Stats: Pelanggan, Komisi bulan ini, Hadir bulan ini.
- Rows: ID Karyawan, Cabang, Kartu absensi.
- Note: "Peran dan cabang hanya dapat diubah oleh pemilik."

---

## AUTH & ERROR

### /auth — Login
- Form email + PIN.
- Theme: dark mode login (border kuning, glow, radial gradient removed).
- Redirect berdasarkan role.

### /error — Error Boundary
- "Terjadi kesalahan" + tombol coba lagi + link kembali.

### /not-found — 404
- "Halaman tidak ditemukan" + link kembali.

---

## PWA & COMPONENTS

### PWA
- manifest.json (name: TheSystem, icons: icon-192.png + icon-512.png white bg).
- sw.js (network-first, cache only 200 OK, never cache redirects).
- apple-touch-icon.png (180×180, white bg).
- Meta tags: apple-mobile-web-app-capable, apple-touch-icon, theme-color, manifest.

### Komponen utama
- **ThemeToggle**: floating button bottom-right (light/dark).
- **ToastHost**: toast notification kiri bawah (hijau/merah, auto-dismiss 4s).
- **PortalNav**: nav bar (desktop sidebar / mobile bottom pill).
- **Tbl**: reusable table component.
- **F**: form field component.
- **LogoField**: logo upload (data URL).
- **ProfileCard**: social-media style profile card.
- **RangeFilter**: date range filter.
- **BranchSel**: branch selector dropdown.

---

## API ROUTES

| Route | Method | Fungsi |
|-------|--------|--------|
| /api/auth/login | POST | Login (email + PIN) |
| /api/auth/logout | POST | Logout (delete session) |
| /api/services | GET | List services (branch-scoped) |
| /api/artists | GET | List barbers (branch-scoped, availability) |
| /api/transactions | POST | Create transaction (POS) |
| /api/attendance/cashier | POST | Check-in/out (cashier) |
| /api/owner/export | GET | Export data (owner) |
| /api/admin/export | GET | Export data (admin) |

---

## FITUR UTAMA (summary)
1. Multi-role auth (Owner, Admin, Cashier, Employee) + PIN.
2. Branch CRUD + soft delete + shift management.
3. Employee CRUD + soft delete + PIN reset + shift/work days/meal allowance.
4. Service CRUD + soft delete + per-employee commission override.
5. POS: cash + QRIS (dynamic), struk auto-print.
6. Absensi: check-in/out one click, late detection, meal allowance (forfeit if late).
7. Komisi: rule-based (FIXED/PERCENT) + per-layanan + per-karyawan.
8. Keuangan: income/expense records, void/edit, employee pay (kasbon/insentif/bonus).
9. Laporan: revenue, analytics, artists performance.
10. Tema: light/dark mode, yellow accent (#FED950).
11. Toast notifications (bottom-left, red/green).
12. PWA: manifest, service worker, iOS standalone, white-bg icon.
13. Audit log (dicatat, belum ada viewer UI).

---

## YANG BELUM ADA (gap)
1. Audit log viewer UI.
2. Export data (CSV/Excel) — route ada tapi UI belum.
3. Struk sudah ada (auto-print).
4. Payment gateway (QRIS auto-detect).
5. Inventory/produk stock.
6. Backup/restore otomatis.
7. Notifikasi push/email.
8. Rate limiting login (ada basic 5 attempt lockout).
9. Offline mode (PWA basic cache).
10. Multi-branch consolidated dashboard (owner dashboard sudah ada tapi basic).

---

*Laporan ini dibuat berdasarkan analisis codebase. File: audit-log/pages-report.md*