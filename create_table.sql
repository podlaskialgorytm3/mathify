CREATE TABLE "MaterialSubchapter" (
    "id" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "subchapterId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MaterialSubchapter_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "MaterialSubchapter_materialId_subchapterId_key" ON "MaterialSubchapter"("materialId", "subchapterId");
