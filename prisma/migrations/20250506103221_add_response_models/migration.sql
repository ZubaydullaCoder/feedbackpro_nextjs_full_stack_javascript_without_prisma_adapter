-- CreateEnum
CREATE TYPE "ResponseType" AS ENUM ('QR', 'SMS');

-- CreateEnum
CREATE TYPE "ResponseStatus" AS ENUM ('PENDING', 'COMPLETED');

-- CreateTable
CREATE TABLE "ResponseEntity" (
    "id" TEXT NOT NULL,
    "type" "ResponseType" NOT NULL DEFAULT 'QR',
    "status" "ResponseStatus" NOT NULL DEFAULT 'PENDING',
    "surveyId" TEXT NOT NULL,
    "phoneNumber" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResponseEntity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Response" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "responseEntityId" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Response_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ResponseEntity" ADD CONSTRAINT "ResponseEntity_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "Survey"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Response" ADD CONSTRAINT "Response_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Response" ADD CONSTRAINT "Response_responseEntityId_fkey" FOREIGN KEY ("responseEntityId") REFERENCES "ResponseEntity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
