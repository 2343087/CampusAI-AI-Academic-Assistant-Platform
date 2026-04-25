"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  User,
  Sparkles,
  ChevronLeft,
  Settings,
  MoreHorizontal,
  Bot,
  Trash2,
  Paperclip,
  Clock,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/useAuthStore";
import api from "@/lib/api";
import gsap from "gsap";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  intent?: string;
  timestamp: string;
}

export default function ChatPage() {
  const router = useRouter();
  const { user, token, isAuthenticated } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Auth Guard
  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  // Load History
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await api.get("/chat/history");
        const historyData = response.data;
        setChatHistory(historyData);

        const history = historyData.flatMap((h: any) => [
          { 
            id: h.id.toString() + "_q", 
            role: "user", 
            content: h.query, 
            timestamp: h.timestamp ? new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Recently"
          },
          { 
            id: h.id.toString() + "_a", 
            role: "assistant", 
            content: h.response, 
            timestamp: h.timestamp ? new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Recently"
          }
        ]);
        
        setMessages(history);
      } catch (err) {
        console.error("Failed to fetch history:", err);
      }
    };
    fetchHistory();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const apiUrl = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api").replace(/\/$/, "");
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(`${apiUrl}/chat/stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: input }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!response.ok) throw new Error("Stream failed");

      const assistantMessageId = (Date.now() + 1).toString();
      setMessages((prev) => [
        ...prev,
        { 
          id: assistantMessageId, 
          role: "assistant", 
          content: "", 
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
        },
      ]);

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6));
                fullContent += data.chunk;
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMessageId ? { ...msg, content: fullContent } : msg
                  )
                );
              } catch (e) {}
            }
          }
        }
      }
    } catch (err) {
      console.error("Chat error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = async () => {
    if (!confirm("Hapus semua riwayat chat kamu?")) return;
    try {
      await api.delete("/chat/history");
      setMessages([]);
      setChatHistory([]);
    } catch (err) {
      console.error("Failed to clear chat:", err);
    }
  };

  const handleNewChat = () => {
    setMessages([]);
  };

  return (
    <div className="flex h-screen bg-[#030303] overflow-hidden pt-24 selection:bg-indigo-500/30">
      {/* Sidebar - Desktop Only */}
      <div className="hidden lg:flex w-[340px] flex-col border-r border-white/5 bg-white/[0.01] backdrop-blur-3xl p-8">
        <button 
          onClick={handleNewChat}
          className="w-full primary-button !py-4 mb-10 shadow-[0_0_30px_rgba(79,70,229,0.2)]"
        >
          <Sparkles className="w-4 h-4" />
          Chat Baru
        </button>

        <div className="flex-1 overflow-y-auto space-y-10 custom-scrollbar pr-2">
          <div>
            <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.3em] mb-6 px-2">Terbaru</p>
            <div className="space-y-2">
              {chatHistory.length === 0 ? (
                <p className="px-4 py-3 text-xs text-zinc-600 italic font-medium">Belum ada percakapan</p>
              ) : (
                chatHistory.slice(0, 12).map((item, i) => (
                  <button 
                    key={i} 
                    onClick={() => setInput(item.query)}
                    className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl text-sm text-zinc-500 hover:text-white hover:bg-white/5 transition-all duration-300 group text-left border border-transparent hover:border-white/5"
                  >
                    <Clock className="w-4 h-4 text-zinc-700 group-hover:text-indigo-400" />
                    <span className="truncate font-medium">{item.query}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-white/5">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center shadow-xl">
                <Bot className="w-7 h-7 text-indigo-500" />
              </div>
              <div>
                <p className="text-sm font-bold">Llama 3.3</p>
                <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">Sistem Aktif</p>
              </div>
            </div>
            <div className="p-2.5 rounded-xl hover:bg-white/5 cursor-pointer transition-colors text-zinc-600 hover:text-white">
              <Settings className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative">
        {/* Chat Header */}
        <div className="h-20 border-b border-white/5 flex items-center justify-between px-10 bg-white/[0.01] backdrop-blur-2xl">
          <div className="flex items-center gap-6">
            <button onClick={() => router.push("/dashboard")} className="lg:hidden p-3 hover:bg-white/5 rounded-2xl">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-11 h-11 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center">
                   <Sparkles className="w-5 h-5 text-indigo-400" />
                </div>
                <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#030303] flex items-center justify-center rounded-full">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                </span>
              </div>
              <div>
                <h2 className="text-base font-bold tracking-tight">Asisten Kampus</h2>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Didukung RAG v2.0</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={handleClearChat}
              className="p-3 hover:bg-white/5 rounded-2xl text-zinc-600 hover:text-red-400 transition-all duration-300"
              title="Hapus Percakapan"
            >
              <Trash2 className="w-5 h-5" />
            </button>
            <button className="p-3 hover:bg-white/5 rounded-2xl text-zinc-600 hover:text-white transition-all">
              <MoreHorizontal className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Messages List */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-8 md:p-14 space-y-12 scroll-smooth custom-scrollbar"
        >
          <AnimatePresence initial={false}>
            {messages.length === 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="h-full flex flex-col items-center justify-center text-center max-w-lg mx-auto space-y-10"
              >
                <div className="w-24 h-24 rounded-[2.5rem] bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center shadow-[0_20px_50px_rgba(79,70,229,0.2)]">
                  <Bot className="w-12 h-12 text-indigo-500" />
                </div>
                <div className="space-y-4">
                  <h3 className="text-3xl md:text-4xl font-bold tracking-tight premium-gradient-text">Apa yang bisa saya bantu?</h3>
                  <p className="text-zinc-500 text-base leading-relaxed font-medium">
                    Saya asisten akademik AI kamu. Tanyakan apa saja mulai dari jadwal kuliah hingga review draft skripsi.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4 w-full">
                  {["Jadwal hari ini", "Saran KRS", "Cek Nilai", "Review Skripsi"].map((tag) => (
                    <button 
                      key={tag}
                      onClick={() => setInput(`Tolong cek ${tag.toLowerCase()}`)}
                      className="px-6 py-4 rounded-2xl bg-white/[0.03] border border-white/5 text-xs font-bold text-zinc-500 hover:text-white hover:bg-white/10 hover:border-white/10 transition-all duration-300 uppercase tracking-widest"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {messages.map((msg, i) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "flex items-start gap-6 max-w-4xl",
                  msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                )}
              >
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border shadow-2xl",
                  msg.role === "user" 
                    ? "bg-white text-black border-white" 
                    : "bg-indigo-600/10 border-indigo-500/20 text-indigo-500"
                )}>
                  {msg.role === "user" ? <User className="w-6 h-6" /> : <Bot className="w-6 h-6" />}
                </div>
                
                <div className={cn("space-y-3 max-w-[85%]", msg.role === "user" ? "text-right" : "text-left")}>
                  {/* Intelligence Metadata */}
                  {msg.role === "assistant" && (
                    <div className="flex items-center gap-3 mb-2 px-1">
                       <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-lg uppercase tracking-widest">
                         {msg.intent || "Logika Hybrid"}
                       </span>
                       <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
                         Llama 3.3
                       </span>
                    </div>
                  )}

                  <div className={cn(
                    "p-8 rounded-[2.5rem] text-base md:text-lg leading-relaxed shadow-2xl prose prose-invert max-w-none font-medium",
                    msg.role === "user" 
                      ? "bg-white/[0.05] border border-white/10 text-white rounded-tr-none" 
                      : "premium-glass text-zinc-200 rounded-tl-none border-indigo-500/10"
                  )}>
                    <ReactMarkdown>
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                  <div className="flex items-center gap-4 px-4">
                    <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.2em]">
                      {msg.timestamp}
                    </p>
                    {msg.role === "assistant" && (
                      <div className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-pulse" title="Source Grounded" />
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {isLoading && (
            <div className="flex items-center gap-4 text-indigo-400 font-bold text-[10px] uppercase tracking-widest ml-20">
              <div className="flex gap-1.5">
                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
              </div>
              Menganalisis Kecerdasan Neural...
            </div>
          )}
        </div>

        {/* Chat Input Area */}
        <div className="p-8 md:p-14 pt-0">
          <form 
            onSubmit={handleSendMessage}
            className="max-w-4xl mx-auto relative group"
          >
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600/30 via-purple-600/30 to-pink-600/30 rounded-[3rem] blur-xl opacity-0 group-focus-within:opacity-100 transition duration-1000" />
            <div className="relative premium-glass !rounded-[2.8rem] p-3 flex items-center gap-4 border-white/10">
              <button type="button" className="p-5 hover:bg-white/5 rounded-3xl transition-all text-zinc-600 hover:text-white">
                <Paperclip className="w-6 h-6" />
              </button>
              <input 
                type="text"
                placeholder="Ketik pesan akademik..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none text-base md:text-lg py-5 px-3 placeholder:text-zinc-700 text-white font-medium"
              />
              <button 
                type="submit"
                disabled={!input.trim() || isLoading}
                className="w-16 h-16 rounded-[2rem] bg-white text-black flex items-center justify-center hover:bg-zinc-200 hover:scale-105 active:scale-95 transition-all duration-300 disabled:opacity-20 disabled:scale-100 shadow-2xl"
              >
                <Send className="w-6 h-6" />
              </button>
            </div>
          </form>
          <p className="text-center text-[10px] text-zinc-700 mt-8 uppercase tracking-[0.2em] font-bold">
            CampusAI Intelligence Protocol v2.0 • Data Security AES-256 Enabled
          </p>
        </div>
      </div>
    </div>
  );
}
