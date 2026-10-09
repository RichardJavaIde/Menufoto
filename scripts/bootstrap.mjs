//srcipts/bootstrap.mjs
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;

  if ((await prisma.user.count()) === 0) {
    if (!email || !password || password.length < 10) {
      throw new Error("Define BOOTSTRAP_ADMIN_EMAIL y BOOTSTRAP_ADMIN_PASSWORD (mínimo 10 caracteres)");
    }
    await prisma.user.create({
      data: {
        name: "Administrador",
        email,
        passwordHash: await bcrypt.hash(password, 12),
        role: "ADMIN",
      },
    });
    console.log("Administrador creado:", email);
  }

  await prisma.restaurantSettings.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, name: process.env.BOOTSTRAP_RESTAURANT_NAME || "Mi restaurante" },
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());