import { useState } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  UserCheck, 
  Calendar, 
  TrendingUp, 
  Settings, 
  LogOut,
  Shield,
  ChevronDown,
  Menu
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard, minRole: "read_only" },
  { name: "Properties", href: "/properties", icon: Building2, minRole: "read_only" },
  { name: "Landlords", href: "/landlords", icon: UserCheck, minRole: "read_only" },
  { name: "Tenants", href: "/tenants", icon: Users, minRole: "read_only" },
  { name: "Rate Increases", href: "/rate-increases", icon: TrendingUp, minRole: "read_only" },
  { name: "Birthdays", href: "/birthdays", icon: Calendar, minRole: "read_only" },
  { name: "User Management", href: "/users", icon: Shield, minRole: "super_admin" },
  { name: "Settings", href: "/settings", icon: Settings, minRole: "standard" },
];

const roleHierarchy = {
  "read_only": 1,
  "standard": 2,
  "admin": 3,
  "super_admin": 4
};

const roleLabels = {
  "read_only": "Read Only",
  "standard": "Standard",
  "admin": "Admin",
  "super_admin": "Super Admin"
};

const roleColors = {
  "read_only": "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
  "standard": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  "admin": "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  "super_admin": "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
};

function hasAccess(userRole: string, requiredRole: string): boolean {
  const userLevel = roleHierarchy[userRole as keyof typeof roleHierarchy] || 0;
  const requiredLevel = roleHierarchy[requiredRole as keyof typeof roleHierarchy] || 0;
  return userLevel >= requiredLevel;
}

// Sidebar content component that will be used in both desktop and mobile
function SidebarContent({ onLinkClick }: { onLinkClick?: () => void }) {
  const [location] = useLocation();
  const { user } = useAuth();

  const filteredNavigation = navigation.filter(item => 
    hasAccess(user?.role || "read_only", item.minRole)
  );

  const getUserDisplayName = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    if (user?.email) {
      return user.email;
    }
    return user?.id || "User";
  };

  const getUserInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user?.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
    return "U";
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 w-64">
      {/* Header */}
      <div className="flex items-center justify-center h-16 px-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <Building2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">PropertyHub</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">Management System</p>
          </div>
        </div>
      </div>

        {/* User Profile */}
        {user && (
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full justify-start p-2 h-auto">
                  <div className="flex items-center space-x-3 w-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.profileImageUrl || undefined} />
                      <AvatarFallback className="text-xs">
                        {getUserInitials()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {getUserDisplayName()}
                      </p>
                      <Badge className={cn("text-xs", roleColors[user.role as keyof typeof roleColors])}>
                        {roleLabels[user.role as keyof typeof roleLabels]}
                      </Badge>
                    </div>
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuLabel>Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => window.location.href = '/api/logout'}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {filteredNavigation.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.name} href={item.href}>
              <a
                onClick={onLinkClick}
                className={cn(
                  "flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
                )}
              >
                <item.icon className="h-5 w-5 mr-3" />
                {item.name}
              </a>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          © 2025 PropertyHub
        </p>
      </div>
    </div>
  );
}

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
        <SidebarContent />
      </div>

      {/* Mobile Menu Button */}
      <div className="lg:hidden">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="fixed top-4 left-4 z-50 bg-white dark:bg-gray-900 shadow-lg"
            >
              <Menu className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64">
            <SidebarContent onLinkClick={() => setIsOpen(false)} />
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}