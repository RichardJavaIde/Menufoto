//prisma/seed.ts
import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!email || !password) {
    throw new Error("Faltan SEED_ADMIN_EMAIL y SEED_ADMIN_PASSWORD en .env");
  }

  // Primer administrador
  await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      name: "Administrador",
      email,
      passwordHash: await hash(password, 12),
      role: "ADMIN",
    },
  });
  // Usuario de prueba con rol USER (se elimina luego desde la pantalla de Usuarios)
  const userEmail = process.env.SEED_USER_EMAIL;
  const userPassword = process.env.SEED_USER_PASSWORD;
  if (userEmail && userPassword) {
    await prisma.user.upsert({
      where: { email: userEmail },
      update: {},
      create: {
        name: "Usuario de prueba",
        email: userEmail,
        passwordHash: await hash(userPassword, 12),
        role: "USER",
      },
    });
  }

  // Ajustes del restaurante (una sola fila)
  await prisma.restaurantSettings.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      name: "Mi Restaurante",
      tagline: "Sabores que se disfrutan",
    },
  });

  // Horarios informativos
  if ((await prisma.openingHour.count()) === 0) {
    await prisma.openingHour.createMany({
      data: Array.from({ length: 7 }, (_, dayOfWeek) => ({
        dayOfWeek,
        opensAt: "11:00",
        closesAt: "22:00",
        closed: false,
      })),
    });
  }

  // Datos de ejemplo (solo si la base está vacía)
  if ((await prisma.category.count()) === 0) {
    const vegetariano = await prisma.tag.create({ data: { name: "Vegetariano", icon: "🌱", sortOrder: 0 } });
    const picante = await prisma.tag.create({ data: { name: "Picante", icon: "🌶️", sortOrder: 1 } });
    const nuevo = await prisma.tag.create({ data: { name: "Nuevo", icon: "✨", sortOrder: 2 } });
    const casa = await prisma.tag.create({ data: { name: "Especialidad de la casa", icon: "⭐", sortOrder: 3 } });

    await prisma.category.create({
      data: {
        name: "Entradas",
        description: "Para comenzar",
        sortOrder: 0,
        dishes: {
          create: [
            {
              name: "Tostones rellenos",
              description: "Plátano verde frito relleno de camarones al ajillo.",
              priceCents: 35000,
              sortOrder: 0,
              tags: { connect: [{ id: casa.id }] },
            },
            {
              name: "Yuquitas con salsa picante",
              description: "Croquetas de yuca crujientes con salsa de ají.",
              priceCents: 22000,
              sortOrder: 1,
              tags: { connect: [{ id: vegetariano.id }, { id: picante.id }] },
            },
          ],
        },
      },
    });

    await prisma.category.create({
      data: {
        name: "Platos fuertes",
        description: "Cocina criolla de la casa",
        sortOrder: 1,
        dishes: {
          create: [
            {
              name: "Sancocho de tres carnes",
              description: "Caldo tradicional con víveres, servido con arroz blanco y aguacate.",
              priceCents: 45000,
              sortOrder: 0,
              tags: { connect: [{ id: casa.id }] },
            },
            {
              name: "Pescado frito con tostones",
              description: "Pescado entero del día, ensalada fresca y tostones.",
              priceCents: 68000,
              sortOrder: 1,
            },
            {
              name: "Pollo guisado",
              description: "Muslos guisados lentamente con arroz, habichuelas y ensalada.",
              priceCents: 38000,
              sortOrder: 2,
              available: false,
            },
          ],
        },
      },
    });

    await prisma.category.create({
      data: {
        name: "Postres",
        sortOrder: 2,
        dishes: {
          create: [
            {
              name: "Tres leches",
              description: "Bizcocho húmedo con crema batida y canela.",
              priceCents: 21000,
              sortOrder: 0,
              tags: { connect: [{ id: nuevo.id }] },
            },
          ],
        },
      },
    });

    await prisma.category.create({
      data: {
        name: "Bebidas",
        sortOrder: 3,
        dishes: {
          create: [
            {
              name: "Jugo de chinola",
              description: "Natural, con o sin azúcar.",
              priceCents: 15000,
              sortOrder: 0,
              tags: { connect: [{ id: vegetariano.id }] },
            },
          ],
        },
      },
    });
  }

  console.log("Seed completado.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());