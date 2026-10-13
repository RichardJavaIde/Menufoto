-- CreateEnum
CREATE TYPE "TvSlideType" AS ENUM ('OFFERS', 'POPULAR', 'CATEGORY', 'GALLERY');

-- CreateEnum
CREATE TYPE "TvEffect" AS ENUM ('FADE', 'SLIDE', 'ZOOM', 'KENBURNS');

-- AlterTable
ALTER TABLE "Dish" ADD COLUMN     "offerEnd" TIMESTAMP(3),
ADD COLUMN     "offerPriceCents" INTEGER,
ADD COLUMN     "offerStart" TIMESTAMP(3),
ADD COLUMN     "popular" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "RestaurantSettings" ADD COLUMN     "timezone" TEXT NOT NULL DEFAULT 'America/Santo_Domingo';

-- CreateTable
CREATE TABLE "TvScreen" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "lastSeenAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TvScreen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TvSlide" (
    "id" TEXT NOT NULL,
    "screenId" TEXT NOT NULL,
    "type" "TvSlideType" NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "seconds" INTEGER NOT NULL DEFAULT 10,
    "effect" "TvEffect" NOT NULL DEFAULT 'FADE',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "days" INTEGER,
    "startMinute" INTEGER,
    "endMinute" INTEGER,
    "categoryId" TEXT,
    "title" TEXT,
    "text" TEXT,

    CONSTRAINT "TvSlide_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TvSlideImage" (
    "id" TEXT NOT NULL,
    "slideId" TEXT NOT NULL,
    "imageId" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "TvSlideImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TvScreen_token_key" ON "TvScreen"("token");

-- CreateIndex
CREATE INDEX "TvSlide_screenId_position_idx" ON "TvSlide"("screenId", "position");

-- CreateIndex
CREATE INDEX "TvSlideImage_slideId_position_idx" ON "TvSlideImage"("slideId", "position");

-- AddForeignKey
ALTER TABLE "TvSlide" ADD CONSTRAINT "TvSlide_screenId_fkey" FOREIGN KEY ("screenId") REFERENCES "TvScreen"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TvSlide" ADD CONSTRAINT "TvSlide_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TvSlideImage" ADD CONSTRAINT "TvSlideImage_slideId_fkey" FOREIGN KEY ("slideId") REFERENCES "TvSlide"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TvSlideImage" ADD CONSTRAINT "TvSlideImage_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "Image"("id") ON DELETE CASCADE ON UPDATE CASCADE;
