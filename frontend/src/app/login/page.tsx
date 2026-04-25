"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Mail, Lock, ChevronRight, Sparkles, CheckCircle2, ShieldCheck } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import api from "@/lib/api";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token, isAuthenticated, setAuth } = useAuthStore();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (isAuthenticated() && typeof window !== "undefined") {
      const userStr = localStorage.getItem("dev_user");
      if (userStr) {
        try {
          const userObj = JSON.parse(userStr);
          const role = userObj.role?.toLowerCase();
          if (role === "admin" || role === "developer") {
            router.push("/dev-console");
          } else if (role === "lecturer") {
            router.push("/dashboard/lecturer");
          } else {
            router.push("/dashboard");
          }
          return;
        } catch (e) {}
      }
      router.push("/dashboard");
    }
  }, [token, router, isAuthenticated]);

  useEffect(() => {
    if (searchParams.get("registered")) {
      setShowSuccess(true);
    }
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await api.post("/auth/login", { email, password });
      const { access_token, user } = response.data;
      
      setAuth(access_token, user);
      localStorage.setItem("dev_token", access_token);
      localStorage.setItem("dev_user", JSON.stringify(user));
      
      const role = user.role?.toLowerCase();
      if (role === "admin" || role === "developer") {
        router.push("/dev-console");
      } else if (role === "lecturer") {
        router.push("/dashboard/lecturer");
      } else {
        router.push("/dashboard");
      }
    } catch (err: any) {
      if (err.code === "ECONNABORTED") {
        setError("Koneksi ke server lambat. Silakan coba lagi.");
      } else {
        setError(err.response?.data?.detail || "Email atau password salah.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030303] text-white flex flex-col items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "circOut" }}
        className="w-full max-w-md space-y-10"
      >
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-indigo-600 rounded-[2.5rem] mx-auto flex items-center justify-center shadow-[0_0_50px_rgba(79,70,229,0.3)] animate-float">
            <ShieldCheck className="w-10 h-10 text-white" />
          </div>
          <div className="space-y-1">
            <h1 className="text-4xl font-bold tracking-tight premium-gradient-text">Sign In</h1>
            <p className="text-zinc-500 font-medium">Welcome back to your academic portal</p>
          </div>
        </div>

        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-5 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center gap-3 backdrop-blur-xl"
          >
            <CheckCircle2 className="w-5 h-5" />
            Pendaftaran berhasil! Silakan masuk.
          </motion.div>
        )}

        <form onSubmit={handleLogin} className="glass-card !rounded-[3rem] p-10 space-y-8">
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] ml-1">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600 group-focus-within:text-indigo-500 transition-colors duration-300" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@university.ac.id"
                  className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-5 pl-14 pr-6 text-sm focus:outline-none focus:border-indigo-500/50 transition-all placeholder:text-zinc-800"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] ml-1">Password</label>
              <div className="relative group">
                <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600 group-focus-within:text-indigo-500 transition-colors duration-300" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-5 pl-14 pr-6 text-sm focus:outline-none focus:border-indigo-500/50 transition-all placeholder:text-zinc-800"
                />
              </div>
            </div>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold text-center backdrop-blur-xl"
            >
              {error}
            </motion.div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="primary-button w-full shadow-[0_10px_30px_rgba(255,255,255,0.1)] group"
          >
            {isLoading ? "Verifying..." : "Masuk"}
            {!isLoading && <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
          </button>
        </form>

        <p className="text-center text-sm text-zinc-500 font-medium">
          Belum punya akun?{" "}
          <Link href="/register" className="text-white font-bold hover:text-indigo-400 transition-colors">
            Daftar di sini
          </Link>
        </p>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#030303] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
