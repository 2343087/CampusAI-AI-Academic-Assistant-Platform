"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronRight, MessageSquare, Sparkles, ShieldCheck, Globe, Zap, Cpu } from "lucide-react";
import gsap from "gsap";
import ThreeBackground from "@/components/ThreeBackground";

export default function LandingPage() {
  const containerRef = useRef<HTMLDivElement>(null);

  const hasAnimated = useRef(false);

  useEffect(() => {
    if (hasAnimated.current) return;
    
    const ctx = gsap.context(() => {
      gsap.fromTo(".gsap-reveal", 
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 1.2,
          stagger: 0.2,
          ease: "power4.out",
          delay: 0.3,
          onComplete: () => { hasAnimated.current = true; }
        }
      );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="relative min-h-screen flex flex-col items-center overflow-hidden">
      <ThreeBackground />

      {/* Hero Section */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 pt-32 pb-20 text-center max-w-6xl mx-auto">
        <div className="gsap-reveal inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs font-bold uppercase tracking-[0.3em] mb-10 text-indigo-400">
          <Sparkles className="w-3 h-3" />
          The Next Gen AI Operating System
        </div>

        <h1 className="gsap-reveal text-6xl md:text-8xl font-extrabold tracking-tight mb-8 leading-[1.1]">
          Satu Pintu untuk <br />
          <span className="accent-gradient-text">Masa Depan Kampus</span>
        </h1>

        <p className="gsap-reveal text-lg md:text-xl text-zinc-400 max-w-2xl mb-12 leading-relaxed font-medium">
          Transformasi akademik dengan kecerdasan buatan. Dari administrasi cerdas hingga asisten riset skripsi yang mendampingi setiap langkahmu.
        </p>

        <div className="gsap-reveal flex flex-col sm:flex-row items-center gap-6">
          <Link href="/register" className="primary-button group shadow-indigo-500/20">
            Mulai Eksplorasi
            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link href="/chat" className="secondary-button group">
            <MessageSquare className="w-5 h-5 text-indigo-400" />
            Coba Chat AI
          </Link>
        </div>

        {/* Stats / Trust Badges */}
        <div className="gsap-reveal grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-16 mt-32 pt-20 border-t border-white/5 w-full">
          {[
            { label: "Kampus Partner", value: "10+" },
            { label: "AI Accuracy", value: "99.8%" },
            { label: "Data Secured", value: "AES-256" },
            { label: "Response Time", value: "< 200ms" },
          ].map((stat, i) => (
            <div key={i} className="space-y-2 text-center md:text-left">
              <p className="text-3xl md:text-4xl font-bold tracking-tighter">{stat.value}</p>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{stat.label}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Features Preview */}
      <section className="relative z-10 w-full px-6 py-32 bg-white/[0.01]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20 space-y-4">
             <h2 className="text-4xl md:text-5xl font-bold tracking-tight">Built for Performance</h2>
             <p className="text-zinc-500 max-w-xl mx-auto">CampusAI dirancang untuk memberikan kecepatan dan akurasi tinggi dalam setiap interaksi akademik.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Zap, title: "Instant RAG", desc: "Akses database kampus secara real-time dengan teknologi Retrieval Augmented Generation." },
              { icon: ShieldCheck, title: "Academic Integrity", desc: "AI yang paham etika akademik dan membantu riset tanpa plagiarisme." },
              { icon: Globe, title: "Universal Adopt", desc: "Siap diintegrasikan dengan berbagai sistem informasi akademik (SIAKAD)." },
            ].map((feature, i) => (
              <div key={i} className="premium-glass !rounded-[2.5rem] p-10 premium-glass-hover">
                <div className="w-14 h-14 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center mb-8">
                  <feature.icon className="w-7 h-7 text-indigo-400" />
                </div>
                <h3 className="text-xl font-bold mb-4">{feature.title}</h3>
                <p className="text-sm text-zinc-500 leading-relaxed font-medium">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 w-full px-6 py-10 border-t border-white/5 text-center">
        <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.3em]">
          &copy; 2026 CampusAI — New Apex Protocol by Delong
        </p>
      </footer>
    </div>
  );
}
