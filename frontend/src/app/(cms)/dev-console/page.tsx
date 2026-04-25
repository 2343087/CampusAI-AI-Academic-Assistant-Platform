"use client";

import React, { useEffect, useRef } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/api";
import { 
  Activity, 
  Cpu, 
  Database, 
  MessageSquare, 
  TrendingUp,
  Zap,
  ShieldCheck,
  Globe,
  Terminal,
  ArrowUpRight,
  RefreshCcw
} from "lucide-react";
import gsap from "gsap";
import { cn } from "@/lib/utils";

export default function DevConsolePage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { data: health, mutate: refreshHealth } = useSWR("/cms/health", fetcher, { refreshInterval: 5000 });
  const { data: logs } = useSWR("/cms/logs", fetcher, { refreshInterval: 3000 });

  useEffect(() => {
    if (containerRef.current) {
      gsap.fromTo(".dev-reveal", 
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, stagger: 0.08, ease: "power2.out" }
      );
    }
  }, []);

  const stats = [
    { label: "Total Kueri AI", value: "1,284", change: "+12.5%", icon: MessageSquare, color: "text-blue-400" },
    { label: "Latensi Neural", value: health?.resources.cpu_usage || "450ms", change: "-5.2%", icon: Activity, color: "text-emerald-400" },
    { label: "Memori Mesin", value: health?.resources.memory_usage || "320MB", change: "+2.4%", icon: Cpu, color: "text-purple-400" },
    { label: "Basis Pengetahuan", value: "42 Dok", change: "0%", icon: Database, color: "text-amber-400" },
  ];

  return (
    <div ref={containerRef} className="space-y-12 pb-20">
      
      {/* Header */}
      <div className="dev-reveal flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-indigo-600/10 border border-indigo-500/20 text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-400">
            <Terminal className="w-3.5 h-3.5" />
            System Command Center
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight premium-gradient-text">Konsol Pengembang</h1>
          <p className="text-zinc-500 font-medium">Pemantauan mesin AI dan orkestrasi sistem secara real-time.</p>
        </div>
        
        <button 
          onClick={() => refreshHealth()}
          className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-white/5 border border-white/10 text-xs font-bold uppercase tracking-widest hover:bg-white/10 transition-all group"
        >
          <RefreshCcw className="w-4 h-4 group-active:rotate-180 transition-transform duration-500" />
          Sinkron Paksa
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <div 
            key={idx} 
            className="dev-reveal premium-glass !rounded-[2.5rem] p-8 group premium-glass-hover"
          >
            <div className="flex items-center justify-between mb-8">
              <div className={cn("w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center group-hover:scale-110 transition-all duration-500")}>
                <stat.icon className={cn("w-6 h-6", stat.color)} />
              </div>
              <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/10">
                {stat.change}
              </span>
            </div>
            <h3 className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-2">{stat.label}</h3>
            <p className="text-3xl font-bold tracking-tight">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Main Monitoring Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Performance Chart Placeholder */}
        <div className="dev-reveal lg:col-span-2 space-y-6">
          <div className="premium-glass !rounded-[3rem] p-10 md:p-12 min-h-[500px] flex flex-col group relative overflow-hidden">
             <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/[0.03] rounded-full blur-[120px] -mr-48 -mt-48" />
             
             <div className="flex items-center justify-between mb-12 relative z-10">
                <div>
                  <h3 className="text-2xl font-bold tracking-tight mb-1">Kecepatan Neural</h3>
                  <p className="text-xs text-zinc-600 font-bold uppercase tracking-widest">Frekuensi permintaan global</p>
                </div>
                <div className="flex items-center gap-3">
                   <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/5 border border-emerald-500/10 text-[10px] font-bold text-emerald-500 uppercase tracking-widest">
                     <Zap className="w-3.5 h-3.5" />
                     Langsung
                   </div>
                </div>
             </div>
             
             <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6 opacity-30 relative z-10">
                <div className="w-20 h-20 rounded-3xl bg-white/5 border border-white/5 flex items-center justify-center">
                   <TrendingUp className="w-10 h-10 text-zinc-500" />
                </div>
                <p className="text-sm font-medium text-zinc-400">Visualisasi telemetri sedang dimuat... <br/> Menghubungkan ke Neural Bridge.</p>
             </div>
             
             <div className="mt-8 grid grid-cols-3 gap-6 relative z-10">
                {[
                  { label: "Uptime", value: "99.99%", icon: ShieldCheck },
                  { label: "Region", value: "ID-WEST", icon: Globe },
                  { label: "Security", value: "Apex-v3", icon: ShieldCheck },
                ].map((item, i) => (
                  <div key={i} className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col items-center gap-2">
                    <item.icon className="w-4 h-4 text-zinc-700" />
                    <p className="text-xs font-bold">{item.value}</p>
                  </div>
                ))}
             </div>
          </div>
        </div>

        {/* Logs Feed */}
        <div className="dev-reveal space-y-6">
          <div className="premium-glass !rounded-[3rem] p-8 md:p-10 flex flex-col h-full max-h-[700px]">
            <div className="flex items-center justify-between mb-10">
              <h3 className="text-xl font-bold tracking-tight">Log Sistem</h3>
              <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-pulse" />
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-6 pr-2 custom-scrollbar">
              {logs && logs.length > 0 ? logs.map((log: any, idx: number) => (
                <div 
                  key={idx} 
                  className="p-5 rounded-3xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all duration-300 group relative"
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-indigo-500/10 flex items-center justify-center text-[10px] font-bold text-indigo-400">
                        REQ
                      </div>
                      <p className="text-xs font-bold text-zinc-400 group-hover:text-white transition-colors truncate max-w-[140px]">
                        {log.query}
                      </p>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-zinc-800 group-hover:text-indigo-500 transition-colors" />
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-bold text-zinc-700 uppercase tracking-widest">{log.timestamp}</p>
                    <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">{log.latency}s</p>
                  </div>
                </div>
              )) : (
                <div className="py-20 text-center space-y-4 opacity-20">
                   <Terminal className="w-12 h-12 mx-auto" />
                   <p className="text-xs font-bold uppercase tracking-[0.2em]">Mendengarkan Aktivitas Neural...</p>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
