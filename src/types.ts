/**
 * Apex Store Intelligence Pipeline Types
 */

export enum EventType {
  ENTRY = "ENTRY",
  EXIT = "EXIT",
  ZONE_ENTER = "ZONE_ENTER",
  ZONE_EXIT = "ZONE_EXIT",
  ZONE_DWELL = "ZONE_DWELL",
  BILLING_QUEUE_JOIN = "BILLING_QUEUE_JOIN",
  BILLING_QUEUE_ABANDON = "BILLING_QUEUE_ABANDON",
  REENTRY = "REENTRY",
}

export interface EventMetadata {
  queue_depth?: number | null;
  sku_zone?: string | null;
  session_seq?: number;
  customer_name?: string;
  total_amount?: number;
  order_id?: string;
  customer_number?: string;
}

export interface StoreEvent {
  event_id: string; // uuid-v4
  store_id: string;
  camera_id: string;
  visitor_id: string; // Re-ID token
  event_type: EventType;
  timestamp: string; // ISO-8601 UTC
  zone_id: string | null; // Null for ENTRY/EXIT
  dwell_ms: number; // 0 for instantaneous events
  is_staff: boolean;
  confidence: number;
  metadata: EventMetadata;
}

export interface POSTransaction {
  order_id: string;
  coupon_code?: string;
  offer_name?: string;
  invoice_number?: string;
  order_date: string; // DD-MM-YYYY
  order_time: string; // HH:MM:ss
  store_id: string;
  store_name: string;
  city: string;
  customer_name: string;
  customer_number: string;
  product_name: string;
  brand_name: string;
  qty: number;
  total_amount: number;
  timestamp: string; // Composed ISO string
}

export interface ZoneMetrics {
  zone_id: string;
  visit_frequency: number;
  avg_dwell_sec: number;
  normalised_score: number;
}

export interface StoreMetrics {
  today_unique_visitors: number;
  today_total_visitors?: number;
  today_guests?: number;
  today_repeat_customers?: number;
  conversion_rate: number;
  avg_dwell_per_zone: { [zone: string]: number };
  queue_depth: number;
  abandonment_rate: number;
  total_transactions: number;
  total_sales_inr: number;
}

export interface FunnelStage {
  stage: "Entry" | "Zone Visit" | "Billing Queue" | "Purchase";
  count: number;
  dropoff_pct: number;
}

export interface FunnelResponse {
  store_id: string;
  stages: FunnelStage[];
}

export interface HeatmapResponse {
  store_id: string;
  zones: ZoneMetrics[];
  data_confidence_flag: boolean;
}

export interface StoreAnomaly {
  id: string;
  type: "BILLING_QUEUE_SPIKE" | "CONVERSION_DROP" | "DEAD_ZONE" | "STALE_FEED";
  severity: "INFO" | "WARN" | "CRITICAL";
  timestamp: string;
  description: string;
  suggested_action: string;
}

export interface StoreLayout {
  store_id: string;
  store_name: string;
  city: string;
  zones: {
    zone_id: string;
    zone_name: string;
    sku_zone: string;
    camera_coverage: string[];
    bounds: { x: number; y: number; w: number; h: number };
  }[];
  open_hours: {
    open: string; // HH:MM
    close: string; // HH:MM
  };
}
