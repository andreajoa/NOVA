"use client";
import Sidebar from "@/components/Sidebar";
export default function DashboardLayout({ children }) {
  return (
    <div className="flex h-screen bg-[#050505] overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
