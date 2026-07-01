-- CreateTable
CREATE TABLE "public"."Certificate" (
    "id" SERIAL NOT NULL,
    "certificateNo" TEXT NOT NULL,
    "studentId" INTEGER NOT NULL,
    "courseId" INTEGER NOT NULL,
    "pdfUrl" TEXT,
    "qrCode" TEXT,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Certificate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Certificate_certificateNo_key" ON "public"."Certificate"("certificateNo");

-- CreateIndex
CREATE UNIQUE INDEX "Certificate_studentId_courseId_key" ON "public"."Certificate"("studentId", "courseId");

-- AddForeignKey
ALTER TABLE "public"."Certificate" ADD CONSTRAINT "Certificate_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Certificate" ADD CONSTRAINT "Certificate_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "public"."Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
