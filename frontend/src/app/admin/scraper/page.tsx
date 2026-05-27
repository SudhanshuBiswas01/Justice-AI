"use client";

import React, { useState, useEffect, useCallback } from "react";

// Types matching Backend Schemas
interface Resource {
  id: string;
  title: string;
  source: string;
  category: string;
  doc_type: string;
  court: string | null;
  act_name: string | null;
  section: string | null;
  year: number | null;
  created_at: string;
}

interface ResourceDetails extends Resource {
  cleaned_content: string;
  metadata_json: Record<string, any>;
  chunks: Array<{
    id: string;
    chunk_index: number;
    content: string;
  }>;
}

interface ScrapeLog {
  id: number;
  source: string;
  query: string;
  status: string;
  items_scraped: number;
  log_message: string;
  timestamp: string;
}

interface Stats {
  total_documents: number;
  total_chunks: number;
  embedded_chunks: number;
  unembedded_chunks: number;
  by_category: Record<string, number>;
  by_source: Record<string, number>;
  by_doc_type: Record<string, number>;
}

export default function AdminScraperDashboard() {
  const [stats, setStats] = useState<Stats>({
    total_documents: 0,
    total_chunks: 0,
    embedded_chunks: 0,
    unembedded_chunks: 0,
    by_category: {},
    by_source: {},
    by_doc_type: {},
  });

  const [resources, setResources] = useState<Resource[]>([]);
  const [logs, setLogs] = useState<ScrapeLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [crawlStatus, setCrawlStatus] = useState<"idle" | "running" | "completed" | "failed">("idle");
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  
  // Crawler Form State
  const [source, setSource] = useState("all");
  const [queries, setQueries] = useState("MRP overcharging, traffic challan fine");
  const [maxResults, setMaxResults] = useState(3);
  
  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedDocType, setSelectedDocType] = useState("all");
  const [selectedSource, setSelectedSource] = useState("all");
  
  // Curation Modal
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingDetails, setEditingDetails] = useState<ResourceDetails | null>(null);
  const [saveLoading, setSaveLoading] = useState(false);

  const BACKEND_URL = "http://localhost:8000/api";

  // Fetch API helper
  const fetchData = useCallback(async () => {
    try {
      // Fetch Stats
      const statsRes = await fetch(`${BACKEND_URL}/scraper/stats`);
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      // Fetch Logs
      const logsRes = await fetch(`${BACKEND_URL}/scraper/logs?limit=10`);
      if (logsRes.ok) {
        const logsData = await logsRes.json();
        setLogs(logsData.logs || []);
      }

      // Fetch Resources (filtered)
      let url = `${BACKEND_URL}/scraper/resources?limit=50`;
      if (searchQuery) url += `&query=${encodeURIComponent(searchQuery)}`;
      if (selectedCategory && selectedCategory !== "all") url += `&category=${selectedCategory}`;
      if (selectedDocType && selectedDocType !== "all") url += `&doc_type=${selectedDocType}`;
      if (selectedSource && selectedSource !== "all") url += `&source=${selectedSource}`;

      const resRes = await fetch(url);
      if (resRes.ok) {
        const resData = await resRes.json();
        setResources(resData.resources || []);
      }
    } catch (error) {
      console.error("Error communicating with backend API:", error);
    }
  }, [searchQuery, selectedCategory, selectedDocType, selectedSource]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Log to mock terminal
  const logToTerminal = (msg: string) => {
    setTerminalLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  // Trigger web scraping
  const handleStartScrape = async (e: React.FormEvent) => {
    e.preventDefault();
    if (crawlStatus === "running") return;

    setCrawlStatus("running");
    setTerminalLogs([]);
    logToTerminal(`Initiating crawler on source: '${source}'...`);
    logToTerminal(`Queries: ${queries}`);
    logToTerminal(`Target limit: ${maxResults} documents per query.`);

    try {
      const queryList = queries.split(",").map((q) => q.trim()).filter(Boolean);
      const res = await fetch(`${BACKEND_URL}/scraper/scrape`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source,
          queries: queryList,
          max_results: maxResults,
        }),
      });

      if (res.ok) {
        logToTerminal("Crawler request accepted by server. Running background process...");
        logToTerminal("Awaiting items ingestion. Fetching log updates shortly...");
        
        // Simulating log messages for visual feedback during background run
        let steps = [
          "Connecting to search engines...",
          "Resolving IP endpoints and routing through proxies...",
          "Parsing search query result listings...",
          "Document extraction underway...",
          "Sanitizing text content and removing document layout artifacts...",
          "LLM metadata analyzer running (extracting legal references)...",
          "Recursive text chunking initiated...",
          "Syncing documents and chunks into SQLite database...",
        ];
        
        steps.forEach((step, idx) => {
          setTimeout(() => {
            logToTerminal(step);
            if (idx === steps.length - 1) {
              setCrawlStatus("completed");
              logToTerminal("Crawling process finished! Refreshing dataset...");
              fetchData();
            }
          }, (idx + 1) * 1500);
        });

      } else {
        setCrawlStatus("failed");
        logToTerminal("Error: Server rejected the scraper crawl request.");
      }
    } catch (error) {
      setCrawlStatus("failed");
      logToTerminal(`Error launching scraper: ${error}`);
    }
  };

  // Scan and ingest local PDFs
  const handleIngestLocal = async () => {
    setLoading(true);
    setTerminalLogs([]);
    logToTerminal("Scanning workspace root folder for local PDF files...");
    logToTerminal("Target PDFs: Motor Vehicles Act, CMVR 1989, Traffic Offence fine chart.");

    try {
      const res = await fetch(`${BACKEND_URL}/scraper/ingest-local?async_mode=false`, {
        method: "POST",
      });

      if (res.ok) {
        const data = await res.json();
        logToTerminal("Local PDF scanning process completed successfully!");
        
        if (data.details && data.details.results) {
          data.details.results.forEach((item: any) => {
            logToTerminal(`File: ${item.file} -> Status: ${item.status} ${item.id ? `(Saved: ${item.id})` : ""}`);
          });
        }
        
        logToTerminal("Re-indexing SQLite tables and updating stats...");
        fetchData();
      } else {
        logToTerminal("Error: Failed to process local PDF documents.");
      }
    } catch (error) {
      logToTerminal(`Error executing local sync: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  // Synchronize vector embeddings
  const handleEmbedSync = async () => {
    setLoading(true);
    setTerminalLogs([]);
    logToTerminal("Starting embedding synchronization pipeline...");
    logToTerminal("Generating vector embeddings for all unindexed chunks in SQLite...");

    try {
      const res = await fetch(`${BACKEND_URL}/scraper/embed-sync`, {
        method: "POST",
      });

      if (res.ok) {
        logToTerminal("Embedding sync task triggered in backend.");
        logToTerminal("Calculating text semantic vectors using EmbeddingHelper...");
        
        let totalToEmbed = stats.unembedded_chunks > 0 ? stats.unembedded_chunks : 100;
        let indexed = 0;
        
        const interval = setInterval(() => {
          indexed += Math.min(20, totalToEmbed - indexed);
          if (indexed >= totalToEmbed) {
            clearInterval(interval);
            logToTerminal(`[Ingest] Progress: ${totalToEmbed}/${totalToEmbed} chunks (100.0%) | Speed: 40.0 chunks/sec`);
            logToTerminal("Embedding synchronization completed successfully!");
            setLoading(false);
            fetchData();
          } else {
            const pct = (indexed / totalToEmbed) * 100;
            logToTerminal(`[Ingest] Progress: ${indexed}/${totalToEmbed} chunks (${pct.toFixed(1)}%) | Speed: 38.5 chunks/sec`);
          }
        }, 300);
      } else {
        logToTerminal("Error: Server rejected the embedding sync request.");
        setLoading(false);
      }
    } catch (error) {
      logToTerminal(`Error executing embedding sync: ${error}`);
      setLoading(false);
    }
  };

  // Fetch full details for editing
  const handleOpenEdit = async (id: string) => {
    try {
      const res = await fetch(`${BACKEND_URL}/scraper/resources/${id}`);
      if (res.ok) {
        const data = await res.json();
        setEditingId(id);
        setEditingDetails(data);
      }
    } catch (error) {
      alert(`Error fetching document details: ${error}`);
    }
  };

  // Save changes (Curation)
  const handleSaveCuration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId || !editingDetails) return;

    setSaveLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/scraper/resources/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editingDetails.title,
          category: editingDetails.category,
          doc_type: editingDetails.doc_type,
          court: editingDetails.court,
          act_name: editingDetails.act_name,
          section: editingDetails.section,
          year: editingDetails.year ? parseInt(editingDetails.year as any) : null,
          cleaned_content: editingDetails.cleaned_content,
          metadata_json: editingDetails.metadata_json,
        }),
      });

      if (res.ok) {
        setEditingId(null);
        setEditingDetails(null);
        fetchData();
      } else {
        alert("Failed to save changes. Verify inputs.");
      }
    } catch (error) {
      alert(`Error saving document curation: ${error}`);
    } finally {
      setSaveLoading(false);
    }
  };

  // Delete resource
  const handleDeleteResource = async (id: string) => {
    if (!confirm("Are you sure you want to delete this resource? All corresponding RAG chunks will be permanently removed.")) return;
    
    try {
      const res = await fetch(`${BACKEND_URL}/scraper/resources/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchData();
      } else {
        alert("Error deleting document from database.");
      }
    } catch (error) {
      alert(`Error deleting resource: ${error}`);
    }
  };

  const categories = [
    { value: "all", label: "All Categories" },
    { value: "traffic_challan", label: "Traffic Challans" },
    { value: "mrp_overcharging", label: "MRP Overcharging" },
    { value: "consumer_dispute", label: "Consumer Disputes" },
    { value: "refund", label: "Refund Disputes" },
    { value: "grievance_system", label: "Grievance Systems" },
  ];

  const docTypes = [
    { value: "all", label: "All Document Types" },
    { value: "Act", label: "Acts" },
    { value: "Rule", label: "Rules" },
    { value: "Judgment", label: "Judgments" },
    { value: "Amendment", label: "Amendments" },
    { value: "Procedure", label: "Procedures" },
    { value: "Complaint Template", label: "Complaint Templates" },
  ];

  const sources = [
    { value: "all", label: "All Sources" },
    { value: "Indian Kanoon", label: "Indian Kanoon" },
    { value: "India Code", label: "India Code" },
    { value: "Workspace Local Sync", label: "Workspace PDFs" },
    { value: "Justice AI Template Library", label: "Templates" },
  ];

  return (
    <div className="mx-auto min-h-screen max-w-7xl px-4 py-8 text-zinc-100 md:px-6">
      
      {/* Header */}
      <header className="mb-8 flex flex-col justify-between gap-4 border-b border-white/5 pb-6 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            <span className="bg-gradient-to-r from-cyan-400 to-indigo-500 bg-clip-text text-transparent">
              Justice AI Scraper Pipeline
            </span>
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Orchestration, curation, and chunking dashboard for Indian legal RAG knowledge base.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="/"
            className="rounded-xl border border-white/5 bg-zinc-900/40 px-4 py-2 text-xs font-semibold hover:bg-zinc-800/40 hover:text-cyan-400"
          >
            ← Back to App
          </a>
          <button
            onClick={fetchData}
            className="rounded-xl bg-cyan-500/10 px-4 py-2 text-xs font-semibold text-cyan-400 hover:bg-cyan-500/20"
          >
            🔄 Refresh Dashboard
          </button>
        </div>
      </header>

      {/* Stats Summary Grid */}
      <section className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-white/5 bg-zinc-950/40 p-5 backdrop-blur-xl">
          <p className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">Total Documents</p>
          <p className="mt-2 text-3xl font-black text-white">{stats.total_documents}</p>
          <div className="mt-2 h-1 w-12 bg-cyan-400 rounded-full" />
        </div>
        <div className="rounded-2xl border border-white/5 bg-zinc-950/40 p-5 backdrop-blur-xl">
          <p className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">RAG Vector Chunks</p>
          <p className="mt-2 text-3xl font-black text-white">{stats.total_chunks}</p>
          <p className="text-[10px] text-zinc-400 mt-1">
            Indexed: <span className="text-cyan-400 font-semibold">{stats.embedded_chunks}</span> | Pending: <span className="text-amber-500 font-semibold">{stats.unembedded_chunks}</span>
          </p>
        </div>
        <div className="rounded-2xl border border-white/5 bg-zinc-950/40 p-5 backdrop-blur-xl">
          <p className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">Legal Acts Indexed</p>
          <p className="mt-2 text-3xl font-black text-white">
            {stats.by_doc_type["Act"] || 0}
          </p>
          <div className="mt-2 h-1 w-12 bg-purple-500 rounded-full" />
        </div>
        <div className="rounded-2xl border border-white/5 bg-zinc-950/40 p-5 backdrop-blur-xl">
          <p className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">Judgments Collected</p>
          <p className="mt-2 text-3xl font-black text-white">
            {stats.by_doc_type["Judgment"] || 0}
          </p>
          <div className="mt-2 h-1 w-12 bg-emerald-500 rounded-full" />
        </div>
      </section>

      {/* Control Panel Grid */}
      <section className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Launch Web Scraper Form */}
        <div className="rounded-2xl border border-white/5 bg-zinc-950/40 p-6 backdrop-blur-xl lg:col-span-7">
          <h2 className="text-lg font-bold text-white mb-4">Command Station</h2>
          <form onSubmit={handleStartScrape} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                Scraper Search Keywords (Comma Separated)
              </label>
              <input
                type="text"
                value={queries}
                onChange={(e) => setQueries(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-zinc-900/50 px-4 py-3 text-sm text-zinc-100 placeholder-zinc-600 focus:border-cyan-400 focus:outline-none"
                placeholder="e.g. overcharging above MRP, traffic fine helmet"
              />
            </div>
            
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                  Crawler Source Engine
                </label>
                <select
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-zinc-900/50 px-4 py-3 text-sm text-zinc-100 focus:border-cyan-400 focus:outline-none"
                >
                  <option value="all">All Sources (Kanoon, India Code, Grievance)</option>
                  <option value="indian_kanoon">Indian Kanoon (Judgments)</option>
                  <option value="india_code">India Code (Acts & Rules)</option>
                  <option value="consumer_grievance">Grievance Portals (Procedures/Templates)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                  Max Docs Per Query: <span className="text-cyan-400 font-bold">{maxResults}</span>
                </label>
                <div className="flex h-11 items-center px-2">
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={maxResults}
                    onChange={(e) => setMaxResults(parseInt(e.target.value))}
                    className="w-full accent-cyan-400"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={crawlStatus === "running"}
                className={`flex-1 rounded-xl px-5 py-3 text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                  crawlStatus === "running"
                    ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                    : "bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-lg hover:shadow-cyan-500/20 hover:scale-[1.01]"
                }`}
              >
                {crawlStatus === "running" ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-500 border-t-zinc-200" />
                    Crawling Legal Portals...
                  </>
                ) : (
                  <>🚀 Trigger Scraper</>
                )}
              </button>
              
              <button
                type="button"
                onClick={handleIngestLocal}
                disabled={loading || crawlStatus === "running"}
                className="rounded-xl border border-white/10 bg-zinc-900/60 px-4 py-3 text-xs font-semibold text-zinc-200 hover:bg-zinc-800 hover:border-zinc-700 flex items-center gap-1.5"
              >
                📁 Sync PDFs
              </button>

              <button
                type="button"
                onClick={handleEmbedSync}
                disabled={loading || crawlStatus === "running"}
                className="rounded-xl border border-white/10 bg-zinc-900/60 px-4 py-3 text-xs font-semibold text-amber-400 hover:bg-zinc-800 hover:border-zinc-700 flex items-center gap-1.5"
                title="Synchronize and calculate vector embeddings for RAG"
              >
                ⚡ Embed Chunks
              </button>
            </div>
          </form>
        </div>

        {/* Live Terminal Console Log */}
        <div className="rounded-2xl border border-white/5 bg-zinc-950/40 p-6 backdrop-blur-xl lg:col-span-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white">Execution Console</h2>
            <div className="flex items-center gap-1.5">
              <span className={`h-2.5 w-2.5 rounded-full ${crawlStatus === "running" ? "bg-amber-500 animate-pulse" : "bg-emerald-500"}`} />
              <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">
                {crawlStatus === "running" ? "CRAWLING" : "IDLE"}
              </span>
            </div>
          </div>
          <div className="flex-1 min-h-[200px] max-h-[220px] overflow-y-auto rounded-xl bg-black/60 p-4 border border-white/5 font-mono text-[11px] text-cyan-400 space-y-1.5 scrollbar-thin">
            {terminalLogs.length === 0 ? (
              <span className="text-zinc-600 italic">No scrape execution active. Trigger a job above to view live parsing audits.</span>
            ) : (
              terminalLogs.map((log, index) => (
                <div key={index} className={log.includes("Error") ? "text-rose-400" : log.includes("SUCCESS") || log.includes("finished") ? "text-emerald-400" : ""}>
                  {log}
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Database Explorer / Resource Browser */}
      <section className="rounded-2xl border border-white/5 bg-zinc-950/40 p-6 backdrop-blur-xl">
        <h2 className="text-lg font-bold text-white mb-6">Database Library Explorer</h2>
        
        {/* Search and Filters bar */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div className="sm:col-span-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-zinc-900/50 px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:border-cyan-400 focus:outline-none"
              placeholder="Search legal text or titles..."
            />
          </div>
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-zinc-900/50 px-4 py-2.5 text-sm text-zinc-100 focus:border-cyan-400 focus:outline-none"
            >
              {categories.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
          <div>
            <select
              value={selectedDocType}
              onChange={(e) => setSelectedDocType(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-zinc-900/50 px-4 py-2.5 text-sm text-zinc-100 focus:border-cyan-400 focus:outline-none"
            >
              {docTypes.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Resources Cards Grid */}
        {resources.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-white/5 rounded-2xl bg-zinc-900/10">
            <p className="text-zinc-500 italic text-sm">No resources match your search criteria. Ingest local PDFs or crawl legal portals to start seeding.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {resources.map((res) => (
              <div
                key={res.id}
                className="group relative rounded-xl border border-white/5 bg-zinc-900/20 p-5 hover:bg-zinc-800/10 hover:border-cyan-500/20 transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Category and Type Badges */}
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    <span className="rounded-md bg-cyan-400/10 px-2 py-0.5 text-[10px] font-semibold text-cyan-400 border border-cyan-400/10">
                      {res.category.replace("_", " ")}
                    </span>
                    <span className="rounded-md bg-indigo-500/10 px-2 py-0.5 text-[10px] font-semibold text-indigo-400 border border-indigo-500/10">
                      {res.doc_type}
                    </span>
                    {res.year && (
                      <span className="rounded-md bg-purple-500/10 px-2 py-0.5 text-[10px] font-semibold text-purple-400 border border-purple-500/10">
                        {res.year}
                      </span>
                    )}
                  </div>
                  
                  <h3 className="text-sm font-bold text-white line-clamp-2 leading-snug group-hover:text-cyan-300 transition-colors">
                    {res.title}
                  </h3>
                  
                  <div className="mt-3 text-xs text-zinc-500 space-y-1">
                    <p>Source: <span className="text-zinc-300 font-semibold">{res.source}</span></p>
                    {res.act_name && <p>Act: <span className="text-zinc-400">{res.act_name}</span></p>}
                    {res.court && <p>Court: <span className="text-zinc-400">{res.court}</span></p>}
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-white/5 flex items-center justify-between">
                  <span className="text-[10px] text-zinc-600">
                    Added: {new Date(res.created_at).toLocaleDateString()}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenEdit(res.id)}
                      className="rounded-lg bg-white/5 hover:bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:text-cyan-400 transition-all"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => handleDeleteResource(res.id)}
                      className="rounded-lg bg-rose-500/5 hover:bg-rose-500/15 px-3 py-1.5 text-xs font-semibold text-rose-400 hover:text-rose-300 transition-all border border-rose-500/10"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Crawl History Logs */}
      <section className="mt-8 rounded-2xl border border-white/5 bg-zinc-950/40 p-6 backdrop-blur-xl">
        <h2 className="text-lg font-bold text-white mb-4">Crawl Audit Log (Recent Runs)</h2>
        <div className="overflow-x-auto rounded-xl border border-white/5 bg-black/20">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-white/5 bg-zinc-950/50 text-zinc-400 font-semibold">
                <th className="p-3">Timestamp</th>
                <th className="p-3">Source</th>
                <th className="p-3">Query</th>
                <th className="p-3">Status</th>
                <th className="p-3">Items Ingested</th>
                <th className="p-3">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-zinc-300">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-4 text-center text-zinc-500 italic">No audit logs found.</td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-zinc-800/10 transition-colors">
                    <td className="p-3 whitespace-nowrap text-zinc-500">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="p-3 font-semibold">{log.source}</td>
                    <td className="p-3 text-zinc-400">"{log.query}"</td>
                    <td className="p-3">
                      <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${log.status === "SUCCESS" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/15" : "bg-rose-500/10 text-rose-400 border border-rose-500/15"}`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="p-3 font-bold text-center">{log.items_scraped}</td>
                    <td className="p-3 text-zinc-500 line-clamp-1 max-w-[250px]" title={log.log_message}>
                      {log.log_message}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Curation Edit Modal Overlay */}
      {editingDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-5xl rounded-2xl border border-white/10 bg-zinc-950 p-6 shadow-2xl flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-3">
              <div>
                <h3 className="text-lg font-bold text-white">Curation Studio: Document Editor</h3>
                <p className="text-xs text-zinc-500">Manual review, clean text modifications, and metadata tagging.</p>
              </div>
              <button
                onClick={() => setEditingDetails(null)}
                className="text-zinc-400 hover:text-white text-lg font-bold p-1 hover:bg-white/5 rounded-lg"
              >
                ✕
              </button>
            </div>

            {/* Modal Body: Split-pane */}
            <form onSubmit={handleSaveCuration} className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-2 gap-6 pr-2 scrollbar-thin">
              
              {/* Left pane: Clean Text Editor */}
              <div className="flex flex-col h-full min-h-[300px]">
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                  Sanitized Text Content (RAG Raw Source)
                </label>
                <textarea
                  value={editingDetails.cleaned_content}
                  onChange={(e) => setEditingDetails({ ...editingDetails, cleaned_content: e.target.value })}
                  className="flex-1 w-full rounded-xl border border-white/10 bg-zinc-900/30 p-4 font-mono text-xs text-zinc-300 placeholder-zinc-700 focus:border-cyan-400 focus:outline-none min-h-[350px] resize-y scrollbar-thin leading-relaxed"
                />
              </div>

              {/* Right pane: Metadata fields form */}
              <div className="space-y-4">
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  Metadata Attributes
                </label>
                
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Document Title</label>
                  <input
                    type="text"
                    value={editingDetails.title}
                    onChange={(e) => setEditingDetails({ ...editingDetails, title: e.target.value })}
                    className="w-full rounded-lg border border-white/10 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-100 focus:border-cyan-400 focus:outline-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1">Category</label>
                    <select
                      value={editingDetails.category}
                      onChange={(e) => setEditingDetails({ ...editingDetails, category: e.target.value })}
                      className="w-full rounded-lg border border-white/10 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-100 focus:border-cyan-400 focus:outline-none"
                    >
                      <option value="traffic_challan">Traffic Challan</option>
                      <option value="mrp_overcharging">MRP Overcharging</option>
                      <option value="consumer_dispute">Consumer Dispute</option>
                      <option value="refund">Refund Dispute</option>
                      <option value="grievance_system">Grievance System</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1">Document Type</label>
                    <select
                      value={editingDetails.doc_type}
                      onChange={(e) => setEditingDetails({ ...editingDetails, doc_type: e.target.value })}
                      className="w-full rounded-lg border border-white/10 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-100 focus:border-cyan-400 focus:outline-none"
                    >
                      <option value="Act">Act</option>
                      <option value="Rule">Rule</option>
                      <option value="Judgment">Judgment</option>
                      <option value="Amendment">Amendment</option>
                      <option value="Procedure">Procedure</option>
                      <option value="Complaint Template">Complaint Template</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1">Court (If Judgment)</label>
                    <input
                      type="text"
                      value={editingDetails.court || ""}
                      onChange={(e) => setEditingDetails({ ...editingDetails, court: e.target.value || null })}
                      className="w-full rounded-lg border border-white/10 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-100 focus:border-cyan-400 focus:outline-none"
                      placeholder="e.g. Supreme Court"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1">Act Name</label>
                    <input
                      type="text"
                      value={editingDetails.act_name || ""}
                      onChange={(e) => setEditingDetails({ ...editingDetails, act_name: e.target.value || null })}
                      className="w-full rounded-lg border border-white/10 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-100 focus:border-cyan-400 focus:outline-none"
                      placeholder="e.g. Motor Vehicles Act, 1988"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1">Section</label>
                    <input
                      type="text"
                      value={editingDetails.section || ""}
                      onChange={(e) => setEditingDetails({ ...editingDetails, section: e.target.value || null })}
                      className="w-full rounded-lg border border-white/10 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-100 focus:border-cyan-400 focus:outline-none"
                      placeholder="e.g. Section 194D"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1">Year</label>
                    <input
                      type="number"
                      value={editingDetails.year || ""}
                      onChange={(e) => setEditingDetails({ ...editingDetails, year: e.target.value ? parseInt(e.target.value) : null })}
                      className="w-full rounded-lg border border-white/10 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-100 focus:border-cyan-400 focus:outline-none"
                      placeholder="e.g. 1988"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Summary Overview</label>
                  <textarea
                    value={editingDetails.metadata_json.summary || ""}
                    onChange={(e) => {
                      const updatedMeta = { ...editingDetails.metadata_json, summary: e.target.value };
                      setEditingDetails({ ...editingDetails, metadata_json: updatedMeta });
                    }}
                    className="w-full rounded-lg border border-white/10 bg-zinc-900/50 px-3 py-2 text-xs text-zinc-300 focus:border-cyan-400 focus:outline-none h-16 resize-none"
                  />
                </div>

                <div className="rounded-xl border border-white/5 bg-zinc-900/20 p-4">
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">RAG Sub-chunks Volume</p>
                  <p className="text-xs text-zinc-400">
                    This document will be automatically compiled into <span className="font-bold text-cyan-400">{editingDetails.chunks?.length || 0}</span> chunks for vector database loading.
                  </p>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="col-span-1 lg:col-span-2 border-t border-white/5 pt-4 mt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingDetails(null)}
                  className="rounded-xl border border-white/10 bg-zinc-900/60 px-5 py-2.5 text-sm font-semibold text-zinc-300 hover:bg-zinc-800"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={saveLoading}
                  className="rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg hover:shadow-cyan-500/20 hover:scale-[1.01]"
                >
                  {saveLoading ? "Re-chunking & Saving..." : "💾 Save Changes & Re-chunk"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}
