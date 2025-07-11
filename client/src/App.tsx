import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { SearchProvider } from "@/providers/search-provider";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import SimpleLogin from "@/pages/simple-login";
import Dashboard from "@/pages/dashboard";
import Properties from "@/pages/properties";
import Landlords from "@/pages/landlords";
import Tenants from "@/pages/tenants";
import Birthdays from "@/pages/birthdays";
import RateIncreases from "@/pages/rate-increases";
import Settings from "@/pages/settings";
import Users from "@/pages/users-basic";
import TestMinimal from "@/pages/test-minimal";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading || !isAuthenticated) {
    return (
      <Switch>
        <Route path="/" component={Landing} />
        <Route path="/admin" component={SimpleLogin} />
        <Route component={NotFound} />
      </Switch>
    );
  }

  return (
    <div className="h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <div className="lg:pl-64">
        <div className="flex flex-col h-screen">
          <Header />
          <main className="flex-1 overflow-auto p-4 lg:p-6">
            <Switch>
              <Route path="/" component={Dashboard} />
              <Route path="/properties" component={Properties} />
              <Route path="/landlords" component={Landlords} />
              <Route path="/tenants" component={Tenants} />
              <Route path="/birthdays" component={Birthdays} />
              <Route path="/rate-increases" component={RateIncreases} />
              <Route path="/users" component={Users} />
              <Route path="/test" component={TestMinimal} />
              <Route path="/settings" component={Settings} />
              <Route component={NotFound} />
            </Switch>
          </main>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SearchProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </SearchProvider>
    </QueryClientProvider>
  );
}

export default App;
