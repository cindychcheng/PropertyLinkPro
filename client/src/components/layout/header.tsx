import { useState } from "react";
import {
  Menu,
  Search,
  Bell,
  HelpCircle,
  Command,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { SimpleSearch } from "@/components/search/simple-search";

type HeaderProps = {
  onMenuClick: () => void;
};

export function Header({ onMenuClick }: HeaderProps) {
  const [searchOpen, setSearchOpen] = useState(false);

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
          <button
            onClick={() => setSearchOpen(true)}
            className="relative flex w-64 items-center border border-input rounded-md bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 hover:bg-accent hover:text-accent-foreground"
          >
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <span className="text-neutral-medium">Search properties, tenants...</span>
            <kbd className="pointer-events-none absolute right-1.5 top-[50%] -translate-y-1/2 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 md:flex">
              <span className="text-xs">⌘</span>K
            </kbd>
          </button>
          <SimpleSearch open={searchOpen} setOpen={setSearchOpen} />
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
