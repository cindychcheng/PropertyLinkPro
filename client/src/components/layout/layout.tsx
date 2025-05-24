import { useState } from "react";
import { Sidebar } from "./sidebar";
import { Header } from "./header";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  
  const toggleMobileSidebar = () => {
    setShowMobileSidebar(!showMobileSidebar);
  };
  
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop sidebar */}
      <Sidebar />
      
      {/* Mobile sidebar */}
      {showMobileSidebar && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowMobileSidebar(false)}></div>
          <div className="fixed left-0 top-0 flex flex-col w-full max-w-xs h-full bg-gradient-to-b from-slate-50 to-white shadow-xl border-r border-slate-200">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-white/50 backdrop-blur-sm">
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">PropManager</h1>
              <button 
                onClick={() => setShowMobileSidebar(false)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <Sidebar isMobile={true} />
            </div>
          </div>
        </div>
      )}
      
      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onMenuClick={toggleMobileSidebar} />
        <main className="flex-1 overflow-y-auto bg-neutral-lightest p-4">
          {children}
        </main>
      </div>
    </div>
  );
}
