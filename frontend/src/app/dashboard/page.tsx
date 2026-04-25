"use client";

import React, { useEffect, useRef } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { motion } from "framer-motion";
import gsap from "gsap";
import {
  GraduationCap,
  Calendar,
  Clock,
  AlertCircle,
  TrendingUp,
  BookOpen,
  ArrowRight,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const { data, error } = useSWR("/academic/dashboard", fetcher);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  const hasAnimated = useRef(false);

  useEffect(() => {
    if (data && containerRef.current && !hasAnimated.current) {
      const ctx = gsap.context(() => {
        gsap.fromTo(".gsap-card", 
          { y: 30, opacity: 0 },
          { 
            y: 0, 
            opacity: 1, 
            duration: 0.8, 
            stagger: 0.1, 
            ease: "power3.out",
            delay: 0.2,
            onComplete: () => { hasAnimated.current = true; }
          }
        );
      }, containerRef);
      return () => ctx.revert();
    }
  }, [data]);

  if (!data)
    return (
      <div className="min-h-screen bg-[#030303] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );

  return (
    <div ref={containerRef} className="min-h-screen pt-32 pb-20 px-6 lg:px-12 selection:bg-indigo-500/30">
      <div className="max-w-7xl mx-auto space-y-16">
        
        {/* Header Section */}
        <div className="gsap-card flex flex-col md:flex-row md:items-end justify-between gap-10">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-400">
              <Sparkles className="w-3.5 h-3.5" />
              Protokol Akademik: Aktif
            </div>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight premium-gradient-text leading-tight">
              Halo, {data.student_info?.name?.split(' ')[0] || user?.full_name?.split(' ')[0]}
            </h1>
            <p className="text-zinc-400 font-medium text-lg md:text-xl">
              {data.student_info?.prodi || "Informatics"} <span className="mx-2 text-zinc-700">•</span> {data.student_info?.nim || "23.XX.XXXX"}
            </p>
          </div>
          
          <div className="flex items-center gap-4">
             <button
              onClick={() => router.push("/chat")}
              className="primary-button group"
            >
              <MessageSquare className="w-5 h-5" />
              Tanya Assistant
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        {/* Alerts Section */}
        {data.alerts && data.alerts.length > 0 && (
          <div className="gsap-card grid grid-cols-1 gap-6">
            {data.alerts.map((alert: any, idx: number) => (
              <div 
                key={idx}
                className={cn(
                  "p-8 rounded-[2.5rem] border backdrop-blur-3xl flex items-start gap-6 transition-all hover:scale-[1.01]",
                  alert.level === 'critical' 
                    ? "bg-red-500/5 border-red-500/10 text-red-400" 
                    : "bg-amber-500/5 border-amber-500/10 text-amber-400"
                )}
              >
                <div className={cn(
                  "w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-2xl",
                  alert.level === 'critical' ? "bg-red-500/20" : "bg-amber-500/20"
                )}>
                  <AlertCircle className="w-7 h-7" />
                </div>
                <div className="space-y-2">
                  <p className="font-bold uppercase text-[10px] tracking-[0.3em] opacity-50">Saran Sistem</p>
                  <p className="text-base md:text-lg font-medium leading-relaxed">{alert.message}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { label: "IPK Saat Ini", value: data.stats?.ipk || "0.0", icon: GraduationCap, color: "text-indigo-400" },
            { label: "SKS Terlampaui", value: `${data.stats?.sks_completed || 0}/${data.stats?.sks_total || 144}`, icon: BookOpen, color: "text-purple-400" },
            { label: "Presensi", value: data.stats?.attendance || "92%", icon: Clock, color: "text-emerald-400" },
            { label: "Kelas Aktif", value: data.courses?.length || 0, icon: Calendar, color: "text-blue-400" },
          ].map((stat, idx) => (
            <div
              key={idx}
              className="gsap-card premium-glass !rounded-[2.5rem] p-10 group premium-glass-hover"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center group-hover:scale-110 group-hover:bg-white/[0.08] transition-all duration-500">
                  <stat.icon className={cn("w-7 h-7", stat.color)} />
                </div>
                <TrendingUp className="w-5 h-5 text-zinc-800" />
              </div>
              <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-3">{stat.label}</p>
              <p className="text-4xl font-bold tracking-tight">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Schedule Column */}
          <div className="gsap-card lg:col-span-2 space-y-10">
            <div className="premium-glass !rounded-[3rem] p-10 md:p-12">
              <div className="flex items-center justify-between mb-12">
                <h3 className="text-3xl font-bold tracking-tight">Jadwal Kuliah</h3>
                <div className="px-5 py-2 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                  Semester Ganjil 2026
                </div>
              </div>
              
              <div className="space-y-8">
                {data.schedule && data.schedule.length > 0 ? (
                  data.schedule.map((item: any, idx: number) => (
                    <div
                      key={idx}
                      className="group flex flex-col sm:flex-row sm:items-center justify-between p-8 rounded-[2.5rem] bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] hover:border-white/10 transition-all duration-500"
                    >
                      <div className="flex items-center gap-10">
                        <div className="space-y-1 text-center sm:text-left min-w-[100px]">
                          <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.2em]">{item.day || "SENIN"}</p>
                          <p className="text-2xl font-bold">{item.time?.split(" - ")[0] || "08:00"}</p>
                        </div>
                        <div className="w-px h-16 bg-white/5 hidden sm:block" />
                        <div className="space-y-2">
                          <p className="text-2xl font-bold group-hover:text-indigo-400 transition-colors duration-500">{item.subject}</p>
                          <div className="flex items-center gap-4">
                            <span className="text-xs font-medium text-zinc-500">{item.lecturer || "Dr. Tech, M.Kom"}</span>
                            <span className="w-1.5 h-1.5 rounded-full bg-zinc-800" />
                            <span className="text-xs font-medium text-zinc-500 flex items-center gap-2">
                              <Clock className="w-4 h-4 text-zinc-600" />
                              {item.room || "Room 4.2"}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-end mt-6 sm:mt-0">
                        <button className="w-14 h-14 rounded-full border border-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 group-hover:bg-white group-hover:text-black transition-all duration-500 shadow-2xl">
                          <ArrowRight className="w-6 h-6" />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-24 bg-white/[0.01] rounded-[3rem] border-2 border-dashed border-white/5">
                    <Calendar className="w-16 h-16 mx-auto mb-6 text-zinc-800 opacity-20" />
                    <p className="text-zinc-500 font-medium">Belum ada jadwal hari ini.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Sidebar Column */}
          <div className="gsap-card space-y-10">
             {/* GPA Chart Card */}
             <div className="premium-glass !rounded-[3rem] p-10 overflow-hidden relative group premium-glass-hover">
                <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/5 rounded-full blur-[80px] -mr-20 -mt-20 group-hover:bg-indigo-500/10 transition-all duration-700" />
                <h3 className="text-xl font-bold mb-10 flex items-center gap-3">
                  <TrendingUp className="w-5 h-5 text-indigo-500" />
                  Lintasan IPK
                </h3>
                <div className="h-[220px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.gpa_history}>
                      <defs>
                        <linearGradient id="colorGpa" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="semester" hide />
                      <YAxis hide domain={[0, 4.5]} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#0a0a0a",
                          border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: "20px",
                          boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
                          padding: "12px 16px"
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="gpa"
                        stroke="#6366f1"
                        strokeWidth={4}
                        fillOpacity={1}
                        fill="url(#colorGpa)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-8 p-6 rounded-[2rem] bg-white/[0.02] border border-white/5">
                  <p className="text-sm text-zinc-400 text-center leading-relaxed font-medium">
                    Performa meningkat <span className="text-emerald-400 font-bold">12%</span> <br/>
                    <span className="text-[10px] uppercase tracking-widest text-zinc-600 font-bold">Dibanding Semester Lalu</span>
                  </p>
                </div>
            </div>

            {/* AI Assistant CTA */}
            <div className="premium-glass !rounded-[3rem] p-10 bg-gradient-to-br from-indigo-600/80 to-violet-800/80 text-white relative overflow-hidden group shadow-[0_30px_60px_rgba(79,70,229,0.3)] border-indigo-500/20">
              <div className="relative z-10 space-y-8">
                <div className="w-16 h-16 rounded-[1.5rem] bg-white/20 backdrop-blur-3xl flex items-center justify-center shadow-inner">
                  <MessageSquare className="w-8 h-8" />
                </div>
                <div className="space-y-3">
                  <h3 className="text-3xl font-bold">Campus AI Assistant</h3>
                  <p className="text-indigo-100 text-sm leading-relaxed opacity-70 font-medium">
                    Butuh review draft skripsi atau saran KRS kilat?
                  </p>
                </div>
                <button 
                  onClick={() => router.push("/chat")}
                  className="w-full py-5 bg-white text-black font-bold rounded-2xl hover:bg-zinc-100 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-3 shadow-2xl"
                >
                  Buka Chat Assistant
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
              
              <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
