"use client";

import Sidebar from "@/components/Sidebar";
import DashboardFooter from "@/components/DashboardFooter";

export default function DashboardLayout({ children }) {
  return (
    <div className="flex h-[calc(100vh-76px)] overflow-hidden bg-[#050505]">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <main className="min-h-0 flex-1 overflow-y-auto">
          {children}
        </main>

        <DashboardFooter />
      </div>
    </div>
  );
}
