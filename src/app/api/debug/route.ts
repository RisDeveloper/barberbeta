import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  const dbUrl = process.env.DATABASE_URL || '';
  const directUrl = process.env.DIRECT_URL || '';

  let dbStatus = 'UNKNOWN';
  let dbError: any = null;
  let userCount = 0;

  try {
    userCount = await prisma.user.count();
    dbStatus = 'BERHASIL_TERHUBUNG';
  } catch (err: any) {
    dbStatus = 'GAGAL_TERHUBUNG';
    dbError = {
      name: err.name,
      message: err.message,
      code: err.code,
    };
  } finally {
    await prisma.$disconnect();
  }

  return NextResponse.json({
    status: dbStatus,
    timestamp: new Date().toISOString(),
    envVariablesCheck: {
      DATABASE_URL: {
        ada: !!dbUrl,
        diawaliPetik: dbUrl.startsWith('"') || dbUrl.startsWith("'"),
        diawaliPostgresProtocol: dbUrl.startsWith('postgresql://') || dbUrl.startsWith('postgres://'),
        awalanTeks15Karakter: dbUrl.substring(0, 15),
      },
      DIRECT_URL: {
        ada: !!directUrl,
        diawaliPetik: directUrl.startsWith('"') || directUrl.startsWith("'"),
        diawaliPostgresProtocol: directUrl.startsWith('postgresql://') || directUrl.startsWith('postgres://'),
        awalanTeks15Karakter: directUrl.substring(0, 15),
      },
      NEXTAUTH_SECRET: {
        ada: !!process.env.NEXTAUTH_SECRET,
      },
      NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'TIDAK_TERSET',
    },
    totalUserDiDatabase: userCount,
    detailError: dbError,
  });
}