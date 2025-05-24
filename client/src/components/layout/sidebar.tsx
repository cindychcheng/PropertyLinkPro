import { useLocation, Link } from "wouter";
import {
  Building,
  Home,
  User,
  Users,
  TrendingUp,
  Cake,
  Settings,
  BarChart,
} from "lucide-react";

type NavLinkProps = {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  badge?: number;
  badgeColor?: string;
};

const NavLink = ({ href, icon, children, badge, badgeColor = "bg-blue-500" }: NavLinkProps) => {
  const [location] = useLocation();
  const isActive = location === href;
  
  return (
    <div className="mx-2">
      <Link href={href}>
        <div
          className={`flex items-center px-4 py-3 rounded-xl cursor-pointer transition-all duration-200 ${
            isActive
              ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/25 transform scale-[1.02]"
              : "text-slate-700 hover:bg-slate-100/60 hover:text-slate-900 hover:transform hover:scale-[1.01]"
          }`}
        >
          <span className={`mr-3 transition-colors duration-200 ${isActive ? "text-white" : "text-slate-500"}`}>
            {icon}
          </span>
          <span className="font-medium">{children}</span>
          {badge !== undefined && (
            <span className={`ml-auto ${badgeColor} text-white rounded-full text-xs px-2 py-1 shadow-sm`}>
              {badge}
            </span>
          )}
        </div>
      </Link>
    </div>
  );
};

export function Sidebar({ isMobile = false }: { isMobile?: boolean }) {
  return (
    <div className={`bg-gradient-to-b from-slate-50 to-white shadow-xl border-r border-slate-200 z-20 w-64 flex-shrink-0 ${isMobile ? 'block' : 'hidden md:block'}`}>
      {!isMobile && (
        <div className="h-16 flex items-center justify-center border-b border-slate-200 bg-white/50 backdrop-blur-sm">
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">PropManager</h1>
        </div>
      )}
      <nav className="py-6">
        <div className="px-4 py-2 text-slate-500 text-xs font-semibold uppercase tracking-wider">
          Main
        </div>
        <NavLink href="/" icon={<Home size={20} />}>
          Dashboard
        </NavLink>
        <NavLink href="/properties" icon={<Building size={20} />}>
          Properties
        </NavLink>
        <NavLink href="/landlords" icon={<User size={20} />}>
          Landlords
        </NavLink>
        <NavLink href="/tenants" icon={<Users size={20} />}>
          Tenants
        </NavLink>
        
        <div className="px-4 py-2 mt-6 text-slate-500 text-xs font-semibold uppercase tracking-wider">
          Reminders
        </div>
        <NavLink 
          href="/birthdays" 
          icon={<Cake size={20} />} 
          badge={4}
        >
          Birthdays
        </NavLink>
        <NavLink 
          href="/rate-increases" 
          icon={<TrendingUp size={20} />} 
          badge={12} 
          badgeColor="bg-gradient-to-r from-orange-500 to-red-500"
        >
          Rate Increases
        </NavLink>
        
        <div className="px-4 py-2 mt-6 text-slate-500 text-xs font-semibold uppercase tracking-wider">
          System
        </div>
        <NavLink href="/settings" icon={<Settings size={20} />}>
          Settings
        </NavLink>
      </nav>
    </div>
  );
}
