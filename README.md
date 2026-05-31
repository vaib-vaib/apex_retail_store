# APEX RETAIL: STORE INTELLIGENCE SUITE

This repository contains the complete Store Intelligence system for Apex Retail, translating raw video surveillance signals into actionable real-time dashboard analytics.

## 1. Quick Start

### Prerequisites
- **Node.js** version 18 or higher
- **npm** (comes with Node.js)

Deploy and boot the entire full-stack application locally with these simple commands:

### Running Locally
```bash
# 1. Install project dependencies
npm install

# 2. Compile and build the production bundle
npm run build

# 3. Start the development server (Express backend + Vite client)
npm run dev
```

Once running, open your browser and navigate to **http://localhost:3000** to explore the interactive dashboard interface.

---

## 1.5. Hackathon Configuration

### 🔑 Local & Offline-First Core Execution
- **Is a Gemini API Key required?** **No!**
  - The core of the application—including the interactive Store Operations simulation, preloaded checkout databases, transactional matching engine, live charts, real-time analytics calculations, floor heatmaps, and spatial logs—runs **entirely locally without any API keys or internet connection**.
  - Reviewers can evaluate, run, and interact with the full suite using the pre-seeded simulation records seamlessly.

### 🎥 VLM Feature Activation (Optional)
- The only module that utilizes an external model is the **Video Analysis Engine** VLM tab, which allows you to drop arbitrary MP4 clips to parse live retail traffic on-the-fly using Gemini.
- To enable this feature locally, copy the example environment file:
  ```bash
  cp .env.example .env
  ```
- Edit `.env` and input your `GEMINI_API_KEY`:
  ```env
  GEMINI_API_KEY="AIzaSyYourActualKeyHere..."
  ```

---

## 2. Repository Architecture

```
/
├── server.ts                 # Full-stack Express & Vite gateway server
├── Dockerfile                # Production alpine system build
├── docker-compose.yml        # Orchestration layer configuration
├── docs/                     # Compliance docs for submission
│   ├── DESIGN.md             # Systems design architecture and LLM tradeoffs
│   └── CHOICES.md            # Hardware model select and schema justifications
├── tests/                    # Production-aware automated test suites
│   ├── test_metrics.ts       # Metrics calculation, staff exclusion, and re-entry testing
│   └── test_anomalies.ts     # Operational anomaly alarm warning behavior testing
├── src/
│   ├── App.tsx               # Analytics Operations Dashboard panel (React SPA)
│   ├── types.ts              # Strict TypeScript interface declarations
│   ├── data/
│   │   ├── store_layout.ts      # Station zone maps for ST1008
│   │   ├── initial_events.ts    # Seed CCTV parsed event logs (April 10, 2026)
│   │   └── pos_transactions.ts  # Preloaded checkout receipts database
│   ├── index.css             # Tailwind CSS main layout style
│   └── main.tsx              # React client entrypoint
└── package.json              # Operations command declarations
```

---

## 3. Core REST API Endpoints

### Ingestion Interface
* **`POST /api/events/ingest`**: Ingest person-tracking computer vision event logs.
  - Idempotent: Deduplicates automatically based on `event_id` keys.
  - Returns count of parsed and duplicate records.

### Dashboard Data Interfaces
* **`GET /api/stores/:id/metrics`**: Returns today's active unique visitors, customer conversion rates (excluding staff footprints), average dwell timings per floor zone (ms), active register queue counts, and checkout abandonment rates.
* **`GET /api/stores/:id/funnel`**: Computes sequential session leakage rates: `Entry` -> `Zone Visit` -> `Billing Queue` -> `Completed Purchase`.
* **`GET /api/stores/:id/heatmap`**: Aggregates visitor floor counts and layouts.
* **`GET /api/stores/:id/anomalies`**: Scans floor traffic to trigger security/operation warnings (such as queue line spikes, dead aisles, or sales drops).
* **`GET /api/health`**: Verifies system status and alerts if camera feed signals are delayed by > 10 minutes.

---

## 4. Video Analysis Engine (AI Integration)
Our platform features a **Gemini 3.5 VLM analyzer** integrated into `/api/gemini/analyze-video`. Reviewers can drop an MP4 video file directly onto the dashboard to watch a real large-multimodal-model parse, classify, and populate real-time analytics events dynamically!
