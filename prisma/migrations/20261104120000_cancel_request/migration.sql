-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN "cancelRequested" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Transaction" ADD COLUMN "cancelReason" TEXT;
ALTER TABLE "Transaction" ADD COLUMN "cancelKind" "TxStatus";