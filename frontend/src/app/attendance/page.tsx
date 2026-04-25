"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { fetcher } from "@/lib/api";
import { QrCode, Send, CheckCircle, AlertCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AttendancePage() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);

  // Lecturer State
  const [sessionData, setSessionData] = useState<{ session_code: string; valid_until: string } | null>(null);

  // Student State
  const [otpCode, setOtpCode] = useState("");

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  const handleStartSession = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch("http://localhost:8000/api/attendance/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${useAuthStore.getState().token}`,
        },
        body: JSON.stringify({ schedule_id: 1, duration_minutes: 15 }), // Hardcoded schedule 1 for MVP
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Gagal memulai sesi");

      setSessionData(data);
      setMessage({ type: "success", text: "Sesi absensi berhasil dimulai!" });
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode) return;

    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch("http://localhost:8000/api/attendance/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${useAuthStore.getState().token}`,
        },
        body: JSON.stringify({ session_code: otpCode.trim() }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Gagal melakukan absensi");

      setMessage({ type: "success", text: data.message });
      setOtpCode("");
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen pt-32 pb-20 px-6 lg:px-12">
      <div className="max-w-3xl mx-auto space-y-12">
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold premium-gradient-text">Smart Attendance</h1>
          <p className="text-zinc-400 text-lg">Sistem Absensi Cepat & Aman</p>
        </div>

        {message && (
          <div
            className={cn(
              "p-6 rounded-2xl border flex items-start gap-4",
              message.type === "error"
                ? "bg-red-500/10 border-red-500/20 text-red-400"
                : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
            )}
          >
            {message.type === "error" ? <AlertCircle className="w-6 h-6 shrink-0" /> : <CheckCircle className="w-6 h-6 shrink-0" />}
            <p className="font-medium text-lg leading-snug">{message.text}</p>
          </div>
        )}

        {user.role === "lecturer" || user.role === "admin" ? (
          <div className="premium-glass !rounded-[3rem] p-10 md:p-14 space-y-8 text-center">
            <div className="w-20 h-20 bg-indigo-500/20 rounded-[2rem] flex items-center justify-center mx-auto shadow-[0_0_50px_rgba(99,102,241,0.2)]">
              <QrCode className="w-10 h-10 text-indigo-400" />
            </div>
            
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Generate Sesi Kelas</h2>
              <p className="text-zinc-400 max-w-md mx-auto">
                Mulai sesi absensi untuk kelas saat ini. Mahasiswa akan membutuhkan kode OTP untuk mencatat kehadiran mereka.
              </p>
            </div>

            {sessionData ? (
              <div className="py-8 space-y-6">
                <p className="text-[10px] uppercase tracking-[0.3em] text-zinc-500 font-bold">KODE OTP KELAS</p>
                <div className="text-7xl font-black tracking-[0.2em] text-white">
                  {sessionData.session_code}
                </div>
                <div className="flex items-center justify-center gap-2 text-amber-400">
                  <Clock className="w-5 h-5" />
                  <p className="font-medium text-sm">
                    Valid sampai: {new Date(sessionData.valid_until).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ) : (
              <button
                onClick={handleStartSession}
                disabled={loading}
                className="primary-button mx-auto px-10 py-4 text-lg"
              >
                {loading ? "Memproses..." : "Mulai Sesi Absensi"}
              </button>
            )}
          </div>
        ) : (
          <div className="premium-glass !rounded-[3rem] p-10 md:p-14">
            <form onSubmit={handleSubmitAttendance} className="space-y-10">
              <div className="space-y-4 text-center">
                <h2 className="text-2xl font-bold">Input Kehadiran</h2>
                <p className="text-zinc-400">Masukkan 6 digit kode OTP yang diberikan oleh dosen Anda.</p>
              </div>

              <div className="space-y-6">
                <input
                  type="text"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.toUpperCase())}
                  maxLength={6}
                  placeholder="X X X X X X"
                  className="w-full text-center text-4xl md:text-5xl font-bold tracking-[0.5em] bg-white/5 border border-white/10 rounded-[2rem] py-8 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-zinc-700 uppercase"
                />
                
                <button
                  type="submit"
                  disabled={loading || otpCode.length !== 6}
                  className="w-full primary-button py-6 text-xl flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-6 h-6" />
                  {loading ? "Memverifikasi..." : "Kirim Absensi"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
