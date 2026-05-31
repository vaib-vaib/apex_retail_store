# SYSTEM DESIGN: APEX STORE INTELLIGENCE PIPELINE

## 1. Architectural Overview

This system is an end-to-end IoT and computer vision store analytics pipeline designed for **Apex Retail** to eliminate the offline data blind spot. By capturing and transforming raw CCTV feeds into structured real-time events, the pipeline produces core business metrics such as store conversion rates, zone dwell times, and queue bottleneck alerts.

```
+------------------+     +--------------------+     +-------------------+
|  Camera CCTV     | --> |  VLM / Detection   | --> |  Structured Event |
|  CCTV Video Clip |     |  Tracking (YOLOv8) |     |  Ingest Stream    |
+------------------+     +--------------------+     +-------------------+
                                                              |
                                                              v
+------------------+     +--------------------+     +-------------------+
|  Store metrics   | <-- |  Store Analytics   | <-- |  POST /api/events |
|  & funnel plots  |     |  Correlation Engine|     |  In memory DB     |
+------------------+     +--------------------+     +-------------------+
```

### Core Architecture Components:
1. **Detection Layer (Part A)**: Processes raw CCTV clips (1080p, 15fps) across 3 key angles per store. Utilizes person-detection object boundaries and tracking models to emit schema-compliant event packets.
2. **Persistence & Processing API (Part B/C)**: A high-throughput REST API built in Node.js/TypeScript using Express. Validates and stores incoming event streams in an in-memory buffer with strict idempotency (checking `event_id` keys).
3. **Transactional Correlation Manager**: Merges POS transactions (from `pos_transactions.csv`) with visitor sessions using a rolling 5-minute time window before transaction timestamps to compute the primary **North Star Metric: Conversion Rate**.
4. **Live Dashboard Observer (Part E)**: Responsive React interface that connects the live video stream playbacks, overlays bounding frames, and visualizes real-world analytics panels through fully interactive line graphs, funnel charts, and store floor maps.

### Technical Stack & Dependencies:
The system is built on a modern full-stack TypeScript architecture, consisting of the following layers and technologies:

* **Backend & Server Engine**:
  * **Runtime Environment**: **Node.js** with **TypeScript** type checking.
  * **API Framework**: **Express (v4.21)** to construct high-throughput RESTful endpoints (for live metrics, analytical funnels, heatmaps, event logs, resets, and VLM simulation uploads).
  * **Build & Dev Tooling**: Executed in development mode using **tsx** (TypeScript Execute) for real-time interpretation; compiled into a single production-ready CommonJS file (`dist/server.cjs`) using **esbuild** to enable maximum startup speeds and clean environment separation in active deployments.

* **Frontend Dashboard Interface**:
  * **Core Library**: **React 19** utilizing modern functional components, state hooks, and robust `useEffect` polling schedules.
  * **Development & Build Tooling**: **Vite (v6)** to serve the single-page application and bundles assets into statically hosted artifacts.
  * **Styling**: **Tailwind CSS v4** configuring deep dark canvases, responsive bento-grids, customized layouts, and flexible grid elements directly using modern CSS variables.
  * **Animation & Icons**: **Motion (v12)** (formerly Framer Motion) to power hardware-accelerated state transitions, dynamic metric ticker animations, and overlay card fade-ins; combined with **Lucide React** for premium, scalable interface icons.

* **AI & Computer Vision Intelligence**:
  * **SDK**: **@google/genai (v2.4)** to facilitate server-side video, clip, or frame analysis leveraging Google's Gemini models for object counting and detection tasks.

---

## 2. AI-Assisted Decisions

During research and development, an LLM assisted in three structural decisions:

### A. Temporal Transaction Assignment Window
* **The Problem**: Associating untagged POS cash receipts with unique camera session IDs in crowded checkout aisles.
* **The LLM Suggestion**: The model suggested a strict strict nearest-neighbor time proximity match, grouping customers by sequence of arrival.
* **The Engineering Override**: We overrode this in favor of a **5-minute rolling look-back threshold** relative to the customer's last active Billing Zone presence interval. Why? Sequenced timing breaks under varying grocery bagging speeds, whereas checking if a visitor was present near the cashier in the 5 minutes directly preceding transaction timestamps aligns with real-world customer queues and billing habits.

### B. In-Memory Database vs PostgreSQL in Sandboxed Environment
* **The Problem**: Selecting an storage engine that meets the criteria of production-readiness but executes completely within sandboxed web execution parameters with zero config.
* **The LLM Suggestion**: Recommended deploying a complete PostgreSQL database with Prisma ORM schemas inside the stack.
* **The Engineering Override**: We selected a highly specialized **in-memory volatile buffer** with full transactional capability, pre-seeded with April 10, 2026 data. This offers sub-millisecond query performance, prevents container crash traps resulting from un-provisioned database credentials, and fulfills the idempotency requirements via fast key hashing.

---

## 3. Production Readiness and Scalability

* **Structured Logging Guidelines**: Our backend logs every incoming ingestion batch, tracking tracer tokens, elapsed runtime (ms), status codes, and payload footprint.
* **Graceful Degradation Rules**: If the database throws a timeout, the API responds with a structured `HTTP 503 Service Unavailable` block without exposing raw Node.js system track traces to clients.

---

## 4. Pipeline Event Ledger: Logs Rendering

The interactive **Pipeline Event Ledger** terminal widget in the React UI prints real-time structured logs fed directly from the live event ingestion buffer.

### Log Extraction & Print Flow:
1. **Dynamic Streaming**: On each simulation tick or API ingest payload, the client polls `/api/events`, which fetches the latest 100 ingested database files sorted in reverse chronological order.
2. **Timestamp Formatting**: The UTC ISO string (`timestamp` fields, e.g., `2026-04-10T19:21:55.000Z`) is sliced in the client to yield a clean clock-time format: `[19:21:55]`.
3. **Color-Coded Status Framing**: To reinforce instant readability, the left border accent of each log line maps directly to its `event_type`:
   - **ENTRY**: Styled with Emerald Green (`#10b981`) accent.
   - **ZONE_DWELL**: Styled with Royal Purple (`#6366f1`) accent.
   - **BILLING_QUEUE_JOIN**: Styled with Amber Yellow (`#eab308`) accent.
   - **EXIT**: Styled with Crimson Red (`#ef4444`) accent.
4. **Context & Metrics Interpolation**: 
   - Non-staff events and staff tags are parsed selectively (`is_staff` prints a distinct red badge).
   - If `dwell_ms` exists and is greater than `0`, it is parsed dynamically into seconds and appended (e.g., `(120s)`).
   - Zone context (`zone_id` e.g., `SKINCARE`, `HAIRCARE`, `MAKEUP`, `ENTRY_DOORS`) is highlighted in custom styling alongside CCTV confidence metrics (`confidence` mapping to range `[0.0, 1.0]`).

---

## 5. Revenue Calculation Flow

The metrics panel on the UI prominently displays the **Total Revenue (INR)** generated by the store during active monitoring.

### Technical Calculation Steps:
1. **Server-Side Aggregation**: When the client queries the `/api/stores/:id/metrics` endpoint, the Express server parses the `eventsDatabase` in memory.
2. **Target Event Selection**: The server filters for events matching the specified store ID where:
   - `e.event_type` matches exactly `BILLING_QUEUE_JOIN`.
   - The event contains a valid `metadata` object with a non-null `total_amount` attribute.
3. **Summation & Precision Handling**:
   - The server iterates through these filtered billing event streams, summing up the transaction amounts: `totalSalesInr += e.metadata.total_amount`.
   - The resulting sum is rounded to 2 decimal places using `parseFloat(totalSalesInr.toFixed(2))` to avoid floating-point math issues and sent within the JSON payload as `total_sales_inr`.
4. **UI Formatting**: The React frontend maps this value directly into the **Sales Revenue** KPI metric card, parsing it via `metrics.total_sales_inr?.toLocaleString() || "0"` to format the currency gracefully in Indian Rupees (INR, `₹`) alongside the total transaction count (`metrics.total_transactions` / Receipts count).

---

## 6. Dynamic Simulation Metrics: Visits Overlap & Revenue Aggregation

During continuous simulator record processing (such as past 69 steps), operators will notice a specific state where metrics like **Total Visits**, **Unique Customers**, and **Returning Customers** reach a plateau (e.g., 21, 20, and 1 respectively), while **Revenue** continues to scale upwards.

This is an expected architectural design pattern resulting from how transactional line-items are parsed and ingested.

### A. Line Items vs. Transaction Headers
The underlying POS transaction sheet (`posTxs` array used by the pipeline generator) contains **individual product item purchases (SKUs/line-items)** rather than aggregated transaction headers. 
- A single customer transaction with a unique `order_id` (e.g., order `104341290` or `104377545`) containing 10 items will appear in the source dataset as **10 distinct rows**.
- As the simulator progresses, it generates a full set of 3 CV-events (`ENTRY`, `ZONE_DWELL`, and `BILLING_QUEUE_JOIN`) for **each independent row** in the dataset.

### B. Why Visits and Unique Customers Freeze
The server metrics calculation engine defines these KPI metrics using standard set-theoretic deduplication:
* **Total Visits**: Calculated by counting the size of the unique `order_id` set:
  $$\text{Total Visits} = \left| \{ \text{order\_id} \mid e \in \text{storeEvents} \} \right|$$
  Since subsequent records are line-items belonging to the same `order_id` strings already ingested, they do not increase the size of the `processedOrdersSet`. The metric correctly peaks and plateaus at the total number of unique orders (21).
* **Unique Customers**: Derived from the map size of unique `customer_number` identifiers. Because duplicate items belong to the same shoppers, the count of unique customers remains constant at 20.
* **Returning Customers**: Measures unique shopper numbers associated with **more than one unique `order_id`**. Since the incoming records represent different products listed under the same single order, no customer’s unique order count increases, keeping this metric steady at 1.

### C. Why Revenue Keeps Increasing
While visitor tracking deduplicates duplicate order and buyer identifiers, the financial accumulator iterates line-by-line:
* Every time a line-item is processed, a separate `BILLING_QUEUE_JOIN` event is ingested into the database containing that specific item's `total_amount` in its metadata.
* The backend metric calculator sums up **all** `metadata.total_amount` values across the entire stream of ingested billing queue joins.
* Consequently, as each product row's payment metrics are received, the system accumulates their partial amounts (e.g., ₹274.36, ₹99.00), causing the cumulative **Sales Revenue** to rise with every incoming record, even as visitor footprints remain fixed in their steady-state!



