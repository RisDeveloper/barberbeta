# Audit — Ringkasan (10 Temuan Teratas)

Tanggal: 2026-11-09. Read-only. Laporan lengkap di audit-log/.

1. **Route debug mengekspos env** (`src/app/api/debug/route.ts`) — risiko kebocoran DB URL. Hapus/protect. Risiko penghapusan: rendah.
2. **AuditLog & Device model tidak dipakai** (schema) — AuditLog tidak pernah ditulis; Device tidak direferensikan di kode. Risiko: butuh migration; sedang.
3. **Query berat take:20000** (admin/analytics, owner/revenue) — bisa lambat di data besar. Risiko pengurangan take: rendah (ubah pagination).
4. **Index kurang** (Service, Branch, CommissionRule, AuditLog, Expense/Income by branch) — query filter lambat. Risiko: migration; rendah.
5. **qrcode bundle besar** hanya di POS — kandidat next/dynamic. Risiko: rendah.
6. **Build tidak bisa dijalankan** di env ini (EPERM lock) — angka route size tidak tersedia. Risiko: tidak ada perubahan kode.
7. **Tidak ada file/dependency yang jelas tidak terpakai** — tidak ada aksi.
8. **public/ kecil** (applogo.png 25KB) — tidak ada file >200KB.
9. **Export routes take:50000** — wajar untuk export, tapi bisa berat; pertimbangkan streaming.
10. **Tidak ada test** — perubahan non-trivial (qris, earnings, profile) tanpa test. Risiko regresi; sedang.

## Rekomendasi aksi (tunggu persetujuan)
- Hapus `src/app/api/debug/route.ts` (tinggi).
- Tambah index Prisma via migration (sedang).
- Lazy-load `qrcode` di POS (rendah).
- Kurangi take di analytics/revenue atau tambah pagination (sedang).
- AuditLog/Device: hapus model via migration (sedang).

Setelah Anda setujui daftar file yang boleh dihapus, saya eksekusi. Selain itu, semua perubahan tetap read-only sampai ada persetujuan.
