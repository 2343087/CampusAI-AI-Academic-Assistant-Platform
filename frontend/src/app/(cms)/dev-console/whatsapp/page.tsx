"use client";

import React, { useState } from "react";
import { 
  Send, 
  Smartphone, 
  History,
  CheckCircle2
} from "lucide-react";
import { motion } from "framer-motion";

export default function WhatsAppConsole() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [logs, setLogs] = useState([
    { id: 1, to: "+628123456789", type: "Risiko Akademik", status: "terkirim", time: "10 menit lalu" },
    { id: 2, to: "+628129876543", type: "Deadline KRS", status: "terkirim", time: "1 jam lalu" },
  ]);

  const handleTestSend = async () => {
    if (!phoneNumber || !message) return;
    setIsLoading(true);
    try {
      await new Promise(r => setTimeout(r, 1000));
      alert("Pesan WhatsApp terkirim (Mode Simulasi)!");
      setLogs([{ id: Date.now(), to: phoneNumber, type: "Pesan Tes", status: "terkirim", time: "Baru saja" }, ...logs]);
      setMessage("");
    } catch {
      alert("Gagal mengirim pesan.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-10 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight premium-gradient-text">Jembatan WhatsApp</h1>
          <p className="text-zinc-400 font-medium mt-2">Kelola komunikasi proaktif dan notifikasi otomatis ke mahasiswa.</p>
        </div>
        <div className="flex items-center gap-3 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Layanan Aktif</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Konsol Kirim Manual */}
        <div className="premium-glass !rounded-3xl p-8 md:p-10 space-y-8">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center">
              <Send className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold">Kirim Manual</h3>
              <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Tes Konektivitas API</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-3">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Nomor Penerima</label>
              <div className="relative">
                <Smartphone className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600" />
                <input 
                  type="text" 
                  placeholder="+628..." 
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full bg-black/30 border border-white/10 rounded-2xl py-4 pl-14 pr-6 text-sm focus:outline-none focus:border-indigo-500/50 transition-all font-medium"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Isi Pesan</label>
              <textarea 
                placeholder="Ketik pesan tes di sini..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full h-32 bg-black/30 border border-white/10 rounded-2xl p-6 text-sm focus:outline-none focus:border-indigo-500/50 transition-all font-medium resize-none"
              />
            </div>

            <button 
              onClick={handleTestSend}
              disabled={isLoading}
              className="w-full py-5 bg-white text-black rounded-2xl font-bold hover:bg-zinc-200 transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50"
            >
              <Send className="w-5 h-5" />
              Kirim ke Ponsel
            </button>
          </div>
        </div>

        {/* Log Transmisi */}
        <div className="premium-glass !rounded-3xl p-8 md:p-10 flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center">
                <History className="w-6 h-6 text-indigo-400" />
              </div>
              <h3 className="text-xl font-bold">Riwayat Pengiriman</h3>
            </div>
            <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-pulse" />
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar max-h-[500px]">
            {logs.map((log) => (
              <div key={log.id} className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-lg uppercase tracking-widest">
                    {log.type}
                  </span>
                  <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">{log.time}</span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="font-bold text-zinc-300">{log.to}</p>
                  <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-500 uppercase tracking-widest">
                    <CheckCircle2 className="w-3 h-3" />
                    {log.status}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
