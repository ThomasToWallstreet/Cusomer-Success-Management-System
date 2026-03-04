-- CreateTable
CREATE TABLE "public"."CustomerContact" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "department" TEXT,
    "level" TEXT,
    "note" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerContact_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CustomerContact_customerId_idx" ON "public"."CustomerContact"("customerId");

-- CreateIndex
CREATE INDEX "CustomerContact_customerId_status_idx" ON "public"."CustomerContact"("customerId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerContact_customerId_name_key" ON "public"."CustomerContact"("customerId", "name");

-- AddForeignKey
ALTER TABLE "public"."CustomerContact" ADD CONSTRAINT "CustomerContact_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
