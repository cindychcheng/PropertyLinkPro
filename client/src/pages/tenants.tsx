import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Layout } from "@/components/layout/layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TenantForm } from "@/components/forms/tenant-form";
import { Cake, Plus, Building } from "lucide-react";
import { formatDisplayDate, formatBirthday } from "@/lib/utils/date-utils";

export default function Tenants() {
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState("list");
  const [editTenant, setEditTenant] = useState<any>(null);
  
  const rowsPerPage = 10;
  const { toast } = useToast();

  const { data: properties, isLoading, refetch } = useQuery({
    queryKey: ['/api/properties'],
    staleTime: 60000, // 1 minute
  });

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Function to look up tenant ID from the db
  const fetchTenantForProperty = async (propertyAddress: string) => {
    try {
      // Retrieve the tenant data directly from the API
      const response = await fetch(`/api/tenants/${encodeURIComponent(propertyAddress)}`);
      if (!response.ok) {
        throw new Error('Failed to fetch tenant data');
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching tenant:", error);
      return null;
    }
  };

  const handleEditTenant = async (property: any) => {
    console.log("Editing tenant for property:", property);

    try {
      // Get actual tenant data from the database to ensure we have the correct ID
      const tenantFromDb = await fetchTenantForProperty(property.propertyAddress);
      console.log("Tenant data from database:", tenantFromDb);
      
      if (tenantFromDb) {
        // Create tenant data with the confirmed ID from database
        const tenantData = {
          id: tenantFromDb.id, // Use the ID from database query
          propertyAddress: property.propertyAddress,
          serviceType: property.serviceType,
          moveInDate: tenantFromDb.moveInDate,
          moveOutDate: tenantFromDb.moveOutDate,
          name: tenantFromDb.name,
          contactNumber: tenantFromDb.contactNumber,
          email: tenantFromDb.email,
          birthday: tenantFromDb.birthday
        };
        
        console.log("Tenant data for edit with confirmed ID:", tenantData);
        setEditTenant(tenantData);
        setActiveTab("add");
      } else {
        // Handle case where tenant isn't found
        toast({
          title: "Error",
          description: "Could not retrieve tenant information for this property.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error preparing tenant edit:", error);
      toast({
        title: "Error",
        description: "An error occurred while preparing to edit tenant information.",
        variant: "destructive"
      });
    }
  };

  const handleFormSuccess = () => {
    setActiveTab("list");
    setEditTenant(null);
    refetch();
  };

  // Debug the properties data to see what we're getting
  console.log("Properties data for tenant display:", properties);
  
  // Filter only properties with tenants
  const tenantProperties = properties?.filter((property: any) => property.tenant) || [];
  
  // Debug the tenant IDs to ensure they're properly set
  console.log("Tenant properties:", tenantProperties.map(p => ({ 
    address: p.propertyAddress, 
    tenantId: p.tenant?.id,
    tenantName: p.tenant?.name
  })));
  
  const totalItems = tenantProperties.length;
  const paginatedData = tenantProperties?.slice(
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
      header: "Tenant Name",
      accessorKey: (row: any) => (
        <div>
          {row.tenant?.name}
          {row.tenant?.birthday && (
            <span className="ml-2 text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">
              <Cake className="inline h-3 w-3 mr-1" />
              {formatBirthday(row.tenant.birthday)}
            </span>
          )}
        </div>
      ),
    },
    {
      header: "Contact",
      accessorKey: (row: any) => (
        <div>
          <div>{row.tenant?.contactNumber || "N/A"}</div>
          <div className="text-xs text-neutral-medium">{row.tenant?.email || ""}</div>
        </div>
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
      header: "Move-in Date",
      accessorKey: (row: any) => formatDisplayDate(row.tenant?.moveInDate),
    },
    {
      header: "Actions",
      accessorKey: (row: any) => (
        <div className="flex justify-end space-x-2">
          <Button 
            variant="link" 
            size="sm"
            onClick={() => handleEditTenant(row)}
            className="text-primary hover:text-primary-dark"
          >
            Edit
          </Button>
        </div>
      ),
      className: "text-right",
    },
  ];

  return (
    <Layout>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h1 className="text-2xl font-semibold mb-2 md:mb-0">Tenants</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="list">Tenant List</TabsTrigger>
          <TabsTrigger value="add">
            {editTenant ? "Edit Tenant" : "Add Tenant"}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="list">
          <div className="flex justify-end mb-4">
            <Button onClick={() => {
              setEditTenant(null);
              setActiveTab("add");
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Tenant
            </Button>
          </div>
          
          <DataTable
            columns={columns}
            data={paginatedData}
            isLoading={isLoading}
            emptyMessage="No tenants found."
            rowsPerPage={rowsPerPage}
            currentPage={currentPage}
            totalItems={totalItems}
            onPageChange={handlePageChange}
          />
        </TabsContent>
        
        <TabsContent value="add">
          <TenantForm 
            onSuccess={handleFormSuccess}
            onCancel={() => {
              setActiveTab("list");
              setEditTenant(null);
            }}
            tenantData={editTenant}
            isEdit={!!editTenant}
          />
        </TabsContent>
      </Tabs>
    </Layout>
  );
}
