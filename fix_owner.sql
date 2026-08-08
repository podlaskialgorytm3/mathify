ALTER TABLE "Material" ADD COLUMN "ownerId" TEXT;
UPDATE "Material" m SET "ownerId" = c."teacherId" FROM "Subchapter" s JOIN "Chapter" ch ON s."chapterId" = ch."id" JOIN "Course" c ON ch."courseId" = c."id" WHERE m."subchapterId" = s."id";
UPDATE "Material" SET "ownerId" = (SELECT id FROM "User" WHERE role = 'TEACHER' LIMIT 1) WHERE "ownerId" IS NULL;
ALTER TABLE "Material" ALTER COLUMN "ownerId" SET NOT NULL;
