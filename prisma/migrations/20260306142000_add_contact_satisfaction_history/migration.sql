-- CreateTable
CREATE TABLE "public"."CustomerContactSatisfactionHistory" (
  "id" TEXT NOT NULL,
  "contactId" TEXT NOT NULL,
  "satisfactionCurrent" TEXT NOT NULL,
  "satisfactionUpdatedAt" TIMESTAMP(3) NOT NULL,
  "satisfactionEvidence" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CustomerContactSatisfactionHistory_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."CustomerContactSatisfactionHistory"
ADD CONSTRAINT "CustomerContactSatisfactionHistory_contactId_fkey"
FOREIGN KEY ("contactId") REFERENCES "public"."CustomerContact"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "CustomerContactSatisfactionHistory_contactId_satisfactionUpdatedAt_idx"
ON "public"."CustomerContactSatisfactionHistory"("contactId", "satisfactionUpdatedAt");
