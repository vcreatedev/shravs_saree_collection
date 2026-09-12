import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const categories = [
  {
    name: "Apparel",
    slug: "apparel",
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80",
  },
  {
    name: "Home",
    slug: "home",
    image: "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=800&q=80",
  },
  {
    name: "Accessories",
    slug: "accessories",
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80",
  },
  {
    name: "Footwear",
    slug: "footwear",
    image: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&q=80",
  },
];

const products = [
  {
    name: "Wool Overshirt",
    category: "apparel",
    price: 4200,
    compareAtPrice: 5200,
    description:
      "A heavyweight wool-blend overshirt with a relaxed cut, built for cool evenings and long weekends.",
    images: [
      "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=1000&q=80",
      "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=1000&q=80",
    ],
    stock: 18,
    featured: true,
    tags: "new,bestseller",
    colors: "Charcoal,Sand",
    sizes: "S,M,L,XL",
  },
  {
    name: "Organic Cotton Tee",
    category: "apparel",
    price: 1200,
    description: "Garment-dyed, heavyweight cotton tee with a boxy fit and reinforced collar.",
    images: [
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=1000&q=80",
      "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=1000&q=80",
    ],
    stock: 40,
    featured: true,
    tags: "new",
    colors: "Ink,Bone,Clay",
    sizes: "XS,S,M,L,XL",
  },
  {
    name: "Wide-Leg Trousers",
    category: "apparel",
    price: 3100,
    description: "Fluid drape trousers cut from Japanese twill, tailored for movement.",
    images: ["https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=1000&q=80"],
    stock: 22,
    tags: "bestseller",
    colors: "Olive,Black",
    sizes: "28,30,32,34,36",
  },
  {
    name: "Linen Shirt",
    category: "apparel",
    price: 2600,
    compareAtPrice: 3200,
    description: "Breathable European linen shirt with mother-of-pearl buttons.",
    images: ["https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=1000&q=80"],
    stock: 0,
    tags: "",
    colors: "White,Sky",
    sizes: "S,M,L",
  },
  {
    name: "Ceramic Pour-Over Set",
    category: "home",
    price: 2800,
    description: "Hand-thrown ceramic dripper and carafe set, finished in a matte reactive glaze.",
    images: [
      "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1000&q=80",
      "https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=1000&q=80",
    ],
    stock: 14,
    featured: true,
    tags: "new,bestseller",
    colors: "Oatmeal,Slate",
    sizes: "",
  },
  {
    name: "Linen Throw Blanket",
    category: "home",
    price: 3400,
    description: "Stonewashed linen throw, woven in small batches for a soft, lived-in hand.",
    images: ["https://images.unsplash.com/photo-1580301762395-83aae2974f43?w=1000&q=80"],
    stock: 26,
    tags: "",
    colors: "Rust,Fog",
    sizes: "",
  },
  {
    name: "Oak Cutting Board",
    category: "home",
    price: 1900,
    description: "Solid white oak board with a routed hand-grip, finished in food-safe oil.",
    images: ["https://images.unsplash.com/photo-1585909695284-32d2985ac9c0?w=1000&q=80"],
    stock: 32,
    tags: "bestseller",
    colors: "",
    sizes: "",
  },
  {
    name: "Scented Soy Candle",
    category: "home",
    price: 950,
    description: "Hand-poured soy candle in cedar and amber, 60-hour burn time.",
    images: ["https://images.unsplash.com/photo-1602874801007-bd458bb1b8f6?w=1000&q=80"],
    stock: 60,
    featured: true,
    tags: "new",
    colors: "",
    sizes: "",
  },
  {
    name: "Leather Weekender Bag",
    category: "accessories",
    price: 8900,
    compareAtPrice: 10500,
    description: "Full-grain leather weekender with brass hardware, ages beautifully over time.",
    images: [
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=1000&q=80",
      "https://images.unsplash.com/photo-1547949003-9792a18a2645?w=1000&q=80",
    ],
    stock: 9,
    featured: true,
    tags: "bestseller",
    colors: "Cognac,Black",
    sizes: "",
  },
  {
    name: "Minimalist Card Wallet",
    category: "accessories",
    price: 1400,
    description: "Slim vegetable-tanned leather wallet with a single pull-tab.",
    images: ["https://images.unsplash.com/photo-1627123424574-724758594e93?w=1000&q=80"],
    stock: 45,
    tags: "new",
    colors: "Tan,Black",
    sizes: "",
  },
  {
    name: "Wool Beanie",
    category: "accessories",
    price: 890,
    description: "Merino wool beanie, ribbed knit, one size fits most.",
    images: ["https://images.unsplash.com/photo-1576871337622-98d48d1cf531?w=1000&q=80"],
    stock: 50,
    tags: "",
    colors: "Charcoal,Rust,Cream",
    sizes: "",
  },
  {
    name: "Titanium Watch",
    category: "accessories",
    price: 12500,
    description: "Brushed titanium case with a sapphire crystal and Italian leather strap.",
    images: ["https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=1000&q=80"],
    stock: 6,
    featured: true,
    tags: "bestseller",
    colors: "",
    sizes: "",
  },
  {
    name: "Suede Chelsea Boots",
    category: "footwear",
    price: 6200,
    description: "Water-resistant suede Chelsea boots on a Goodyear-welted sole.",
    images: [
      "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=1000&q=80",
      "https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=1000&q=80",
    ],
    stock: 16,
    featured: true,
    tags: "new,bestseller",
    colors: "Taupe,Black",
    sizes: "7,8,9,10,11",
  },
  {
    name: "Canvas Low-Tops",
    category: "footwear",
    price: 2400,
    description: "Washed canvas low-tops with a cushioned cork footbed.",
    images: ["https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=1000&q=80"],
    stock: 28,
    tags: "",
    colors: "White,Sand",
    sizes: "6,7,8,9,10,11",
  },
  {
    name: "Wool Trail Sneakers",
    category: "footwear",
    price: 5400,
    compareAtPrice: 6400,
    description: "Merino wool upper sneakers designed for all-day comfort and breathability.",
    images: ["https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=1000&q=80"],
    stock: 20,
    tags: "bestseller",
    colors: "Grey,Navy",
    sizes: "7,8,9,10,11,12",
  },
  {
    name: "Leather Sandals",
    category: "footwear",
    price: 1800,
    description: "Hand-stitched leather sandals with a contoured, break-in-free sole.",
    images: ["https://images.unsplash.com/photo-1603487742131-4160ec999306?w=1000&q=80"],
    stock: 0,
    tags: "",
    colors: "Tan",
    sizes: "6,7,8,9,10",
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
  console.log("Seeding categories...");
  const categoryMap = new Map<string, string>();
  for (const cat of categories) {
    const created = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, image: cat.image },
      create: cat,
    });
    categoryMap.set(cat.slug, created.id);
  }

  console.log("Seeding products...");
  for (const product of products) {
    const slug = slugify(product.name);
    await prisma.product.upsert({
      where: { slug },
      update: {},
      create: {
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
        reviewCount: Math.floor(Math.random() * 120) + 5,
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
