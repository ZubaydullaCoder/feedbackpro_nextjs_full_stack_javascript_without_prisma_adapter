/*
  Warnings:

  - You are about to drop the column `value` on the `Response` table. All the data in the column will be lost.
  - You are about to drop the column `phoneNumber` on the `ResponseEntity` table. All the data in the column will be lost.
  - The `status` column on the `ResponseEntity` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `answer` to the `Response` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `type` on the `ResponseEntity` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "ResponseType" AS ENUM ('QR', 'SMS');

-- CreateEnum
CREATE TYPE "ResponseStatus" AS ENUM ('PENDING', 'COMPLETED');

-- AlterTable
ALTER TABLE "Response" DROP COLUMN "value",
ADD COLUMN     "answer" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "ResponseEntity" DROP COLUMN "phoneNumber",
ADD COLUMN     "submittedAt" TIMESTAMP(3),
DROP COLUMN "type",
ADD COLUMN     "type" "ResponseType" NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "ResponseStatus" NOT NULL DEFAULT 'PENDING';
