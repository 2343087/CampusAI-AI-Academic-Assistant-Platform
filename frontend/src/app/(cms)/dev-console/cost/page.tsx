"use client";

import React from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/api";
import { DollarSign, TrendingUp, AlertTriangle, ArrowDownRight, ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";

export default function CostMonitorPage() {
  const { data: costData } = useSWR("/cms/stats/cost", fetcher, { refreshInterval: 10000 });

  const dailyCosts = costData?.daily_cost || [];
  const totalMonth = costData?.total_month || 0;
  const quotaRemaining = costData?.quota_remaining || 0;

  return (
    <div className="space-y-12 pb-20">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight premium-gradient-text">Monitor Biaya</h1>
        <p className="text-zinc-400 font-medium mt-2">Pantau penggunaan dan pengeluaran API AI secara real-time.</p>
      </div>

      {/* Kartu Ringkasan */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="premium-glass !rounded-3xl p-8"
        >
          <DollarSign className="w-6 h-6 text-emerald-400 mb-4" />
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Pengeluaran Bulanan</p>
          <p className="text-3xl font-bold">${totalMonth}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="premium-glass !rounded-3xl p-8"
        >
          <TrendingUp className="w-6 h-6 text-indigo-400 mb-4" />
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Sisa Kuota</p>
          <p className="text-3xl font-bold">${quotaRemaining}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="premium-glass !rounded-3xl p-8"
        >
          <AlertTriangle className="w-6 h-6 text-amber-400 mb-4" />
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Rata-rata Harian</p>
          <p className="text-3xl font-bold">
            ${dailyCosts.length > 0 ? (dailyCosts.reduce((a: number, b: any) => a + b.cost, 0) / dailyCosts.length).toFixed(2) : "0.00"}
          </p>
        </motion.div>
      </div>

      {/* Rincian Harian */}
      <div className="premium-glass !rounded-3xl p-8 md:p-10">
        <h2 className="text-xl font-bold mb-8">Rincian Harian</h2>
        <div className="space-y-4">
          {dailyCosts.map((day: any, i: number) => {
            const prev = dailyCosts[i - 1]?.cost || day.cost;
            const isUp = day.cost > prev;
            return (
              <div key={i} className="flex items-center justify-between p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-zinc-400" />
                  </div>
                  <span className="font-medium text-zinc-300">{day.date}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-lg">${day.cost.toFixed(2)}</span>
                  {isUp ? (
                    <ArrowUpRight className="w-4 h-4 text-red-400" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4 text-emerald-400" />
                  )}
                </div>
              </div>
            );
          })}
          {dailyCosts.length === 0 && (
            <div className="py-16 text-center text-zinc-600 text-sm">Belum ada data biaya.</div>
          )}
        </div>
      </div>
    </div>
  );
}
