import React, { useState, useEffect, useRef } from "react";
import {
  Camera,
  Activity,
  Users,
  ShoppingBag,
  Map,
  Flame,
  Zap,
  Play,
  Pause,
  Upload,
  ArrowRight,
  BookOpen,
  Clock,
  Trash2,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ChevronRight,
  Info,
  DollarSign,
  ArrowLeft,
  Database,
  Video
} from "lucide-react";
import { motion } from "motion/react";

import { STORE_LAYOUT_BLR } from "./data/store_layout";
import { POS_TRANSACTIONS } from "./data/pos_transactions";
import { INITIAL_EVENTS } from "./data/initial_events";
import { StoreEvent, StoreMetrics, FunnelResponse, HeatmapResponse, StoreAnomaly, EventType } from "./types";

// Standard cameras configs
const CAMERAS = [
  { id: "CAM_ENTRY_01", name: "CAM-01: Main Entrance Threshold", description: "Entry & exit tracking, customer Re-ID check" },
  { id: "CAM_MAIN_01", name: "CAM-02: Main Counter & Aisles", description: "Cosmetics, skincare rows, browsing traffic" },
  { id: "CAM_BILLING_01", name: "CAM-03: Billing Register & Queue", description: "Wait queues, purchases checkout, bottlenecks" },
  { id: "CAM_PROMO_01", name: "CAM-04: Promotional Interactive Counter", description: "Hotspot displays, tester sampling activity" },
  { id: "CAM_BACKROOM_01", name: "CAM-05: Warehousing & Staff Backroom", description: "Labor logistics, employee performance metrics" }
];

export default function App() {
  const storeId = "STORE_BLR_002";
  const layout = STORE_LAYOUT_BLR;

  // Active States
  const [activeCam, setActiveCam] = useState<string>("CAM_ENTRY_01");
  const [isSimulating, setIsSimulating] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<"overview" | "funnel" | "heatmap" | "pos" | "swagger" | "documents">("overview");

  // Swagger Client Interactive States
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>("POST /api/events/ingest");
  const [requestPayload, setRequestPayload] = useState<string>(() => JSON.stringify([
    {
      "event_id": "evt-ingest-tst-" + Math.floor(Math.random() * 900000 + 100000),
      "store_id": "STORE_BLR_002",
      "camera_id": "CAM_ENTRY_01",
      "visitor_id": "VIS_c8a2f1",
      "event_type": "ZONE_DWELL",
      "timestamp": new Date().toISOString(),
      "zone_id": "SKINCARE",
      "dwell_ms": 8400,
      "is_staff": false,
      "confidence": 0.91,
      "metadata": {
        "queue_depth": null,
        "sku_zone": "MOISTURISER",
        "session_seq": 5
      }
    }
  ], null, 2));
  const [responseStatus, setResponseStatus] = useState<number | null>(null);
  const [responseBody, setResponseBody] = useState<string>("");
  const [isRequestLoading, setIsRequestLoading] = useState<boolean>(false);

  const executeSwaggerRequest = async () => {
    setIsRequestLoading(true);
    setResponseStatus(null);
    setResponseBody("");
    try {
      let url = "";
      let method = "GET";
      let body: any = null;

      if (selectedEndpoint.includes("POST /api/events/ingest")) {
        url = "/api/events/ingest";
        method = "POST";
        body = requestPayload;
      } else if (selectedEndpoint.includes("GET /api/stores/STORE_BLR_002/metrics")) {
        url = `/api/stores/${storeId}/metrics`;
      } else if (selectedEndpoint.includes("GET /api/stores/STORE_BLR_002/funnel")) {
        url = `/api/stores/${storeId}/funnel`;
      } else if (selectedEndpoint.includes("GET /api/stores/STORE_BLR_002/heatmap")) {
        url = `/api/stores/${storeId}/heatmap`;
      } else if (selectedEndpoint.includes("GET /api/stores/STORE_BLR_002/anomalies")) {
        url = `/api/stores/${storeId}/anomalies`;
      } else if (selectedEndpoint.includes("GET /api/health")) {
        url = "/api/health";
      }

      const options: RequestInit = {
        method,
        headers: {
          "Content-Type": "application/json"
        }
      };

      if (body) {
        options.body = body;
      }

      const res = await fetch(url, options);
      setResponseStatus(res.status);
      const resData = await res.json();
      setResponseBody(JSON.stringify(resData, null, 2));
      
      // Update the dashboard figures if they ingested something!
      await fetchDashboardData();
    } catch (err: any) {
      setResponseStatus(500);
      setResponseBody(JSON.stringify({ error: "Failed to connect to REST API", message: err.message }, null, 2));
    } finally {
      setIsRequestLoading(false);
    }
  };

  // Ingested Data from server state
  const [metrics, setMetrics] = useState<StoreMetrics>({
    today_unique_visitors: 0,
    today_total_visitors: 0,
    today_guests: 0,
    today_repeat_customers: 0,
    conversion_rate: 0,
    avg_dwell_per_zone: {},
    queue_depth: 0,
    abandonment_rate: 0,
    total_transactions: 0,
    total_sales_inr: 0
  });

  const [funnel, setFunnel] = useState<FunnelResponse>({
    store_id: storeId,
    stages: []
  });

  const [heatmap, setHeatmap] = useState<HeatmapResponse>({
    store_id: storeId,
    zones: [],
    data_confidence_flag: false
  });

  const [hoveredZoneId, setHoveredZoneId] = useState<string | null>(null);

  const [anomalies, setAnomalies] = useState<StoreAnomaly[]>([]);
  const [liveEvents, setLiveEvents] = useState<StoreEvent[]>([]);
  const [totalLiveEvents, setTotalLiveEvents] = useState<number>(0);
  const [isResetting, setIsResetting] = useState<boolean>(false);

  // VLM upload states
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [vlmMessage, setVlmMessage] = useState<string>("");
  const [vlmIngestedEvents, setVlmIngestedEvents] = useState<any[]>([]);
  const [showVlmJson, setShowVlmJson] = useState<boolean>(true);

  // Simulation parameters
  const [playbackTime, setPlaybackTime] = useState<string>("20:10:00");
  const [simSpeed, setSimSpeed] = useState<number>(1); // Speed multiplier
  const [searchPOS, setSearchPOS] = useState<string>("");

  // Raw file viewer for docs
  const [selectedDoc, setSelectedDoc] = useState<"design" | "choices" | "readme">("design");
  const [docContent, setDocContent] = useState<string>("");

  // Refs for camera animation boxes
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const simIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Poll server state representing the intelligence API endpoints
  const fetchDashboardData = async () => {
    try {
      const [mRes, fRes, hRes, aRes, eRes] = await Promise.all([
        fetch(`/api/stores/${storeId}/metrics`),
        fetch(`/api/stores/${storeId}/funnel`),
        fetch(`/api/stores/${storeId}/heatmap`),
        fetch(`/api/stores/${storeId}/anomalies`),
        fetch(`/api/events`)
      ]);

      const [metricsData, funnelData, heatmapData, anomaliesData, eventsData] = await Promise.all([
        mRes.ok ? mRes.json() : null,
        fRes.ok ? fRes.json() : null,
        hRes.ok ? hRes.json() : null,
        aRes.ok ? aRes.json() : null,
        eRes.ok ? eRes.json() : null
      ]);

      if (metricsData) setMetrics(metricsData);
      if (funnelData) setFunnel(funnelData);
      if (heatmapData) setHeatmap(heatmapData);
      if (anomaliesData) setAnomalies(anomaliesData);
      if (eventsData) {
        setLiveEvents(eventsData.events || []);
        setTotalLiveEvents(eventsData.total || 0);
      }
    } catch (e) {
      console.error("Failed to query Store Intelligence API:", e);
    }
  };

  const eventIdxRef = useRef<number>(0);
  const [isReadyToSimulate, setIsReadyToSimulate] = useState<boolean>(false);
  const hasResetRef = useRef<boolean>(false);

  // Initial load & periodic poll
  useEffect(() => {
    let active = true;

    if (!hasResetRef.current) {
      hasResetRef.current = true;
      setIsReadyToSimulate(false);
      eventIdxRef.current = 0;

      // Force UI state to clean zero values immediately on mount/reload
      setMetrics({
        today_unique_visitors: 0,
        today_total_visitors: 0,
        today_guests: 0,
        today_repeat_customers: 0,
        conversion_rate: 0,
        avg_dwell_per_zone: {
          SKINCARE: 0,
          HAIRCARE: 0,
          MAKEUP: 0,
          BILLING: 0
        },
        queue_depth: 0,
        abandonment_rate: 0,
        total_transactions: 0,
        total_sales_inr: 0
      });
      setLiveEvents([]);
      setTotalLiveEvents(0);

      fetch("/api/events/reset", { method: "POST" }).then(() => {
          if (active) {
            fetchDashboardData().then(() => {
              if (active) {
                setIsReadyToSimulate(true);
              }
            });
          }
      });
    } else {
        if (active) {
            setIsReadyToSimulate(true);
        }
    }
    
    const interval = setInterval(fetchDashboardData, 3000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  // Fetch documents on tab view
  useEffect(() => {
    const fetchDoc = async () => {
      let url = "";
      if (selectedDoc === "design") url = "/docs/DESIGN.md";
      else if (selectedDoc === "choices") url = "/docs/CHOICES.md";
      else url = "/README.md";

      try {
        const res = await fetch(url);
        if (res.ok) {
          const text = await res.text();
          setDocContent(text);
        }
      } catch (err) {
        setDocContent("# Failed to load documentation");
      }
    };
    fetchDoc();
  }, [selectedDoc]);

  // Simulated live event dispatcher: feeds predefined POS events dynamically to /api/events/ingest in real-time
  useEffect(() => {
    if (!isSimulating || !isReadyToSimulate) return;

    let timeoutId: NodeJS.Timeout;

    const startOrResume = async () => {
      if (eventIdxRef.current >= INITIAL_EVENTS.length) {
        eventIdxRef.current = 0;
        try {
          await fetch("/api/events/reset", { method: "POST" });
          await fetchDashboardData();
        } catch (e) {
          console.error("Failed simulator reset:", e);
        }
      }
      runTick();
    };

    const runTick = async () => {
      if (eventIdxRef.current >= INITIAL_EVENTS.length) {
        setIsSimulating(false);
        return;
      }

      const eventsToIngest = INITIAL_EVENTS.slice(eventIdxRef.current, eventIdxRef.current + 3);
      if (eventsToIngest.length === 0) {
        setIsSimulating(false);
        return;
      }

      const finalEvent = eventsToIngest[eventsToIngest.length - 1];
      
      // Update UI clock to match the simulated event timestamp
      if (finalEvent && finalEvent.timestamp) {
         setPlaybackTime(finalEvent.timestamp.substring(11, 19));
      }

      try {
        await fetch("/api/events/ingest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(eventsToIngest)
        });
        await fetchDashboardData();
      } catch (e) {
        console.error("Failed simulator feed:", e);
      }
      
      eventIdxRef.current += 3;
      timeoutId = setTimeout(runTick, 1000 / simSpeed);
    };

    timeoutId = setTimeout(startOrResume, 1000 / simSpeed);

    return () => clearTimeout(timeoutId);
  }, [isSimulating, simSpeed, isReadyToSimulate]);

  // Draw continuous camera visualization bounding boxes overlay
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let frameId: number;
    let bboxes: { x: number; y: number; id: string; type: string; vx: number; vy: number; width: number; height: number; color: string }[] = [];

    // Prepopulate some mock targets moving across surveillance screen
    const names = ["VIS_blr_112", "VIS_blr_113", "VIS_blr_108", "VIS_staff_1", "VIS_blr_122"];
    const colors = ["#10b981", "#6366f1", "#eab308", "#ef4444", "#3b82f6"];

    for (let i = 0; i < 4; i++) {
      const isStaff = i === 3;
      bboxes.push({
        x: Math.random() * 400 + 100,
        y: Math.random() * 200 + 80,
        id: isStaff ? "STAFF_01" : names[i],
        type: isStaff ? "STAFF" : "CUSTOMER",
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5,
        width: Math.random() * 30 + 50,
        height: Math.random() * 50 + 100,
        color: isStaff ? "#ef4444" : colors[i]
      });
    }

    const render = () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Background grid & floor silhouette mimicry
      ctx.strokeStyle = "rgba(255, 255, 255, 0.04)";
      ctx.lineWidth = 1;
      for (let i = 0; i < canvas.width; i += 40) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, canvas.height);
        ctx.stroke();
      }
      for (let i = 0; i < canvas.height; i += 40) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(canvas.width, i);
        ctx.stroke();
      }

      // Draw Zone borders based on selected camera layout
      ctx.strokeStyle = "rgba(99, 102, 241, 0.4)";
      ctx.setLineDash([5, 5]);
      ctx.lineWidth = 2;

      if (activeCam === "CAM_ENTRY_01") {
        // Entrance line
        ctx.beginPath();
        ctx.moveTo(0, 180);
        ctx.lineTo(640, 180);
        ctx.stroke();
      } else if (activeCam === "CAM_MAIN_01" || activeCam === "CAM_PROMO_01") {
        // Draw Skincare & Makeup Zone Bounds
        ctx.strokeRect(30, 65, 250, 160);

        ctx.strokeStyle = "rgba(16, 185, 129, 0.4)";
        ctx.strokeRect(320, 50, 290, 200);
      } else if (activeCam === "CAM_BILLING_01") {
        // Billing Counter Wait Queue
        ctx.strokeRect(120, 60, 400, 180);
      }
      ctx.setLineDash([]);

      // Draw & animate targets
      bboxes.forEach((box) => {
        // Move target
        box.x += box.vx;
        box.y += box.vy;

        // Wall collisions
        if (box.x < 20 || box.x + box.width > canvas.width - 20) box.vx *= -1;
        if (box.y < 40 || box.y + box.height > canvas.height - 20) box.vy *= -1;

        // Draw Bounding box frame
        ctx.strokeStyle = box.color;
        ctx.lineWidth = 2;
        ctx.strokeRect(box.x, box.y, box.width, box.height);

        // Draw center pivot tracker dot & tracking tail line
        ctx.fillStyle = box.color;
        ctx.beginPath();
        ctx.arc(box.x + box.width / 2, box.y + box.height, 4, 0, Math.PI * 2);
        ctx.fill();
      });

      frameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(frameId);
  }, [activeCam]);

  // In Memory database reset request callback to API
  const handleResetData = async () => {
    setIsResetting(true);
    setIsReadyToSimulate(false);
    try {
      eventIdxRef.current = 0;
      
      // Force UI state to clean zero values immediately
      setMetrics({
        today_unique_visitors: 0,
        today_total_visitors: 0,
        today_guests: 0,
        today_repeat_customers: 0,
        conversion_rate: 0,
        avg_dwell_per_zone: {
          SKINCARE: 0,
          HAIRCARE: 0,
          MAKEUP: 0,
          BILLING: 0
        },
        queue_depth: 0,
        abandonment_rate: 0,
        total_transactions: 0,
        total_sales_inr: 0
      });
      setLiveEvents([]);
      setTotalLiveEvents(0);

      const res = await fetch("/api/events/reset", { method: "POST" });
      if (res.ok) {
        await fetchDashboardData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsResetting(false);
      setIsReadyToSimulate(true);
    }
  };

  // VLM Simulated file dropping handler
  const handleVideoUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadedFile) return;

    setIsUploading(true);
    setVlmMessage("Initializing VLM Network & preparing upload stream...");

    try {
      const CHUNK_SIZE = 500 * 1024; // 500KB chunks
      const totalChunks = Math.ceil(uploadedFile.size / CHUNK_SIZE);
      const uploadId = "vlm_" + Date.now() + "_" + Math.floor(Math.random() * 1000) + ".mp4";

      for (let i = 0; i < totalChunks; i++) {
        setVlmMessage(`Streaming video chunk ${i + 1} of ${totalChunks}...`);
        const chunk = uploadedFile.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
        const chunkBase64 = await new Promise<string>((resolve, reject) => {
          const r = new FileReader();
          r.onload = (e) => resolve((e.target?.result as string).split(',')[1] || "");
          r.onerror = reject;
          r.readAsDataURL(chunk);
        });

        const res = await fetch("/api/gemini/upload-chunk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ uploadId, chunkIndex: i, totalChunks, chunkBase64 })
        });
        
        if (!res.ok) throw new Error("Failed to upload chunk " + i);
      }

      setVlmMessage("Transmitting to Gemini VLM. Mapping densities & extracting events...");

      const res = await fetch("/api/gemini/analyze-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoName: uploadedFile.name,
          uploadId: uploadId,
          mimeType: uploadedFile.type || "video/mp4"
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          if (data.events.length === 0) {
            setVlmMessage(`ANALYSIS SUCCESS: Analyzed "${uploadedFile.name}". No people detected - 0 events ingested.`);
          } else {
            setVlmMessage(`ANALYSIS SUCCESS: Ingested ${data.events.length} CV-Events from file "${uploadedFile.name}" directly into API!`);
          }
          setVlmIngestedEvents(data.events);
          fetchDashboardData();
        } else {
          setVlmMessage(`ANALYSIS FAILED: ${data.message || data.error || "Unknown error occurred during processing."}`);
          setVlmIngestedEvents([]);
        }
      } else {
        setVlmMessage(`ANALYSIS FAILED: The server responded with status ${res.status}. ${res.status === 413 ? 'Video file is too large.' : ''}`);
      }
    } catch (err: any) {
      setVlmMessage("Connection error with VLM host: " + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  // Safe decimal & pct converters
  const formatPct = (rate: number) => Math.round(rate * 100);

  // Search filtered transactions
  const filteredPOS = POS_TRANSACTIONS.filter((tx) => {
    const q = searchPOS.toLowerCase();
    return (
      tx.customer_name.toLowerCase().includes(q) ||
      tx.order_id.includes(q) ||
      tx.product_name.toLowerCase().includes(q) ||
      tx.brand_name.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans relative overflow-x-hidden">
      {/* Ambient background mesh blur pattern / glass orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/5 rounded-full blur-[120px] pointer-events-none z-0"></div>
      <div className="absolute bottom-[-5%] right-[-5%] w-[450px] h-[450px] bg-sky-600/5 rounded-full blur-[110px] pointer-events-none z-0"></div>
      <div className="absolute top-[35%] left-[25%] w-[350px] h-[350px] bg-pink-600/5 rounded-full blur-[100px] pointer-events-none z-0"></div>

      {/* Header and Store Selector Section */}
      <header className="border-b border-indigo-100 bg-white/80 backdrop-blur-xl sticky top-0 z-50 px-6 py-4 flex items-center justify-between relative shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-100 p-2.5 rounded-xl border border-indigo-200 text-indigo-600">
            <Activity id="logo-icon" className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-display font-bold tracking-tight text-slate-900 flex items-center gap-2">
              APEX STORE INTELLIGENCE 
            </h1>
            <p className="text-xs text-slate-500">Computer Vision CCTV Analytics Pipeline & Event Stream</p>
          </div>
        </div>

        {/* Current Active parameters & Global controls */}
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-slate-100 backdrop-blur-md rounded-xl p-1 border border-slate-200 gap-2 px-3 py-1.5 font-mono text-[11px] animate-fadeIn text-slate-800 pointer-events-none">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>REST API Tester:</span>
            <button
              onClick={() => setActiveTab(activeTab === "swagger" ? "overview" : "swagger")}
              className={`px-2.5 py-1 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-all font-sans text-[11px] font-bold flex items-center gap-1 cursor-pointer pointer-events-auto ${
                activeTab === "swagger" ? "bg-indigo-600 text-white border-indigo-700 hover:bg-indigo-700 hover:text-white" : ""
              }`}
            >
              {activeTab === "swagger" ? <ArrowLeft className="w-3 h-3 shrink-0" /> : <Sparkles className="w-3 h-3 shrink-0" />}
              <span>{activeTab === "swagger" ? "Back to Dashboard" : "Open"}</span>
            </button>
          </div>


          <button
            onClick={handleResetData}
            disabled={isResetting}
            title="Reset DB to Initial Seed"
            className="p-2 bg-slate-100 backdrop-blur-md rounded-xl border border-slate-200 hover:bg-slate-200 text-slate-600 hover:text-slate-900 disabled:opacity-50 transition-all cursor-pointer shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${isResetting ? "animate-spin text-emerald-500" : ""}`} />
          </button>
        </div>
      </header>

      {/* Main Operations Terminal Grid */}
      <main className="p-6 max-w-[1700px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10 items-stretch">
        {/* LEFT COLUMN (Active CCTV Feeds & Event Streams) -- Span 6 (50% Grid width) */}
        <div className={activeTab === "swagger" ? "hidden" : "lg:col-span-6 flex flex-col h-full"}>
          
          {/* Section: Live Event catalog stream terminal */}
          <div className="backdrop-blur-md bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] flex flex-col h-full flex-grow">
            <div className="flex justify-between items-center text-sm">
              <h2 className="font-display font-semibold text-slate-900 tracking-tight flex items-center gap-2">
                <Activity className="w-4 h-4 text-indigo-300 animate-pulse" /> Pipeline Event Ledger
              </h2>
              <div className="flex flex-col items-end gap-1 font-mono">
                <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">Total Processed: {totalLiveEvents > 0 ? Math.floor(totalLiveEvents / 3) : 0} Seq.</span>
              </div>
            </div>

            {/* Running logs feed */}
            <div className="bg-slate-100 backdrop-blur-sm rounded-xl p-3 border border-slate-200 flex-grow min-h-[300px] h-0 overflow-y-auto font-mono text-[11px] space-y-2">
              {liveEvents.length === 0 ? (
                <div className="text-slate-500 italic text-center pt-24">Waiting for pipeline signals...</div>
              ) : (
                liveEvents.map((evt, idx) => (
                  <div
                    key={evt.event_id || idx}
                    className="p-2 rounded bg-white border-l-2 border-slate-200 hover:bg-slate-100 transition-all flex items-start justify-between text-slate-500"
                    style={{
                      borderLeftColor:
                        evt.event_type === EventType.ENTRY
                           ? "#10b981"
                           : evt.event_type === EventType.EXIT
                           ? "#ef4444"
                           : evt.event_type === EventType.BILLING_QUEUE_JOIN
                           ? "#eab308"
                           : "#6366f1"
                    }}
                  >
                    <div>
                      <span className="text-slate-500">[{evt.timestamp.substring(11, 19)}]</span>{" "}
                      <span className="text-slate-900 font-medium">{evt.visitor_id}</span>{" "}
                      <span
                        className={
                          evt.is_staff
                            ? "text-red-400 bg-red-500/10 px-1 rounded text-[9px]"
                            : "text-slate-600"
                        }
                      >
                        {evt.event_type}
                      </span>{" "}
                      {evt.zone_id && (
                        <span>
                          in <span className="text-indigo-300 font-semibold">{evt.zone_id}</span>
                        </span>
                      )}
                      {evt.dwell_ms > 0 && (
                        <span className="text-slate-500 font-normal">
                          {" "}
                          ({Math.round(evt.dwell_ms / 1000)}s)
                        </span>
                      )}
                    </div>
                    <span className="text-slate-500 text-[9px]">Conf: {evt.confidence}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (Metrics dashboard display & navigation tabs) -- Span 6 (50% Grid width) */}
        <div className={activeTab === "swagger" ? "lg:col-span-12 flex flex-col h-full space-y-6" : "lg:col-span-6 flex flex-col h-full space-y-4"}>
          
          <div className="flex items-center justify-center w-full px-2 mb-2">
            <div className="text-xs sm:text-sm font-semibold text-slate-550 font-mono tracking-wide bg-slate-50/60 px-5 py-2.5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-3">
              <Database strokeWidth={2} className="w-5 h-5 text-emerald-500" />
              <span>Metrics Data Source:</span>
              <span className="font-bold text-slate-700 bg-white px-3 py-1 rounded-xl border border-slate-200 shadow-sm">
                Brigade_Bangalore_10_April_26_bc6219c.xlsx
              </span>
            </div>
          </div>

          {/* Navigation layout tabs */}
          {activeTab !== "swagger" && (
          <div className="flex bg-white backdrop-blur-md border border-slate-200 p-1 rounded-2xl gap-1 shadow-lg overflow-x-auto scrollbar-none">
            <button
              onClick={() => setActiveTab("overview")}
              className={`flex-1 min-w-0 py-3 px-1 rounded-xl font-display text-[11px] sm:text-xs md:text-sm font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === "overview"
                  ? "bg-slate-100 text-slate-900 border border-slate-300 shadow-xl"
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <Activity className="w-4 h-4 text-emerald-500 shrink-0" /> <span className="truncate">Metrics Stats</span>
            </button>
            <button
              onClick={() => setActiveTab("funnel")}
              className={`flex-1 min-w-0 py-3 px-1 rounded-xl font-display text-[11px] sm:text-xs md:text-sm font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === "funnel"
                  ? "bg-slate-100 text-slate-900 border border-slate-300 shadow-xl"
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <Users className="w-4 h-4 text-indigo-500 shrink-0" /> <span className="truncate">Conversion</span>
            </button>
            <button
              onClick={() => setActiveTab("heatmap")}
              className={`flex-1 min-w-0 py-3 px-1 rounded-xl font-display text-[11px] sm:text-xs md:text-sm font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === "heatmap"
                  ? "bg-slate-100 text-slate-900 border border-slate-300 shadow-xl"
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <Map className="w-4 h-4 text-pink-500 shrink-0" /> <span className="truncate">Store Heatmap</span>
            </button>
            <button
              onClick={() => setActiveTab("pos")}
              className={`flex-1 min-w-0 py-3 px-1 rounded-xl font-display text-[11px] sm:text-xs md:text-sm font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === "pos"
                  ? "bg-slate-100 text-slate-900 border border-slate-300 shadow-xl"
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <ShoppingBag className="w-4 h-4 text-amber-500 pointer-events-none shrink-0" /> <span className="truncate">POS Transactions</span>
            </button>
            <button
              onClick={() => setActiveTab("documents")}
              className={`flex-1 min-w-0 py-3 px-1 rounded-xl font-display text-[11px] sm:text-xs md:text-sm font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === "documents"
                  ? "bg-slate-100 text-slate-900 border border-slate-300 shadow-xl"
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <BookOpen className="w-4 h-4 text-teal-500 shrink-0" /> <span className="truncate">Build Docs</span>
            </button>
          </div>
          )}

          {/* ACTIVE CONTENT VIEW - OVERVIEW METRICS TAB */}
          {activeTab === "overview" && (
            <div className="space-y-6 flex-grow flex flex-col h-full">
              
              {/* Dynamic Overview Metrics Row */}
              <div className="flex flex-wrap gap-4">
                
                {/* Visual Card: Total Visits */}
                <div className="flex-1 min-w-[160px] backdrop-blur-md bg-white border border-slate-200 shadow-[0_8px_32px_0_rgba(0,0,0,0.2)] rounded-2xl p-5 hover:bg-slate-200/[0.06] hover:border-slate-300 transition-all flex items-center justify-between text-left">
                  <div>
                    <span className="text-xs text-slate-600 font-semibold block">Total Visits</span>
                    <span className="text-3xl font-display font-bold text-slate-900 block mt-1">
                      {metrics.today_total_visitors || 0}
                    </span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl text-slate-600 shadow-[0_0_15px_rgba(0,0,0,0.05)] border border-slate-200">
                    <Users className="w-6 h-6" />
                  </div>
                </div>

                {/* Visual Card: Unique Customers */}
                <div className="flex-1 min-w-[160px] backdrop-blur-md bg-white border border-slate-200 shadow-[0_8px_32px_0_rgba(0,0,0,0.2)] rounded-2xl p-5 hover:bg-slate-200/[0.06] hover:border-slate-300 transition-all flex items-center justify-between text-left">
                  <div>
                    <span className="text-xs text-slate-600 font-semibold block">Unique Customers</span>
                    <span className="text-3xl font-display font-bold text-slate-900 block mt-1">
                      {metrics.today_unique_visitors || 0}
                    </span>
                  </div>
                  <div className="bg-violet-50 p-3 rounded-xl text-violet-600 shadow-[0_0_15px_rgba(139,92,246,0.15)] border border-violet-200">
                    <Users className="w-6 h-6" />
                  </div>
                </div>

                {/* Visual Card: Repeat Visits */}
                <div className="flex-1 min-w-[160px] backdrop-blur-md bg-white border border-slate-200 shadow-[0_8px_32px_0_rgba(0,0,0,0.2)] rounded-2xl p-5 hover:bg-slate-200/[0.06] hover:border-slate-300 transition-all flex items-center justify-between text-left">
                  <div>
                    <span className="text-xs text-slate-600 font-semibold block">Returning Customers</span>
                    <span className="text-3xl font-display font-bold text-slate-900 block mt-1">
                      {metrics.today_repeat_customers || 0}
                    </span>
                  </div>
                  <div className="bg-blue-50 p-3 rounded-xl text-blue-600 shadow-[0_0_15px_rgba(59,130,246,0.15)] border border-blue-200">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                </div>

                {/* Visual Card: Conversion Rate */}
                <div className="flex-1 min-w-[160px] backdrop-blur-md bg-white border border-slate-200 shadow-[0_8px_32px_0_rgba(0,0,0,0.2)] rounded-2xl p-5 hover:bg-slate-200/[0.06] hover:border-slate-300 transition-all flex items-center justify-between text-left">
                  <div>
                    <span className="text-xs text-slate-600 font-semibold block">Conversion Rate</span>
                    <span className="text-3xl font-display font-bold text-indigo-600 block mt-1">
                      {formatPct(metrics.conversion_rate || 0)}%
                    </span>
                  </div>
                  <div className="bg-indigo-50 p-3 rounded-xl text-indigo-600 shadow-[0_0_15px_rgba(99,102,241,0.15)] border border-indigo-200">
                    <Sparkles className="w-6 h-6" />
                  </div>
                </div>

                {/* Visual Card: Queue Size */}
                <div className="flex-1 min-w-[160px] backdrop-blur-md bg-white border border-slate-200 shadow-[0_8px_32px_0_rgba(0,0,0,0.2)] rounded-2xl p-5 hover:bg-slate-200/[0.06] hover:border-slate-300 transition-all flex items-center justify-between text-left">
                  <div>
                    <span className="text-xs text-slate-600 font-semibold block">Billing Queue</span>
                    <span className={`text-3xl font-display font-bold block mt-1 ${metrics.queue_depth > 4 ? "text-amber-600" : "text-amber-500"}`}>
                      {metrics.queue_depth || 0} <span className="text-xs font-normal text-slate-500">waiting</span>
                    </span>
                  </div>
                  <div className="bg-amber-50 p-3 rounded-xl text-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.15)] border border-amber-200">
                    <Clock className="w-6 h-6" />
                  </div>
                </div>

                {/* Visual Card: Sales Revenue */}
                <div className="flex-1 min-w-[160px] backdrop-blur-md bg-white border border-slate-200 shadow-[0_8px_32px_0_rgba(0,0,0,0.2)] rounded-2xl p-5 hover:bg-slate-200/[0.06] hover:border-slate-300 transition-all flex items-center justify-between text-left">
                  <div>
                    <span className="text-xs text-slate-600 font-semibold block">Revenue (INR)</span>
                    <span className="text-3xl font-display font-bold text-slate-900 block mt-1">
                      ₹{metrics.total_sales_inr?.toLocaleString() || "0"}
                    </span>
                    <span className="text-[10px] text-slate-500 mt-1 block">{metrics.total_transactions || 0} Receipts</span>
                  </div>
                  <div className="bg-emerald-50 p-3 rounded-xl text-emerald-600 shadow-[0_0_15px_rgba(16,185,129,0.15)] border border-emerald-200">
                    <DollarSign className="w-6 h-6" />
                  </div>
                </div>
              </div>

              {/* Active System Anomalies & Alert logs */}
              {anomalies.length > 0 && (
                <div className="backdrop-blur-md bg-amber-500/5 border border-amber-500/20 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center gap-2 text-amber-350 text-sm font-semibold">
                    <AlertTriangle className="w-4 h-4 animate-bounce" />
                    <span>Real-time Operational Anomalies Detected ({anomalies.length})</span>
                  </div>
                  <div className="space-y-3">
                    {anomalies.map((anom) => (
                      <div
                        key={anom.id}
                        className="p-3.5 bg-slate-100 rounded-xl border border-slate-200 flex gap-3 text-xs backdrop-blur-sm"
                      >
                        <div className="mt-0.5">
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono leading-none ${
                            anom.severity === "CRITICAL"
                              ? "bg-red-500/20 text-red-350"
                              : "bg-amber-500/20 text-amber-350"
                          }`}>
                            {anom.severity}
                          </span>
                        </div>
                        <div className="space-y-1">
                          <div className="font-semibold text-slate-900">{anom.type}</div>
                          <p className="text-slate-600 leading-relaxed">{anom.description}</p>
                          <div className="text-emerald-300 font-mono text-[11px] pt-1">
                            ✔ Recommended: {anom.suggested_action}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}


            </div>
          )}

          {/* ACTIVE CONTENT VIEW - CONVERSION FUNNEL TAB */}
          {activeTab === "funnel" && (
            <div className="backdrop-blur-md bg-white border border-slate-200 rounded-2xl p-6 space-y-6 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] flex-grow flex flex-col h-full">
              <div>
                <h3 className="font-display font-semibold text-slate-900 tracking-tight flex items-center gap-2">
                  Sequential Funnel Leakage
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  Session-based sequential drop-off rates across layout stages. Excludes staff. Re-entries deduplicated.
                </p>
              </div>

              {/* Graphic SVG custom vertical funnel stair diagram */}
              <div className="space-y-4">
                {funnel.stages && funnel.stages.length > 0 ? (
                  funnel.stages.map((stage, idx) => {
                    const maxVal = funnel.stages[0]?.count || 1;
                    const fillPct = (stage.count / maxVal) * 100;

                    return (
                      <div key={stage.stage} className="space-y-1">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-slate-900 flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-slate-100 text-indigo-300 flex items-center justify-center font-mono text-[10px] border border-slate-200">
                              {idx + 1}
                            </span>
                            {stage.stage}
                          </span>
                          <span className="text-slate-600">
                            {stage.count} {stage.count === 1 ? "visitor" : "visitors"}{" "}
                            {idx > 0 && (
                              <span className="text-rose-400 font-mono font-medium ml-1">
                                (Lost {stage.dropoff_pct}%)
                              </span>
                            )}
                          </span>
                        </div>

                        {/* Staggered progress bar bar representing funnel */}
                        <div className="h-6 bg-slate-100 rounded-lg overflow-hidden border border-slate-200 flex items-center pr-3">
                          <div
                            className="bg-indigo-500/20 h-full border-r border-indigo-500/40 relative flex items-center pl-3 animate-pulse"
                            style={{ width: `${fillPct}%` }}
                          >
                            <span className="text-[10px] font-mono leading-none text-indigo-200">
                              {Math.round(fillPct)}% scale
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-slate-500 italic text-center py-20">Loading funnel data...</div>
                )}
              </div>

              <div className="p-4 bg-slate-100 backdrop-blur-sm border border-slate-200 rounded-xl text-xs space-y-1">
                <span className="font-semibold text-slate-900 block">✔ Store Optimization insights:</span>
                <p className="text-slate-600 leading-relaxed">
                  The primary funnel leakage occurs between the **Zone Visit** and the **Billing Queue** stages (dropoff-pct of customers vacate display rows without queuing at POS).
                </p>
              </div>
            </div>
          )}

          {/* ACTIVE CONTENT VIEW - STORE MAP & HEATMAP TAB */}
          {activeTab === "heatmap" && (
            <div className="backdrop-blur-md bg-white border border-slate-200 rounded-2xl p-6 space-y-6 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] flex-grow flex flex-col h-full">
              <div>
                <h3 className="font-display font-semibold text-slate-900 tracking-tight flex items-center gap-2">
                  Layout Traffic Heatmap & Floorplan Analysis
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  Floor space layout mapped with customer browsing density and relative store performance.
                </p>
              </div>

              {/* Interactive Premium Metrics List display */}
              <div className="space-y-3.5 mt-4">
                {heatmap.zones && heatmap.zones.length > 0 ? (
                  heatmap.zones.map((zone) => {
                    // Custom characteristics for each zone to render perfect customized styles
                    const layoutConfig = {
                      MAKEUP: {
                        emoji: "💄",
                        name: "Cosmetic Lounge",
                        desc: "High-exposure beauty lanes & tester rows",
                        textColor: "text-violet-750",
                        barColor: "bg-violet-600",
                        scoreBg: "bg-violet-50 text-violet-750 border-violet-200"
                      },
                      SKINCARE: {
                        emoji: "🌸",
                        name: "Skincare Sanctuary",
                        desc: "Hydration aisles & premium cream testing counters",
                        textColor: "text-pink-700",
                        barColor: "bg-pink-500",
                        scoreBg: "bg-pink-50 text-pink-700 border-pink-200"
                      },
                      HAIRCARE: {
                        emoji: "💈",
                        name: "Haircare Wellness",
                        desc: "Treatment display racks & scalp oils",
                        textColor: "text-amber-700",
                        barColor: "bg-amber-500",
                        scoreBg: "bg-amber-50 text-amber-800 border-amber-200"
                      },
                      BILLING: {
                        emoji: "🏦",
                        name: "Cashier Terminal Point",
                        desc: "High-throughput POS registers & checkout queues",
                        textColor: "text-emerald-700",
                        barColor: "bg-emerald-500",
                        scoreBg: "bg-emerald-50 text-emerald-700 border-emerald-200"
                      }
                    }[zone.zone_id as "MAKEUP" | "SKINCARE" | "HAIRCARE" | "BILLING"] || {
                      emoji: "📍",
                      name: "General Zone",
                      desc: "General walkthrough corridors & common spaces",
                      textColor: "text-indigo-700",
                      barColor: "bg-indigo-500",
                      scoreBg: "bg-indigo-50 text-indigo-700 border-indigo-200"
                    };

                    const isHovered = hoveredZoneId === zone.zone_id;

                    return (
                      <div
                        key={zone.zone_id}
                        onMouseEnter={() => setHoveredZoneId(zone.zone_id)}
                        onMouseLeave={() => setHoveredZoneId(null)}
                        className={`p-4 rounded-xl border transition-all duration-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 cursor-default ${
                          isHovered
                            ? "bg-slate-100/90 border-slate-400 shadow-md translate-x-1"
                            : "bg-slate-50/75 border-slate-200 hover:bg-slate-100/60"
                        }`}
                      >
                        {/* Zone Meta (Emoji, friendly name, ID as custom dark pill badge) */}
                        <div className="flex items-start gap-3 flex-1">
                          <span className="text-xl p-2.5 bg-white rounded-lg shadow-sm border border-slate-200/80 select-none flex-shrink-0">
                            {layoutConfig.emoji}
                          </span>
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="font-sans font-bold text-slate-900 tracking-tight text-sm">
                                {layoutConfig.name}
                              </h4>
                              <span className="text-[9px] font-mono font-bold bg-slate-900 text-slate-100 border border-slate-800 px-2 py-0.5 rounded tracking-wide uppercase">
                                {zone.zone_id}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-1 italic font-sans">
                              {layoutConfig.desc}
                            </p>
                          </div>
                        </div>

                        {/* Telemetry metrics comparison */}
                        <div className="flex items-center gap-4 sm:gap-6 self-stretch sm:self-auto justify-between sm:justify-end border-t sm:border-t-0 border-slate-200/50 pt-3 sm:pt-0">
                          {/* Visit code count */}
                          <div className="text-left sm:text-right">
                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block font-sans">Visits Code</span>
                            <span className="text-xs font-mono font-bold text-slate-900">
                              {zone.visit_frequency} sessions
                            </span>
                          </div>

                          {/* Average browse times */}
                          <div className="text-left sm:text-right">
                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block font-sans">Avg Dwell</span>
                            <span className="text-xs font-mono font-bold text-slate-900">
                              {zone.avg_dwell_sec}s
                            </span>
                          </div>

                          {/* Efficiency Normal score badge */}
                          <div className="text-right min-w-[75px]">
                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block font-sans">Score Index</span>
                            <span className={`text-[11px] font-bold font-mono inline-block px-2 py-0.5 rounded border ${layoutConfig.scoreBg}`}>
                              {zone.normalised_score}% index
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-slate-500 italic py-16 text-center">Loading heat metrics...</div>
                )}
              </div>
            </div>
          )}

          {/* ACTIVE CONTENT VIEW - POS TRANSACTION LISTS */}
          {activeTab === "pos" && (
            <div className="backdrop-blur-md bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] flex-grow flex flex-col h-full">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-display font-semibold text-slate-900 tracking-tight flex items-center gap-2">
                    Preloaded checkout receipts database
                  </h3>
                  <p className="text-xs text-slate-600 mt-1">
                    Receipt database for Store ST1008 (Brigade, Bangalore) on April 10, 2026.
                  </p>
                </div>
                <div className="relative w-48">
                  <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-500" />
                  <input
                    type="text"
                    value={searchPOS}
                    onChange={(e) => setSearchPOS(e.target.value)}
                    placeholder="Search brand/buyer..."
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-100 border border-slate-200 text-xs rounded-xl text-slate-900 outline-none focus:border-slate-300 transition-all font-mono"
                  />
                </div>
              </div>

              {/* Transactions grid list */}
              <div className="max-h-[360px] overflow-y-auto space-y-3 pr-2 text-xs">
                {filteredPOS.map((tx) => (
                  <div
                    key={tx.order_id}
                    className="p-3 bg-slate-100 backdrop-blur-sm rounded-xl border border-slate-200 flex justify-between items-center hover:bg-slate-50 hover:border-slate-300 transition-all text-left"
                  >
                    <div>
                      <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                        <span>{tx.customer_name}</span>
                        <span className="text-[10px] bg-slate-100 text-indigo-300 px-1.5 py-0.5 rounded border border-slate-200 font-mono">
                          ID: {tx.order_id}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-600 mt-1">{tx.product_name}</div>
                      <div className="text-[10px] text-slate-500 mt-1 font-mono">
                        Time: {tx.order_time} | salesperson: {tx.brand_name}
                      </div>
                    </div>
                    <div className="font-bold text-slate-900 text-right">
                      <div>₹{tx.total_amount}</div>
                      <div className="text-[10px] text-emerald-400 font-mono mt-1 font-semibold">Paid</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}



          {/* ACTIVE CONTENT VIEW - TECHNICAL BUILD DOCUMENTATION TAB */}
          {activeTab === "documents" && (
            <div className="backdrop-blur-md bg-white border border-slate-200 rounded-2xl p-6 space-y-6 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] flex-grow flex flex-col h-full">
              
              {/* Docs selector header buttons */}
              <div className="flex border-b border-slate-200 pb-3 gap-2 flex-wrap">
                <button
                  onClick={() => setSelectedDoc("design")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                    selectedDoc === "design"
                      ? "bg-slate-200 text-slate-900 border border-slate-200 shadow-md"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  DESIGN.md
                </button>
                <button
                  onClick={() => setSelectedDoc("choices")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                    selectedDoc === "choices"
                      ? "bg-slate-200 text-slate-900 border border-slate-200 shadow-md"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  CHOICES.md
                </button>
                <button
                  onClick={() => setSelectedDoc("readme")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                    selectedDoc === "readme"
                      ? "bg-slate-200 text-slate-900 border border-slate-200 shadow-md"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  README.md
                </button>
              </div>

              {/* Doc Markdown content renderer */}
              <div className="bg-slate-100 backdrop-blur-sm rounded-xl p-5 border border-slate-200 h-[400px] overflow-y-auto space-y-4 text-left font-sans prose  max-w-none text-xs leading-relaxed text-slate-800">
                <div style={{ whiteSpace: "pre-wrap" }}>{docContent}</div>
              </div>
            </div>
          )}

          {/* ACTIVE CONTENT VIEW - INTERACTIVE SWAGGER & REST API TESTER */}
          {activeTab === "swagger" && (
            <div className="backdrop-blur-md bg-white border border-slate-200 rounded-2xl p-6 space-y-6 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] text-left animate-fadeIn">
              <div>
                <div className="flex justify-between items-center flex-wrap gap-2">
                  <div>
                    <h3 className="font-display font-semibold text-slate-900 tracking-tight flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-indigo-400" /> Intelligence API Swagger Tester
                    </h3>
                    <p className="text-xs text-slate-600 mt-1">
                      Query, ingest, and audit every single Live REST endpoint running on the backend container.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setResponseStatus(null);
                      setResponseBody("");
                    }}
                    className="px-3 py-1 bg-slate-100 hover:bg-slate-100 border border-slate-200 rounded-lg text-[10px] font-mono text-slate-600 cursor-pointer transition-all"
                  >
                    Clear Console
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* Left Sidebar: Endpoints Selectors */}
                <div className="lg:col-span-4 space-y-2">
                  <div className="text-[10px] uppercase font-mono text-slate-500 font-bold tracking-wider mb-2 block">
                    Endpoints Spectrum
                  </div>

                  {/* POST Ingest events */}
                  <button
                    onClick={() => {
                      setSelectedEndpoint("POST /api/events/ingest");
                      setResponseStatus(null);
                      setResponseBody("");
                    }}
                    className={`w-full p-3 rounded-xl border text-left transition-all cursor-pointer block ${
                      selectedEndpoint === "POST /api/events/ingest"
                        ? "bg-emerald-500/10 border-emerald-500/30 text-white shadow"
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-500 text-white">
                        POST
                      </span>
                      <span className="font-mono text-xs font-semibold text-slate-800">/events/ingest</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1 lines-clamp-2 leading-snug">
                      Ingest batches of up to 500 events. Validates, deduplicates, and stores securely.
                    </p>
                  </button>

                  {/* GET store metrics */}
                  <button
                    onClick={() => {
                      setSelectedEndpoint("GET /api/stores/STORE_BLR_002/metrics");
                      setResponseStatus(null);
                      setResponseBody("");
                    }}
                    className={`w-full p-3 rounded-xl border text-left transition-all cursor-pointer block ${
                      selectedEndpoint === "GET /api/stores/STORE_BLR_002/metrics"
                        ? "bg-blue-500/10 border-blue-500/30 text-slate-900 shadow"
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-blue-500 text-slate-900">
                        GET
                      </span>
                      <span className="font-mono text-xs font-semibold text-slate-800">/stores/:id/metrics</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1 lines-clamp-2 leading-snug">
                      Live store stats: unique visitors, conversion rate, avg dwells, queue size. Excludes staff.
                    </p>
                  </button>

                  {/* GET store funnel */}
                  <button
                    onClick={() => {
                      setSelectedEndpoint("GET /api/stores/STORE_BLR_002/funnel");
                      setResponseStatus(null);
                      setResponseBody("");
                    }}
                    className={`w-full p-3 rounded-xl border text-left transition-all cursor-pointer block ${
                      selectedEndpoint === "GET /api/stores/STORE_BLR_002/funnel"
                        ? "bg-blue-500/10 border-blue-500/30 text-slate-900 shadow"
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-blue-500 text-slate-900">
                        GET
                      </span>
                      <span className="font-mono text-xs font-semibold text-slate-800">/stores/:id/funnel</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1 lines-clamp-2 leading-snug">
                      Conversion funnel: Entry → Zone → Billing Queue → Purchase stage counts.
                    </p>
                  </button>

                  {/* GET store heatmap */}
                  <button
                    onClick={() => {
                      setSelectedEndpoint("GET /api/stores/STORE_BLR_002/heatmap");
                      setResponseStatus(null);
                      setResponseBody("");
                    }}
                    className={`w-full p-3 rounded-xl border text-left transition-all cursor-pointer block ${
                      selectedEndpoint === "GET /api/stores/STORE_BLR_002/heatmap"
                        ? "bg-blue-500/10 border-blue-500/30 text-slate-900 shadow"
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-blue-500 text-slate-900">
                        GET
                      </span>
                      <span className="font-mono text-xs font-semibold text-slate-800">/stores/:id/heatmap</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1 lines-clamp-2 leading-snug">
                      Zone visits freq & avg dwells normalised 0-100 with data confidence flags.
                    </p>
                  </button>

                  {/* GET store anomalies */}
                  <button
                    onClick={() => {
                      setSelectedEndpoint("GET /api/stores/STORE_BLR_002/anomalies");
                      setResponseStatus(null);
                      setResponseBody("");
                    }}
                    className={`w-full p-3 rounded-xl border text-left transition-all cursor-pointer block ${
                      selectedEndpoint === "GET /api/stores/STORE_BLR_002/anomalies"
                        ? "bg-blue-500/10 border-blue-500/30 text-slate-900 shadow"
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-blue-500 text-slate-900">
                        GET
                      </span>
                      <span className="font-mono text-xs font-semibold text-slate-800">/stores/:id/anomalies</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1 lines-clamp-2 leading-snug">
                      Active operational alerts: queue spikes, low conv drop, or dead zones.
                    </p>
                  </button>

                  {/* GET health status */}
                  <button
                    onClick={() => {
                      setSelectedEndpoint("GET /api/health");
                      setResponseStatus(null);
                      setResponseBody("");
                    }}
                    className={`w-full p-3 rounded-xl border text-left transition-all cursor-pointer block ${
                      selectedEndpoint === "GET /api/health"
                        ? "bg-blue-500/10 border-blue-500/30 text-slate-900 shadow"
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-blue-500 text-slate-900">
                        GET
                      </span>
                      <span className="font-mono text-xs font-semibold text-slate-800">/health</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1 lines-clamp-2 leading-snug">
                      On-call checks. Returns server up state, last timestamp, and stale feed alerts.
                    </p>
                  </button>
                </div>

                {/* Right: Request & Response Console */}
                <div className="lg:col-span-8 flex flex-col gap-4">
                  
                  {/* Active Endpoint Info Header */}
                  <div className="p-4 bg-slate-100 border border-slate-200 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-mono font-bold text-slate-500 tracking-wide">
                        Endpoint Details
                      </span>
                      <span className="text-[10px] font-mono text-indigo-300">
                        Host: http://localhost:3000
                      </span>
                    </div>

                    <div className="flex gap-2 items-center">
                      <span className={`px-2 py-1 rounded text-xs font-mono font-bold ${
                        selectedEndpoint.startsWith("POST") ? "bg-emerald-500 text-white" : "bg-blue-500 text-slate-900"
                      }`}>
                        {selectedEndpoint.split(" ")[0]}
                      </span>
                      <input
                        type="text"
                        readOnly
                        value={selectedEndpoint.split(" ")[1]}
                        className="flex-1 bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-mono text-slate-800 focus:outline-none"
                      />
                      <button
                        onClick={executeSwaggerRequest}
                        disabled={isRequestLoading}
                        className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-550 text-white text-xs font-semibold rounded-lg shadow cursor-pointer transition-all disabled:opacity-50"
                      >
                        {isRequestLoading ? "Executing..." : "Execute Test"}
                      </button>
                    </div>

                    {/* Logic and Rubrics checklist regarding the active endpoint */}
                    <div className="text-[11px] text-slate-600 bg-white p-3 rounded-lg border border-slate-200 space-y-1">
                      <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                        <Info className="w-3.5 h-3.5 text-indigo-300 shrink-0" />
                        <span>Core Compliance Rule Checks:</span>
                      </div>
                      <p className="text-slate-500 leading-relaxed text-[10.5px]">
                        {selectedEndpoint.includes("ingest") && "✔ Accepts batches of up to 500 events. Unique event_id check keeps it idempotent. Reentry tracks preserve distinct customer counters."}
                        {selectedEndpoint.includes("metrics") && "✔ Computes metrics dynamically in real-time. Excludes staff members (is_staff: true) from unique visitors and dwell computations."}
                        {selectedEndpoint.includes("funnel") && "✔ Session is the analytical unit. Handles multiple zone transitions cleanly. Re-entries never generate false double counts."}
                        {selectedEndpoint.includes("heatmap") && "✔ Formats spatial scores scaled between 0-100. Emits standard data_confidence_flag based on session counts."}
                        {selectedEndpoint.includes("anomalies") && "✔ Detects operational alerts: conversion drops, queue bottlenecks, or dead displays with severity severity tags."}
                        {selectedEndpoint.includes("health") && "✔ Standard heartbeat checking feed lag. Triggers STALE_FEED alerts if state contains zero events for > 10 mins."}
                      </p>
                    </div>
                  </div>

                  {/* Body Selector when POST */}
                  {selectedEndpoint.startsWith("POST") && (
                    <div className="space-y-1.5 flex-1 flex flex-col min-h-[160px]">
                      <div className="flex justify-between items-center text-[10px] font-mono text-slate-500">
                        <span>REQUEST BODY (JSON ARRAY)</span>
                        <button
                          onClick={() => setRequestPayload(JSON.stringify([
                            {
                              "event_id": "evt-ingest-tst-" + Math.floor(Math.random() * 900000 + 100000),
                              "store_id": "STORE_BLR_002",
                              "camera_id": "CAM_ENTRY_01",
                              "visitor_id": "VIS_c8a2f1",
                              "event_type": "ZONE_DWELL",
                              "timestamp": new Date().toISOString(),
                              "zone_id": "SKINCARE",
                              "dwell_ms": 8400,
                              "is_staff": false,
                              "confidence": 0.91,
                              "metadata": {
                                "queue_depth": null,
                                "sku_zone": "MOISTURISER",
                                "session_seq": 5
                              }
                            }
                          ], null, 2))}
                          className="text-xs text-indigo-300 hover:text-indigo-200 cursor-pointer"
                        >
                          Generate New Event Payload
                        </button>
                      </div>
                      <textarea
                        value={requestPayload}
                        onChange={(e) => setRequestPayload(e.target.value)}
                        className="w-full flex-1 min-h-[180px] p-3 bg-slate-100 border border-slate-200 rounded-xl font-mono text-[11px] text-slate-800 focus:outline-none focus:border-indigo-500/40"
                      />
                    </div>
                  )}

                  {/* Response Console Box */}
                  <div className="space-y-1.5 flex-1 flex flex-col min-h-[220px]">
                    <div className="flex justify-between items-center text-[10px] font-mono text-slate-500">
                      <span>RESPONSE CONSOLE</span>
                      {responseStatus !== null && (
                        <div className="flex items-center gap-2">
                          <span>Status:</span>
                          <span className={`px-1.5 py-0.5 rounded font-mono font-bold ${
                            responseStatus >= 200 && responseStatus < 300
                              ? "bg-emerald-500/20 text-emerald-400"
                              : "bg-red-500/20 text-red-400"
                          }`}>
                            {responseStatus} {responseStatus === 200 ? "OK" : responseStatus === 500 ? "Error" : "Bad Request"}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 bg-slate-50 border border-slate-200 shadow-inner rounded-xl p-4 font-mono text-[11px] overflow-y-auto max-h-[300px]">
                      {isRequestLoading ? (
                        <div className="text-slate-500 italic animate-pulse flex items-center justify-center h-full gap-2">
                          <Clock className="w-4 h-4 animate-spin text-indigo-400" />
                          <span>Initiating REST request to server backend...</span>
                        </div>
                      ) : responseBody ? (
                        <pre className="text-slate-800 text-left whitespace-pre-wrap">{responseBody}</pre>
                      ) : (
                        <div className="text-slate-400 italic flex items-center justify-center py-10">
                          Waiting for API Execution... click "Execute Test" above to query endpoint.
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              </div>
            </div>
          )}
        </div>

        {/* PERSISTENT EQUAL-HEIGHT VLM PARSER & ANALYSIS ROW */}
        {activeTab !== "swagger" && (
          <div className="lg:col-span-12 grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch mt-6">
            
            {/* VLM Video analysis sandbox Card */}
            <div className="backdrop-blur-md bg-white border border-slate-200 rounded-2xl p-6 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] flex flex-col justify-between h-full">
              <div className="space-y-4 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-display font-semibold text-slate-900 tracking-tight flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-600 animate-pulse" /> Pipeline sandbox: VLM Video Parser
                  </h3>
                  <p className="text-xs text-slate-600 mt-1">
                    Upload an MP4 clip to trigger server-side classification and ingest the results instantly based on camera feeds.
                  </p>
                </div>

                <form onSubmit={handleVideoUpload} className="space-y-4 flex-grow flex flex-col justify-between">
                  <div 
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const file = e.dataTransfer.files?.[0];
                      if (file) {
                        setUploadedFile(file);
                        setVideoPreviewUrl(URL.createObjectURL(file));
                      }
                    }}
                    className="border border-dashed border-slate-300 rounded-2xl p-5 bg-slate-50 hover:bg-slate-100/80 transition-all flex flex-col items-center justify-center gap-3 text-slate-600 relative flex-grow min-h-[170px]"
                  >
                    {videoPreviewUrl ? (
                      <div className="w-full space-y-3 text-left">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono text-slate-700 flex items-center gap-1.5 uppercase tracking-wider font-bold">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            FEED: {uploadedFile?.name}
                          </span>
                          <span className="text-[9px] text-slate-500 font-mono bg-white px-2 py-0.5 rounded border border-slate-200 shadow-sm font-bold">
                            {((uploadedFile?.size ?? 0) / (1024 * 1024)).toFixed(1)} MB
                          </span>
                        </div>
                        <div className="relative aspect-video rounded-lg overflow-hidden border border-slate-200 bg-slate-100 group shadow-inner">
                          <video
                            src={videoPreviewUrl}
                            controls
                            autoPlay
                            loop
                            muted
                            playsInline
                            className="w-full h-full object-contain"
                          />
                          <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-white/80 backdrop-blur text-[8px] font-mono text-slate-800 rounded border border-slate-200 pointer-events-none font-bold shadow-sm">
                            FEED DECODER ACTIVE
                          </div>
                          <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-emerald-600 text-white backdrop-blur text-[9px] font-mono rounded border border-emerald-500/20 pointer-events-none animate-pulse font-bold shadow-sm">
                            ● READY FOR ANALYSIS
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-indigo-400 animate-pulse" />
                        <div className="text-xs text-center font-medium text-slate-600">
                          <span>Drag & drop MP4 camera clips here, or browse files</span>
                        </div>
                      </>
                    )}
                    <input
                      type="file"
                      accept="video/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setUploadedFile(file);
                          setVideoPreviewUrl(URL.createObjectURL(file));
                        }
                      }}
                      className="hidden"
                      id="video-selector"
                    />
                    {!uploadedFile && (
                      <label
                        htmlFor="video-selector"
                        className="px-4 py-1.5 bg-white hover:bg-slate-50 text-slate-800 font-semibold rounded-xl text-xs mt-1 cursor-pointer border border-slate-200 shadow-sm transition-all"
                      >
                        Browse Clips
                      </label>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={!uploadedFile || isUploading}
                      className="flex-1 px-4 py-2 bg-[#2563eb] hover:bg-[#1d4ed8] text-white shadow-md text-xs font-semibold cursor-pointer disabled:opacity-50 transition-all rounded-xl"
                    >
                      {isUploading ? "VLM Processing..." : "Execute VLM Classifier"}
                    </button>
                    {uploadedFile && (
                      <button
                        type="button"
                        onClick={() => {
                          setUploadedFile(null);
                          setVideoPreviewUrl(null);
                          setVlmMessage("");
                          setVlmIngestedEvents([]);
                        }}
                        className="px-3 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-205 rounded-xl text-xs font-semibold text-slate-800 transition-all cursor-pointer"
                      >
                        Reset File
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </div>

            {/* Video Analysis Result/Progress Card (Equal Height) */}
            <div className="backdrop-blur-md bg-white border border-slate-200 rounded-2xl p-6 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] text-left flex flex-col justify-between h-full">
              <div className="space-y-5 flex-grow flex flex-col justify-between">
                <div>
                  <h3 className="font-display font-semibold text-slate-900 tracking-tight flex items-center gap-2">
                    <Video className="w-5 h-5 text-indigo-500 animate-pulse" /> Video Analysis
                  </h3>
                  <p className="text-xs text-slate-600 mt-1">
                    Ingested CCTV parameters and live stream event mapping produced by Gemini 2.5 Flash VLM.
                  </p>
                </div>

                <div className="flex-grow flex flex-col justify-center my-2 min-h-[300px]">
                  {vlmIngestedEvents.length > 0 ? (
                    <div className="space-y-4 animate-fadeIn w-full">
                      {vlmMessage && (
                        <div className="p-3 bg-slate-900 border border-slate-800 text-emerald-400 font-mono text-xs rounded-xl flex items-center gap-2.5 shadow-sm">
                          <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></span>
                          <span><strong>VLM Status:</strong> {vlmMessage}</span>
                        </div>
                      )}

                      {/* Analysis exact counts summary */}
                      <div className="border border-slate-200 bg-slate-50/50 rounded-xl p-4 space-y-3">
                        <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <h4 className="font-sans font-bold text-slate-900 text-xs">VLM Ingestion Analytics</h4>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px] font-mono font-bold text-slate-900">
                          <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
                            <span className="text-slate-500 uppercase text-[8px] tracking-wider font-sans mb-1">Total Events</span>
                            <span className="text-slate-900 text-base font-black">{vlmIngestedEvents.length}</span>
                          </div>
                          <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
                            <span className="text-slate-500 uppercase text-[8px] tracking-wider font-sans mb-1">Unique Visitors</span>
                            <span className="text-slate-900 text-base font-black">{new Set(vlmIngestedEvents.map(e => e.visitor_id)).size}</span>
                          </div>
                          <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
                            <span className="text-slate-500 uppercase text-[8px] tracking-wider font-sans mb-1">Staff Detected</span>
                            <span className="text-slate-900 text-base font-black">{vlmIngestedEvents.filter((e: any) => e.is_staff).length}</span>
                          </div>
                          <div className="p-3 bg-white rounded-lg border border-slate-201 shadow-sm flex flex-col items-center justify-center text-center">
                            <span className="text-slate-500 uppercase text-[8px] tracking-wider font-sans mb-1">Avg Confidence</span>
                            <span className="text-slate-900 text-base font-black">{(vlmIngestedEvents.reduce((acc: number, e: any) => acc + (e.confidence || 0), 0) / vlmIngestedEvents.length * 100).toFixed(0)}%</span>
                          </div>
                        </div>
                      </div>

                      {/* Detail event lists mapped from VLM */}
                      <div className="space-y-2">
                        <div className="text-[10px] text-slate-500 uppercase tracking-widest font-sans font-bold">Mapped CV Events Ingested:</div>
                        <div className="max-h-[160px] overflow-y-auto space-y-1.5 pr-1 text-[11px] font-mono">
                          {vlmIngestedEvents.map((evt: any, idx: number) => (
                            <div key={idx} className="p-2.5 border border-slate-200 bg-slate-50 hover:bg-slate-100/50 rounded-lg flex items-center justify-between text-slate-800 transition-all font-bold">
                              <div className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse"></span>
                                <span className="font-black text-slate-900">{evt.visitor_id}</span>
                                <span>{evt.event_type}</span>
                                {evt.zone_id && (
                                  <span>in <strong className="text-indigo-600">{evt.zone_id}</strong></span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-slate-500 text-[10px]">
                                {evt.dwell_ms ? <span className="bg-white px-2 py-0.5 rounded border border-slate-200">Dwell: {Math.round(evt.dwell_ms / 1000)}s</span> : null}
                                <span className="bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 rounded text-[9px]">Conf: {evt.confidence}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : vlmMessage || isUploading ? (
                    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between shadow-lg animate-fadeIn text-left w-full h-full flex-grow min-h-[280px]">
                      <div className="space-y-3.5">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                          <span className="text-[10px] text-emerald-400 font-bold tracking-wider uppercase font-mono flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                            VLM Pipe Stream Log
                          </span>
                          <span className="text-[9px] bg-slate-900 text-emerald-500 font-mono px-2 py-0.5 rounded border border-slate-800 font-semibold">
                            SYS_VLM_1.0_LIVE
                          </span>
                        </div>

                        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/50 text-slate-100 font-bold font-mono text-xs break-words leading-relaxed shadow-inner">
                          <div className="text-[9px] text-slate-500 uppercase tracking-widest font-sans mb-1.5 font-bold flex items-center gap-1.5">
                            <Activity className="w-3.5 h-3.5 text-emerald-500 animate-spin" />
                            Active Stream Buffer:
                          </div>
                          <span className="text-emerald-300">{vlmMessage || "Preparing and aligning media packets..."}</span>
                        </div>
                      </div>

                      <div className="text-[10px] font-mono text-slate-550 text-center mt-4 pt-2 border-t border-slate-800/45">
                        Chunked media streaming buffers securely transmit telemetry logs directly.
                      </div>
                    </div>
                  ) : (
                    <div className="bg-slate-50 border border-slate-205 rounded-2xl p-8 text-center shadow-inner flex-grow flex flex-col items-center justify-center min-h-[280px] w-full">
                      <div className="max-w-sm mx-auto space-y-2.5">
                        <Video strokeWidth={1.5} className="w-8 h-8 text-slate-350 mx-auto animate-pulse" />
                        <p className="text-xs text-slate-500 italic leading-relaxed">
                          No video stream active. Drag & drop or upload an MP4 clip in the "Pipeline sandbox: VLM Video Parser" panel on the left, then click "Execute VLM Classifier" to begin.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="text-[10px] font-mono text-slate-400 text-center pt-3 border-t border-slate-200/50">
                  VLM pipelines are powered by Gemini Multi-modal streaming classifiers securely.
                </div>
              </div>
            </div>

          </div>
        )}
      </main>
    </div>
  );
}
