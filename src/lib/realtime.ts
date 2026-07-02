// Realtime event names and room helpers (shared server/client)

export const EVENTS = {
  ORDER_NEW: "order:new",
  ORDER_ACCEPTED: "order:accepted",
  ORDER_REJECTED: "order:rejected",
  ORDER_PREPARING: "order:preparing",
  ORDER_OUT_FOR_DELIVERY: "order:out_for_delivery",
  ORDER_DELIVERED: "order:delivered",
  ORDER_CANCELLED: "order:cancelled",
  INVENTORY_LOW_STOCK: "inventory:low_stock",
  INVENTORY_OUT_OF_STOCK: "inventory:out_of_stock",
  NOTIFICATION_NEW: "notification:new",
} as const;

export const rooms = {
  admin: "admin",
  store: (id: string) => `store:${id}`,
  customer: (id: string) => `customer:${id}`,
  order: (id: string) => `order:${id}`,
};

export type OrderEventPayload = {
  orderId: string;
  orderNumber: string;
  storeId: string;
  customerName?: string;
  total?: number;
  status?: string;
};
