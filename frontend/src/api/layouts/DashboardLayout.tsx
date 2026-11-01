
import { useState } from "react";
import { Outlet } from "react-router-dom";

import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

export function DashboardLayout() {
    console.log("DASHBOARD LAYOUT SE ESTÁ EJECUTANDO");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleCloseSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="flex min-h-screen bg-app">
      <Sidebar
        open={sidebarOpen}
        onClose={handleCloseSidebar}
      />

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <Topbar
          onMenuClick={() => setSidebarOpen(true)}
        />

        <main className="flex-1 p-4 sm:p-6">
            
          <Outlet />
        </main>
      </div>
    </div>
  );
}
