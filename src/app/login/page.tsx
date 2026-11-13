"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Mail, ArrowRight, ShieldCheck } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@elitetradingfd.com");
  const [password, setPassword] = useState("Admin@123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Invalid credentials");
      } else {
        router.push("/");
        router.refresh();
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#123528]">
      {/* Left Architectural Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#173D30] via-[#294C3B] to-[#123528] text-[#F3F0E3] p-12 flex-col justify-between relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-3.5 mb-10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt="EliteTrading Logo"
              className="w-12 h-12 rounded-xl object-cover border border-[#8BA77A]/50 bg-[#F3F0E3] shadow-lg"
            />
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-[#F3F0E3]">EliteTrading</h1>
              <p className="text-xs text-[#B2C6A5] tracking-widest uppercase">
                elitetradingfd.com
              </p>
            </div>
          </div>

          <h2 className="text-4xl font-bold leading-tight max-w-lg mb-4 text-[#F3F0E3]">
            Architectural Doors, Windows &amp; Glass Quotation ERP
          </h2>
          <p className="text-[#B2C6A5] text-base max-w-md leading-relaxed">
            Precision technical drawings, dynamic Sq.Ft. pricing, multi-brand uPVC &amp; Aluminium systems, and instant multi-page A4 quotation PDFs.
          </p>
        </div>

        <div className="relative z-10 grid grid-cols-2 gap-4 max-w-lg">
          {[
            "Infinity Metal French Doors",
            "Saint Gobain / Prominance uPVC",
            "Aluminium & Domal Systems",
            "Acoustic Glass Partitions",
          ].map((item) => (
            <div
              key={item}
              className="bg-white/8 border border-[#8BA77A]/25 rounded-xl px-4 py-3 text-xs font-medium text-[#F3F0E3]"
            >
              {item}
            </div>
          ))}
        </div>
      </div>

      {/* Right Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-[#F6F7F3]">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-[#DDE4DA] p-8">
          <div className="mb-7">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F3F0E3] text-[#294C3B] text-xs font-semibold mb-3 border border-[#DDE4DA]">
              <ShieldCheck className="w-3.5 h-3.5 text-[#294C3B]" />
              Secure ERP Portal
            </div>
            <h2 className="text-2xl font-bold text-[#25382E]">Sign in to EliteTrading</h2>
            <p className="text-sm text-[#718075] mt-1">
              Enter your credentials to access the ERP workspace.
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#294C3B]/20 focus:border-[#294C3B]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#294C3B]/20 focus:border-[#294C3B]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-lg bg-[#8BA77A] hover:bg-[#7b9969] text-[#123528] font-bold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-60 shadow-sm"
            >
              {loading ? "Signing in..." : "Sign In"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-[#DDE4DA]">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
              Quick Login
            </div>
            <div>
              <button
                type="button"
                onClick={() => {
                  setEmail("admin@elitetradingfd.com");
                  setPassword("Admin@123");
                }}
                className="w-full px-3 py-2 rounded-lg border border-[#DDE4DA] hover:bg-slate-50 text-xs font-medium text-slate-700 flex items-center justify-between"
              >
                <span>Administrator (Ali Asger)</span>
                <span className="text-[10px] text-slate-400 font-mono">admin@elitetradingfd.com</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

