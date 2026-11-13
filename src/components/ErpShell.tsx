"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  FileSpreadsheet,
  BarChart3,
  Settings,
  Search,
  Bell,
  LogOut,
  Menu,
  X,
  Building2,
  ChevronRight,
} from "lucide-react";
import { formatINR } from "@/lib/format";

export interface ShellUser {
  id: string;
  name: string;
  email: string;
  roleName: string;
}

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/quotations", label: "Quotations", icon: FileSpreadsheet },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function ErpShell({
  user,
  children,
}: {
  user: ShellUser;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Global search
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{
    customers: Array<{ id: string; name: string; customerCode: string; city?: string }>;
    projects: Array<{ id: string; name: string; projectCode: string; status: string }>;
    quotations: Array<{
      id: string;
      quotationNumber: string;
      status: string;
      grandTotal: number;
      customer: { name: string };
    }>;
  } | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 2) {
      setSearchResults(null);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data);
          setSearchOpen(true);
        }
      } catch {
        // ignore
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <div className="h-screen w-full flex overflow-hidden bg-[#F6F7F3] text-[#25382E] print:h-auto print:overflow-visible">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-[#123528]/60 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Fixed to viewport */}
      <aside
        className={`no-print fixed inset-y-0 left-0 z-50 w-64 h-screen bg-[#173D30] text-white flex flex-col transition-transform duration-200 border-r border-[#123528] ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="h-16 px-5 flex items-center justify-between border-b border-white/10 bg-[#123528] shrink-0">
          <Link href="/" className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt="EliteTrading Logo"
              className="w-9 h-9 rounded-lg object-cover border border-[#8BA77A]/40 bg-[#F3F0E3] shadow-sm"
            />
            <div>
              <div className="font-bold text-base tracking-tight leading-none text-[#F3F0E3]">
                EliteTrading
              </div>
              <div className="text-[10px] text-[#B2C6A5] tracking-wider uppercase mt-1">
                Fenestration ERP
              </div>
            </div>
          </Link>
          <button
            className="lg:hidden text-[#B2C6A5] hover:text-white"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? "bg-[#294C3B] text-[#F3F0E3] shadow-sm border border-[#8BA77A]/30"
                    : "text-[#B2C6A5] hover:bg-[#294C3B]/60 hover:text-white"
                }`}
              >
                <span className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${active ? "text-[#F3F0E3]" : "text-[#8BA77A]"}`} />
                  {item.label}
                </span>
                {active && <ChevronRight className="w-3.5 h-3.5 text-[#8BA77A]" />}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10 bg-[#123528] text-xs text-[#B2C6A5] shrink-0">
          <div className="flex items-center gap-2 text-[#F3F0E3] font-medium mb-1">
            <Building2 className="w-3.5 h-3.5 text-[#8BA77A]" />
            elitetradingfd.com
          </div>
          <div className="text-[11px] text-[#B2C6A5]/80">
            Indore • Doors, Windows &amp; Glass
          </div>
        </div>
      </aside>

      {/* Main Column - Scrollable Content with Header */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto overflow-x-hidden lg:ml-64 print:h-auto print:overflow-visible print:ml-0">
        {/* Top Navbar */}
        <header className="no-print h-14 shrink-0 bg-white/95 backdrop-blur-xs border-b border-[#E5EAE3] px-4 lg:px-6 flex items-center justify-between gap-4 sticky top-0 z-30">
          <div className="flex items-center gap-2.5 flex-1 max-w-md">
            <button
              className="lg:hidden p-1.5 rounded-lg text-[#1F2937] hover:bg-slate-100"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="relative flex-1" ref={searchRef}>
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchResults && setSearchOpen(true)}
                placeholder="Search customers, projects, or quotation #..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#F7F8F4] border border-[#E5EAE3] rounded-lg text-[#1F2937] placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#174535] focus:border-[#174535] transition"
              />

              {searchOpen && searchResults && (
                <div className="absolute left-0 right-0 mt-1.5 bg-white border border-[#E5EAE3] rounded-xl shadow-xl z-50 max-h-96 overflow-y-auto p-2">
                  {searchResults.customers.length === 0 &&
                  searchResults.projects.length === 0 &&
                  searchResults.quotations.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-500">
                      No matching records found.
                    </div>
                  ) : (
                    <>
                      {searchResults.quotations.length > 0 && (
                        <div className="mb-2">
                          <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            Quotations
                          </div>
                          {searchResults.quotations.map((q) => (
                            <Link
                              key={q.id}
                              href={`/quotations/${q.id}`}
                              onClick={() => setSearchOpen(false)}
                              className="flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-slate-50 text-xs"
                            >
                              <div>
                                <span className="font-semibold text-[#174535]">
                                  {q.quotationNumber}
                                </span>
                                <span className="text-slate-500 ml-2">
                                  {q.customer.name}
                                </span>
                              </div>
                              <span className="font-semibold text-slate-700">
                                {formatINR(q.grandTotal)}
                              </span>
                            </Link>
                          ))}
                        </div>
                      )}
                      {searchResults.customers.length > 0 && (
                        <div className="mb-2">
                          <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            Customers
                          </div>
                          {searchResults.customers.map((c) => (
                            <Link
                              key={c.id}
                              href={`/customers/${c.id}`}
                              onClick={() => setSearchOpen(false)}
                              className="flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-slate-50 text-xs"
                            >
                              <span className="font-medium text-slate-800">{c.name}</span>
                              <span className="text-slate-500">
                                {c.customerCode}
                              </span>
                            </Link>
                          ))}
                        </div>
                      )}
                      {searchResults.projects.length > 0 && (
                        <div>
                          <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            Projects
                          </div>
                          {searchResults.projects.map((p) => (
                            <Link
                              key={p.id}
                              href={`/projects/${p.id}`}
                              onClick={() => setSearchOpen(false)}
                              className="flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-slate-50 text-xs"
                            >
                              <span className="font-medium text-slate-800">{p.name}</span>
                              <span className="text-slate-500">
                                {p.projectCode}
                              </span>
                            </Link>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/quotations/new"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#174535] text-white text-xs font-semibold hover:bg-[#10382D] transition shadow-xs"
            >
              + New Quotation
            </Link>

            <button
              title="Notifications"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition relative"
              onClick={() => router.push("/")}
            >
              <Bell className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 pl-2.5 border-l border-[#E5EAE3]">
              <div className="w-7 h-7 rounded-full bg-[#174535] text-[#F7F8F4] flex items-center justify-center text-[10px] font-bold tracking-tight shadow-xs">
                {user.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
              <div className="hidden md:block leading-tight">
                <div className="text-xs font-semibold text-[#1F2937]">
                  {user.name}
                </div>
                <div className="text-[10px] text-slate-500 font-medium">
                  {user.roleName}
                </div>
              </div>
              <button
                onClick={handleLogout}
                title="Sign Out"
                className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6 max-w-[1600px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

