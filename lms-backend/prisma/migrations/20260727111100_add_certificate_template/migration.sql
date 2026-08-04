/*
  Warnings:

  - A unique constraint covering the columns `[certificateId]` on the table `Enrollment` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `Enrollment` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "public"."Certificate_studentId_courseId_key";

-- AlterTable
ALTER TABLE "public"."Certificate" ALTER COLUMN "issueDate" DROP DEFAULT,
ALTER COLUMN "status" SET DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "public"."Enrollment" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "public"."CertificateTemplate" (
    "id" SERIAL NOT NULL,
    "courseId" INTEGER NOT NULL,
    "header" TEXT NOT NULL DEFAULT 'Certificate of Completion',
    "footer" TEXT NOT NULL DEFAULT 'Issued by ZSmartClass',
    "textColor" TEXT NOT NULL DEFAULT '#1a1a2e',
    "backgroundColor" TEXT NOT NULL DEFAULT '#ffffff',
    "borderColor" TEXT NOT NULL DEFAULT '#667eea',
    "fontFamily" TEXT NOT NULL DEFAULT 'Helvetica',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CertificateTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CertificateTemplate_courseId_key" ON "public"."CertificateTemplate"("courseId");

-- CreateIndex
CREATE UNIQUE INDEX "Enrollment_certificateId_key" ON "public"."Enrollment"("certificateId");

-- AddForeignKey
ALTER TABLE "public"."Enrollment" ADD CONSTRAINT "Enrollment_certificateId_fkey" FOREIGN KEY ("certificateId") REFERENCES "public"."Certificate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CertificateTemplate" ADD CONSTRAINT "CertificateTemplate_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "public"."Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
