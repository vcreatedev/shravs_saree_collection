import type { Order, OrderItem, Product, Category } from "@prisma/client";

export type ProductWithCategory = Product & { category: Category };

export type SizeStock = Record<string, number>;

export type ColorVariant = { color: string; images: string[]; price: number | null };

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

export type ProductFilters = {
  q?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: "newest" | "price-asc" | "price-desc" | "rating";
  tag?: string;
  color?: string;
  size?: string;
};
