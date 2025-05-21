import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Layout } from "@/components/layout/layout";
import { PropertyDialog } from "@/components/dialogs/property-dialog-updated";
import { RateIncreaseDialog } from "@/components/dialogs/rate-increase-dialog";
import { AddPropertyDialog } from "@/components/dialogs/add-property-dialog";
import { Plus, TrendingUp } from "lucide-react";
import { formatCurrency, formatDisplayDate } from "@/lib/utils/date-utils";

export default function Properties() {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedProperty, setSelectedProperty] = useState<string | null>(null);
  const [showPropertyDialog, setShowPropertyDialog] = useState(false);
  const [showRateIncreaseDialog, setShowRateIncreaseDialog] = useState(false);
  const [showAddPropertyDialog, setShowAddPropertyDialog] = useState(false);
  
  const rowsPerPage = 10;
  const { toast } = useToast();

  const { data: properties, isLoading } = useQuery({
    queryKey: ['/api/properties'],
    staleTime: 60000, // 1 minute
  });

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleViewProperty = (address: string) => {
    setSelectedProperty(address);
    setShowPropertyDialog(true);
  };

  const handleProcessRateIncrease = (address: string) => {
    setSelectedProperty(address);
    setShowRateIncreaseDialog(true);
  };

  const totalItems = properties?.length || 0;
  const paginatedData = properties?.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

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
        row.rentalInfo 
          ? formatDisplayDate(row.rentalInfo.nextAllowableRentalIncreaseDate).split(',')[0]
          : 'N/A'
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
          {row.rentalInfo && (
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
    <Layout>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h1 className="text-2xl font-semibold mb-2 md:mb-0">Properties</h1>
        <Button onClick={() => setShowAddPropertyDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Property
        </Button>
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
    </Layout>
  );
}
