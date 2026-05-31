# ENGINEERING CHOICES AND TRADE-OFFS

## 1. Detection Model Selection & Pipeline

### Selected Architecture: YOLOv8-M + ByteTrack + OSNet Re-ID / Gemini 3.5 Flash (for Multimodal Video Upload)
* **Other Options Discarded**:
  - *MediaPipe Face Detection*: Discarded because CCTV cameras are mounted at high overhead angles; faces are mostly occluded, blurred, or tilted downward.
  - *Sort/DeepSort*: DeepSORT relies on heavy appearance-feature extractors. Under variable light and crowd overlaps, it suffers high ID-switching. ByteTrack utilizes bounding box overlap logic, which is faster and highly resilient to partial frame concealment.
* **Why this combination**:
  - **YOLOv8** offers exceptional speed-accuracy tradeoffs for detecting general person objects in 1080p surveillance video feeds in real-time.
  - **ByteTrack** solves the major tracking tracking issue of temporary blockages (e.g. when a customer is hidden behind shelves or displays) by leveraging motion predictions.
  - **OSNet** provides re-identification of matching visitor IDs when they step out of one camera frame and enter another (e.g., from Entrance CAM_ENTRY_01 to main store CAM_MAIN_01), ensuring a deduplicated visitor session.
  - **Gemini-3.5-Flash** is selected for custom user video uploads in the dashboard. As a large multimodal VLM, it can parse uploaded MP4 video assets directly, classify zones, identify staff, and extract visitor counts using natural language cues, bypassing local tensor models on thin client computers.

---

## 2. Event Schema & Session Logic

* **Schema Rationale**:
  We adopted a **hierarchical structured event catalog** with 8 distinct occurrences (`ENTRY`, `EXIT`, `ZONE_ENTER`, `ZONE_EXIT`, `ZONE_DWELL`, `BILLING_QUEUE_JOIN`, `BILLING_QUEUE_ABANDON`, `REENTRY`). This covers the entire user journey:
  - Keeping a `session_seq` ordinal counter ensures that we can validate the state transition sequence on any session (e.g., an `EXIT` can never occur before an `ENTRY` has happened).
  - Explicitly categorizing `is_staff: true` lets the ingestion pipeline preserve staff footprints for store labor efficiency logs while guaranteeing their exclusion from business converting rates.
  - Keeping high-precision decimals `confidence` ensures we can filter out low-confidence video phantoms during low-light hours.

---

## 3. API Architectural Choice

### Choosing Injest-time Rollups vs. Query-time Aggregations
* **Other Options Discarded**:
  - *Precompute and persist statistical row indicators during ingestion*: Fast ingestion, but highly rigid. If a customer is associated with a late-arriving POS transaction, updating compiled indexes is complex.
* **Why we chose Query-time Aggregations**:
  Surveillance feeds depend on asynchronous data streams. Transactions can land at the cashier point minutes before or after cameras record queue events. By choosing dynamic query-time aggregations (grouping and correlating events by session groupings during request), we:
  - Deliver absolute accuracy for rolling real-time queries.
  - Bypassed stale database row caches.
  - Retain the raw event grain, enabling users to play back, speed up, or clear store histories easily on the frontend.
