import { useState } from "react";
import {
  Menu,
  Search,
  Bell,
  HelpCircle,
} from "lucide-react";
import { Input } from "@/components/ui/input";

type HeaderProps = {
  onMenuClick: () => void;
};

export function Header({ onMenuClick }: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <header className="bg-white shadow-sm z-10">
      <div className="flex items-center justify-between h-16 px-4">
        <div className="flex items-center">
          <button 
            className="md:hidden mr-2"
            onClick={onMenuClick}
            aria-label="Toggle menu"
          >
            <Menu className="text-neutral-dark" />
          </button>
          <div className="relative w-64">
            <span className="absolute inset-y-0 left-0 flex items-center pl-2">
              <Search className="text-neutral-medium h-5 w-5" />
            </span>
            <Input
              type="text"
              placeholder="Search properties, tenants..."
              className="w-full pl-10 pr-4 py-2"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="flex items-center">
          <button className="p-2 rounded-full hover:bg-neutral-lightest" aria-label="Notifications">
            <Bell className="text-neutral-dark h-5 w-5" />
          </button>
          <button className="p-2 rounded-full hover:bg-neutral-lightest" aria-label="Help">
            <HelpCircle className="text-neutral-dark h-5 w-5" />
          </button>
          <div className="ml-4 relative flex items-center">
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white">
              AM
            </div>
            <span className="ml-2 text-sm font-medium hidden md:block">Admin User</span>
          </div>
        </div>
      </div>
    </header>
  );
}
