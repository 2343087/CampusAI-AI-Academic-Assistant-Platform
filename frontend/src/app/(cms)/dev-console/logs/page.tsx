"use client";

import React from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/api";
import { Terminal } from "lucide-react";
import { motion } from "framer-motion";

export default function AILogsPage() {
  const { data: logs, isLoading } = useSWR("/cms/logs", fetcher, { refreshInterval: 5000 });

  return (
    <div className="space-y-12 pb-20">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight premium-gradient-text">Log Interaksi AI</h1>
        <p className="text-zinc-400 font-medium mt-2">Jejak audit lengkap semua kueri dan respons mesin neural.</p>
      </div>

      {/* Tabel Log */}
      <div className="premium-glass !rounded-3xl p-6 md:p-10 overflow-x-auto">
        <div className="min-w-[600px]">
          {/* Header */}
          <div className="grid grid-cols-12 gap-4 px-5 py-3 text-[10px] font-bold text-zinc-600 uppercase tracking-widest border-b border-white/5 mb-4">
            <div className="col-span-1">#</div>
            <div className="col-span-2">Pengguna</div>
            <div className="col-span-4">Pertanyaan</div>
            <div className="col-span-3">Jawaban</div>
            <div className="col-span-1">Latensi</div>
            <div className="col-span-1">Waktu</div>
          </div>

          {/* Baris */}
          {isLoading ? (
            <div className="py-20 text-center text-zinc-600 text-sm">Memuat log...</div>
          ) : logs && logs.length > 0 ? (
            logs.map((log: any, i: number) => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="grid grid-cols-12 gap-4 px-5 py-4 rounded-2xl hover:bg-white/[0.03] transition-all group items-center"
              >
                <div className="col-span-1 text-xs text-zinc-700 font-mono">{log.id}</div>
                <div className="col-span-2">
                  <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded-lg">{log.user}</span>
                </div>
                <div className="col-span-4 text-sm text-zinc-300 truncate font-medium">{log.query}</div>
                <div className="col-span-3 text-sm text-zinc-500 truncate">{log.response}</div>
                <div className="col-span-1">
                  <span className="text-xs font-bold text-emerald-500">{log.latency}s</span>
                </div>
                <div className="col-span-1 text-[10px] text-zinc-600 font-mono">
                  {new Date(log.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </div>
              </motion.div>
            ))
          ) : (
            <div className="py-20 text-center space-y-4 opacity-30">
              <Terminal className="w-12 h-12 mx-auto" />
              <p className="text-xs font-bold uppercase tracking-widest">Belum ada log tercatat</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
