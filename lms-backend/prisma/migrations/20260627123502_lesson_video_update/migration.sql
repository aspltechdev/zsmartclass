/*
  Warnings:

  - Made the column `videoType` on table `Lesson` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "public"."Lesson" ALTER COLUMN "videoType" SET NOT NULL;
