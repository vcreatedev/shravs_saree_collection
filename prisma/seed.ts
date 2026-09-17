import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const CLOUD = "https://res.cloudinary.com/cklit2yc/image/upload";

const categories = [
  {
    name: "Silk Sarees",
    slug: "silk-sarees",
    image: `${CLOUD}/shravs-saree-collections/silk-sarees/wine-chevron-silk-saree-2.jpg`,
  },
  {
    name: "Printed Sarees",
    slug: "printed-sarees",
    image: `${CLOUD}/shravs-saree-collections/printed-sarees/floral-print-georgette-saree-1.jpg`,
  },
  {
    name: "Anarkali & Gowns",
    slug: "anarkali-gowns",
    image: `${CLOUD}/shravs-saree-collections/anarkali-gowns/deep-violet-embroidered-anarkali-gown-2.jpg`,
  },
];

const products = [
  {
    name: "Purple Embroidered Anarkali Gown",
    category: "anarkali-gowns",
    price: 4500,
    compareAtPrice: 5500,
    description:
      "A rich magenta-purple anarkali gown with intricate gold-thread floral embroidery across the yoke and sleeves, paired with a matching embroidered dupatta. Perfect for festive occasions and celebrations.",
    images: [
      `${CLOUD}/shravs-saree-collections/anarkali-gowns/purple-embroidered-anarkali-gown-1.jpg`,
      `${CLOUD}/shravs-saree-collections/anarkali-gowns/purple-embroidered-anarkali-gown-2.jpg`,
      `${CLOUD}/shravs-saree-collections/anarkali-gowns/purple-embroidered-anarkali-gown-3.jpg`,
    ],
    stock: 5,
    featured: true,
    tags: "new,bestseller",
    colors: "Purple",
    sizes: "",
  },
  {
    name: "Deep Violet Embroidered Anarkali Gown",
    category: "anarkali-gowns",
    price: 4800,
    compareAtPrice: 5800,
    description:
      "An elegant deep violet anarkali gown featuring gold sequin and zari embroidery across the bodice, with a flowing georgette dupatta finished in the same intricate detailing.",
    images: [
      `${CLOUD}/shravs-saree-collections/anarkali-gowns/deep-violet-embroidered-anarkali-gown-1.jpg`,
      `${CLOUD}/shravs-saree-collections/anarkali-gowns/deep-violet-embroidered-anarkali-gown-2.jpg`,
      `${CLOUD}/shravs-saree-collections/anarkali-gowns/deep-violet-embroidered-anarkali-gown-3.jpg`,
      `${CLOUD}/shravs-saree-collections/anarkali-gowns/deep-violet-embroidered-anarkali-gown-4.jpg`,
    ],
    stock: 4,
    featured: true,
    tags: "new",
    colors: "Violet",
    sizes: "",
  },
  {
    name: "Floral Print Georgette Saree",
    category: "printed-sarees",
    price: 2200,
    compareAtPrice: 2800,
    description:
      "A lightweight georgette saree in a soft floral rose print, finished with a vivid red satin border. Comes with an unstitched matching blouse piece.",
    images: [
      `${CLOUD}/shravs-saree-collections/printed-sarees/floral-print-georgette-saree-1.jpg`,
      `${CLOUD}/shravs-saree-collections/printed-sarees/floral-print-georgette-saree-2.jpg`,
    ],
    stock: 6,
    featured: true,
    tags: "new,bestseller",
    colors: "Rose Print",
    sizes: "",
  },
  {
    name: "Maroon Silk Saree with Belt",
    category: "silk-sarees",
    price: 3200,
    compareAtPrice: 3900,
    description:
      "A classic maroon silk saree with a rich, fluid drape - a versatile piece for festive and formal occasions. Styled here with a statement belt; sold as saree only.",
    images: [
      `${CLOUD}/shravs-saree-collections/silk-sarees/maroon-silk-saree-with-belt-1.jpg`,
      `${CLOUD}/shravs-saree-collections/silk-sarees/maroon-silk-saree-with-belt-2.jpg`,
    ],
    stock: 5,
    featured: true,
    tags: "bestseller",
    colors: "Maroon",
    sizes: "",
  },
  {
    name: "Wine Chevron Silk Saree",
    category: "silk-sarees",
    price: 3600,
    compareAtPrice: 4200,
    description:
      "A wine-and-pink chevron zigzag silk saree with an ornate gold-detailed pallu and contrast border - a striking choice for weddings and celebrations.",
    images: [
      `${CLOUD}/shravs-saree-collections/silk-sarees/wine-chevron-silk-saree-1.jpg`,
      `${CLOUD}/shravs-saree-collections/silk-sarees/wine-chevron-silk-saree-2.jpg`,
    ],
    stock: 4,
    tags: "bestseller",
    colors: "Wine",
    sizes: "",
  },
];

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

async function main() {
  console.log("Clearing previous demo catalog and test orders...");
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.category.deleteMany({});

  console.log("Seeding categories...");
  const categoryMap = new Map<string, string>();
  for (const cat of categories) {
    const created = await prisma.category.create({ data: cat });
    categoryMap.set(cat.slug, created.id);
  }

  console.log("Seeding products...");
  for (const product of products) {
    const slug = slugify(product.name);
    await prisma.product.create({
      data: {
        name: product.name,
        slug,
        description: product.description,
        price: product.price,
        compareAtPrice: product.compareAtPrice ?? null,
        images: JSON.stringify(product.images),
        stock: product.stock,
        categoryId: categoryMap.get(product.category)!,
        featured: product.featured ?? false,
        tags: product.tags ?? "",
        colors: product.colors ?? "",
        sizes: product.sizes ?? "",
        rating: 4 + Math.random(),
        reviewCount: Math.floor(Math.random() * 60) + 5,
      },
    });
  }

  const adminEmail = (process.env.ADMIN_EMAIL || "admin@store.com").toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || "Admin@123";
  const passwordHash = await bcrypt.hash(adminPassword, 10);

  await prisma.admin.upsert({
    where: { email: adminEmail },
    update: { passwordHash },
    create: { email: adminEmail, passwordHash },
  });

  console.log(`Admin account ready: ${adminEmail} / ${adminPassword}`);
  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
