-- CreateTable
CREATE TABLE "LatexDocument" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "sourceCode" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "materialId" TEXT,
    "templateId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LatexDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LatexTemplate" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "sourceCode" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LatexTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LatexElement" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "snippetCode" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LatexElement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LatexDocument_materialId_key" ON "LatexDocument"("materialId");

-- CreateIndex
CREATE INDEX "LatexDocument_ownerId_idx" ON "LatexDocument"("ownerId");

-- CreateIndex
CREATE INDEX "LatexTemplate_ownerId_idx" ON "LatexTemplate"("ownerId");

-- CreateIndex
CREATE INDEX "LatexElement_ownerId_idx" ON "LatexElement"("ownerId");

-- AddForeignKey
ALTER TABLE "LatexDocument" ADD CONSTRAINT "LatexDocument_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LatexDocument" ADD CONSTRAINT "LatexDocument_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LatexDocument" ADD CONSTRAINT "LatexDocument_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "LatexTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LatexTemplate" ADD CONSTRAINT "LatexTemplate_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LatexElement" ADD CONSTRAINT "LatexElement_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
