ALTER TABLE "CustomerScenarioItem"
ADD COLUMN "keyScenarioDescription" TEXT;

CREATE TABLE "CustomerScenarioAttachment" (
    "id" TEXT NOT NULL,
    "scenarioItemId" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "storedName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "mimeType" TEXT,
    "fileSize" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomerScenarioAttachment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CustomerScenarioAttachment_scenarioItemId_createdAt_idx"
ON "CustomerScenarioAttachment"("scenarioItemId", "createdAt");

ALTER TABLE "CustomerScenarioAttachment"
ADD CONSTRAINT "CustomerScenarioAttachment_scenarioItemId_fkey"
FOREIGN KEY ("scenarioItemId") REFERENCES "CustomerScenarioItem"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
