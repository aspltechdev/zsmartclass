/*
  Warnings:

  - You are about to drop the column `issuedAt` on the `Certificate` table. All the data in the column will be lost.
  - You are about to drop the column `qrCode` on the `Certificate` table. All the data in the column will be lost.
  - Added the required column `courseTitle` to the `Certificate` table without a default value. This is not possible if the table is not empty.
  - Added the required column `instructorName` to the `Certificate` table without a default value. This is not possible if the table is not empty.
  - Added the required column `studentName` to the `Certificate` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Certificate` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Certificate" DROP COLUMN "issuedAt",
DROP COLUMN "qrCode",
ADD COLUMN     "courseTitle" TEXT NOT NULL,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "instructorName" TEXT NOT NULL,
ADD COLUMN     "issueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "qrCodeUrl" TEXT,
ADD COLUMN     "revokeReason" TEXT,
ADD COLUMN     "revokedAt" TIMESTAMP(3),
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "studentName" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "public"."Enrollment" ADD COLUMN     "certificateId" INTEGER,
ADD COLUMN     "certificateNo" TEXT;
