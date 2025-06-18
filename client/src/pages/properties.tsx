import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useSearch } from "@/providers/search-provider";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";

import { PropertyDialog } from "@/components/dialogs/property-dialog-updated";
import { RateIncreaseDialog } from "@/components/dialogs/rate-increase-dialog";
import { AddPropertyDialog } from "@/components/dialogs/add-property-dialog";
import { Plus, TrendingUp } from "lucide-react";
import { formatCurrency, formatDisplayDate } from "@/lib/utils/date-utils";

// Function to check if tenant has lived in property for at least 12 months
function hasTenantLivedLongEnough(moveInDate: Date | string | undefined): boolean {
  if (!moveInDate) return false;
  
  const today = new Date();
  const moveInDateObj = moveInDate instanceof Date ? moveInDate : new Date(moveInDate);
  
  // Ensure we have a valid date
  if (isNaN(moveInDateObj.getTime())) return false;
  
  const diffInMonths = (today.getFullYear() - moveInDateObj.getFullYear()) * 12 + 
    (today.getMonth() - moveInDateObj.getMonth());
  
  return diffInMonths >= 12;
}

export default function Properties() {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedProperty, setSelectedProperty] = useState<string | null>(null);
  const [showPropertyDialog, setShowPropertyDialog] = useState(false);
  const [pendingPropertyFromUrl, setPendingPropertyFromUrl] = useState<string | null>(null);
  const [showRateIncreaseDialog, setShowRateIncreaseDialog] = useState(false);
  const [showAddPropertyDialog, setShowAddPropertyDialog] = useState(false);
  
  const rowsPerPage = 10;
  const { toast } = useToast();
  const [location] = useLocation();
  const { selectedPropertyAddress, clearSelection, openPropertyDialog } = useSearch();
  
  const { data: properties, isLoading } = useQuery<any[]>({
    queryKey: ['/api/properties'],
    staleTime: 60000, // 1 minute
  });

  // Handle hash-based navigation for search results
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1); // Remove the #
      console.log('Hash detected:', hash);
      
      if (hash) {
        const decodedAddress = decodeURIComponent(hash);
        console.log('Decoded address:', decodedAddress);
        console.log('Properties loaded:', !!properties, 'Length:', properties?.length);
        
        if (properties && Array.isArray(properties) && properties.length > 0) {
          const propertyExists = properties.some((p: any) => 
            p.propertyAddress === decodedAddress
          );
          
          console.log('Property exists:', propertyExists);
          
          if (propertyExists) {
            console.log('Opening dialog for:', decodedAddress);
            setSelectedProperty(decodedAddress);
            setShowPropertyDialog(true);
            // Clear the hash
            window.history.replaceState({}, '', window.location.pathname);
          }
        } else {
          console.log('Properties not loaded, setting pending:', decodedAddress);
          setPendingPropertyFromUrl(decodedAddress);
          // Clear the hash
          window.history.replaceState({}, '', window.location.pathname);
        }
      }
    };

    // Check on mount
    handleHashChange();
    
    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange);
    
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, [properties]);

  // Handle search context selection for immediate dialog opening
  useEffect(() => {
    console.log('Search context effect:', { selectedPropertyAddress, propertiesLoaded: !!properties });
    
    if (selectedPropertyAddress && properties && Array.isArray(properties) && properties.length > 0) {
      const propertyExists = properties.some((p: any) => 
        p.propertyAddress === selectedPropertyAddress
      );
      
      console.log('Property search result:', { selectedPropertyAddress, propertyExists });
      
      if (propertyExists) {
        console.log('Opening dialog via search context for:', selectedPropertyAddress);
        setSelectedProperty(selectedPropertyAddress);
        setShowPropertyDialog(true);
        clearSelection(); // Clear the context selection
      }
    } else if (selectedPropertyAddress && (!properties || properties.length === 0)) {
      console.log('Properties not loaded yet, setting pending:', selectedPropertyAddress);
      setPendingPropertyFromUrl(selectedPropertyAddress);
      clearSelection();
    }
  }, [selectedPropertyAddress, properties, clearSelection]);

  // Handle URL parameter navigation for search results - immediate check
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const propertyParam = urlParams.get('property');
    
    console.log('Checking URL parameters:', { propertyParam, propertiesLoaded: !!properties });
    
    if (propertyParam) {
      if (properties && Array.isArray(properties) && properties.length > 0) {
        const propertyExists = properties.some((p: any) => 
          p.propertyAddress === propertyParam
        );
        
        console.log('Property search from URL:', { propertyParam, propertyExists });
        
        if (propertyExists) {
          console.log('OPENING DIALOG IMMEDIATELY for:', propertyParam);
          setSelectedProperty(propertyParam);
          setShowPropertyDialog(true);
          
          // Clear URL parameters to clean up
          const newUrl = new URL(window.location.href);
          newUrl.searchParams.delete('property');
          newUrl.searchParams.delete('t');
          window.history.replaceState({}, '', newUrl.pathname);
        }
      } else {
        console.log('Properties not loaded yet, setting pending for:', propertyParam);
        setPendingPropertyFromUrl(propertyParam);
      }
    }
  }, [properties]);

  // Handle sessionStorage for search result navigation
  useEffect(() => {
    const propertyToOpen = sessionStorage.getItem('openProperty');
    
    if (propertyToOpen && properties && Array.isArray(properties) && properties.length > 0) {
      console.log('SessionStorage property detected:', propertyToOpen);
      
      const propertyExists = properties.some((p: any) => 
        p.propertyAddress === propertyToOpen
      );
      
      if (propertyExists) {
        console.log('Opening dialog from sessionStorage:', propertyToOpen);
        setSelectedProperty(propertyToOpen);
        setShowPropertyDialog(true);
        sessionStorage.removeItem('openProperty'); // Clear after use
      }
    }
  }, [properties]);

  // Handle opening dialog when we have properties data and a pending property
  useEffect(() => {
    if (pendingPropertyFromUrl && properties && Array.isArray(properties) && properties.length > 0) {
      // Check if the property exists in our data
      const propertyExists = properties.some((p: any) => 
        p.propertyAddress === pendingPropertyFromUrl
      );
      
      if (propertyExists) {
        setSelectedProperty(pendingPropertyFromUrl);
        setShowPropertyDialog(true);
        setPendingPropertyFromUrl(null);
      }
    }
  }, [pendingPropertyFromUrl, properties]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleViewProperty = (address: string) => {
    console.log('🎯 Direct handleViewProperty called for:', address);
    setSelectedProperty(address);
    setShowPropertyDialog(true);
  };

  // Test function for debugging - expose to window
  useEffect(() => {
    (window as any).testPropertyDialog = (address: string) => {
      console.log('🧪 Test function called for:', address);
      handleViewProperty(address);
    };
  }, []);

  const handleProcessRateIncrease = (address: string) => {
    setSelectedProperty(address);
    setShowRateIncreaseDialog(true);
  };

  const totalItems = Array.isArray(properties) ? properties.length : 0;
  const paginatedData = Array.isArray(properties) 
    ? properties.slice(
        (currentPage - 1) * rowsPerPage,
        currentPage * rowsPerPage
      ) 
    : [];

  const columns = [
    {
      header: "Property Address",
      accessorKey: "propertyAddress",
      cell: (row: any) => (
        <div>
          <div className="font-medium">{row.propertyAddress}</div>
          {row.propertyAddress.includes(',') && (
            <div className="text-xs text-neutral-medium">
              {row.propertyAddress.split(',')[1]}
            </div>
          )}
        </div>
      ),
    },
    {
      header: "Key #",
      accessorKey: "keyNumber",
    },
    {
      header: "Landlord",
      accessorKey: (row: any) => (
        <div>
          <div>{row.landlordOwners?.[0]?.name || 'No owner'}</div>
          <div className="text-xs text-neutral-medium">
            {row.landlordOwners?.[0]?.contactNumber || ''}
          </div>
        </div>
      ),
    },
    {
      header: "Tenant",
      accessorKey: (row: any) => (
        row.tenant ? (
          <div>
            <div>{row.tenant.name}</div>
            <div className="text-xs text-neutral-medium">
              Since {formatDisplayDate(row.tenant.moveInDate).split(',')[0]}
            </div>
          </div>
        ) : (
          <span className="text-warning italic">Vacant</span>
        )
      ),
    },
    {
      header: "Service Type",
      accessorKey: "serviceType",
      cell: (row: any) => (
        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
          row.serviceType === 'Full-Service Management' 
            ? 'bg-green-100 text-green-800' 
            : 'bg-blue-100 text-blue-800'
        }`}>
          {row.serviceType === 'Full-Service Management' ? 'Full-Service' : 'Tenant Replacement'}
        </span>
      ),
    },
    {
      header: "Rental Rate",
      accessorKey: (row: any) => (
        row.rentalInfo 
          ? `${formatCurrency(row.rentalInfo.latestRentalRate)}/mo` 
          : 'N/A'
      ),
    },
    {
      header: "Next Increase",
      accessorKey: (row: any) => (
        row.rentalInfo ? (
          <div>
            <div className="text-sm font-medium">
              {new Date(row.rentalInfo.nextAllowableRentalIncreaseDate).toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric',
                timeZone: 'UTC' 
              })}
            </div>
            <div className="text-xs text-gray-600">
              {new Date(row.rentalInfo.nextAllowableRentalIncreaseDate).getUTCFullYear()}
            </div>
          </div>
        ) : 'N/A'
      ),
    },
    {
      header: "Actions",
      accessorKey: (row: any) => (
        <div className="flex justify-end space-x-2">
          <Button 
            variant="link" 
            size="sm"
            onClick={() => handleViewProperty(row.propertyAddress)}
            className="text-primary hover:text-primary-dark"
          >
            View
          </Button>
          {row.rentalInfo && row.tenant && hasTenantLivedLongEnough(row.tenant.moveInDate) && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleProcessRateIncrease(row.propertyAddress)}
              className="text-primary hover:text-primary-dark"
            >
              <TrendingUp className="h-3 w-3 mr-1" />
              Increase
            </Button>
          )}
        </div>
      ),
      className: "text-right",
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h1 className="text-2xl font-semibold mb-2 md:mb-0">Properties</h1>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => {
              const property = "2468 10th Street, Unit 2";
              console.log('Direct test - opening property dialog for:', property);
              setSelectedProperty(property);
              setShowPropertyDialog(true);
            }}
          >
            Test: Open Peppa Property
          </Button>
          <Button onClick={() => setShowAddPropertyDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Property
          </Button>
        </div>
      </div>

      {/* Quick Property Access */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border p-4 mb-6">
        <h3 className="text-lg font-medium mb-3">Quick Property Access</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {properties && properties.map((property: any) => (
            <Button
              key={property.propertyAddress}
              variant="outline"
              size="sm"
              className="justify-start text-left h-auto p-3"
              onClick={() => {
                console.log('Quick access - opening property:', property.propertyAddress);
                setSelectedProperty(property.propertyAddress);
                setShowPropertyDialog(true);
              }}
            >
              <div className="flex flex-col items-start">
                <span className="font-medium">{property.propertyAddress}</span>
                <span className="text-xs text-gray-500">
                  {property.tenant ? property.tenant.name : 'Vacant'}
                </span>
              </div>
            </Button>
          ))}
        </div>
      </div>

      <DataTable
        columns={columns}
        data={paginatedData}
        isLoading={isLoading}
        emptyMessage="No properties found."
        rowsPerPage={rowsPerPage}
        currentPage={currentPage}
        totalItems={totalItems}
        onPageChange={handlePageChange}
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
