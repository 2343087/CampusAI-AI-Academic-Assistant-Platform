"use client";

import React, { useEffect } from "react";
import Sidebar from "@/components/cms/Sidebar";
import { useAuthStore } from "@/store/useAuthStore";
import { useRouter } from "next/navigation";

export default function CMSLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }

    const role = user?.role?.toLowerCase();
    if (role !== "admin" && role !== "developer") {
      router.push("/dashboard");
    }
  }, [user, isAuthenticated, router]);

  if (!isAuthenticated() || (user?.role?.toLowerCase() !== "admin" && user?.role?.toLowerCase() !== "developer")) {
    return <div className="min-h-screen bg-[#030303]" />;
  }

  return (
    <div className="flex min-h-screen bg-[#030303] text-white selection:bg-indigo-500/30">
      <Sidebar />
      <main className="flex-1 overflow-y-auto pt-32 pb-20 px-6 md:px-12 lg:px-16 custom-scrollbar">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
