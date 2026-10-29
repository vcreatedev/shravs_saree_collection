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

export type Category = {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  description?: string;
  productCount?: number;
};

export type HeroSlide = {
  id: string;
  title: string;
  subtitle?: string;
  image: string;
  link?: string;
  badge?: string;
};

export type ProductVariant = {
  key: string;
  name: string;
  image: string;
  inStock: boolean;
};

export type ProductSize = {
  key: string;
  size: string;
  stock: number;
};

/** A product as the storefront uses it, read from Sanity (lib/catalog.ts). */
export type Product = {
  id: string;
  slug: string;
  name: string;
  code: string;
  productCode?: string;
  description: string;
  price: number;
  compareAtPrice: number | null;
  /** Photo URLs, main photo first. */
  images: string[];
  hoverImage: string | null;
  color: string | null;
  optionName: string;
  variants: ProductVariant[];
  sizes: ProductSize[];
  /** Pieces that can be bought now: 0 when sold out. */
  stock: number;
  inStock?: boolean;
  featured?: boolean;
  rating: number;
  reviewCount: number;
  isNew: boolean;
  isBestSeller: boolean;
  isFeatured: boolean;
  details: { label: string; value: string }[];
  metaTitle: string | null;
  metaDescription: string | null;
  category: Category;
  createdAt: string;
  fabric?: string;
  craft?: string;
  blousePiece?: string;
  length?: string;
  washCare?: string;
  occasion?: string;
  weightKg?: number;
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
  sort?: ProductSort;
  tag?: string;
};

/* ── Orders: private Sanity documents, id "orders.<id>" ── */

export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "READY_TO_SHIP"
  | "SHIPPED"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED"
  | "RETURNED";

export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED";

export type OrderLine = {
  _key: string;
  productId: string;
  slug: string;
  code: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
  color?: string;
  size?: string;
  weightKg: number;
};

export type ShipmentEvent = {
  _key: string;
  date: string;
  status: string;
  activity: string;
  location: string;
};

export type Shipment = {
  /** "manual": sent outside Shiprocket (e.g. India Post), its details typed in. */
  provider: "shiprocket" | "manual";
  state?: string;
  srOrderId?: string;
  shipmentId?: string;
  awb?: string;
  courierId?: number;
  courierName?: string;
  labelUrl?: string;
  manifestUrl?: string;
  pickupScheduledFor?: string;
  trackingUrl?: string;
  etd?: string;
  /** The courier's own wording for where the parcel is, e.g. "IN TRANSIT". */
  status?: string;
  courierStatus?: string;
  courierUpdatedAt?: string;
  history?: ShipmentEvent[];
  lastError?: string;
  error?: string;
  updatedAt?: string;
};

export type Order = {
  _id: string;
  /** The private part of the order's address: /orders/<id>. */
  id: string;
  orderNumber: string;
  status: OrderStatus;
  statusText?: string;
  paymentStatus: PaymentStatus;
  customer: { name: string; email: string; phone: string; phoneDigits: string };
  shippingAddress: { address: string; city: string; state: string; pincode: string };
  items: OrderLine[];
  subtotal: number;
  shipping: number;
  total: number;
  amount?: number;
  payment: {
    provider: "razorpay";
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
    method?: string;
    paidAt?: string;
  };
  shipment?: Shipment;
  carrier?: string;
  trackingNumber?: string;
  estimatedDelivery?: string;
  cancelReason?: string;
  cancelEmail?: string;
  cancelEmailNote?: string;
  cancelEmailId?: string;
  /** When each email went out, so none is ever sent twice. */
  emails?: Partial<Record<"confirmation" | "storeAlert" | "cancellation" | "shipped" | "outForDelivery" | "delivered", string>>;
  stockDeducted?: boolean;
  createdAt: string;
  updatedAt: string;
};
