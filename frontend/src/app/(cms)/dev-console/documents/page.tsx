"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
  FileText, Upload, Database, Trash2, Link2, Globe, 
  CheckCircle2, AlertCircle, File, Calendar, Loader2, 
  Search, Filter, Zap, Layers, Cpu, Save, ShieldCheck,
  FileCode, Package, ChevronRight, BarChart3, Info, Plus
} from "lucide-react";
import api from "@/lib/api";
import { cn } from "@/lib/utils";

type TabType = "text" | "pdf" | "url" | "csv" | "zip";

interface KnowledgeDoc {
  id: number;
  title: string;
  file_path: string;
  content_type: string;
  category: string;
  prodi: string;
  year?: number;
  priority: string;
  chunk_count: number;
  uploaded_at: string;
  is_processed: number;
}

interface DBStats {
  total_docs: number;
  total_chunks: number;
  collection: string;
  embedding: string;
  reranking_active: boolean;
  metadata_filter_active: boolean;
}

const CATEGORIES = [
  "Peraturan Kampus", "Kalender Akademik", "FAQ Mahasiswa", 
  "Kurikulum", "Info Beasiswa", "Prosedur Skripsi", 
  "Info Dosen", "Kegiatan ORMAWA", "Layanan Kampus"
];

const PRODI_LIST = [
  "Semua prodi", "Teknik Informatika", "Sistem Informasi", 
  "Manajemen", "Hukum", "Kedokteran", "Teknik Sipil"
];

const PRIORITIES = ["low", "normal", "high"];

export default function DocumentsPage() {
  const [activeTab, setActiveTab] = useState<TabType>("text");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  
  // Form States
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [prodi, setProdi] = useState(PRODI_LIST[0]);
  const [year, setYear] = useState(new Date().getFullYear());
  const [priority, setPriority] = useState("normal");

  // List & Stats States
  const [documents, setDocuments] = useState<KnowledgeDoc[]>([]);
  const [stats, setStats] = useState<DBStats | null>(null);
  const [fetching, setFetching] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("Semua");

  // Settings States
  const [kbSettings, setKbSettings] = useState<{
    knowledge_categories: string[];
    knowledge_prodi: string[];
    knowledge_years: number[];
    knowledge_priorities: string[];
  } | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  const fetchDocsStatsAndSettings = async () => {
    try {
      const [docsRes, statsRes, settingsRes] = await Promise.all([
        api.get("/cms/documents"),
        api.get("/cms/documents/stats"),
        api.get("/cms/settings/knowledge-base")
      ]);
      setDocuments(docsRes.data);
      setStats(statsRes.data);
      setKbSettings(settingsRes.data);
      
      // Initialize dropdowns with first values if not already set
      if (settingsRes.data.knowledge_categories.length > 0) setCategory(settingsRes.data.knowledge_categories[0]);
      if (settingsRes.data.knowledge_prodi.length > 0) setProdi(settingsRes.data.knowledge_prodi[0]);
      if (settingsRes.data.knowledge_years.length > 0) setYear(settingsRes.data.knowledge_years[0]);
      if (settingsRes.data.knowledge_priorities.length > 0) setPriority(settingsRes.data.knowledge_priorities[0]);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchDocsStatsAndSettings();
  }, []);

  const resetForm = () => {
    setTitle("");
    setText("");
    setUrl("");
    setFile(null);
    setLoading(false);
  };

  const handleIngest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    try {
      let res;
      const finalProdi = prodi === "Semua prodi" ? "umum" : prodi;
      const metadata = { title, category, prodi: finalProdi, year, priority };

      if (activeTab === "text") {
        res = await api.post("/chat/ingest", { text, ...metadata });
      } else if (activeTab === "url") {
        res = await api.post(`/chat/ingest/url?url=${encodeURIComponent(url)}&category=${category}&prodi=${finalProdi}&year=${year}&priority=${priority}`);
      } else {
        const formData = new FormData();
        if (file) formData.append("file", file);
        formData.append("title", title || file?.name || "Untitled");
        formData.append("category", category);
        formData.append("prodi", finalProdi);
        formData.append("year", year.toString());
        formData.append("priority", priority);

        const endpoint = activeTab === "pdf" ? "/cms/documents/upload" : 
                         activeTab === "csv" ? "/cms/documents/upload/csv" : 
                         "/cms/documents/upload/bulk";
        
        res = await api.post(endpoint, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      setStatus({ type: "success", msg: `Berhasil! ${res.data.chunks || res.data.chunks_added} chunk ditambahkan.` });
      resetForm();
      fetchDocsStatsAndSettings();
    } catch (err: any) {
      setStatus({ type: "error", msg: err?.response?.data?.detail || "Gagal memproses data." });
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Hapus data ini dari memori AI?")) return;
    try {
      await api.delete(`/cms/documents/${id}`);
      fetchDocsStatsAndSettings();
    } catch (err) {
      alert("Gagal menghapus.");
    }
  };

  const filteredDocs = useMemo(() => {
    return documents.filter(doc => {
      const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          doc.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          doc.prodi.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesType = typeFilter === "Semua" || 
                         (typeFilter === "PDF" && doc.content_type === "pdf") ||
                         (typeFilter === "Teks" && doc.content_type === "text") ||
                         (typeFilter === "URL" && doc.content_type.startsWith("url")) ||
                         (typeFilter === "CSV" && doc.content_type === "csv");

      return matchesSearch && matchesType;
    });
  }, [documents, searchQuery, typeFilter]);

  const tabs = [
    { id: "text" as TabType, label: "Teks / FAQ", icon: FileText },
    { id: "pdf" as TabType, label: "Upload PDF", icon: Upload },
    { id: "url" as TabType, label: "Link / URL", icon: Globe },
    { id: "csv" as TabType, label: "CSV / Excel", icon: FileCode },
    { id: "zip" as TabType, label: "Bulk Import", icon: Package },
  ];

  return (
    <div className="space-y-10 pb-20 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl md:text-4xl font-black tracking-tight premium-gradient-text">Basis Pengetahuan</h1>
            <div className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-500 flex items-center gap-1">
              <Zap className="w-3 h-3 fill-emerald-500" /> RAG AKTIF
            </div>
          </div>
          <p className="text-zinc-400 font-medium">Latih otak AI Assistant dengan data institusi lu.</p>
        </div>
        <button
          onClick={() => setShowSettings(true)}
          className="flex items-center gap-2 px-6 py-4 rounded-2xl bg-white/[0.03] border border-white/5 text-xs font-bold text-zinc-400 hover:text-white hover:border-white/10 transition-all active:scale-95"
        >
          <Filter className="w-4 h-4" /> KELOLA LIST DROPDOWN
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* Main Workspace */}
        <div className="xl:col-span-8 space-y-8">
          {/* Tabs & Form Panel */}
          <div className="premium-glass !rounded-[2.5rem] overflow-hidden border-white/5">
            <div className="bg-white/[0.02] border-b border-white/5 p-2 flex flex-wrap gap-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id); setStatus(null); }}
                  className={cn(
                    "flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold transition-all",
                    activeTab === tab.id
                      ? "bg-indigo-600 text-white shadow-xl shadow-indigo-500/20"
                      : "text-zinc-500 hover:text-white hover:bg-white/5"
                  )}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>

            <form onSubmit={handleIngest} className="p-8 space-y-8">
              {/* Context Specific Inputs */}
              {activeTab === "text" && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1">KONTEN PENGETAHUAN</label>
                  <textarea
                    className="w-full h-48 bg-black/40 border border-white/10 rounded-3xl p-6 text-sm focus:outline-none focus:border-indigo-500/40 transition-all placeholder:text-zinc-800 resize-none"
                    placeholder="Tempel aturan kampus, FAQ, atau pengumuman di sini..."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    required
                  />
                </div>
              )}

              {activeTab === "url" && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1">URL SUMBER</label>
                  <div className="relative">
                    <Globe className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600" />
                    <input
                      type="url"
                      className="w-full bg-black/40 border border-white/10 rounded-2xl py-5 pl-16 pr-6 text-sm focus:outline-none focus:border-indigo-500/40"
                      placeholder="https://univ.ac.id/peraturan atau link YouTube..."
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      required
                    />
                  </div>
                </div>
              )}

              {(activeTab === "pdf" || activeTab === "csv" || activeTab === "zip") && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1">JUDUL DATA</label>
                    <input
                      type="text"
                      className="w-full bg-black/40 border border-white/10 rounded-2xl py-5 px-6 text-sm focus:outline-none"
                      placeholder="Contoh: Jadwal Kuliah Ganjil 2026"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1">FILE {activeTab.toUpperCase()}</label>
                    <label className="flex items-center gap-4 w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-6 text-sm cursor-pointer hover:bg-white/[0.03] transition-all">
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                        <Upload className="w-5 h-5 text-zinc-500" />
                      </div>
                      <span className="text-zinc-500 truncate">{file ? file.name : `Pilih file .${activeTab === 'csv' ? 'csv/.xlsx' : activeTab}`}</span>
                      <input type="file" className="hidden" accept={activeTab === 'pdf' ? '.pdf' : activeTab === 'csv' ? '.csv,.xlsx,.xls' : '.zip'} onChange={(e) => setFile(e.target.files?.[0] || null)} />
                    </label>
                  </div>
                </div>
              )}

              {/* Common Metadata Fields */}
              <div className="pt-6 border-t border-white/5 grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1">KATEGORI</label>
                  <select 
                    className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-5 text-sm focus:outline-none appearance-none cursor-pointer"
                    value={category} onChange={(e) => setCategory(e.target.value)}
                  >
                    {(kbSettings?.knowledge_categories || CATEGORIES).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1">PRODI / FAKULTAS</label>
                  <select 
                    className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-5 text-sm focus:outline-none appearance-none cursor-pointer"
                    value={prodi} onChange={(e) => setProdi(e.target.value)}
                  >
                    {(kbSettings?.knowledge_prodi || PRODI_LIST).map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1">TAHUN BERLAKU</label>
                  <select 
                    className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-5 text-sm focus:outline-none appearance-none"
                    value={year} onChange={(e) => setYear(parseInt(e.target.value))}
                  >
                    {(kbSettings?.knowledge_years || [2024, 2025, 2026]).map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1">PRIORITAS</label>
                  <select 
                    className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-5 text-sm focus:outline-none appearance-none"
                    value={priority} onChange={(e) => setPriority(e.target.value)}
                  >
                    {(kbSettings?.knowledge_priorities || PRIORITIES).map(p => <option key={p} value={p}>{p.toUpperCase()}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between gap-6">
                {status && (
                  <div className={cn(
                    "flex items-center gap-3 px-6 py-4 rounded-2xl text-xs font-bold border",
                    status.type === "success" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-red-500/10 border-red-500/20 text-red-400"
                  )}>
                    {status.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    {status.msg}
                  </div>
                )}
                <div />
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-10 py-5 rounded-2xl font-black text-sm transition-all flex items-center gap-3 shadow-2xl shadow-indigo-600/20 active:scale-95"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  SIMPAN KE MEMORI AI
                </button>
              </div>
            </form>
          </div>

          {/* List Panel */}
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h2 className="text-xl font-black tracking-tight flex items-center gap-3">
                <Layers className="w-5 h-5 text-indigo-500" />
                Daftar Sumber Pengetahuan
              </h2>
              <div className="flex items-center gap-3">
                <div className="relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-indigo-500 transition-colors" />
                  <input 
                    type="text" 
                    placeholder="Cari nama, kategori..."
                    className="bg-white/[0.02] border border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-xs focus:outline-none focus:border-white/10 w-64 transition-all"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="flex bg-white/[0.02] border border-white/5 rounded-xl p-1">
                  {["Semua", "PDF", "Teks", "URL", "CSV"].map(type => (
                    <button
                      key={type}
                      onClick={() => setTypeFilter(type)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-[10px] font-black transition-all",
                        typeFilter === type ? "bg-white/10 text-white" : "text-zinc-600 hover:text-zinc-400"
                      )}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {fetching ? (
                Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-28 rounded-3xl bg-white/[0.02] border border-white/5 animate-pulse" />)
              ) : filteredDocs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 rounded-[2.5rem] border border-dashed border-white/5 bg-white/[0.01]">
                  <Database className="w-16 h-16 text-zinc-900 mb-4" />
                  <p className="text-zinc-600 font-bold">Data tidak ditemukan.</p>
                </div>
              ) : (
                filteredDocs.map((doc) => (
                  <div key={doc.id} className="group premium-glass !rounded-[2rem] p-6 flex items-center justify-between gap-6 hover:border-white/10 transition-all border-white/5">
                    <div className="flex items-center gap-6">
                      <div className={cn(
                        "w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-inner",
                        doc.content_type === "pdf" ? "bg-red-500/10 text-red-500" :
                        doc.content_type.startsWith("url") ? "bg-blue-500/10 text-blue-500" :
                        doc.content_type === "csv" ? "bg-emerald-500/10 text-emerald-500" :
                        "bg-indigo-500/10 text-indigo-500"
                      )}>
                        {doc.content_type === "pdf" ? <FileText className="w-7 h-7" /> :
                         doc.content_type.startsWith("url") ? <Globe className="w-7 h-7" /> :
                         doc.content_type === "csv" ? <FileCode className="w-7 h-7" /> :
                         <FileText className="w-7 h-7" />}
                      </div>
                      <div className="space-y-1.5">
                        <h4 className="font-bold text-zinc-100 text-lg leading-tight group-hover:text-white transition-colors">{doc.title}</h4>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                          <div className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                            <Calendar className="w-3 h-3" /> {new Date(doc.uploaded_at).toLocaleDateString('id-ID')}
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-400 uppercase tracking-wider bg-white/5 px-2 py-0.5 rounded-lg">
                            {doc.category}
                          </div>
                          <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
                            {doc.prodi}
                          </div>
                          <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-500 uppercase tracking-wider">
                            <Cpu className="w-3 h-3" /> {doc.chunk_count} CHUNKS
                          </div>
                          {doc.priority === 'high' && (
                            <div className="px-2 py-0.5 rounded-lg bg-orange-500/10 text-orange-500 text-[10px] font-black uppercase">HIGH PRIORITY</div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => handleDelete(doc.id)}
                      className="p-4 rounded-2xl bg-white/[0.02] hover:bg-red-500/10 text-zinc-600 hover:text-red-500 transition-all border border-white/5"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Diagnostics */}
        <div className="xl:col-span-4 space-y-8">
          {/* Stats Card */}
          <div className="premium-glass !rounded-[2.5rem] p-8 border-white/5 space-y-8">
            <h3 className="text-sm font-black text-zinc-400 uppercase tracking-[0.2em] flex items-center gap-3">
              <BarChart3 className="w-4 h-4 text-indigo-500" /> INFO VECTOR DB
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-5 text-center">
                <div className="text-2xl font-black text-white mb-1">{stats?.total_docs || 0}</div>
                <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">DOKUMEN</div>
              </div>
              <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-5 text-center">
                <div className="text-2xl font-black text-white mb-1">{stats?.total_chunks || 0}</div>
                <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">CHUNK</div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs border-b border-white/5 pb-4">
                <span className="text-zinc-500 font-medium">Koleksi</span>
                <span className="text-white font-mono bg-indigo-500/10 px-2 py-0.5 rounded-lg text-[10px]">{stats?.collection || "campus_knowledge"}</span>
              </div>
              <div className="flex items-center justify-between text-xs border-b border-white/5 pb-4">
                <span className="text-zinc-500 font-medium">Embedding</span>
                <span className="text-zinc-300 font-bold">{stats?.embedding || "all-MiniLM-L6-v2"}</span>
              </div>
              <div className="flex items-center justify-between text-xs border-b border-white/5 pb-4">
                <span className="text-zinc-500 font-medium">Reranking</span>
                <span className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-lg bg-orange-500/10 text-orange-500 text-[10px] font-bold">Belum aktif</span>
                </span>
              </div>
              <div className="flex items-center justify-between text-xs border-b border-white/5 pb-4">
                <span className="text-zinc-500 font-medium">Metadata Filter</span>
                <span className="flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-emerald-500 font-bold uppercase text-[10px]">Aktif</span>
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-500 font-medium">Status</span>
                <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                   <span className="text-white font-bold text-[10px] uppercase">Sehat</span>
                </div>
              </div>
            </div>

            <button className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-black text-zinc-400 hover:text-white hover:border-white/20 transition-all flex items-center justify-center gap-2">
              UPGRADE RAG ENGINE <Zap className="w-3 h-3" />
            </button>
          </div>

          {/* Pipeline Visualizer */}
          <div className="premium-glass !rounded-[2.5rem] p-8 border-white/5">
            <h3 className="text-sm font-black text-zinc-400 uppercase tracking-[0.2em] mb-8">Pipeline Ingest</h3>
            
            <div className="space-y-6 relative">
              <div className="absolute left-[13px] top-4 bottom-4 w-px bg-white/5" />
              
              {[
                { label: "Raw input (PDF/TXT/CSV/URL)", icon: File },
                { label: "Text cleaning & normalization", icon: Cpu },
                { label: "Chunking (700 token / 100 overlap)", icon: Layers },
                { label: "Assign metadata (prodi/tahun/title)", icon: ShieldCheck },
                { label: "Embedding → all-MiniLM-L6-v2", icon: Zap },
                { label: "Store ke ChromaDB", icon: Save },
              ].map((step, i) => (
                <div key={i} className="flex items-center gap-5 group relative z-10">
                  <div className="w-7 h-7 rounded-full bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-[10px] font-bold text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                    {i + 1}
                  </div>
                  <div className="flex items-center gap-3">
                    <step.icon className="w-4 h-4 text-zinc-600" />
                    <span className="text-xs font-bold text-zinc-500 group-hover:text-zinc-200 transition-all">{step.label}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Help Tooltip */}
          <div className="p-6 rounded-[2rem] bg-white/[0.02] border border-white/5 flex gap-4">
            <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center shrink-0">
              <Info className="w-5 h-5 text-zinc-500" />
            </div>
            <div>
              <h5 className="text-sm font-bold text-zinc-300 mb-1">Tips RAG</h5>
              <p className="text-[11px] text-zinc-500 leading-relaxed font-medium">
                Gunakan metadata <span className="text-indigo-400 font-bold">Prodi</span> yang spesifik agar AI tidak bingung membedakan aturan antar fakultas.
              </p>
            </div>
          </div>
        </div>
      </div>
      {/* (Inserting modal at the bottom of the component) */}
      {showSettings && kbSettings && (
        <SettingsModal 
          settings={kbSettings} 
          onClose={() => setShowSettings(false)} 
          onRefresh={fetchDocsStatsAndSettings} 
        />
      )}
    </div>
  );
}

// --- SUB-COMPONENT: SETTINGS MODAL ---
function SettingsModal({ settings, onClose, onRefresh }: { settings: any, onClose: () => void, onRefresh: () => void }) {
  const [localSettings, setLocalSettings] = useState(settings);
  const [saving, setSaving] = useState<string | null>(null);

  const addItem = (key: string, value: any) => {
    if (!value) return;
    if (localSettings[key].includes(value)) return;
    setLocalSettings({
      ...localSettings,
      [key]: [...localSettings[key], value]
    });
  };

  const removeItem = (key: string, index: number) => {
    const newList = [...localSettings[key]];
    newList.splice(index, 1);
    setLocalSettings({
      ...localSettings,
      [key]: newList
    });
  };

  const handleSave = async (key: string) => {
    setSaving(key);
    try {
      await api.post(`/cms/settings/knowledge-base/${key}`, localSettings[key]);
      onRefresh();
    } catch (err) {
      alert("Gagal menyimpan.");
    } finally {
      setSaving(null);
    }
  };

  const sections = [
    { key: "knowledge_categories", label: "KATEGORI", type: "text" },
    { key: "knowledge_prodi", label: "PRODI / FAKULTAS", type: "text" },
    { key: "knowledge_years", label: "TAHUN BERLAKU", type: "number" },
    { key: "knowledge_priorities", label: "PRIORITAS", type: "text" },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="w-full max-w-4xl max-h-[90vh] premium-glass !rounded-[3rem] border-white/10 flex flex-col overflow-hidden shadow-2xl">
        <div className="p-8 border-b border-white/5 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight">Kelola List Dropdown</h2>
            <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest mt-1">Konfigurasi Dinamis Pengetahuan AI</p>
          </div>
          <button 
            onClick={onClose}
            className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-zinc-500 hover:text-white transition-all"
          >
            <ChevronRight className="w-6 h-6 rotate-180" />
          </button>
        </div>

        <div className="p-8 overflow-y-auto space-y-10 custom-scrollbar">
          {sections.map((section) => (
            <div key={section.key} className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">{section.label}</h3>
                <button 
                  onClick={() => handleSave(section.key)}
                  disabled={saving === section.key}
                  className="px-4 py-1.5 rounded-lg bg-indigo-600/20 border border-indigo-500/30 text-[10px] font-black text-indigo-400 hover:bg-indigo-600 hover:text-white transition-all disabled:opacity-50"
                >
                  {saving === section.key ? "MENYIMPAN..." : "SIMPAN PERUBAHAN"}
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {localSettings[section.key].map((item: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-2 bg-white/[0.03] border border-white/5 pl-4 pr-2 py-2 rounded-xl group hover:border-white/10 transition-all">
                    <span className="text-xs font-bold text-zinc-300">{item}</span>
                    <button 
                      onClick={() => removeItem(section.key, idx)}
                      className="p-1.5 rounded-lg hover:bg-red-500/10 text-zinc-600 hover:text-red-500 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                
                <div className="flex items-center gap-2">
                  <input 
                    type={section.type}
                    placeholder="Tambah baru..."
                    className="bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-indigo-500/40 w-32"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const val = e.currentTarget.value;
                        addItem(section.key, section.type === 'number' ? parseInt(val) : val);
                        e.currentTarget.value = "";
                      }
                    }}
                  />
                  <button 
                    onClick={(e) => {
                      const input = e.currentTarget.previousSibling as HTMLInputElement;
                      const val = input.value;
                      addItem(section.key, section.type === 'number' ? parseInt(val) : val);
                      input.value = "";
                    }}
                    className="p-2 rounded-xl bg-white/5 border border-white/5 text-zinc-500 hover:text-white transition-all"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="p-8 bg-white/[0.02] border-t border-white/5 flex justify-end">
          <button 
            onClick={onClose}
            className="px-8 py-4 rounded-2xl bg-white/5 border border-white/10 text-xs font-black text-white hover:bg-white/10 transition-all"
          >
            SELESAI & TUTUP
          </button>
        </div>
      </div>
    </div>
  );
}

// Add Plus icon to imports
