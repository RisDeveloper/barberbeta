const S: Record<string, string> = {
  COMPLETED: "Selesai", CANCELLED: "Dibatalkan", REFUNDED: "Dikembalikan",
  PENDING: "Menunggu", APPROVED: "Disetujui", PAID: "Dibayar", REVERSED: "Dibatalkan",
  PRESENT: "Hadir", LATE: "Terlambat", ON_LEAVE: "Cuti", ABSENT: "Tidak hadir", INCOMPLETE: "Belum lengkap",
};
export const st = (s: string) => S[s] ?? s;
