import { StoreLayout } from "../types";

export const STORE_LAYOUT_BLR: StoreLayout = {
  store_id: "STORE_BLR_002",
  store_name: "Brigade, Bangalore",
  city: "Bangalore",
  zones: [
    {
      zone_id: "SKINCARE",
      zone_name: "Skincare Sanctuary",
      sku_zone: "Face Wash, Toner, Sunscreen & Sheet Masks",
      camera_coverage: ["CAM_MAIN_01", "CAM_PROMO_01"],
      bounds: { x: 50, y: 150, w: 220, h: 180 }
    },
    {
      zone_id: "MAKEUP",
      zone_name: "Cosmetic & Glamour Lounge",
      sku_zone: "Lipsticks, Kajal, Eyeliner, Compact & Blush",
      camera_coverage: ["CAM_MAIN_01", "CAM_PROMO_01"],
      bounds: { x: 300, y: 100, w: 280, h: 220 }
    },
    {
      zone_id: "HAIRCARE",
      zone_name: "Haircare & Wellness Hub",
      sku_zone: "Hair growth serums, Shampoos & Organic Oils",
      camera_coverage: ["CAM_MAIN_01"],
      bounds: { x: 600, y: 120, w: 180, h: 160 }
    },
    {
      zone_id: "BILLING",
      zone_name: "Billing & Queue Counter",
      sku_zone: "Checkout Point, Bags & Small Grips",
      camera_coverage: ["CAM_BILLING_01"],
      bounds: { x: 100, y: 80, w: 200, h: 140 }
    }
  ],
  open_hours: {
    open: "10:00",
    close: "22:00"
  }
};
