-- CreateEnum
CREATE TYPE "TvGalleryMode" AS ENUM ('SINGLE', 'SPLIT', 'SEQUENCE');

-- AlterTable
ALTER TABLE "TvSlide" ADD COLUMN     "galleryMode" "TvGalleryMode" NOT NULL DEFAULT 'SEQUENCE';
