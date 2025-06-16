import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Building, Users, TrendingUp, Cake, FileDown, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/dashboard/stat-card";
import { RateIncreaseReminders } from "@/components/dashboard/rate-increase-reminders-fixed";
import { BirthdayReminders } from "@/components/dashboard/birthday-reminders";
import { PropertiesTable } from "@/components/dashboard/properties-table";
import { PropertyDialog } from "@/components/dialogs/property-dialog-updated";
import { RateIncreaseDialog } from "@/components/dialogs/rate-increase-dialog";
import { AddPropertyDialog } from "@/components/dialogs/add-property-dialog";
import { useAppContext } from "@/providers/app-provider";

export default function Dashboard() {
  const [selectedProperty, setSelectedProperty] = useState<string | null>(null);
  const [showPropertyDialog, setShowPropertyDialog] = useState(false);
  const [showRateIncreaseDialog, setShowRateIncreaseDialog] = useState(false);
  const [showAddPropertyDialog, setShowAddPropertyDialog] = useState(false);
  
  const { 
    setActiveBirthdayCount, 
    setActiveRateIncreaseCount 
  } = useAppContext();
  
  const { data: properties, isLoading: isLoadingProperties } = useQuery({
    queryKey: ['/api/properties'],
    staleTime: 60000, // 1 minute
  });
  
  const { data: birthdayReminders } = useQuery({
    queryKey: ['/api/reminders/birthdays'],
    staleTime: 60000, // 1 minute
  });
  
  const { data: rateIncreaseReminders } = useQuery({
    queryKey: ['/api/reminders/rental-increases'],
    staleTime: 60000, // 1 minute
  });
  
  // Update badge counts
  useEffect(() => {
    if (birthdayReminders) {
      setActiveBirthdayCount(birthdayReminders.length);
    }
    
    if (rateIncreaseReminders) {
      setActiveRateIncreaseCount(rateIncreaseReminders.length);
    }
  }, [birthdayReminders, rateIncreaseReminders, setActiveBirthdayCount, setActiveRateIncreaseCount]);
  
  const handleViewProperty = (address: string) => {
    console.log("=== OPENING PROPERTY DIALOG ===");
    console.log("Setting property address to:", address);
    
    // Close dialog first if it's open
    setShowPropertyDialog(false);
    
    // Set the property address
    setSelectedProperty(address);
    
    // Wait a moment then open dialog
    setTimeout(() => {
      console.log("Opening dialog for address:", address);
      setShowPropertyDialog(true);
    }, 100);
  };
  
  const handleEditProperty = (address: string) => {
    // For now, just view the property
    setSelectedProperty(address);
    setShowPropertyDialog(true);
  };
  
  const handleProcessRateIncrease = (address: string) => {
    setSelectedProperty(address);
    setShowRateIncreaseDialog(true);
  };
  
  const handleAddProperty = () => {
    setShowAddPropertyDialog(true);
  };
  
  // Calculate stats
  const totalProperties = properties?.length || 0;
  const totalTenants = properties?.filter((p: any) => p.tenant).length || 0;
  const activeRateIncreases = rateIncreaseReminders?.length || 0;
  const birthdaysThisMonth = birthdayReminders?.length || 0;

  return (
    <div className="p-6 space-y-6">
      {/* Dashboard Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h1 className="text-2xl font-semibold mb-2 md:mb-0">Dashboard</h1>
        <div className="flex space-x-2">
          <Button variant="outline" className="space-x-1">
            <FileDown className="h-4 w-4" />
            <span>Export</span>
          </Button>
          <Button onClick={handleAddProperty} className="space-x-1">
            <Plus className="h-4 w-4" />
            <span>Add Property</span>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {isLoadingProperties ? (
          <>
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </>
        ) : (
          <>
            <StatCard
              title="Total Properties"
              value={totalProperties}
              icon={<Building className="h-5 w-5" />}
              bgColor="bg-primary bg-opacity-10"
              iconColor="text-primary"
            />
            <StatCard
              title="Tenants"
              value={totalTenants}
              icon={<Users className="h-5 w-5" />}
              bgColor="bg-info bg-opacity-10"
              iconColor="text-info"
            />
            <StatCard
              title="Active Rate Increases"
              value={activeRateIncreases}
              icon={<TrendingUp className="h-5 w-5" />}
              bgColor="bg-warning bg-opacity-10"
              iconColor="text-warning"
            />
            <StatCard
              title="Birthdays This Month"
              value={birthdaysThisMonth}
              icon={<Cake className="h-5 w-5" />}
              bgColor="bg-secondary bg-opacity-10"
              iconColor="text-secondary"
            />
          </>
        )}
      </div>

      {/* Reminders Section */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-4">Reminders & Actions</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <RateIncreaseReminders onProcessIncrease={handleProcessRateIncrease} />
          <BirthdayReminders />
        </div>
      </div>

      {/* Property Listings Section */}
      <PropertiesTable
        onViewProperty={handleViewProperty}
        onEditProperty={handleEditProperty}
      />
      
      {/* Property Details Dialog */}
      <PropertyDialog
        propertyAddress={selectedProperty}
        isOpen={showPropertyDialog}
        onClose={() => setShowPropertyDialog(false)}
        onProcessRateIncrease={handleProcessRateIncrease}
      />
      
      {/* Rate Increase Dialog */}
      <RateIncreaseDialog
        propertyAddress={selectedProperty}
        isOpen={showRateIncreaseDialog}
        onClose={() => setShowRateIncreaseDialog(false)}
      />
      
      {/* Add Property Dialog */}
      <AddPropertyDialog
        isOpen={showAddPropertyDialog}
        onClose={() => setShowAddPropertyDialog(false)}
      />
    </div>
  );
}
