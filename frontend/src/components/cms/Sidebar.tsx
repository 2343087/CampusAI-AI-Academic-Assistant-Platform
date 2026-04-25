"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Terminal, 
  DollarSign, 
  FileText, 
  Users, 
  Activity,
  ShieldCheck,
  Menu,
  X,
  Smartphone
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const menuItems = [
  { name: "Beranda", icon: LayoutDashboard, href: "/dev-console" },
  { name: "Log AI", icon: Terminal, href: "/dev-console/logs" },
  { name: "Monitor Biaya", icon: DollarSign, href: "/dev-console/cost" },
  { name: "Basis Pengetahuan", icon: FileText, href: "/dev-console/documents" },
  { name: "WhatsApp", icon: Smartphone, href: "/dev-console/whatsapp" },
  { name: "Kelola Pengguna", icon: Users, href: "/dev-console/users" },
  { name: "Kesehatan Sistem", icon: Activity, href: "/dev-console/health" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const toggleSidebar = () => setIsOpen(!isOpen);

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-8 pt-32">
        <div className="flex items-center gap-4 mb-12">
          <div className="w-11 h-11 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-[0_0_20px_rgba(79,70,229,0.4)]">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tighter">CampusAI</h1>
            <p className="text-[10px] text-indigo-500 font-bold uppercase tracking-widest">Konsol Admin</p>
          </div>
        </div>

        <nav className="space-y-2">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 group",
                  isActive 
                    ? "bg-indigo-600/10 text-indigo-400 shadow-sm border border-indigo-500/10" 
                    : "text-zinc-500 hover:bg-white/5 hover:text-white"
                )}
              >
                <item.icon className={cn(
                  "w-5 h-5 transition-colors",
                  isActive ? "text-indigo-400" : "text-zinc-600 group-hover:text-zinc-300"
                )} />
                <span className="font-bold text-sm tracking-tight">{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto p-8">
        <div className="rounded-[2rem] bg-zinc-900/30 border border-white/5 p-6 backdrop-blur-xl">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Status Sistem</span>
          </div>
          <p className="text-sm font-bold text-zinc-200">Semua Sistem Normal</p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Toggle Button */}
      <button 
        onClick={toggleSidebar}
        className="lg:hidden fixed bottom-8 right-8 z-[110] w-14 h-14 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-2xl active:scale-95 transition-transform"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Backdrop for Mobile */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-[280px] sticky top-0 h-screen border-r border-white/5 bg-[#030303] flex-col shrink-0 overflow-y-auto z-[90]">
        <SidebarContent />
      </aside>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 left-0 w-[300px] bg-[#030303] z-[105] border-r border-white/10 lg:hidden shadow-[30px_0_100px_rgba(0,0,0,0.5)]"
          >
            <SidebarContent />
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
