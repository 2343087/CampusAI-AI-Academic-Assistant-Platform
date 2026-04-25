"use client";

import React from "react";
import { Users, UserPlus, Search, MoreVertical } from "lucide-react";
import { cn } from "@/lib/utils";

const users = [
  { name: "Main Developer", email: "dev@campusai.com", role: "DEVELOPER", status: "Aktif" },
  { name: "Budi Raharjo", email: "budi@campus.edu", role: "MAHASISWA", status: "Aktif" },
  { name: "Dr. Tech", email: "tech@campus.edu", role: "DOSEN", status: "Aktif" },
  { name: "Admin Kampus", email: "admin@campusai.id", role: "ADMIN", status: "Aktif" },
];

export default function UsersPage() {
  return (
    <div className="space-y-10 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight premium-gradient-text">Kelola Pengguna</h1>
          <p className="text-zinc-400 font-medium mt-2">Atur pengguna kampus dan peran akses mereka.</p>
        </div>
        <button className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all active:scale-95">
          <UserPlus className="w-5 h-5" />
          Tambah Pengguna
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600" />
        <input 
          type="text" 
          placeholder="Cari berdasarkan nama, email, atau peran..." 
          className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-4 pl-14 pr-4 focus:outline-none focus:border-indigo-500/50 transition-all text-sm"
        />
      </div>

      {/* Tabel Pengguna — Responsive */}
      {/* Desktop Table */}
      <div className="hidden md:block rounded-3xl bg-white/[0.02] border border-white/5 overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-white/5 bg-white/[0.03]">
              <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-widest">Pengguna</th>
              <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-widest">Peran</th>
              <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-widest">Status</th>
              <th className="px-6 py-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {users.map((user) => (
              <tr key={user.email} className="hover:bg-white/[0.03] transition-colors group">
                <td className="px-6 py-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600/20 flex items-center justify-center text-indigo-400 font-bold text-sm">
                      {user.name[0]}
                    </div>
                    <div>
                      <p className="font-bold text-sm">{user.name}</p>
                      <p className="text-xs text-zinc-500">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <span className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-bold tracking-widest",
                    user.role === "DEVELOPER" ? "bg-purple-500/10 text-purple-400 border border-purple-500/20" :
                    user.role === "ADMIN" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                    user.role === "DOSEN" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                    "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                  )}>
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-5">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span className="text-sm font-medium">{user.status}</span>
                  </div>
                </td>
                <td className="px-6 py-5 text-right">
                  <button className="text-zinc-600 hover:text-white transition-colors">
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-4">
        {users.map((user) => (
          <div key={user.email} className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600/20 flex items-center justify-center text-indigo-400 font-bold text-sm">
                  {user.name[0]}
                </div>
                <div>
                  <p className="font-bold text-sm">{user.name}</p>
                  <p className="text-xs text-zinc-500">{user.email}</p>
                </div>
              </div>
              <button className="text-zinc-600 hover:text-white transition-colors">
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-white/5">
              <span className={cn(
                "px-3 py-1 rounded-full text-[10px] font-bold tracking-widest",
                user.role === "DEVELOPER" ? "bg-purple-500/10 text-purple-400 border border-purple-500/20" :
                user.role === "ADMIN" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                user.role === "DOSEN" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                "bg-blue-500/10 text-blue-400 border border-blue-500/20"
              )}>
                {user.role}
              </span>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="text-xs font-medium text-zinc-400">{user.status}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
