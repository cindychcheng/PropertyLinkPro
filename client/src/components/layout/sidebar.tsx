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

const NavLink = ({ href, icon, children, badge, badgeColor = "bg-primary" }: NavLinkProps) => {
  const [location] = useLocation();
  const isActive = location === href;
  
  return (
    <Link href={href}>
      <a
        className={`flex items-center px-4 py-3 ${
          isActive
            ? "text-primary bg-primary bg-opacity-10"
            : "text-neutral-dark hover:bg-neutral-lightest"
        }`}
      >
        <span className={`mr-3 ${isActive ? "text-primary" : "text-neutral-medium"}`}>
          {icon}
        </span>
        {children}
        {badge !== undefined && (
          <span className={`ml-auto ${badgeColor} text-white rounded-full text-xs px-2 py-1`}>
            {badge}
          </span>
        )}
      </a>
    </Link>
  );
};

export function Sidebar() {
  return (
    <div className="bg-white shadow-md z-20 w-64 flex-shrink-0 hidden md:block">
      <div className="h-16 flex items-center justify-center border-b">
        <h1 className="text-xl font-semibold text-primary">PropManager</h1>
      </div>
      <nav className="py-4">
        <div className="px-4 py-2 text-neutral-medium text-xs font-semibold uppercase tracking-wider">
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
        
        <div className="px-4 py-2 mt-4 text-neutral-medium text-xs font-semibold uppercase tracking-wider">
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
          badgeColor="bg-secondary"
        >
          Rate Increases
        </NavLink>
        
        <div className="px-4 py-2 mt-4 text-neutral-medium text-xs font-semibold uppercase tracking-wider">
          System
        </div>
        <NavLink href="/settings" icon={<Settings size={20} />}>
          Settings
        </NavLink>
      </nav>
    </div>
  );
}
