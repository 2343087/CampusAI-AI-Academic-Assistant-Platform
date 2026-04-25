"use client";

import React, { useState } from "react";
import { FileText, Upload, Plus, Database, Trash2, Link2, Globe, Video, CheckCircle2, AlertCircle } from "lucide-react";
import api from "@/lib/api";
import { cn } from "@/lib/utils";

type TabType = "text" | "pdf" | "url";

export default function DocumentsPage() {
  const [activeTab, setActiveTab] = useState<TabType>("text");
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfTitle, setPdfTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const handleIngestText = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setLoading(true);
    setStatus(null);
    try {
      const res = await api.post("/chat/ingest", { text });
      setStatus({ type: "success", msg: `Berhasil! ${res.data.chunks_added} chunk ditambahkan ke memori AI.` });
      setText("");
    } catch (err: any) {
      setStatus({ type: "error", msg: err?.response?.data?.detail || "Gagal menyimpan dokumen. Cek koneksi backend." });
    } finally {
      setLoading(false);
    }
  };

  const handleIngestUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    setLoading(true);
    setStatus(null);
    try {
      const res = await api.post(`/chat/ingest/url?url=${encodeURIComponent(url)}`);
      setStatus({ type: "success", msg: `Berhasil! Data dari "${url}" sudah masuk ke memori AI (${res.data.chunks_added} chunk).` });
      setUrl("");
    } catch (err: any) {
      setStatus({ type: "error", msg: err?.response?.data?.detail || "Gagal scraping URL. Pastikan URL valid dan bisa diakses." });
    } finally {
      setLoading(false);
    }
  };

  const handleIngestPdf = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pdfFile || !pdfTitle.trim()) return;
    setLoading(true);
    setStatus(null);
    try {
      const formData = new FormData();
      formData.append("file", pdfFile);
      formData.append("title", pdfTitle);
      formData.append("category", "peraturan");
      const res = await api.post("/cms/documents/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setStatus({ type: "success", msg: `PDF "${pdfTitle}" sedang diproses di background. Cek kembali nanti.` });
      setPdfFile(null);
      setPdfTitle("");
    } catch (err: any) {
      setStatus({ type: "error", msg: err?.response?.data?.detail || "Gagal upload PDF. Pastikan file format .pdf." });
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: "text" as TabType, label: "Teks / FAQ", icon: FileText },
    { id: "pdf" as TabType, label: "Upload PDF", icon: Upload },
    { id: "url" as TabType, label: "Link / URL", icon: Globe },
  ];

  return (
    <div className="space-y-10 pb-20">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight premium-gradient-text">Basis Pengetahuan</h1>
        <p className="text-zinc-400 font-medium mt-2">Kelola data yang menjadi sumber jawaban AI Assistant.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Main Form Area */}
        <div className="xl:col-span-2 space-y-6">
          {/* Tab Switcher */}
          <div className="flex gap-2 p-1.5 bg-white/[0.03] rounded-2xl border border-white/5">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setStatus(null); }}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold transition-all",
                  activeTab === tab.id
                    ? "bg-indigo-600 text-white shadow-lg"
                    : "text-zinc-500 hover:text-white hover:bg-white/5"
                )}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Text Ingestion */}
          {activeTab === "text" && (
            <form onSubmit={handleIngestText} className="premium-glass !rounded-3xl p-8 space-y-6">
              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3 block">Konten Pengetahuan</label>
                <textarea
                  className="w-full h-52 bg-black/30 border border-white/10 rounded-2xl p-5 text-sm focus:outline-none focus:border-indigo-500/50 transition-all placeholder:text-zinc-700 resize-none"
                  placeholder="Tempel aturan kampus, FAQ, kalender akademik, atau pengetahuan apapun di sini..."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                />
                <p className="text-[10px] text-zinc-600 mt-2">{text.length} karakter • Akan dipecah otomatis menjadi chunk 700 token</p>
              </div>
              <button
                type="submit"
                disabled={loading || !text.trim()}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2 disabled:opacity-40 active:scale-[0.98]"
              >
                {loading ? "Memproses..." : (
                  <>
                    <Upload className="w-5 h-5" />
                    Simpan ke Memori AI
                  </>
                )}
              </button>
            </form>
          )}

          {/* PDF Upload */}
          {activeTab === "pdf" && (
            <form onSubmit={handleIngestPdf} className="premium-glass !rounded-3xl p-8 space-y-6">
              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3 block">Judul Dokumen</label>
                <input
                  type="text"
                  value={pdfTitle}
                  onChange={(e) => setPdfTitle(e.target.value)}
                  placeholder="Contoh: Pedoman Akademik 2026"
                  className="w-full bg-black/30 border border-white/10 rounded-2xl py-4 px-5 text-sm focus:outline-none focus:border-indigo-500/50 transition-all placeholder:text-zinc-700"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3 block">File PDF</label>
                <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-white/10 rounded-2xl cursor-pointer hover:border-indigo-500/30 hover:bg-white/[0.02] transition-all">
                  <Upload className="w-8 h-8 text-zinc-600 mb-3" />
                  <span className="text-sm text-zinc-500 font-medium">
                    {pdfFile ? pdfFile.name : "Klik untuk pilih file PDF"}
                  </span>
                  <input
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                  />
                </label>
              </div>
              <button
                type="submit"
                disabled={loading || !pdfFile || !pdfTitle.trim()}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2 disabled:opacity-40 active:scale-[0.98]"
              >
                {loading ? "Mengupload..." : (
                  <>
                    <Upload className="w-5 h-5" />
                    Upload & Proses PDF
                  </>
                )}
              </button>
            </form>
          )}

          {/* URL Ingestion */}
          {activeTab === "url" && (
            <form onSubmit={handleIngestUrl} className="premium-glass !rounded-3xl p-8 space-y-6">
              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3 block">URL / Link</label>
                <div className="relative">
                  <Link2 className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600" />
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://kampus.ac.id/pengumuman atau link YouTube..."
                    className="w-full bg-black/30 border border-white/10 rounded-2xl py-4 pl-14 pr-5 text-sm focus:outline-none focus:border-indigo-500/50 transition-all placeholder:text-zinc-700"
                  />
                </div>
                <p className="text-[10px] text-zinc-600 mt-2">Mendukung: halaman web, berita kampus, blog, dan link YouTube</p>
              </div>
              <button
                type="submit"
                disabled={loading || !url.trim()}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2 disabled:opacity-40 active:scale-[0.98]"
              >
                {loading ? "Scraping..." : (
                  <>
                    <Globe className="w-5 h-5" />
                    Ambil & Simpan Konten
                  </>
                )}
              </button>
            </form>
          )}

          {/* Status Message */}
          {status && (
            <div className={cn(
              "flex items-start gap-3 p-5 rounded-2xl border text-sm font-medium",
              status.type === "success"
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                : "bg-red-500/10 border-red-500/20 text-red-400"
            )}>
              {status.type === "success" ? <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" /> : <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />}
              {status.msg}
            </div>
          )}
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-indigo-600/10 border border-indigo-500/20">
            <h4 className="font-bold flex items-center gap-2 mb-4 text-indigo-400">
              <Database className="w-4 h-4" />
              Info Vector DB
            </h4>
            <div className="space-y-3 text-sm text-zinc-400">
              <div className="flex justify-between">
                <span>Koleksi</span>
                <span className="text-white font-mono text-xs">campus_knowledge</span>
              </div>
              <div className="flex justify-between">
                <span>Model Embedding</span>
                <span className="text-white font-mono text-xs">all-MiniLM-L6-v2 (Offline)</span>
              </div>
              <div className="flex justify-between">
                <span>Penyimpanan</span>
                <span className="text-white font-mono text-xs">./chroma_db</span>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5">
            <h3 className="font-bold mb-4 text-zinc-200">Cara Kerja</h3>
            <ol className="space-y-3 text-sm text-zinc-500 list-decimal list-inside">
              <li>Data yang kamu masukkan akan dipecah menjadi potongan kecil (chunk)</li>
              <li>Setiap chunk diubah menjadi vektor embedding</li>
              <li>Disimpan di ChromaDB untuk pencarian semantik</li>
              <li>Saat mahasiswa bertanya, AI mencari chunk yang paling relevan</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
