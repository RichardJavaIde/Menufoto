//prisma/seed.ts
import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

// SEED_RESET=1 borra categorías, platos y etiquetas y carga el menú de ejemplo desde cero
const RESET = process.env.SEED_RESET === "1";

type DishSeed = {
  name: string;
  description: string;
  price: number; // en pesos; se guarda en centavos
  tags?: string[];
  available?: boolean;
};
type CategorySeed = { name: string; description: string; dishes: DishSeed[] };

const TAGS = [
  { name: "Vegetariano", icon: "🌱" },
  { name: "Picante", icon: "🌶️" },
  { name: "Nuevo", icon: "✨" },
  { name: "Especialidad de la casa", icon: "⭐" },
  { name: "Sin gluten", icon: "🌾" },
  { name: "Para compartir", icon: "🤝" },
  { name: "Con alcohol", icon: "🍸" },
];

const CASA = "Especialidad de la casa";

const MENU: CategorySeed[] = [
  {
    name: "Entradas",
    description: "Para comenzar",
    dishes: [
      { name: "Tostones rellenos de camarones", description: "Plátano verde frito relleno de camarones al ajillo.", price: 380, tags: [CASA] },
      { name: "Yuquitas con salsa picante", description: "Croquetas de yuca crujientes con salsa de ají.", price: 220, tags: ["Vegetariano", "Picante"] },
      { name: "Quipes criollos", description: "Tres croquetas de trigo rellenas de carne sazonada, con limón.", price: 240 },
      { name: "Catibías de queso", description: "Empanadas de yuca fritas rellenas de queso derretido.", price: 230, tags: ["Vegetariano"] },
      { name: "Chicharrón de pollo", description: "Trozos de pollo marinados y fritos, con salsa mayoketchup.", price: 320, tags: ["Para compartir"] },
      { name: "Ceviche de pescado al coco", description: "Pescado fresco curado en limón con leche de coco, cilantro y ají dulce.", price: 420, tags: ["Sin gluten", "Nuevo"] },
      { name: "Ensalada de aguacate", description: "Aguacate, tomate, cebolla morada y vinagreta de limón.", price: 260, tags: ["Vegetariano", "Sin gluten"] },
      { name: "Bolitas de queso", description: "Queso frito en costra dorada, con mermelada de guayaba.", price: 260, tags: ["Vegetariano"] },
      { name: "Crema de auyama", description: "Crema suave de calabaza con un toque de jengibre y crotones.", price: 240, tags: ["Vegetariano"] },
      { name: "Pulpo a la parrilla", description: "Pulpo tierno con aceite de ajo, pimentón y papas rústicas.", price: 520, tags: ["Sin gluten", CASA] },
    ],
  },
  {
    name: "Platos fuertes",
    description: "Cocina criolla de la casa",
    dishes: [
      { name: "Sancocho de tres carnes", description: "Caldo tradicional con víveres, servido con arroz blanco y aguacate.", price: 480, tags: [CASA] },
      { name: "La bandera dominicana", description: "Arroz blanco, habichuelas rojas y carne guisada, con ensalada.", price: 400 },
      { name: "Pollo guisado criollo", description: "Muslos guisados lentamente, con arroz, habichuelas y ensalada.", price: 380 },
      { name: "Chivo guisado", description: "Chivo en salsa criolla con yuca hervida y arroz blanco.", price: 560, available: false },
      { name: "Pescado frito con tostones", description: "Pescado entero del día, ensalada fresca y tostones.", price: 680 },
      { name: "Churrasco a la parrilla", description: "Corte de 10 oz con yuca al mojo y ensalada verde.", price: 890, tags: ["Sin gluten"] },
      { name: "Mofongo relleno de camarones", description: "Plátano verde majado con ajo y chicharrón, relleno de camarones en salsa criolla.", price: 620, tags: [CASA] },
      { name: "Costillas BBQ", description: "Costillas de cerdo glaseadas en salsa BBQ casera, con papas fritas.", price: 750 },
      { name: "Filete de pescado al coco", description: "Filete en salsa cremosa de coco, con arroz blanco y ensalada.", price: 680, tags: ["Nuevo"] },
      { name: "Pasta cremosa de camarones", description: "Fettuccine en salsa de ajo y crema, con camarones salteados.", price: 640 },
      { name: "Lasaña de vegetales", description: "Capas de berenjena, calabacín, espinaca y queso gratinado.", price: 520, tags: ["Vegetariano"] },
      { name: "Parrillada para dos", description: "Pollo, res, cerdo y chorizo a la parrilla, con yuca, tostones y ensalada.", price: 1650, tags: ["Para compartir", CASA] },
    ],
  },
  {
    name: "Postres",
    description: "Un final dulce",
    dishes: [
      { name: "Flan de coco", description: "Flan cremoso de coco con caramelo.", price: 190, tags: [CASA] },
      { name: "Tres leches", description: "Bizcocho húmedo con crema batida y canela.", price: 220 },
      { name: "Majarete", description: "Postre cremoso de maíz con canela y vainilla.", price: 170 },
      { name: "Cheesecake de guayaba", description: "Base crujiente, queso crema y salsa de guayaba.", price: 240, tags: ["Nuevo"] },
      { name: "Helado artesanal", description: "Tres bolas a elegir: vainilla, coco o chocolate.", price: 200 },
      { name: "Brownie con helado", description: "Brownie tibio de chocolate con helado de vainilla.", price: 230 },
      { name: "Dulce de leche cortada", description: "Dulce tradicional de leche con canela y clavo.", price: 160 },
      { name: "Bizcocho dominicano", description: "Bizcocho esponjoso con relleno de piña y merengue.", price: 190 },
      { name: "Plátano maduro caramelizado", description: "Plátano maduro al horno con caramelo, canela y helado.", price: 210, tags: ["Vegetariano"] },
    ],
  },
  {
    name: "Bebidas",
    description: "Frescas, calientes y con copa",
    dishes: [
      { name: "Jugo de naranja", description: "Exprimido al momento.", price: 140 },
      { name: "Limonada", description: "Con hielo y hojas de menta.", price: 120 },
      { name: "Jugo de chinola", description: "Natural, con o sin azúcar.", price: 150 },
      { name: "Batida de mango", description: "Mango, leche y hielo licuados.", price: 170, tags: ["Nuevo"] },
      { name: "Morir soñando", description: "Jugo de naranja y leche batidos con hielo, un clásico dominicano.", price: 160, tags: [CASA] },
      { name: "Agua mineral", description: "Con o sin gas, 500 ml.", price: 90 },
      { name: "Refresco", description: "Pregunta por los sabores disponibles.", price: 90 },
      { name: "Café americano", description: "Café colado de origen dominicano.", price: 90 },
      { name: "Café con leche", description: "Café colado con leche caliente.", price: 110 },
      { name: "Té caliente", description: "Manzanilla, menta o jengibre.", price: 90 },
      { name: "Cerveza nacional", description: "Bien fría, botella de 12 oz.", price: 150, tags: ["Con alcohol"] },
      { name: "Cerveza importada", description: "Consulta las opciones del día.", price: 220, tags: ["Con alcohol"] },
      { name: "Copa de vino tinto", description: "Selección de la casa, copa de 5 oz.", price: 280, tags: ["Con alcohol"] },
      { name: "Mojito", description: "Ron, hierbabuena, limón y soda.", price: 330, tags: ["Con alcohol"] },
      { name: "Piña colada", description: "Ron, piña y crema de coco, servida bien fría.", price: 350, tags: ["Con alcohol", CASA] },
    ],
  },
];

// Datos de ejemplo del restaurante (se pueden cambiar en Configuración)
const RESTAURANT = {
  name: "Sazón Criolla",
  tagline: "Cocina dominicana hecha con cariño",
  description:
    "Un rincón de sabores dominicanos en el corazón de la ciudad. Cocinamos con recetas de casa e ingredientes frescos, para compartir en familia o con amigos.",
  address: "Av. Principal #100, Santo Domingo",
  phone: "809-555-0123",
  whatsapp: "809-555-0123",
  email: "hola@sazoncriolla.example",
  instagram: "@sazoncriolla",
  facebook: "sazoncriolla",
};

// 0 = domingo ... 6 = sábado
const HOURS = [
  { dayOfWeek: 0, opensAt: "11:00", closesAt: "21:00" },
  { dayOfWeek: 1, opensAt: "11:00", closesAt: "22:00" },
  { dayOfWeek: 2, opensAt: "11:00", closesAt: "22:00" },
  { dayOfWeek: 3, opensAt: "11:00", closesAt: "22:00" },
  { dayOfWeek: 4, opensAt: "11:00", closesAt: "22:00" },
  { dayOfWeek: 5, opensAt: "11:00", closesAt: "23:30" },
  { dayOfWeek: 6, opensAt: "11:00", closesAt: "23:30" },
];

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

  // Ajustes del restaurante (una sola fila). Con SEED_RESET se sobrescriben los textos,
  // pero nunca el logo, la portada ni la apariencia.
  await prisma.restaurantSettings.upsert({
    where: { id: 1 },
    update: RESET ? RESTAURANT : {},
    create: { id: 1, ...RESTAURANT },
  });

  // Horarios informativos
  if (RESET || (await prisma.openingHour.count()) === 0) {
    await prisma.openingHour.deleteMany();
    await prisma.openingHour.createMany({
      data: HOURS.map((h) => ({ ...h, closed: false })),
    });
  }

  // Menú de ejemplo (solo si la base está vacía, o si se pidió SEED_RESET=1)
  if (RESET || (await prisma.category.count()) === 0) {
    if (RESET) {
      await prisma.dish.deleteMany();
      await prisma.category.deleteMany();
      await prisma.tag.deleteMany();
    }

    const tagIds = new Map<string, string>();
    for (const [i, t] of TAGS.entries()) {
      const tag = await prisma.tag.create({ data: { name: t.name, icon: t.icon, sortOrder: i } });
      tagIds.set(t.name, tag.id);
    }
    const tagId = (name: string) => {
      const id = tagIds.get(name);
      if (!id) throw new Error(`Etiqueta desconocida en el seed: ${name}`);
      return id;
    };

    for (const [ci, cat] of MENU.entries()) {
      await prisma.category.create({
        data: {
          name: cat.name,
          description: cat.description,
          sortOrder: ci,
          dishes: {
            create: cat.dishes.map((d, di) => ({
              name: d.name,
              description: d.description,
              priceCents: d.price * 100,
              sortOrder: di,
              available: d.available ?? true,
              tags: { connect: (d.tags ?? []).map((n) => ({ id: tagId(n) })) },
            })),
          },
        },
      });
    }

    const total = MENU.reduce((n, c) => n + c.dishes.length, 0);
    console.log(`Menú de ejemplo cargado: ${MENU.length} categorías y ${total} platos.`);
  }

  console.log("Seed completado.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());