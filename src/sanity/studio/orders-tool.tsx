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
          [o.orderNumber, o.customer?.name, o.customer?.email, o.customer?.phone, o.shipment?.awb, o.shippingAddress?.pincode]
            .filter(Boolean)
            .some((v) => String(v).toLowerCase().includes(q)))
    );
  }, [orders, filter, search]);

  const selected = orders?.find((o) => o.id === selectedId) ?? null;

  return (
    <Flex height="fill" style={{ minHeight: 0 }}>
      <Card borderRight style={{ width: 380, minWidth: 320, overflow: "auto" }}>
        <Stack padding={3} gap={3}>
          <Flex align="center" justify="space-between">
            <Heading size={1}>Orders</Heading>
            <Button icon={RefreshIcon} mode="bleed" title="Reload" onClick={load} />
          </Flex>
          <Flex gap={1} wrap="wrap">
            {FILTERS.map((f) => (
              <Button
                key={f.id}
                text={`${f.title}${orders ? ` (${orders.filter(f.match).length})` : ""}`}
                mode={filter === f.id ? "default" : "ghost"}
                tone={filter === f.id ? "primary" : "default"}
                fontSize={1}
                padding={2}
                onClick={() => setFilter(f.id)}
              />
            ))}
          </Flex>
          <TextInput
            icon={SearchIcon}
            placeholder="Order no., name, phone, email, AWB, pincode"
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
          />
        </Stack>
        {!orders ? (
          <Flex justify="center" padding={5}>
            <Spinner />
          </Flex>
        ) : visible.length === 0 ? (
          <Box padding={4}>
            <Text muted size={1}>
              No orders here.
            </Text>
          </Box>
        ) : (
          <Stack>
            {visible.map((o) => (
              <Card
                key={o._id}
                as="button"
                padding={3}
                borderTop
                tone={o.id === selectedId ? "primary" : "default"}
                onClick={() => setSelectedId(o.id)}
                style={{ textAlign: "left", cursor: "pointer" }}
              >
                <Stack gap={2}>
                  <Flex justify="space-between" align="center" gap={2}>
                    <Text weight="semibold" size={1}>
                      #{o.orderNumber}
                    </Text>
                    <Badge tone={TONE[o.status] ?? "default"} fontSize={0}>
                      {o.paymentStatus === "FAILED" ? "Payment failed" : STATUS_LABEL[o.status] ?? o.status}
                    </Badge>
                  </Flex>
                  <Flex justify="space-between" gap={2}>
                    <Text size={1} muted textOverflow="ellipsis">
                      {o.customer?.name} · {o.shippingAddress?.city}
                    </Text>
                    <Text size={1}>{formatINR(o.total)}</Text>
                  </Flex>
                  <Text size={0} muted>
                    {formatDate(o.createdAt)}
                    {o.shipment?.lastError ? " · ⚠ delivery needs attention" : ""}
                  </Text>
                </Stack>
              </Card>
            ))}
          </Stack>
        )}
      </Card>

      <Box flex={1} style={{ overflow: "auto" }}>
        {selected ? (
          <OrderDetail key={selected.id} order={selected} canAct={dataset === SITE_DATASET} onChanged={load} />
        ) : (
          <Flex align="center" justify="center" height="fill" padding={5}>
            <Text muted>Pick an order to see its details and delivery.</Text>
          </Flex>
        )}
      </Box>
    </Flex>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Stack gap={2}>
      <Label size={0} muted>
        {label}
      </Label>
      <Box>{children}</Box>
    </Stack>
  );
}

function OrderDetail({ order, canAct, onChanged }: { order: StudioOrder; canAct: boolean; onChanged: () => void }) {
  const client = useClient({ apiVersion: ORDERS_API_VERSION });
  const toast = useToast();
  const [busy, setBusy] = useState<string | null>(null);
  const [quote, setQuote] = useState<CourierQuote | null>(null);
  const [manual, setManual] = useState({ courierName: "", awb: "", trackingUrl: "" });
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
        <Flex gap={2} align="center">
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
            <Text size={1}>{order.customer?.name}</Text>
            <Text size={1}>
              <a href={`tel:${order.customer?.phone}`}>{order.customer?.phone}</a>
            </Text>
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
                      text="Book recommended courier"
                      tone="primary"
                      disabled={!canAct || !!busy}
                      loading={busy === "Booked"}
                      onClick={() => run("Booked", { action: "book" })}
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
                          disabled={!canAct || !!busy || !manual.courierName.trim() || !manual.awb.trim()}
                          loading={busy === "Marked shipped"}
                          onClick={() => run("Marked shipped", { action: "manual", ...manual })}
                        />
                      </Box>
                    </Stack>
                  </Card>
                </Stack>
              )}

              {(s?.history?.length ?? 0) > 0 && (
                <Stack gap={2}>
                  <Label size={0} muted>
                    Tracking history
                  </Label>
                  {[...(s!.history ?? [])].reverse().slice(0, 15).map((event) => (
                    <Text key={event._key} size={0}>
                      <strong>{event.activity || event.status}</strong>
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
    </Stack>
  );
}
