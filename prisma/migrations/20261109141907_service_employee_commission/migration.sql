-- CreateTable
CREATE TABLE "ServiceCommission" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "commissionRp" INTEGER NOT NULL,

    CONSTRAINT "ServiceCommission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ServiceCommission_serviceId_idx" ON "ServiceCommission"("serviceId");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceCommission_serviceId_userId_key" ON "ServiceCommission"("serviceId", "userId");

-- AddForeignKey
ALTER TABLE "ServiceCommission" ADD CONSTRAINT "ServiceCommission_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceCommission" ADD CONSTRAINT "ServiceCommission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
