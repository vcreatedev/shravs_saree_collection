"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useClient, useDataset } from "sanity";
import {
  Badge,
  Box,
  Button,
  Card,
  Flex,
  Grid,
  Heading,
  Label,
  Select,
  Spinner,
  Stack,
  Text,
  TextInput,
} from "@sanity/ui";
import { useToast } from "@sanity/ui/toast";
import { DownloadIcon } from "@sanity/icons/Download";
import { LaunchIcon } from "@sanity/icons/Launch";
import { RefreshIcon } from "@sanity/icons/Refresh";
import { SearchIcon } from "@sanity/icons/Search";
import { STATUS_LABEL } from "@/lib/order-status";
import type { OrderStatus } from "@/types";
import type { CourierQuote } from "@/lib/shiprocket";
import {
  deliveryRequest,
  formatDate,
  formatINR,
  ORDER_PROJECTION,
  ORDERS_API_VERSION,
  SITE_DATASET,
  type StudioOrder,
} from "./order-api";

/* Orders: every order the site has saved, with the delivery actions for
   each - comparing courier partners, booking, pickup, labels, tracking. */

const FILTERS: { id: string; title: string; match: (o: StudioOrder) => boolean }[] = [
  { id: "to-ship", title: "To ship", match: (o) => o.paymentStatus === "PAID" && o.status === "CONFIRMED" },
  {
    id: "in-transit",
    title: "In transit",
    match: (o) => ["READY_TO_SHIP", "SHIPPED", "OUT_FOR_DELIVERY"].includes(o.status),
  },
  { id: "delivered", title: "Delivered", match: (o) => o.status === "DELIVERED" },
  { id: "paid", title: "All paid", match: (o) => o.paymentStatus === "PAID" || o.paymentStatus === "REFUNDED" },
  { id: "unpaid", title: "Unpaid", match: (o) => o.paymentStatus === "PENDING" || o.paymentStatus === "FAILED" },
];

const TONE: Partial<Record<OrderStatus, "primary" | "positive" | "caution" | "critical" | "default">> = {
  PENDING: "default",
  CONFIRMED: "caution",
  READY_TO_SHIP: "primary",
  SHIPPED: "primary",
  OUT_FOR_DELIVERY: "primary",
  DELIVERED: "positive",
  CANCELLED: "critical",
  RETURNED: "critical",
};

interface ShiprocketCourier {
  id: number;
  name: string;
  rate: number;
  etd: string;
  estimatedDays: string;
  rating: number;
}

const PRESET_COURIERS = [
  "Delhivery",
  "Blue Dart",
  "DTDC",
  "India Post (Speed Post)",
  "The Professional Couriers",
  "Shadowfax",
  "Trackon",
  "Local Atelier Pickup",
  "Other / Custom",
];

export function OrdersTool() {
  const client = useClient({ apiVersion: ORDERS_API_VERSION });
  const dataset = useDataset();
  const [orders, setOrders] = useState<StudioOrder[] | null>(null);
  const [filter, setFilter] = useState("to-ship");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const load = useCallback(() => {
    client
      .fetch<StudioOrder[]>(`*[_type == "order" && _id in path("orders.*")] | order(createdAt desc) [0...500] ${ORDER_PROJECTION}`)
      .then(setOrders);
  }, [client]);

  // Fresh whenever an order is saved or changed - a new payment, a tracking
  // update - with a short pause so a burst of changes reloads once. The
  // first load runs straight away (a zero delay keeps it out of the effect
  // body itself).
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined = setTimeout(load, 0);
    const subscription = client
      .listen(`*[_type == "order" && _id in path("orders.*")]`, {}, { visibility: "query" })
      .subscribe(() => {
        clearTimeout(timer);
        timer = setTimeout(load, 800);
      });
    return () => {
      clearTimeout(timer);
      subscription.unsubscribe();
    };
  }, [client, load]);

  const visible = useMemo(() => {
    if (!orders) return [];
    const match = FILTERS.find((f) => f.id === filter)?.match ?? (() => true);
    const q = search.trim().toLowerCase();
    return orders.filter(
      (o) =>
        match(o) &&
        (!q ||
          o.orderNumber.toLowerCase().includes(q) ||
          (o.customer?.name ?? "").toLowerCase().includes(q) ||
          (o.customer?.phone ?? "").includes(q) ||
          (o.customer?.email ?? "").toLowerCase().includes(q) ||
          (o.shipment?.awb ?? "").toLowerCase().includes(q) ||
          (o.payment?.razorpayPaymentId ?? "").toLowerCase().includes(q))
    );
  }, [orders, filter, search]);

  const selected = useMemo(() => orders?.find((o) => o.id === selectedId) ?? visible[0] ?? null, [orders, selectedId, visible]);

  // Delivery actions talk to this site's backend, which runs in the dataset
  // in NEXT_PUBLIC_SANITY_DATASET - if the editor switched this Studio to
  // another dataset (e.g. Test while the site runs Live), delivery actions
  // would act on the wrong orders, so disable them.
  const canAct = dataset === SITE_DATASET;

  return (
    <Card height="fill" overflow="auto">
      <Grid gridTemplateColumns={[1, 1, 2]} height="fill" style={{ minHeight: "100vh" }}>
        {/* Left: filters, search, orders list */}
        <Card borderRight style={{ display: "flex", flexDirection: "column" }}>
          <Box padding={3} style={{ borderBottom: "1px solid var(--card-border-color)" }}><Stack gap={3}>
            <Flex gap={1} wrap="wrap">
              {FILTERS.map((f) => {
                const count = orders?.filter(f.match).length;
                return (
                  <Button
                    key={f.id}
                    text={count !== undefined ? `${f.title} (${count})` : f.title}
                    mode={filter === f.id ? "default" : "bleed"}
                    tone={filter === f.id ? "primary" : "default"}
                    onClick={() => setFilter(f.id)}
                    fontSize={1}
                    padding={2}
                  />
                );
              })}
            </Flex>
            <TextInput
              icon={SearchIcon}
              placeholder="Search by order #, phone, AWB…"
              value={search}
              onChange={(e) => setSearch(e.currentTarget.value)}
              fontSize={1}
            />
          </Stack></Box>

          <Box flex={1} overflow="auto">
            {orders === null ? (
              <Flex justify="center" padding={5}>
                <Spinner muted />
              </Flex>
            ) : visible.length === 0 ? (
              <Box padding={4}>
                <Text size={1} muted align="center">
                  {search ? "No orders match this search." : "No orders in this view."}
                </Text>
              </Box>
            ) : (
              <Stack as="ul" style={{ listStyle: "none", margin: 0, padding: 0 }}>
                {visible.map((order) => {
                  const on = order.id === selected?.id;
                  return (
                    <Card
                      as="li"
                      key={order.id}
                      padding={3}
                      borderBottom
                      tone={on ? "primary" : "default"}
                      onClick={() => setSelectedId(order.id)}
                      style={{ cursor: "pointer" }}
                    >
                      <Stack gap={2}>
                        <Flex justify="space-between" align="center">
                          <Text size={1} weight="semibold">
                            #{order.orderNumber}
                          </Text>
                          <Badge tone={TONE[order.status] ?? "default"} fontSize={0}>
                            {STATUS_LABEL[order.status] ?? order.status}
                          </Badge>
                        </Flex>
                        <Flex justify="space-between" align="center">
                          <Text size={1}>{order.customer?.name || "Guest"}</Text>
                          <Text size={1} weight="semibold">
                            {formatINR(order.total)}
                          </Text>
                        </Flex>
                        <Flex justify="space-between" align="center">
                          <Text size={0} muted>
                            {order.items?.length ?? 0} drape{(order.items?.length ?? 0) === 1 ? "" : "s"} ·{" "}
                            {formatDate(order.createdAt)}
                          </Text>
                          {order.shipment?.awb && (
                            <Text size={0} muted>
                              AWB {order.shipment.awb}
                            </Text>
                          )}
                        </Flex>
                      </Stack>
                    </Card>
                  );
                })}
              </Stack>
            )}
          </Box>
        </Card>

        {/* Right: order details and delivery actions */}
        <Box overflow="auto">
          {selected ? (
            <OrderDetail order={selected} canAct={canAct} onChanged={load} />
          ) : (
            <Flex justify="center" align="center" height="fill" padding={5}>
              <Text size={1} muted>
                Select an order to view its drapes, invoice and courier tracking.
              </Text>
            </Flex>
          )}
        </Box>
      </Grid>
    </Card>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Stack gap={2}>
      <Label size={0} muted style={{ textTransform: "uppercase", letterSpacing: "0.08em" }}>
        {label}
      </Label>
      {children}
    </Stack>
  );
}

function OrderDetail({ order, canAct, onChanged }: { order: StudioOrder; canAct: boolean; onChanged: () => void }) {
  const client = useClient({ apiVersion: ORDERS_API_VERSION });
  const toast = useToast();
  const [busy, setBusy] = useState<string | null>(null);
  const [quote, setQuote] = useState<CourierQuote | null>(null);
  const [manual, setManual] = useState({ courierName: "", awb: "", trackingUrl: "" });
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const s = order.shipment;
  const paid = order.paymentStatus === "PAID";

  async function run(label: string, body?: Record<string, unknown>) {
    setBusy(label);
    try {
      const result = await deliveryRequest<{ url?: string; quote?: CourierQuote; configured?: boolean }>(client, order.id, body);
      if (!body) {
        if (result.configured === false) {
          toast.push({ status: "warning", title: "Shiprocket isn't set up yet", description: "Add the SHIPROCKET_* settings to the site." });
        }
        setQuote(result.quote ?? null);
      }
      if (result.url) window.open(result.url, "_blank", "noopener");
      if (body) toast.push({ status: "success", title: `${label}: done` });
      onChanged();
    } catch (error) {
      toast.push({ status: "error", title: label, description: error instanceof Error ? error.message : String(error) });
    } finally {
      setBusy(null);
    }
  }

  async function handleApproveManual(carrier: string, trackingNumber: string, estimatedDelivery: string) {
    setBusy("Approving");
    try {
      await run("Approve with " + carrier, {
        action: "manual",
        courierName: carrier,
        awb: trackingNumber,
        trackingUrl: "",
        estimatedDelivery,
        status: "READY_TO_SHIP",
      });
      setApproveModalOpen(false);
    } finally {
      setBusy(null);
    }
  }

  async function handleApproveShiprocket(courierId?: number) {
    setBusy("Booking courier");
    try {
      const res = await fetch("/api/orders/ship", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id, courierId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Shiprocket booking failed");
      toast.push({ status: "success", title: "Shipment booked with Shiprocket" });
      setApproveModalOpen(false);
      onChanged();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      toast.push({ status: "error", title: "Shipment booking failed", description: message });
    } finally {
      setBusy(null);
    }
  }

  async function handleReject() {
    const reason = window.prompt("Reason for cancellation (will be included in customer apology email):", "Out of stock");
    if (reason === null) return;
    setBusy("Rejecting");
    try {
      const res = await fetch("/api/orders/reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to reject order");
      toast.push({ status: "success", title: "Order rejected and apology email dispatched" });
      onChanged();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      toast.push({ status: "error", title: "Rejection failed", description: message });
    } finally {
      setBusy(null);
    }
  }

  return (
    <Stack padding={4} gap={5} style={{ maxWidth: 860 }}>
      <Flex justify="space-between" align="flex-start" gap={3} wrap="wrap">
        <Stack gap={2}>
          <Heading size={2}>#{order.orderNumber}</Heading>
          <Text size={1} muted>
            Placed {formatDate(order.createdAt)} · {formatINR(order.total)} ·{" "}
            {order.paymentStatus === "PAID" ? `Paid by ${order.payment?.method || "Razorpay"}` : order.paymentStatus}
          </Text>
        </Stack>
        <Flex gap={2} align="center" wrap="wrap">
          {order.status === "CONFIRMED" && (
            <Button
              text="✓ Approve Order"
              tone="positive"
              fontSize={1}
              onClick={() => setApproveModalOpen(true)}
              disabled={!canAct || busy !== null}
            />
          )}
          {["CONFIRMED", "READY_TO_SHIP"].includes(order.status) && (
            <Button
              text="Reject Order"
              tone="critical"
              mode="ghost"
              fontSize={1}
              onClick={handleReject}
              disabled={!canAct || busy !== null}
            />
          )}
          <Text size={1} muted>
            Status
          </Text>
          <Select
            value={order.status}
            disabled={!canAct || !paid || busy !== null}
            onChange={(e) => run("Status changed", { action: "status", status: e.currentTarget.value })}
            fontSize={1}
          >
            {Object.entries(STATUS_LABEL)
              .filter(([value]) => value !== "PENDING")
              .map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
          </Select>
          <Button
            as="a"
            href={`/orders/${order.id}`}
            target="_blank"
            rel="noopener noreferrer"
            icon={LaunchIcon}
            mode="ghost"
            title="Customer's order page"
            fontSize={1}
          />
          {paid && (
            <Button as="a" href={`/api/orders/${order.id}/invoice`} icon={DownloadIcon} mode="ghost" title="Invoice" fontSize={1} />
          )}
        </Flex>
      </Flex>

      {!canAct && (
        <Card padding={3} radius={2} tone="caution">
          <Text size={1}>
            This workspace&apos;s orders come from a different dataset than this site uses, so its delivery actions are off here.
          </Text>
        </Card>
      )}

      <Grid gridTemplateColumns={[1, 1, 2]} gap={4}>
        <Field label="Customer">
          <Stack gap={2}>
            <Text size={1} weight="semibold">{order.customer?.name}</Text>
            <Flex gap={2} align="center">
              <Text size={1}>
                <a href={`tel:${order.customer?.phone}`}>{order.customer?.phone}</a>
              </Text>
              {order.customer?.phone && (
                <Button
                  as="a"
                  href={`https://wa.me/${order.customer.phone.replace(/\D/g, "")}?text=${encodeURIComponent(
                    `Namaste ${order.customer.name || ""}, regarding your Shravs Saree Collection order #${order.orderNumber}:`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  text="WhatsApp"
                  mode="bleed"
                  tone="positive"
                  fontSize={0}
                  padding={1}
                />
              )}
            </Flex>
            <Text size={1}>
              <a href={`mailto:${order.customer?.email}`}>{order.customer?.email}</a>
            </Text>
          </Stack>
        </Field>
        <Field label="Ship to">
          <Stack gap={2}>
            <Text size={1}>{order.shippingAddress?.address}</Text>
            <Text size={1}>
              {order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.pincode}
            </Text>
          </Stack>
        </Field>
      </Grid>

      <Field label="Items">
        <Card border radius={2}>
          <Stack>
            {order.items?.map((item) => (
              <Flex key={item._key} padding={3} gap={3} align="center" style={{ borderBottom: "1px solid var(--card-border-color)" }}>
                {item.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={`${item.image}?w=96&h=120&fit=crop&auto=format`} alt="" width={48} height={60} style={{ borderRadius: 4, objectFit: "cover" }} />
                )}
                <Stack flex={1} gap={2}>
                  <Text size={1} weight="semibold">
                    {item.name}
                  </Text>
                  <Text size={0} muted>
                    {[item.code, item.color, item.size && `Size ${item.size}`].filter(Boolean).join(" · ")}
                  </Text>
                </Stack>
                <Text size={1}>×{item.quantity}</Text>
                <Text size={1}>{formatINR(item.price * item.quantity)}</Text>
              </Flex>
            ))}
            <Flex padding={3} justify="flex-end" gap={4}>
              <Text size={1} muted>
                Shipping {order.shipping ? formatINR(order.shipping) : "free"}
              </Text>
              <Text size={1} weight="semibold">
                Total {formatINR(order.total)}
              </Text>
            </Flex>
          </Stack>
        </Card>
      </Field>

      {paid && (
        <Field label="Delivery">
          <Card border radius={2} padding={4}>
            <Stack gap={4}>
              {s?.lastError && (
                <Card padding={3} radius={2} tone="critical">
                  <Text size={1}>{s.lastError}</Text>
                </Card>
              )}

              {s?.awb ? (
                <Stack gap={3}>
                  <Text size={1}>
                    <strong>{s.courierName || "Courier"}</strong> · AWB {s.awb}
                    {s.provider === "manual" ? " (sent outside Shiprocket)" : ""}
                  </Text>
                  <Text size={1} muted>
                    {[s.status && `Courier status: ${s.status}`, s.etd && `Expected: ${s.etd}`, s.pickupScheduledFor && `Pickup: ${s.pickupScheduledFor}`]
                      .filter(Boolean)
                      .join(" · ")}
                  </Text>
                  <Flex gap={2} wrap="wrap">
                    {s.provider !== "manual" && (
                      <>
                        {!s.pickupScheduledFor && (
                          <Button text="Request pickup" tone="primary" disabled={!canAct || !!busy} loading={busy === "Pickup"} onClick={() => run("Pickup", { action: "pickup" })} />
                        )}
                        <Button text="Shipping label" icon={DownloadIcon} mode="ghost" disabled={!canAct || !!busy} loading={busy === "Label"} onClick={() => run("Label", { action: "label" })} />
                        <Button text="Manifest" icon={DownloadIcon} mode="ghost" disabled={!canAct || !!busy} loading={busy === "Manifest"} onClick={() => run("Manifest", { action: "manifest" })} />
                        <Button text="Refresh tracking" icon={RefreshIcon} mode="ghost" disabled={!canAct || !!busy} loading={busy === "Tracking"} onClick={() => run("Tracking", { action: "track" })} />
                        {order.status === "READY_TO_SHIP" && (
                          <Button
                            text="Cancel shipment"
                            tone="critical"
                            mode="ghost"
                            disabled={!canAct || !!busy}
                            loading={busy === "Cancel shipment"}
                            onClick={() => window.confirm("Cancel this shipment in Shiprocket? You can book it again afterwards.") && run("Cancel shipment", { action: "cancel" })}
                          />
                        )}
                      </>
                    )}
                    {s.trackingUrl && <Button as="a" href={s.trackingUrl} target="_blank" rel="noopener noreferrer" text="Courier tracking" icon={LaunchIcon} mode="bleed" />}
                  </Flex>
                </Stack>
              ) : (
                <Stack gap={3}>
                  <Flex gap={2} wrap="wrap">
                    <Button text="Compare couriers" mode="ghost" disabled={!canAct || !!busy} loading={busy === "Couriers"} onClick={() => run("Couriers")} />
                    <Button
                      text="⚡ Approve & Book Courier"
                      tone="positive"
                      disabled={!canAct || !!busy}
                      onClick={() => setApproveModalOpen(true)}
                    />
                  </Flex>
                  {quote && (
                    quote.options.length === 0 ? (
                      <Text size={1} muted>
                        No courier partner delivers to {order.shippingAddress?.pincode}.
                      </Text>
                    ) : (
                      <Card border radius={2}>
                        {quote.options.map((option) => (
                          <Flex key={option.id} padding={3} gap={3} align="center" style={{ borderBottom: "1px solid var(--card-border-color)" }}>
                            <Stack flex={1} gap={2}>
                              <Text size={1} weight="semibold">
                                {option.name} {option.id === quote.recommendedId && <Badge tone="positive" fontSize={0}>Recommended</Badge>}
                              </Text>
                              <Text size={0} muted>
                                {[option.days && `${option.days} days`, option.etd && `by ${option.etd}`, option.rating && `rated ${option.rating}`]
                                  .filter(Boolean)
                                  .join(" · ")}
                              </Text>
                            </Stack>
                            <Text size={1}>{formatINR(option.rate)}</Text>
                            <Button
                              text="Book"
                              fontSize={1}
                              disabled={!canAct || !!busy}
                              loading={busy === `Booked ${option.name}`}
                              onClick={() => run(`Booked ${option.name}`, { action: "book", courierId: option.id })}
                            />
                          </Flex>
                        ))}
                      </Card>
                    )
                  )}

                  <Card padding={3} radius={2} tone="transparent" border>
                    <Stack gap={3}>
                      <Text size={1} weight="semibold">
                        Sent another way? (India Post, a local courier)
                      </Text>
                      <Grid gridTemplateColumns={[1, 3]} gap={2}>
                        <TextInput placeholder="Courier" value={manual.courierName} onChange={(e) => setManual({ ...manual, courierName: e.currentTarget.value })} />
                        <TextInput placeholder="Tracking number" value={manual.awb} onChange={(e) => setManual({ ...manual, awb: e.currentTarget.value })} />
                        <TextInput placeholder="Tracking link (optional)" value={manual.trackingUrl} onChange={(e) => setManual({ ...manual, trackingUrl: e.currentTarget.value })} />
                      </Grid>
                      <Box>
                        <Button
                          text="Mark shipped and email the customer"
                          mode="ghost"
                          disabled={!canAct || !manual.courierName.trim() || !manual.awb.trim() || !!busy}
                          loading={busy === "Marked shipped"}
                          onClick={() =>
                            run("Marked shipped", {
                              action: "manual",
                              courierName: manual.courierName.trim(),
                              awb: manual.awb.trim(),
                              trackingUrl: manual.trackingUrl.trim(),
                            })
                          }
                        />
                      </Box>
                    </Stack>
                  </Card>
                </Stack>
              )}

              {s?.history && s.history.length > 0 && (
                <Stack gap={2} style={{ borderTop: "1px solid var(--card-border-color)", paddingTop: 12 }}>
                  <Label size={0} muted>
                    TRACKING HISTORY
                  </Label>
                  {s.history.map((event) => (
                    <Text key={event._key} size={0} muted>
                      <strong>{event.status || event.activity}</strong>
                      {event.location ? ` · ${event.location}` : ""} · {event.date}
                    </Text>
                  ))}
                </Stack>
              )}
            </Stack>
          </Card>
        </Field>
      )}

      <Field label="Emails sent">
        <Text size={1} muted>
          {Object.entries(order.emails ?? {})
            .map(([kind, at]) => `${kind} (${formatDate(at as string)})`)
            .join(" · ") || "None yet"}
        </Text>
      </Field>

      {approveModalOpen && (
        <ApproveModal
          order={order}
          saving={busy !== null}
          onClose={() => setApproveModalOpen(false)}
          onApproveManual={handleApproveManual}
          onApproveShiprocket={handleApproveShiprocket}
        />
      )}
    </Stack>
  );
}

function ApproveModal({
  order,
  saving,
  onClose,
  onApproveManual,
  onApproveShiprocket,
}: {
  order: StudioOrder;
  saving: boolean;
  onClose: () => void;
  onApproveManual: (carrier: string, trackingNumber: string, estimatedDelivery: string) => Promise<void>;
  onApproveShiprocket: (courierId?: number) => Promise<void>;
}) {
  const [mode, setMode] = useState<"manual" | "shiprocket">("manual");
  const [selectedCourier, setSelectedCourier] = useState("Delhivery");
  const [customCourier, setCustomCourier] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [estimatedDelivery, setEstimatedDelivery] = useState("3 to 5 Business Days");

  const [loadingCouriers, setLoadingCouriers] = useState(false);
  const [shiprocketConfigured, setShiprocketConfigured] = useState<boolean | null>(null);
  const [shiprocketCouriers, setShiprocketCouriers] = useState<ShiprocketCourier[]>([]);
  const [shiprocketError, setShiprocketError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const fetchRates = async () => {
      const pincode = order.shippingAddress?.pincode;
      if (!pincode) return;
      setLoadingCouriers(true);
      try {
        const res = await fetch(
          `/api/orders/couriers?pincode=${encodeURIComponent(pincode)}&pieces=${order.items?.length || 1}`
        );
        const data = await res.json();
        if (active) {
          setShiprocketConfigured(Boolean(data.configured));
          if (data.configured && Array.isArray(data.couriers)) {
            setShiprocketCouriers(data.couriers);
          }
          if (data.error) {
            setShiprocketError(data.error);
          }
        }
      } catch {
        if (active) setShiprocketConfigured(false);
      } finally {
        if (active) setLoadingCouriers(false);
      }
    };
    fetchRates();
    return () => {
      active = false;
    };
  }, [order]);

  const activeCarrier = selectedCourier === "Other / Custom" ? customCourier : selectedCourier;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(2, 43, 30, 0.65)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: "16px",
        boxSizing: "border-box",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !saving) onClose();
      }}
    >
      <div
        style={{
          background: "#FFFFFF",
          borderRadius: 12,
          border: "1px solid rgba(201, 154, 59, 0.3)",
          maxWidth: 580,
          width: "100%",
          maxHeight: "92vh",
          overflowY: "auto",
          boxShadow: "0 24px 48px rgba(0,0,0,0.22)",
          padding: "28px 24px",
          boxSizing: "border-box",
          position: "relative",
        }}
      >
        <button
          type="button"
          onClick={onClose}
          disabled={saving}
          style={{
            position: "absolute",
            top: 20,
            right: 20,
            background: "none",
            border: "none",
            fontSize: 20,
            color: "rgba(26,46,38,0.5)",
            cursor: saving ? "default" : "pointer",
            padding: 4,
          }}
        >
          ✕
        </button>

        <p
          style={{
            margin: "0 0 4px",
            fontSize: 10.5,
            fontWeight: 700,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "#c99a3b",
          }}
        >
          Atelier Dispatch
        </p>
        <h2 style={{ margin: "0 0 16px", fontSize: 22, fontWeight: 700, color: "#64132f" }}>
          Approve Order &amp; Select Delivery
        </h2>

        <div
          style={{
            background: "#FDF7EF",
            border: "1px solid rgba(201, 154, 59, 0.3)",
            borderRadius: 8,
            padding: "12px 14px",
            marginBottom: 20,
            fontSize: 12.5,
            lineHeight: 1.55,
            color: "#1f110a",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, flexWrap: "wrap" }}>
            <strong>Order #{order.orderNumber}</strong>
            <span style={{ color: "#15803d", fontWeight: 700 }}>{formatINR(order.total)}</span>
          </div>
          <p style={{ margin: 0 }}>
            Customer: <strong>{order.customer?.name || "Guest"}</strong>
            {order.customer?.phone ? ` · ${order.customer.phone}` : ""}
          </p>
          <p style={{ margin: "2px 0 0", color: "rgba(26,46,38,0.75)" }}>
            Destination: {[order.shippingAddress?.address, order.shippingAddress?.city, order.shippingAddress?.pincode].filter(Boolean).join(", ")}
          </p>
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          <button
            type="button"
            onClick={() => setMode("manual")}
            style={{
              flex: 1,
              padding: "10px 12px",
              borderRadius: 6,
              border: `1px solid ${mode === "manual" ? "#64132f" : "#e8dfd5"}`,
              background: mode === "manual" ? "#64132f" : "#FAFBF9",
              color: mode === "manual" ? "#fff8ec" : "#1f110a",
              fontWeight: 600,
              fontSize: 12.5,
              cursor: "pointer",
            }}
          >
            📦 Standard Courier Partner
          </button>
          <button
            type="button"
            onClick={() => setMode("shiprocket")}
            style={{
              flex: 1,
              padding: "10px 12px",
              borderRadius: 6,
              border: `1px solid ${mode === "shiprocket" ? "#64132f" : "#e8dfd5"}`,
              background: mode === "shiprocket" ? "#64132f" : "#FAFBF9",
              color: mode === "shiprocket" ? "#fff8ec" : "#1f110a",
              fontWeight: 600,
              fontSize: 12.5,
              cursor: "pointer",
            }}
          >
            ⚡ Shiprocket Auto-Dispatch
          </button>
        </div>

        {mode === "manual" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={{ display: "block", margin: "0 0 6px", fontSize: 10.5, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "#c99a3b" }}>
                Select Courier Partner
              </label>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
                {PRESET_COURIERS.map((c) => {
                  const active = selectedCourier === c;
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setSelectedCourier(c)}
                      style={{
                        padding: "6px 12px",
                        borderRadius: 100,
                        border: `1px solid ${active ? "#64132f" : "#e8dfd5"}`,
                        background: active ? "#64132f" : "#FFFFFF",
                        color: active ? "#fff8ec" : "rgba(26,46,38,0.8)",
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      {c}
                    </button>
                  );
                })}
              </div>

              {selectedCourier === "Other / Custom" && (
                <input
                  type="text"
                  placeholder="Enter custom courier name (e.g. Blazeflash, Porter, Speed Post)"
                  value={customCourier}
                  onChange={(e) => setCustomCourier(e.target.value)}
                  style={{ width: "100%", padding: "10px 12px", border: "1px solid #e8dfd5", borderRadius: 6, fontSize: 13, boxSizing: "border-box" }}
                  autoFocus
                />
              )}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={{ display: "block", margin: "0 0 6px", fontSize: 10.5, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "#c99a3b" }}>
                  Tracking No. (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 123456789"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  style={{ width: "100%", padding: "10px 12px", border: "1px solid #e8dfd5", borderRadius: 6, fontSize: 13, boxSizing: "border-box" }}
                />
                <span style={{ fontSize: 11, color: "rgba(26,46,38,0.5)", marginTop: 4, display: "block" }}>
                  Can also be added later once parcel is packed.
                </span>
              </div>
              <div>
                <label style={{ display: "block", margin: "0 0 6px", fontSize: 10.5, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "#c99a3b" }}>
                  Estimated Delivery
                </label>
                <input
                  type="text"
                  value={estimatedDelivery}
                  onChange={(e) => setEstimatedDelivery(e.target.value)}
                  style={{ width: "100%", padding: "10px 12px", border: "1px solid #e8dfd5", borderRadius: 6, fontSize: 13, boxSizing: "border-box" }}
                />
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
              <button
                type="button"
                disabled={saving || !activeCarrier.trim()}
                onClick={() => onApproveManual(activeCarrier, trackingNumber, estimatedDelivery)}
                style={{
                  flex: 1,
                  padding: "12px 18px",
                  background: "#64132f",
                  color: "#fff8ec",
                  border: "none",
                  borderRadius: 6,
                  fontSize: 13,
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  cursor: saving ? "default" : "pointer",
                  opacity: saving || !activeCarrier.trim() ? 0.6 : 1,
                }}
              >
                {saving ? "Approving…" : `✓ Approve Order with ${activeCarrier || "Courier"}`}
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={onClose}
                style={{
                  padding: "12px 18px",
                  background: "transparent",
                  color: "rgba(26,46,38,0.65)",
                  border: "1px solid #e8dfd5",
                  borderRadius: 6,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {loadingCouriers && (
              <p style={{ fontSize: 13.5, color: "rgba(26,46,38,0.7)", textAlign: "center", padding: "24px 0" }}>
                Checking available couriers &amp; live rates for pincode {order.shippingAddress?.pincode}…
              </p>
            )}

            {!loadingCouriers && shiprocketConfigured === false && (
              <div
                style={{
                  background: "#FFF9EE",
                  border: "1px solid rgba(201, 154, 59, 0.4)",
                  borderRadius: 8,
                  padding: "16px",
                  fontSize: 13,
                  lineHeight: 1.6,
                  color: "#1f110a",
                }}
              >
                <p style={{ margin: "0 0 6px", fontWeight: 700, color: "#c99a3b" }}>
                  Shiprocket API is not configured yet
                </p>
                <p style={{ margin: "0 0 12px", color: "rgba(26,46,38,0.75)" }}>
                  Add <code>SHIPROCKET_EMAIL</code> and <code>SHIPROCKET_PASSWORD</code> to your environment settings to automatically fetch live courier rates, book pickups, and print labels with 1 click.
                </p>
                <button
                  type="button"
                  onClick={() => setMode("manual")}
                  style={{
                    padding: "8px 14px",
                    background: "#64132f",
                    color: "#fff8ec",
                    border: "none",
                    borderRadius: 4,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Use Standard Courier Partner Instead
                </button>
              </div>
            )}

            {!loadingCouriers && shiprocketConfigured && (
              <div>
                {shiprocketCouriers.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 280, overflowY: "auto", marginBottom: 12 }}>
                    {shiprocketCouriers.map((c) => (
                      <div
                        key={c.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "12px 14px",
                          border: "1px solid #e8dfd5",
                          borderRadius: 8,
                          background: "#FFFFFF",
                          gap: 12,
                        }}
                      >
                        <div>
                          <p style={{ margin: "0 0 3px", fontSize: 13.5, fontWeight: 700, color: "#64132f" }}>
                            {c.name}
                          </p>
                          <p style={{ margin: 0, fontSize: 12, color: "rgba(26,46,38,0.6)" }}>
                            {c.estimatedDays ? `Est. ${c.estimatedDays} days` : ""}
                            {c.etd ? ` (${c.etd})` : ""}
                            {c.rating ? ` · ★ ${c.rating}` : ""}
                          </p>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <span style={{ fontSize: 14, fontWeight: 700, color: "#1f110a" }}>
                            {formatINR(c.rate)}
                          </span>
                          <button
                            type="button"
                            disabled={saving}
                            onClick={() => onApproveShiprocket(c.id)}
                            style={{
                              padding: "8px 14px",
                              background: "#15803d",
                              color: "#fff8ec",
                              border: "none",
                              borderRadius: 4,
                              fontSize: 12,
                              fontWeight: 700,
                              cursor: saving ? "default" : "pointer",
                            }}
                          >
                            {saving ? "Booking…" : "Book"}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: 13, color: "rgba(26,46,38,0.7)", margin: "0 0 12px" }}>
                    {shiprocketError || `No serviceable couriers found for pincode ${order.shippingAddress?.pincode}.`}
                  </p>
                )}

                <button
                  type="button"
                  disabled={saving}
                  onClick={() => onApproveShiprocket()}
                  style={{
                    width: "100%",
                    padding: "12px 18px",
                    background: "#FFFFFF",
                    color: "#64132f",
                    border: "1px solid #64132f",
                    borderRadius: 6,
                    fontSize: 12.5,
                    fontWeight: 700,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    cursor: saving ? "default" : "pointer",
                    marginBottom: 10,
                  }}
                >
                  ⚡ Auto-Assign with Shiprocket Priority
                </button>
              </div>
            )}

            <button
              type="button"
              disabled={saving}
              onClick={onClose}
              style={{
                width: "100%",
                padding: "10px 14px",
                background: "transparent",
                color: "rgba(26,46,38,0.65)",
                border: "1px solid #e8dfd5",
                borderRadius: 6,
                fontSize: 12.5,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
