import { EventType, StoreEvent } from "../types";

const posTxs = [
{ order_id: "104363838", coupon_code: "", offer_name: "Buy 2 Get 1 on PB", discount_code: "", invoice_number: "ML0426KAP0001358", invoice_type: "sales", order_date: "10-04-2026", order_time: "16:55:36", return_id: "", store_id: "ST1008", store_name: "Brigade_Bangalore", city: "Bangalore", customer_name: "Guest", customer_number: "9346413680", sku: "PPLBDD8904362534994NM2", product_id: "402813", ean: "8.90436E+12", product_name: "DERMDOC ExfoliGlow Body Wash", brand_name: "DERMDOC", dep_name: "bath-and-body", sub_category: "Body Wash & Shower Gel", brand_type: "PB", tax: "18", hsn_code: "33049990", salesperson_id: "1178", employee_code: "CL2063", salesperson_name: "kasthuri v", qty: 1, GMV: "400", NMV: "274.36", coupon_amount: "0", item_promotion: "125.64", amt_without_gwp: "274.36", total_amount: "274.36", pb_eb_sale: "274.36", week_assigned: "", tax_m: "1.18", taxable_amt: "232.51", tax_amt: "41.85000000000002" },
{ order_id: "104377545", customer_name: "sagar", customer_number: "9986216644", order_time: "19:21:55", total_amount: 99, brand_name: "Good Vibes" },
{ order_id: "104362899", customer_name: "Guest", customer_number: "9900244874", order_time: "16:45:32", total_amount: 553.17, brand_name: "Faces Canada" },
{ order_id: "104373042", customer_name: "Nivya Sara", customer_number: "9188142680", order_time: "18:41:51", total_amount: 1448.18, brand_name: "Round Lab" },
{ order_id: "104375288", customer_name: "rupa", customer_number: "9972974352", order_time: "19:02:09", total_amount: 466.67, brand_name: "Faces Canada" },
{ order_id: "104346717", customer_name: "madeeha thaseeb", customer_number: "9902843091", order_time: "13:41:55", total_amount: 49.5, brand_name: "Good Vibes" },
{ order_id: "104380754", customer_name: "wilma", customer_number: "9845789663", order_time: "19:54:02", total_amount: 198, brand_name: "Good Vibes" },
{ order_id: "104341290", customer_name: "thanu thanu", customer_number: "9611400437", order_time: "12:42:18", total_amount: 1, brand_name: "Purplle" },
{ order_id: "104373042", customer_name: "Nivya Sara", customer_number: "9188142680", order_time: "18:41:51", total_amount: 0.8, brand_name: "Purplle" },
{ order_id: "104369411", customer_name: "monalisa", customer_number: "8310361706", order_time: "17:55:02", total_amount: 215.67, brand_name: "NY Bae" },
{ order_id: "104338647", customer_name: "sugitha", customer_number: "7483373325", order_time: "12:15:05", total_amount: 302.33, brand_name: "Faces Canada" },
{ order_id: "104341290", customer_name: "thanu thanu", customer_number: "9611400437", order_time: "12:42:18", total_amount: 397.38, brand_name: "Faces Canada" },
{ order_id: "104346717", customer_name: "madeeha thaseeb", customer_number: "9902843091", order_time: "13:41:55", total_amount: 49.5, brand_name: "Good Vibes" },
{ order_id: "104347785", customer_name: "sera", customer_number: "9880557837", order_time: "13:55:16", total_amount: 0, brand_name: "Purplle" },
{ order_id: "104383803", customer_name: "SAVIA", customer_number: "8882631875", order_time: "20:25:04", total_amount: 224.31, brand_name: "NY Bae" },
{ order_id: "104377545", customer_name: "sagar", customer_number: "9986216644", order_time: "19:21:55", total_amount: 299.39, brand_name: "CUFFS N LASHES" },
{ order_id: "104341290", customer_name: "thanu thanu", customer_number: "9611400437", order_time: "12:42:18", total_amount: 0, brand_name: "Renee" },
{ order_id: "104378732", customer_name: "Guest", customer_number: "1000000000", order_time: "19:33:52", total_amount: 249, brand_name: "Carmesi" },
{ order_id: "104341290", customer_name: "thanu thanu", customer_number: "9611400437", order_time: "12:42:18", total_amount: 614.54, brand_name: "Faces Canada" },
{ order_id: "104350137", customer_name: "Bharti Bajaj", customer_number: "9620836012", order_time: "14:23:21", total_amount: 225, brand_name: "Faces Canada" },
{ order_id: "104363838", customer_name: "Guest", customer_number: "9346413680", order_time: "16:55:36", total_amount: 181.76, brand_name: "Alps Goodness" },
{ order_id: "104359750", customer_name: "fana", customer_number: "9043344727", order_time: "16:08:03", total_amount: 799, brand_name: "Maybelline" },
{ order_id: "104362899", customer_name: "Guest", customer_number: "9900244874", order_time: "16:45:32", total_amount: 0, brand_name: "Purplle" },
{ order_id: "104341290", customer_name: "thanu thanu", customer_number: "9611400437", order_time: "12:42:18", total_amount: 469.77, brand_name: "Faces Canada" },
{ order_id: "104379480", customer_name: "anmika", customer_number: "8280017709", order_time: "19:41:29", total_amount: 450, brand_name: "Swiss Beauty" },
{ order_id: "104362899", customer_name: "Guest", customer_number: "9900244874", order_time: "16:45:32", total_amount: 691.64, brand_name: "Faces Canada" },
{ order_id: "104383803", customer_name: "SAVIA", customer_number: "8882631875", order_time: "20:25:04", total_amount: 224.31, brand_name: "NY Bae" },
{ order_id: "104370397", customer_name: "sundar", customer_number: "9845021410", order_time: "18:07:14", total_amount: 495, brand_name: "Lakme" },
{ order_id: "104358212", customer_name: "zthise", customer_number: "8105575833", order_time: "15:50:44", total_amount: 400, brand_name: "Juicy Chemistry" },
{ order_id: "104341290", customer_name: "thanu thanu", customer_number: "9611400437", order_time: "12:42:18", total_amount: 397.38, brand_name: "Faces Canada" },
{ order_id: "104357849", customer_name: "Guest", customer_number: "1000000000", order_time: "15:46:39", total_amount: 599, brand_name: "Faces Canada" },
{ order_id: "104379480", customer_name: "anmika", customer_number: "8280017709", order_time: "19:41:29", total_amount: 99, brand_name: "Good Vibes" },
{ order_id: "104341290", customer_name: "thanu thanu", customer_number: "9611400437", order_time: "12:42:18", total_amount: 445.5, brand_name: "Foxtale" },
{ order_id: "104363838", customer_name: "Guest", customer_number: "9346413680", order_time: "16:55:36", total_amount: 273.67, brand_name: "Alps Goodness" },
{ order_id: "104353598", customer_name: "suman", customer_number: "7997037608", order_time: "15:02:20", total_amount: 314.8, brand_name: "DERMDOC" },
{ order_id: "104377545", customer_name: "sagar", customer_number: "9986216644", order_time: "19:21:55", total_amount: 1221.65, brand_name: "Faces Canada" },
{ order_id: "104368521", customer_name: "nikitha", customer_number: "9961180216", order_time: "17:44:44", total_amount: 299, brand_name: "NY Bae" },
{ order_id: "104346717", customer_name: "madeeha thaseeb", customer_number: "9902843091", order_time: "13:41:55", total_amount: 49.5, brand_name: "Good Vibes" },
{ order_id: "104363838", customer_name: "Guest", customer_number: "9346413680", order_time: "16:55:36", total_amount: 249, brand_name: "Carmesi" },
{ order_id: "104341290", customer_name: "thanu thanu", customer_number: "9611400437", order_time: "12:42:18", total_amount: 216.42, brand_name: "Faces Canada" },
{ order_id: "104375288", customer_name: "rupa", customer_number: "9972974352", order_time: "19:02:09", total_amount: 0, brand_name: "Purplle" },
{ order_id: "104346717", customer_name: "madeeha thaseeb", customer_number: "9902843091", order_time: "13:41:55", total_amount: 49.5, brand_name: "Good Vibes" },
{ order_id: "104362899", customer_name: "Guest", customer_number: "9900244874", order_time: "16:45:32", total_amount: 1278, brand_name: "Beauty of Joseon" },
{ order_id: "104341290", customer_name: "thanu thanu", customer_number: "9611400437", order_time: "12:42:18", total_amount: 1085.03, brand_name: "Faces Canada" },
{ order_id: "104377545", customer_name: "sagar", customer_number: "9986216644", order_time: "19:21:55", total_amount: 99, brand_name: "Good Vibes" },
{ order_id: "104370397", customer_name: "sundar", customer_number: "9845021410", order_time: "18:07:14", total_amount: 198, brand_name: "Lakme" },
{ order_id: "104341290", customer_name: "thanu thanu", customer_number: "9611400437", order_time: "12:42:18", total_amount: 172.8, brand_name: "GUBB" },
{ order_id: "104383803", customer_name: "SAVIA", customer_number: "8882631875", order_time: "20:25:04", total_amount: 0, brand_name: "Purplle" },
{ order_id: "104378732", customer_name: "Guest", customer_number: "1000000000", order_time: "19:33:52", total_amount: 765, brand_name: "COSRX" },
{ order_id: "104379480", customer_name: "anmika", customer_number: "8280017709", order_time: "19:41:29", total_amount: 49.5, brand_name: "Good Vibes" },
{ order_id: "104358212", customer_name: "zthise", customer_number: "8105575833", order_time: "15:50:44", total_amount: 0, brand_name: "Purplle" },
{ order_id: "104363838", customer_name: "Guest", customer_number: "9346413680", order_time: "16:55:36", total_amount: 188.62, brand_name: "Alps Goodness" },
{ order_id: "104369411", customer_name: "monalisa", customer_number: "8310361706", order_time: "17:55:02", total_amount: 215.67, brand_name: "NY Bae" },
{ order_id: "104341290", customer_name: "thanu thanu", customer_number: "9611400437", order_time: "12:42:18", total_amount: 288.81, brand_name: "Faces Canada" },
{ order_id: "104369411", customer_name: "monalisa", customer_number: "8310361706", order_time: "17:55:02", total_amount: 237.31, brand_name: "NY Bae" },
{ order_id: "104363838", customer_name: "Guest", customer_number: "9346413680", order_time: "16:55:36", total_amount: 350, brand_name: "Juicy Chemistry" },
{ order_id: "104369411", customer_name: "monalisa", customer_number: "8310361706", order_time: "17:55:02", total_amount: 179.6, brand_name: "NY Bae" },
{ order_id: "104389493", customer_name: "Guest", customer_number: "1000000000", order_time: "21:16:15", total_amount: 269.1, brand_name: "Neutrogena" },
{ order_id: "104377545", customer_name: "sagar", customer_number: "9986216644", order_time: "19:21:55", total_amount: 599, brand_name: "Faces Canada" },
{ order_id: "104373042", customer_name: "Nivya Sara", customer_number: "9188142680", order_time: "18:41:51", total_amount: 615.09, brand_name: "Bare Anatomy" },
{ order_id: "104377545", customer_name: "sagar", customer_number: "9986216644", order_time: "19:21:55", total_amount: 569.67, brand_name: "Faces Canada" },
{ order_id: "104380754", customer_name: "wilma", customer_number: "9845789663", order_time: "19:54:02", total_amount: 313.64, brand_name: "Maybelline" },
{ order_id: "104341290", customer_name: "thanu thanu", customer_number: "9611400437", order_time: "12:42:18", total_amount: 315, brand_name: "Good Vibes" },
{ order_id: "104341290", customer_name: "thanu thanu", customer_number: "9611400437", order_time: "12:42:18", total_amount: 325, brand_name: "Faces Canada" },
{ order_id: "104375288", customer_name: "rupa", customer_number: "9972974352", order_time: "19:02:09", total_amount: 299.76, brand_name: "Faces Canada" },
{ order_id: "104353598", customer_name: "suman", customer_number: "7997037608", order_time: "15:02:20", total_amount: 255.34, brand_name: "DERMDOC" },
{ order_id: "104375288", customer_name: "rupa", customer_number: "9972974352", order_time: "19:02:09", total_amount: 933.34, brand_name: "Faces Canada" },
{ order_id: "104375288", customer_name: "rupa", customer_number: "9972974352", order_time: "19:02:09", total_amount: 299.76, brand_name: "Faces Canada" },
{ order_id: "104378732", customer_name: "Guest", customer_number: "1000000000", order_time: "19:33:52", total_amount: 99, brand_name: "NY Bae" },
{ order_id: "104377545", customer_name: "sagar", customer_number: "9986216644", order_time: "19:21:55", total_amount: 0, brand_name: "Purplle" },
{ order_id: "104338647", customer_name: "sugitha", customer_number: "7483373325", order_time: "12:15:05", total_amount: 491.77, brand_name: "Faces Canada" },
{ order_id: "104363838", customer_name: "Guest", customer_number: "9346413680", order_time: "16:55:36", total_amount: 240.06, brand_name: "DERMDOC" },
{ order_id: "104341290", customer_name: "thanu thanu", customer_number: "9611400437", order_time: "12:42:18", total_amount: 90, brand_name: "Good Vibes" },
{ order_id: "104369411", customer_name: "monalisa", customer_number: "8310361706", order_time: "17:55:02", total_amount: 287.8, brand_name: "NY Bae" },
{ order_id: "104391745", customer_name: "Guest", customer_number: "1000000000", order_time: "21:39:55", total_amount: 427.5, brand_name: "Bare Anatomy" },
{ order_id: "104379480", customer_name: "anmika", customer_number: "8280017709", order_time: "19:41:29", total_amount: 1305, brand_name: "COSRX" },
{ order_id: "104369867", customer_name: "Jaya Hiranandani", customer_number: "9716299932", order_time: "18:00:18", total_amount: 149, brand_name: "Faces Canada" },
{ order_id: "104362899", customer_name: "Guest", customer_number: "9900244874", order_time: "16:45:32", total_amount: 1, brand_name: "Purplle" },
{ order_id: "104362899", customer_name: "Guest", customer_number: "9900244874", order_time: "16:45:32", total_amount: 553.17, brand_name: "Faces Canada" },
{ order_id: "104380754", customer_name: "wilma", customer_number: "9845789663", order_time: "19:54:02", total_amount: 121.5, brand_name: "GUBB" },
{ order_id: "104341290", customer_name: "thanu thanu", customer_number: "9611400437", order_time: "12:42:18", total_amount: 614.54, brand_name: "Faces Canada" },
{ order_id: "104341290", customer_name: "thanu thanu", customer_number: "9611400437", order_time: "12:42:18", total_amount: 321, brand_name: "Lotus Herbals" },
{ order_id: "104377545", customer_name: "sagar", customer_number: "9986216644", order_time: "19:21:55", total_amount: 172.8, brand_name: "GUBB" },
{ order_id: "104341290", customer_name: "thanu thanu", customer_number: "9611400437", order_time: "12:42:18", total_amount: 275, brand_name: "Garnier" },
{ order_id: "104363838", customer_name: "Guest", customer_number: "9346413680", order_time: "16:55:36", total_amount: 291.5, brand_name: "DERMDOC" },
{ order_id: "104341290", customer_name: "thanu thanu", customer_number: "9611400437", order_time: "12:42:18", total_amount: 578.34, brand_name: "Faces Canada" },
{ order_id: "104341290", customer_name: "thanu thanu", customer_number: "9611400437", order_time: "12:42:18", total_amount: 198, brand_name: "Good Vibes" },
{ order_id: "104341290", customer_name: "thanu thanu", customer_number: "9611400437", order_time: "12:42:18", total_amount: 90, brand_name: "Good Vibes" },
{ order_id: "104341290", customer_name: "thanu thanu", customer_number: "9611400437", order_time: "12:42:18", total_amount: 0, brand_name: "Purplle" },
{ order_id: "104341290", customer_name: "thanu thanu", customer_number: "9611400437", order_time: "12:42:18", total_amount: 578.34, brand_name: "Faces Canada" },
{ order_id: "104341290", customer_name: "thanu thanu", customer_number: "9611400437", order_time: "12:42:18", total_amount: 249, brand_name: "Faces Canada" },
{ order_id: "104380754", customer_name: "wilma", customer_number: "9845789663", order_time: "19:54:02", total_amount: 721.65, brand_name: "Maybelline" },
{ order_id: "104383803", customer_name: "SAVIA", customer_number: "8882631875", order_time: "20:25:04", total_amount: 449.37, brand_name: "Faces Canada" },
{ order_id: "104379480", customer_name: "anmika", customer_number: "8280017709", order_time: "19:41:29", total_amount: 49.5, brand_name: "Good Vibes" },
{ order_id: "104377545", customer_name: "sagar", customer_number: "9986216644", order_time: "19:21:55", total_amount: 406.67, brand_name: "Faces Canada" },
{ order_id: "104347785", customer_name: "sera", customer_number: "9880557837", order_time: "13:55:16", total_amount: 199, brand_name: "Carmesi" },
{ order_id: "104353598", customer_name: "suman", customer_number: "7997037608", order_time: "15:02:20", total_amount: 244.84, brand_name: "DERMDOC" },
{ order_id: "104341290", customer_name: "thanu thanu", customer_number: "9611400437", order_time: "12:42:18", total_amount: 321.38, brand_name: "Faces Canada" },
{ order_id: "104338647", customer_name: "sugitha", customer_number: "7483373325", order_time: "12:15:05", total_amount: 453.88, brand_name: "Faces Canada" },
{ order_id: "104375288", customer_name: "rupa", customer_number: "9972974352", order_time: "19:02:09", total_amount: 296.43, brand_name: "Faces Canada" },
{ order_id: "104369411", customer_name: "monalisa", customer_number: "8310361706", order_time: "17:55:02", total_amount: 359.93, brand_name: "NY Bae" }
];

const generatedEvents: StoreEvent[] = posTxs.flatMap((tx: any, i) => {
  const visitor_id = "VIS_" + tx.customer_number;
  // Use a fallback time if order_time is missing
  const orderTimeStr = tx.order_time || "12:00:00";
  const baseTime = new Date("2026-04-10T" + orderTimeStr + ".000Z").getTime();
  
  // Decide a zone based on product category or fallback to index
  let zone_id = "MAKEUP";
  const mainDep = String(tx.dep_name || "").toLowerCase();
  if (mainDep.includes("skincare") || mainDep.includes("bath") || mainDep.includes("body")) {
    zone_id = "SKINCARE";
  } else if (mainDep.includes("hair")) {
    zone_id = "HAIRCARE";
  } else {
    if (i % 3 === 0) zone_id = "SKINCARE";
    else if (i % 3 === 1) zone_id = "HAIRCARE";
  }
  
  const events = [];
  
  // 1. Entry Event (15 mins prior)
  events.push({
    event_id: "evt-entry-" + i,
    store_id: "STORE_BLR_002",
    camera_id: "CAM_ENTRY_01",
    visitor_id,
    event_type: EventType.ENTRY,
    timestamp: new Date(baseTime - 15 * 60000).toISOString(),
    zone_id: "ENTRY_DOORS",
    dwell_ms: 0,
    is_staff: false,
    confidence: 0.99,
    metadata: {
      customer_name: tx.customer_name,
      customer_number: tx.customer_number,
      order_id: tx.order_id
    }
  });

  // 2. Zone Dwell Event (10 mins prior)
  const dwellTime = Math.floor(Math.random() * 300000) + 120000; // 2 to 7 mins
  events.push({
    event_id: "evt-dwell-" + i,
    store_id: "STORE_BLR_002",
    camera_id: "CAM_PROMO_01",
    visitor_id,
    event_type: EventType.ZONE_DWELL,
    timestamp: new Date(baseTime - 10 * 60000).toISOString(),
    zone_id,
    dwell_ms: dwellTime,
    is_staff: false,
    confidence: 0.96,
    metadata: {
      customer_name: tx.customer_name,
      customer_number: tx.customer_number,
      order_id: tx.order_id
    }
  });

  // 3. Billing Queue Join (from original)
  events.push({
    event_id: "evt-xlsx-" + i,
    store_id: "STORE_BLR_002",
    camera_id: "CAM_BILLING_01",
    visitor_id,
    event_type: EventType.BILLING_QUEUE_JOIN,
    timestamp: new Date(baseTime).toISOString(),
    zone_id: "BILLING",
    dwell_ms: 120000,
    is_staff: false,
    confidence: 0.99,
    metadata: {
      customer_name: tx.customer_name,
      customer_number: tx.customer_number,
      order_id: tx.order_id,
      total_amount: parseFloat(String(tx.total_amount)) || 0
    }
  });

  return events;
});

export const INITIAL_EVENTS = generatedEvents;
