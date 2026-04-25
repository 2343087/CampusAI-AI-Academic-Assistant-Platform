"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Users, 
  FileText, 
  CheckCircle2, 
  Clock, 
  MessageSquare, 
  ChevronRight,
  Search,
  Filter,
  Send
} from "lucide-react";
import api from "@/lib/api";
import { useAuthStore } from "@/store/useAuthStore";
import { useRouter } from "next/navigation";

export default function LecturerDashboard() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSub, setSelectedSub] = useState<any>(null);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }
    const role = user?.role?.toLowerCase();
    if (role !== "lecturer" && role !== "admin" && role !== "developer") {
      router.push("/dashboard");
    }
  }, [user, isAuthenticated, router]);

  useEffect(() => {
    if (!user || user.role?.toLowerCase() === "student") return;
    // Mock fetching for now, replace with real lecturer endpoint
    const fetchSubmissions = async () => {
      try {
        const response = await api.get("/thesis/lecturer/submissions");
        setSubmissions(response.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSubmissions();
  }, []);

  const handleReview = async () => {
    if (!selectedSub || !feedback) return;
    try {
      await api.post("/thesis/review", {
        submission_id: selectedSub.submission_id,
        lecturer_feedback: feedback,
        status: "in_progress"
      });
      alert("Feedback berhasil dikirim!");
      setSelectedSub(null);
      setFeedback("");
    } catch (err) {
      alert("Gagal mengirim feedback");
    }
  };

  return (
    <div className="min-h-screen bg-[#030303] text-white pt-28 pb-20 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-bold font-outfit mb-2">Lecturer Console</h1>
            <p className="text-zinc-400">Monitor and review your students' academic progress.</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-400" />
              <span className="text-sm font-medium">12 Students</span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {[
            { label: "Pending Reviews", value: "8", icon: Clock, color: "text-amber-400" },
            { label: "Drafts Approved", value: "24", icon: CheckCircle2, color: "text-emerald-400" },
            { label: "Total Submissions", value: "142", icon: FileText, color: "text-indigo-400" },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="p-6 rounded-3xl bg-white/[0.02] border border-white/10 backdrop-blur-xl"
            >
              <stat.icon className={`w-6 h-6 ${stat.color} mb-4`} />
              <p className="text-zinc-500 text-sm mb-1">{stat.label}</p>
              <p className="text-3xl font-bold font-outfit">{stat.value}</p>
            </motion.div>
          ))}
        </div>

        {/* Submissions List */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-400" />
                Recent Submissions
              </h2>
              <button className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors">
                View All
              </button>
            </div>

            {loading ? (
              <div className="p-12 text-center text-zinc-500">Loading submissions...</div>
            ) : (
              submissions.map((sub, i) => (
                <motion.div
                  key={sub.submission_id}
                  onClick={() => setSelectedSub(sub)}
                  className={`group p-5 rounded-2xl border transition-all cursor-pointer ${
                    selectedSub?.submission_id === sub.submission_id 
                    ? "bg-white/10 border-indigo-500/50" 
                    : "bg-white/[0.02] border-white/5 hover:border-white/20"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex gap-4">
                      <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-bold">
                        V{sub.version}
                      </div>
                      <div>
                        <h3 className="font-bold group-hover:text-indigo-400 transition-colors">
                          {sub.thesis_title} - Version {sub.version}
                        </h3>
                        <p className="text-sm text-zinc-500">Submitted by: {sub.student_name} ({sub.student_nim})</p>
                      </div>
                    </div>
                    <div className="text-right text-xs text-zinc-600">
                      {new Date(sub.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>

          {/* Review Panel */}
          <div className="lg:col-span-1">
            <div className={`sticky top-28 p-6 rounded-3xl bg-white/[0.02] border border-white/10 backdrop-blur-xl transition-all ${!selectedSub && "opacity-50 grayscale"}`}>
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-indigo-400" />
                Review Panel
              </h2>
              
              {!selectedSub ? (
                <div className="py-20 text-center">
                  <p className="text-sm text-zinc-500">Select a submission to start reviewing.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 block">
                      AI Feedback Summary
                    </label>
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-sm text-zinc-300 leading-relaxed italic">
                      "{selectedSub.ai_feedback.substring(0, 150)}..."
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 block">
                      Your Feedback
                    </label>
                    <textarea
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      placeholder="Enter your guidance here..."
                      className="w-full h-40 bg-white/5 border border-white/10 rounded-2xl p-4 text-sm focus:outline-none focus:border-indigo-500/50 transition-colors resize-none"
                    />
                  </div>

                  <button
                    onClick={handleReview}
                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold transition-all flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    Submit Review
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
