"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ShieldCheck, 
  User, 
  LogOut, 
  MessageSquare, 
  LayoutDashboard, 
  Settings,
  Bell,
  Menu,
  X,
  ChevronDown
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { cn } from "@/lib/utils";
import api from "@/lib/api";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout, isAuthenticated, token } = useAuthStore();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isAuthenticated()) {
      fetchNotifications();
    }
  }, [pathname, token]);

  const fetchNotifications = async () => {
    try {
      const response = await api.get("/notifications/active");
      setNotifications(response.data);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const isStaff = user?.role?.toLowerCase() === "admin" || user?.role?.toLowerCase() === "developer";

  const navLinks = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Chat AI", href: "/chat", icon: MessageSquare },
    ...(isStaff ? [{ name: "Dev Console", href: "/dev-console", icon: ShieldCheck }] : []),
  ];

  if (!mounted) return null;
  
  const isAuthPage = pathname === "/login" || pathname === "/register";
  if (isAuthPage) return null;

  const roleDisplay = user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : "Student";

  return (
    <nav className="fixed top-0 w-full z-[100] px-6 py-6 transition-all duration-500">
      <div className="max-w-7xl mx-auto">
        <div className="premium-glass !rounded-[2rem] px-8 py-4 flex items-center justify-between border-white/[0.08] shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-4 group">
            <div className="w-11 h-11 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-[0_0_30px_rgba(79,70,229,0.5)] group-hover:scale-110 transition-all duration-500">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold tracking-tighter hidden md:block outfit-font">CampusAI</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "px-6 py-2.5 rounded-2xl text-sm font-semibold transition-all duration-500 flex items-center gap-3",
                  pathname === link.href 
                    ? "bg-white/10 text-white shadow-inner" 
                    : "text-zinc-500 hover:text-white hover:bg-white/5"
                )}
              >
                <link.icon className={cn("w-4 h-4", pathname === link.href ? "text-indigo-400" : "text-zinc-600")} />
                {link.name}
              </Link>
            ))}
            {!isAuthenticated() && (
              <Link href="/login" className="px-8 py-2.5 bg-white text-black rounded-2xl text-sm font-bold hover:bg-zinc-200 transition-all ml-4 shadow-xl">
                Sign In
              </Link>
            )}
          </div>

          {/* User Actions */}
          <div className="flex items-center gap-5">
            {isAuthenticated() && (
              <>
                <div className="relative">
                  <button 
                    onClick={() => setIsNotifOpen(!isNotifOpen)}
                    className={cn(
                      "w-11 h-11 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center transition-all duration-500 hover:bg-white/10",
                      notifications.length > 0 ? "text-indigo-400" : "text-zinc-500 hover:text-white"
                    )}
                  >
                    <Bell className="w-5 h-5" />
                    {notifications.length > 0 && (
                      <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-indigo-500 rounded-full border-2 border-[#030303] animate-pulse" />
                    )}
                  </button>

                  <AnimatePresence>
                    {isNotifOpen && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setIsNotifOpen(false)} />
                        <motion.div
                          initial={{ opacity: 0, y: 15, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 15, scale: 0.95 }}
                          className="absolute right-0 mt-4 w-96 premium-glass !rounded-[2.5rem] p-6 z-20 shadow-[0_30px_100px_rgba(0,0,0,0.8)]"
                        >
                          <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold tracking-tight">Activity</h3>
                            <span className="text-[10px] bg-indigo-500 text-white px-3 py-1 rounded-full font-bold uppercase tracking-widest">{notifications.length} New</span>
                          </div>
                          
                          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                            {notifications.length === 0 ? (
                              <div className="text-center py-12 space-y-4 opacity-40">
                                <Bell className="w-10 h-10 mx-auto" />
                                <p className="text-xs font-medium italic">Everything is quiet...</p>
                              </div>
                            ) : (
                              notifications.map((n) => (
                                <div key={n.id} className="p-5 rounded-3xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/20 transition-all duration-300 cursor-pointer group">
                                  <p className="text-xs font-bold text-indigo-400 mb-2 uppercase tracking-widest opacity-80 group-hover:opacity-100">{n.title}</p>
                                  <p className="text-sm text-zinc-400 font-medium leading-relaxed">{n.message}</p>
                                </div>
                              ))
                            )}
                          </div>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>

                <div className="relative">
                  <button 
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center gap-4 pl-1.5 pr-4 py-1.5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-500 group"
                  >
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-lg">
                      {user?.full_name?.charAt(0) || "U"}
                    </div>
                    <div className="hidden sm:block text-left">
                      <p className="text-sm font-bold leading-none mb-1 group-hover:text-indigo-400 transition-colors">{user?.full_name?.split(' ')[0]}</p>
                      <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-tighter">{roleDisplay} Account</p>
                    </div>
                    <ChevronDown className={cn("w-4 h-4 text-zinc-600 transition-transform duration-500", isProfileOpen ? "rotate-180" : "")} />
                  </button>

                  <AnimatePresence>
                    {isProfileOpen && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setIsProfileOpen(false)} />
                        <motion.div
                          initial={{ opacity: 0, y: 15, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 15, scale: 0.95 }}
                          className="absolute right-0 mt-4 w-72 premium-glass !rounded-[2.5rem] p-3 z-20 shadow-[0_30px_100px_rgba(0,0,0,0.8)]"
                        >
                          <div className="px-6 py-5 border-b border-white/5 mb-2">
                            <p className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-bold mb-2">Authorized User</p>
                            <p className="text-sm font-bold text-white truncate">{user?.email}</p>
                          </div>
                          
                          <div className="p-2 space-y-1">
                            <Link 
                              href="/dashboard"
                              onClick={() => setIsProfileOpen(false)}
                              className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-sm font-semibold text-zinc-400 hover:text-white hover:bg-white/5 transition-all duration-300"
                            >
                              <User className="w-5 h-5 text-zinc-600" />
                              View Profile
                            </Link>
                            <Link 
                              href="/settings"
                              onClick={() => setIsProfileOpen(false)}
                              className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-sm font-semibold text-zinc-400 hover:text-white hover:bg-white/5 transition-all duration-300"
                            >
                              <Settings className="w-5 h-5 text-zinc-600" />
                              Account Settings
                            </Link>
                            
                            <div className="h-px bg-white/5 my-3 mx-4" />
                            
                            <button 
                              onClick={handleLogout}
                              className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-sm font-bold text-red-400 hover:bg-red-500/10 transition-all duration-300"
                            >
                              <LogOut className="w-5 h-5" />
                              Sign Out
                            </button>
                          </div>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              </>
            )}

            {/* Mobile Menu Toggle */}
            <button 
              className="md:hidden w-11 h-11 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden mt-6 premium-glass !rounded-[2.5rem] p-6 space-y-3 overflow-hidden shadow-2xl"
          >
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={cn(
                  "w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-sm font-bold",
                  pathname === link.href 
                    ? "bg-white/10 text-white" 
                    : "text-zinc-500"
                )}
              >
                <link.icon className="w-5 h-5" />
                {link.name}
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
