"use client";

import React, { useEffect, useState } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { Users, Search, Target, Shield, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function OrmawaPage() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  const { data: allOrmawas, mutate: mutateAll } = useSWR("/academic/ormawa/", fetcher);
  const { data: myOrmawas, mutate: mutateMy } = useSWR("/academic/ormawa/my", fetcher);

  const handleJoin = async (ormawaId: number) => {
    setIsJoining(true);
    try {
      const response = await fetch("http://localhost:8000/api/ormawa/join", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${useAuthStore.getState().token}`,
        },
        body: JSON.stringify({ ormawa_id: ormawaId }),
      });

      if (response.ok) {
        alert("Berhasil bergabung dengan ORMAWA!");
        mutateAll();
        mutateMy();
      } else {
        const data = await response.json();
        alert(data.detail || "Gagal bergabung");
      }
    } catch (err) {
      alert("Terjadi kesalahan jaringan.");
    } finally {
      setIsJoining(false);
    }
  };

  const filteredOrmawas = allOrmawas?.filter((o: any) => 
    o.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    o.category.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const joinedOrmawaIds = myOrmawas?.map((m: any) => m.id) || [];

  if (!user) return null;

  return (
    <div className="min-h-screen pt-32 pb-20 px-6 lg:px-12 selection:bg-indigo-500/30">
      <div className="max-w-7xl mx-auto space-y-16">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-10">
          <div className="space-y-4">
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight premium-gradient-text leading-tight">
              Eksplorasi ORMAWA
            </h1>
            <p className="text-zinc-400 font-medium text-lg max-w-2xl">
              Organisasi Mahasiswa adalah wadah untuk mengembangkan soft skill, networking, dan pengalaman kepemimpinan.
            </p>
          </div>
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
            <input 
              type="text" 
              placeholder="Cari BEM, UKM, HIMA..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
        </div>

        {/* My Ormawas (If any) */}
        {myOrmawas && myOrmawas.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Target className="w-6 h-6 text-emerald-400" />
              Organisasi Aktif Kamu
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myOrmawas.map((org: any) => (
                <div key={org.id} className="premium-glass !rounded-[2rem] p-6 border border-emerald-500/20 bg-emerald-500/5 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-3xl rounded-full" />
                  <div className="relative z-10 flex justify-between items-start">
                    <div>
                      <span className="px-3 py-1 bg-white/10 rounded-full text-[10px] font-bold uppercase tracking-widest mb-3 inline-block text-zinc-300">
                        {org.category}
                      </span>
                      <h3 className="text-xl font-bold">{org.name}</h3>
                      <p className="text-emerald-400 text-sm font-medium mt-1 uppercase tracking-wider">
                        Role: {org.role}
                      </p>
                    </div>
                    <Shield className="w-8 h-8 text-emerald-500/50" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All Ormawas Grid */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-400" />
            Daftar Lengkap Organisasi
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredOrmawas.length === 0 ? (
              <p className="text-zinc-500 col-span-full">Tidak ada ORMAWA yang ditemukan.</p>
            ) : (
              filteredOrmawas.map((org: any) => {
                const isJoined = joinedOrmawaIds.includes(org.id);
                return (
                  <div key={org.id} className="premium-glass !rounded-[2.5rem] p-8 group premium-glass-hover flex flex-col justify-between h-full">
                    <div className="space-y-4">
                      <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full text-[10px] font-bold uppercase tracking-widest inline-block">
                        {org.category}
                      </span>
                      <h3 className="text-2xl font-bold group-hover:text-indigo-400 transition-colors">{org.name}</h3>
                      <p className="text-zinc-400 leading-relaxed text-sm">
                        {org.description || "Organisasi yang bergerak dalam pengembangan minat dan bakat mahasiswa."}
                      </p>
                    </div>
                    
                    <div className="mt-8 pt-6 border-t border-white/5">
                      {isJoined ? (
                        <div className="w-full py-3 bg-white/5 text-zinc-400 rounded-xl flex items-center justify-center gap-2 font-medium cursor-default">
                          <CheckCircle className="w-4 h-4" />
                          Terdaftar
                        </div>
                      ) : (
                        <button 
                          onClick={() => handleJoin(org.id)}
                          disabled={isJoining}
                          className="w-full primary-button py-3 text-sm flex items-center justify-center"
                        >
                          Bergabung Sekarang
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
