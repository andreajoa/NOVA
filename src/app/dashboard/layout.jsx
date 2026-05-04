"use client";
import Sidebar from "@/components/Sidebar";
import DashboardTopBar from "@/components/DashboardTopBar";
import DashboardFooter from "@/components/DashboardFooter";

export default function DashboardLayout({ children }) {
  return (
    <div style={{display:"flex", height:"100vh", background:"#050505", overflow:"hidden"}}>
      {/* Sidebar lateral */}
      <Sidebar />

      {/* Coluna principal: TopBar + conteúdo + Footer */}
      <div style={{flex:1, display:"flex", flexDirection:"column", overflow:"hidden"}}>
        <DashboardTopBar />
        <main style={{flex:1, overflowY:"auto"}}>
          {children}
        </main>
        <DashboardFooter />
      </div>
    </div>
  );
}