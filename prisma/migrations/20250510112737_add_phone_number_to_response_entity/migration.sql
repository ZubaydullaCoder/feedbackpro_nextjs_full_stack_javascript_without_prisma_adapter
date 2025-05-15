/*
  Warnings:

  - You are about to drop the column `answer` on the `Response` table. All the data in the column will be lost.
  - The `status` column on the `ResponseEntity` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `value` to the `Response` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `type` on the `ResponseEntity` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "Response" DROP COLUMN "answer",
ADD COLUMN     "value" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "ResponseEntity" ADD COLUMN     "phoneNumber" TEXT,
DROP COLUMN "type",
ADD COLUMN     "type" TEXT NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'PENDING';

-- DropEnum
DROP TYPE "ResponseStatus";

-- DropEnum
DROP TYPE "ResponseType";
