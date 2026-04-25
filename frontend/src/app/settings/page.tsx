"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import gsap from "gsap";
import { 
  User, 
  Settings, 
  Bell, 
  Shield, 
  Save, 
  ChevronLeft,
  Sparkles,
  Mail,
  GraduationCap,
  Fingerprint
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { cn } from "@/lib/utils";
import api from "@/lib/api";

export default function SettingsPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState("profile");
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    full_name: user?.full_name || "",
    email: user?.email || "",
    ai_tone: "formal",
    notifications: true
  });

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  const hasAnimated = useRef(false);

  useEffect(() => {
    if (containerRef.current && !hasAnimated.current) {
      const ctx = gsap.context(() => {
        gsap.fromTo(".settings-reveal", 
          { y: 20, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.8,
            stagger: 0.1,
            ease: "power3.out",
            onComplete: () => { hasAnimated.current = true; }
          }
        );
      }, containerRef);
      return () => ctx.revert();
    }
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate API call
    setTimeout(() => {
      setIsSaving(false);
      alert("Pengaturan berhasil disimpan!");
    }, 1500);
  };

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "academic", label: "Academic", icon: GraduationCap },
    { id: "security", label: "Security", icon: Shield },
    { id: "ai", label: "AI & Prefs", icon: Sparkles },
  ];

  return (
    <div ref={containerRef} className="min-h-screen pt-32 pb-20 px-6 lg:px-12 selection:bg-indigo-500/30">
      <div className="max-w-5xl mx-auto space-y-12">
        
        {/* Header */}
        <div className="settings-reveal flex items-center justify-between">
          <div className="space-y-4">
            <button 
              onClick={() => router.push("/dashboard")}
              className="group flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm font-bold uppercase tracking-widest"
            >
              <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              Back to Dashboard
            </button>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight premium-gradient-text">Account Settings</h1>
          </div>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="primary-button !py-3 !px-6"
          >
            {isSaving ? "Saving..." : "Save Changes"}
            <Save className={cn("w-4 h-4", isSaving ? "animate-spin" : "")} />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
          {/* Navigation Sidebar */}
          <div className="settings-reveal lg:col-span-1 space-y-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-sm font-bold transition-all duration-300",
                  activeTab === tab.id 
                    ? "bg-white text-black shadow-2xl" 
                    : "text-zinc-500 hover:text-white hover:bg-white/5"
                )}
              >
                <tab.icon className={cn("w-5 h-5", activeTab === tab.id ? "text-black" : "text-zinc-700")} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content Area */}
          <div className="settings-reveal lg:col-span-3">
            <div className="premium-glass !rounded-[2.5rem] p-10 md:p-14 space-y-12">
              
              {activeTab === "profile" && (
                <div className="space-y-10">
                   <div className="flex items-center gap-8">
                     <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-3xl font-bold shadow-2xl">
                       {user?.full_name?.charAt(0)}
                     </div>
                     <div className="space-y-2">
                       <h3 className="text-2xl font-bold tracking-tight text-white">Identity Details</h3>
                       <p className="text-sm text-zinc-400 font-medium">Manage your personal presence on CampusAI.</p>
                     </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div className="space-y-3">
                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Full Name</label>
                        <div className="relative">
                          <User className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                          <input 
                            type="text" 
                            className="glass-input pl-14" 
                            value={formData.full_name}
                            onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                          />
                        </div>
                     </div>
                     <div className="space-y-3">
                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Email Address</label>
                        <div className="relative">
                          <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                          <input 
                            type="email" 
                            className="glass-input pl-14" 
                            value={formData.email}
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                          />
                        </div>
                     </div>
                   </div>
                </div>
              )}

              {activeTab === "academic" && (
                <div className="space-y-10">
                   <div className="flex items-center gap-8">
                     <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                       <GraduationCap className="w-8 h-8 text-indigo-400" />
                     </div>
                     <div className="space-y-1">
                       <h3 className="text-2xl font-bold tracking-tight text-white">Academic Identity</h3>
                       <p className="text-sm text-zinc-400 font-medium">Verified by your University Information System.</p>
                     </div>
                   </div>

                   <div className="grid grid-cols-1 gap-6">
                      <div className="p-8 rounded-[2rem] bg-white/[0.02] border border-white/5 flex items-center justify-between">
                         <div className="space-y-1">
                           <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Student ID (NIM)</p>
                           <p className="text-xl font-bold font-mono">23.XX.XXXX</p>
                         </div>
                         <Fingerprint className="w-8 h-8 text-zinc-800" />
                      </div>
                      <div className="p-8 rounded-[2rem] bg-white/[0.02] border border-white/5 space-y-1">
                         <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Major / Study Program</p>
                         <p className="text-xl font-bold text-indigo-400">Informatics & Computer Science</p>
                      </div>
                   </div>
                   
                   <p className="text-[10px] text-zinc-600 italic">Informasi akademik ini bersifat sinkron otomatis. Hubungi Biro Akademik jika terdapat ketidaksesuaian data.</p>
                </div>
              )}

              {activeTab === "ai" && (
                <div className="space-y-10">
                   <h3 className="text-2xl font-bold tracking-tight">Assistant Preferences</h3>
                   
                   <div className="space-y-6">
                      <div className="space-y-3">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">AI Interaction Tone</label>
                        <div className="grid grid-cols-3 gap-4">
                          {["Formal", "Friendly", "Concise"].map((tone) => (
                            <button
                              key={tone}
                              onClick={() => setFormData({...formData, ai_tone: tone.toLowerCase()})}
                              className={cn(
                                "py-4 rounded-2xl text-xs font-bold transition-all border",
                                formData.ai_tone === tone.toLowerCase()
                                  ? "bg-indigo-500/10 border-indigo-500/50 text-indigo-400 shadow-xl"
                                  : "bg-white/5 border-white/5 text-zinc-500 hover:text-white"
                              )}
                            >
                              {tone}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-8 rounded-[2.5rem] bg-white/[0.02] border border-white/5">
                        <div className="space-y-1">
                          <p className="text-base font-bold">Push Notifications</p>
                          <p className="text-xs text-zinc-500">Dapatkan peringatan KRS dan deadline tugas via browser.</p>
                        </div>
                        <button 
                          onClick={() => setFormData({...formData, notifications: !formData.notifications})}
                          className={cn(
                            "w-14 h-8 rounded-full transition-all relative p-1",
                            formData.notifications ? "bg-indigo-600" : "bg-zinc-800"
                          )}
                        >
                          <div className={cn(
                            "w-6 h-6 bg-white rounded-full transition-all shadow-lg",
                            formData.notifications ? "ml-6" : "ml-0"
                          )} />
                        </button>
                      </div>
                   </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
