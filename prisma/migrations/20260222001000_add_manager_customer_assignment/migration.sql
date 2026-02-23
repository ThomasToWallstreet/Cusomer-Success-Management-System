-- CreateTable
CREATE TABLE "public"."ManagerCustomerAssignment" (
    "id" TEXT NOT NULL,
    "managerName" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ManagerCustomerAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ManagerCustomerAssignment_managerName_customerId_key"
ON "public"."ManagerCustomerAssignment"("managerName", "customerId");

-- CreateIndex
CREATE INDEX "ManagerCustomerAssignment_managerName_idx"
ON "public"."ManagerCustomerAssignment"("managerName");

-- CreateIndex
CREATE INDEX "ManagerCustomerAssignment_customerId_idx"
ON "public"."ManagerCustomerAssignment"("customerId");

-- AddForeignKey
ALTER TABLE "public"."ManagerCustomerAssignment"
ADD CONSTRAINT "ManagerCustomerAssignment_customerId_fkey"
FOREIGN KEY ("customerId") REFERENCES "public"."Customer"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
