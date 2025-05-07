/*
  Warnings:

  - The values [RATING] on the enum `QuestionType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `required` on the `Question` table. All the data in the column will be lost.
  - The `status` column on the `ResponseEntity` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `title` on the `Survey` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `Response` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `type` on the `ResponseEntity` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `name` to the `Survey` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "SurveyStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

-- AlterEnum
BEGIN;
CREATE TYPE "QuestionType_new" AS ENUM ('TEXT', 'RATING_SCALE_5', 'YES_NO');
ALTER TABLE "Question" ALTER COLUMN "type" TYPE "QuestionType_new" USING ("type"::text::"QuestionType_new");
ALTER TYPE "QuestionType" RENAME TO "QuestionType_old";
ALTER TYPE "QuestionType_new" RENAME TO "QuestionType";
DROP TYPE "QuestionType_old";
COMMIT;

-- AlterTable
ALTER TABLE "Business" ALTER COLUMN "name" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Question" DROP COLUMN "required",
ADD COLUMN     "isRequired" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "Response" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "ResponseEntity" DROP COLUMN "type",
ADD COLUMN     "type" TEXT NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "Survey" DROP COLUMN "title",
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "status" "SurveyStatus" NOT NULL DEFAULT 'ACTIVE';

-- DropEnum
DROP TYPE "ResponseStatus";

-- DropEnum
DROP TYPE "ResponseType";

-- CreateIndex
CREATE INDEX "Question_surveyId_idx" ON "Question"("surveyId");

-- CreateIndex
CREATE INDEX "Response_questionId_idx" ON "Response"("questionId");

-- CreateIndex
CREATE INDEX "Response_responseEntityId_idx" ON "Response"("responseEntityId");

-- CreateIndex
CREATE INDEX "ResponseEntity_surveyId_idx" ON "ResponseEntity"("surveyId");

-- CreateIndex
CREATE INDEX "Survey_businessId_idx" ON "Survey"("businessId");
