import type { Order, OrderItem, Product, Category } from "@prisma/client";

export type ProductWithCategory = Product & { category: Category };

export type SizeStock = Record<string, number>;

export type ColorVariant = {
  color: string;
  images: string[];
  name: string | null;
  description: string | null;
  price: number | null;
  compareAtPrice: number | null;
  sizes: string | null;
  sizeStock: Record<string, number> | null;
  tags: string | null;
  rating: number | null;
};

export type OrderWithItems = Order & { items: OrderItem[] };

export type CartLine = {
  productId: string;
  name: string;
  slug: string;
  image: string;
  price: number;
  quantity: number;
  color?: string;
  size?: string;
  stock: number;
};

export type CheckoutAddress = {
  customerName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
};

export type ProductSort = "featured" | "price-asc" | "price-desc" | "newest" | "name-asc" | "name-desc" | "rating";

export type ProductFilters = {
  q?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: ProductSort;
  tag?: string;
  color?: string;
  size?: string;
};
