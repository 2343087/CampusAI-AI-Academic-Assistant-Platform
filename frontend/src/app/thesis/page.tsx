"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  FileText, 
  Sparkles, 
  History, 
  Send, 
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  ArrowRight,
  BookOpen
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "framer-motion";
import gsap from "gsap";
import api from "@/lib/api";
import { cn } from "@/lib/utils";

export default function ThesisPage() {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"submit" | "history">("submit");
  const containerRef = useRef<HTMLDivElement>(null);

  const hasAnimated = useRef(false);

  useEffect(() => {
    if (containerRef.current && !hasAnimated.current) {
      const ctx = gsap.context(() => {
        gsap.fromTo(".thesis-reveal", 
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
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setLoading(true);
    setFeedback(null);
    try {
      const res = await api.post("/thesis/submit", { 
        thesis_id: 1,
        content 
      });
      setFeedback(res.data.ai_feedback);
    } catch (err) {
      console.error("Thesis submit error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div ref={containerRef} className="min-h-screen pt-32 pb-20 px-6 lg:px-12 selection:bg-indigo-500/30">
      <div className="max-w-7xl mx-auto space-y-12">
        
        {/* Header Section */}
        <div className="thesis-reveal flex flex-col md:flex-row md:items-end justify-between gap-10">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-400">
              <BookOpen className="w-3.5 h-3.5" />
              Academic Research Assistant
            </div>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight premium-gradient-text leading-tight">
              Bimbingan Skripsi AI
            </h1>
            <p className="text-zinc-400 font-medium text-lg md:text-xl max-w-2xl">
              Sempurnakan draf akademik kamu dengan analisis berbasis kecerdasan buatan yang mendalam.
            </p>
          </div>
          
          <div className="flex bg-white/5 p-1.5 rounded-[1.5rem] border border-white/10 backdrop-blur-3xl shadow-2xl">
            {["submit", "history"].map((tab) => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={cn(
                  "px-8 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all duration-500",
                  activeTab === tab 
                    ? "bg-white text-black shadow-xl scale-[1.02]" 
                    : "text-zinc-500 hover:text-white"
                )}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          
          {/* Editor Panel */}
          <div className="thesis-reveal space-y-6 h-full">
            <div className="premium-glass !rounded-[3rem] p-10 md:p-12 flex flex-col h-full min-h-[600px] group premium-glass-hover">
               <div className="flex items-center justify-between mb-10">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center">
                      <FileText className="w-6 h-6 text-indigo-400" />
                    </div>
                    <h3 className="text-xl font-bold tracking-tight">Draft Editor</h3>
                  </div>
                  <div className="px-5 py-2 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                    Words: {content.split(/\s+/).filter(x => x).length}
                  </div>
               </div>
               
               <textarea
                 className="flex-1 w-full bg-transparent border-none resize-none focus:outline-none text-zinc-300 leading-relaxed placeholder:text-zinc-700 text-lg font-medium scrollbar-hide"
                 placeholder="Tempelkan draf Bab skripsi lo di sini Bang..."
                 value={content}
                 onChange={(e) => setContent(e.target.value)}
               />
               
               <div className="mt-10 pt-10 border-t border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-3 text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
                    <AlertCircle className="w-4 h-4 text-amber-500/50" />
                    Optimal for 100+ words
                  </div>
                  <button 
                    onClick={handleSubmit}
                    disabled={loading || !content}
                    className="primary-button group !px-10"
                  >
                    {loading ? "Analyzing..." : (
                      <>
                        Analyze with AI
                        <Sparkles className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                      </>
                    )}
                  </button>
               </div>
            </div>
          </div>

          {/* Feedback Panel */}
          <div className="thesis-reveal space-y-6 h-full">
             <div className="premium-glass !rounded-[3rem] p-10 md:p-12 bg-indigo-600/[0.02] border-indigo-500/10 flex flex-col h-full min-h-[600px] overflow-hidden relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/5 rounded-full blur-[100px] -mr-32 -mt-32" />
                
                <div className="flex items-center gap-4 mb-10 text-indigo-400 relative z-10">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold tracking-tight">AI Feedback Intelligence</h3>
                </div>
                
                <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar relative z-10">
                  <AnimatePresence mode="wait">
                    {feedback ? (
                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="prose prose-invert prose-indigo max-w-none prose-p:text-zinc-300 prose-headings:text-white prose-p:leading-relaxed prose-p:font-medium"
                      >
                        <ReactMarkdown>{feedback}</ReactMarkdown>
                      </motion.div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-center space-y-8 opacity-40">
                        <div className="w-24 h-24 rounded-full bg-white/5 border border-white/5 flex items-center justify-center animate-pulse">
                          <MessageSquare className="w-10 h-10 text-zinc-600" />
                        </div>
                        <div className="space-y-2">
                          <p className="text-xl font-bold text-white">Menunggu Draf kamu...</p>
                          <p className="text-sm text-zinc-500 font-medium">Kirimkan draf kamu untuk mendapatkan analisis <br/>struktur, tata bahasa, dan orisinalitas.</p>
                        </div>
                      </div>
                    )}
                  </AnimatePresence>
                </div>

                {feedback && (
                  <div className="mt-10 pt-10 border-t border-white/5 flex items-center gap-6 relative z-10">
                     <button className="flex-1 py-4 rounded-2xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white text-xs font-bold transition-all flex items-center justify-center gap-3 border border-white/5">
                        <History className="w-4 h-4" />
                        Save for Later
                     </button>
                     <button className="flex-1 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-3 shadow-[0_20px_50px_rgba(79,70,229,0.3)]">
                        <CheckCircle2 className="w-4 h-4" />
                        Submit to Lecturer
                        <ArrowRight className="w-4 h-4" />
                     </button>
                  </div>
                )}
             </div>
          </div>

        </div>
      </div>
    </div>
  );
}
