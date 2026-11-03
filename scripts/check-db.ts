import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDatabaseConnection() {
  console.log('🔄 Sedang mencoba terhubung ke database Supabase via Prisma...\n');

  try {
    await prisma.$connect();
    console.log('✅ Status Koneksi: BERHASIL TERHUBUNG!');

    const [userCount, branchCount, serviceCount] = await Promise.all([
      prisma.user.count(),
      prisma.branch.count(),
      prisma.service.count(),
    ]);

    console.log('\n📊 Ringkasan Data Saat Ini:');
    console.log(`   • Jumlah Branch  : ${branchCount}`);
    console.log(`   • Jumlah User    : ${userCount}`);
    console.log(`   • Jumlah Service : ${serviceCount}`);

    console.log('\n🎉 Semuanya aman! Database Supabase dan Prisma Client siap digunakan.');
  } catch (error) {
    console.error('❌ Status Koneksi: GAGAL!');
    console.error('\nRincian Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabaseConnection();