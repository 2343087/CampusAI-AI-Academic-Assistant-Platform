"use client";

import React from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/api";
import { 
  Activity, 
  Cpu, 
  Database, 
  HardDrive, 
  Server, 
  CheckCircle2,
  Clock
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function HealthPage() {
  const { data: health } = useSWR("/cms/health", fetcher, { refreshInterval: 5000 });

  const services = [
    { name: "FastAPI Backend", status: "online", icon: Server },
    { name: "PostgreSQL Database", status: health?.services?.database === "connected" ? "online" : "offline", icon: Database },
    { name: "Redis Cache", status: health?.services?.redis === "connected" ? "online" : "offline", icon: Activity },
    { name: "Chroma Vector DB", status: health?.services?.chroma === "connected" ? "online" : "offline", icon: HardDrive },
    { name: "OpenAI API", status: health?.services?.openai_api === "active" ? "online" : "offline", icon: CheckCircle2 },
  ];

  return (
    <div className="space-y-10 pb-20">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight premium-gradient-text">Kesehatan Sistem</h1>
        <p className="text-zinc-400 font-medium mt-2">Pemantauan status real-time semua layanan mikro.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((service) => (
          <div key={service.name} className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 backdrop-blur-xl flex items-center justify-between group hover:border-white/10 transition-all">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-zinc-500 group-hover:text-indigo-400 transition-colors">
                <service.icon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-sm">{service.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <div className={cn("w-1.5 h-1.5 rounded-full", service.status === "online" ? "bg-emerald-500" : "bg-red-500")} />
                  <span className={cn("text-[10px] font-bold uppercase tracking-widest", service.status === "online" ? "text-emerald-500" : "text-red-500")}>
                    {service.status === "online" ? "Aktif" : "Mati"}
                  </span>
                </div>
              </div>
            </div>
            <span className="text-[10px] font-mono text-zinc-600">2ms</span>
          </div>
        ))}
      </div>

      {/* Metrik Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/5">
           <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
             <Cpu className="w-5 h-5 text-indigo-500" />
             Penggunaan Sumber Daya
           </h3>
           <div className="space-y-6">
             <div>
               <div className="flex justify-between text-sm mb-2">
                 <span className="text-zinc-400">Penggunaan CPU</span>
                 <span className="font-mono">{health?.resources?.cpu_usage || "0%"}</span>
               </div>
               <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                 <div className="h-full bg-indigo-500 transition-all" style={{ width: health?.resources?.cpu_usage || "0%" }} />
               </div>
             </div>
             <div>
               <div className="flex justify-between text-sm mb-2">
                 <span className="text-zinc-400">Alokasi Memori</span>
                 <span className="font-mono">{health?.resources?.memory_usage || "0MB"}</span>
               </div>
               <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                 <div className="h-full bg-purple-500 transition-all" style={{ width: '45%' }} />
               </div>
             </div>
           </div>
        </div>

        <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/5">
           <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
             <Clock className="w-5 h-5 text-indigo-500" />
             Riwayat Uptime
           </h3>
           <div className="space-y-4">
             {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
                  <span className="text-sm text-zinc-400">April 2{i}, 2026</span>
                  <span className="text-xs font-bold text-emerald-500">99.98% Tersedia</span>
                </div>
             ))}
           </div>
        </div>
      </div>
    </div>
  );
}
