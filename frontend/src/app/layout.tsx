import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "CampusAI — AI Academic Assistant Platform",
  description:
    "Platform AI terpadu untuk mahasiswa, dosen, dan admin kampus. Chatbot cerdas, dashboard akademik, bimbingan skripsi, dan notifikasi proaktif.",
  keywords: ["campusai", "ai", "kampus", "akademik", "chatbot", "mahasiswa", "skripsi"],
};

import Navbar from "@/components/Navbar";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <div className="bg-mesh" />
        <Navbar />
        {children}
      </body>
    </html>
  );
}
