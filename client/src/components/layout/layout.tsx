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
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowMobileSidebar(false)}></div>
          <div className="fixed left-0 top-0 flex flex-col w-full max-w-xs h-full bg-white shadow-lg">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Menu</h2>
              <button 
                onClick={() => setShowMobileSidebar(false)}
                className="p-2 hover:bg-neutral-lightest rounded"
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
