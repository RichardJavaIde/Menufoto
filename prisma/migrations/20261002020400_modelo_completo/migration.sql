-- CreateTable
CREATE TABLE "Image" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fileKey" TEXT NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "cropX" REAL NOT NULL DEFAULT 0,
    "cropY" REAL NOT NULL DEFAULT 0,
    "cropWidth" REAL NOT NULL DEFAULT 100,
    "cropHeight" REAL NOT NULL DEFAULT 100,
    "focalX" REAL NOT NULL DEFAULT 50,
    "focalY" REAL NOT NULL DEFAULT 50,
    "fit" TEXT NOT NULL DEFAULT 'COVER',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Dish" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "priceCents" INTEGER NOT NULL,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "available" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "categoryId" TEXT NOT NULL,
    "imageId" TEXT,
    CONSTRAINT "Dish_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Dish_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "Image" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "icon" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "OpeningHour" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dayOfWeek" INTEGER NOT NULL,
    "opensAt" TEXT,
    "closesAt" TEXT,
    "closed" BOOLEAN NOT NULL DEFAULT false
);

-- CreateTable
CREATE TABLE "RestaurantSettings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "name" TEXT NOT NULL DEFAULT 'Mi Restaurante',
    "tagline" TEXT,
    "description" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "whatsapp" TEXT,
    "email" TEXT,
    "instagram" TEXT,
    "facebook" TEXT,
    "website" TEXT,
    "currencyCode" TEXT NOT NULL DEFAULT 'DOP',
    "currencySymbol" TEXT NOT NULL DEFAULT 'RD$',
    "logoId" TEXT,
    "coverId" TEXT,
    "themeId" TEXT NOT NULL DEFAULT 'elegante',
    "colorPrimary" TEXT,
    "colorAccent" TEXT,
    "colorBackground" TEXT,
    "colorText" TEXT,
    "fontHeading" TEXT,
    "fontBody" TEXT,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RestaurantSettings_logoId_fkey" FOREIGN KEY ("logoId") REFERENCES "Image" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "RestaurantSettings_coverId_fkey" FOREIGN KEY ("coverId") REFERENCES "Image" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_DishToTag" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_DishToTag_A_fkey" FOREIGN KEY ("A") REFERENCES "Dish" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_DishToTag_B_fkey" FOREIGN KEY ("B") REFERENCES "Tag" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Image_fileKey_key" ON "Image"("fileKey");

-- CreateIndex
CREATE INDEX "Category_sortOrder_idx" ON "Category"("sortOrder");

-- CreateIndex
CREATE INDEX "Dish_categoryId_sortOrder_idx" ON "Dish"("categoryId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_name_key" ON "Tag"("name");

-- CreateIndex
CREATE INDEX "OpeningHour_dayOfWeek_idx" ON "OpeningHour"("dayOfWeek");

-- CreateIndex
CREATE UNIQUE INDEX "_DishToTag_AB_unique" ON "_DishToTag"("A", "B");

-- CreateIndex
CREATE INDEX "_DishToTag_B_index" ON "_DishToTag"("B");
