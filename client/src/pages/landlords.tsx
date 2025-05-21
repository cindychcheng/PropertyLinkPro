import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Layout } from "@/components/layout/layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LandlordForm } from "@/components/forms/landlord-form";
import { Card } from "@/components/ui/card";
import { Cake, Plus, Building } from "lucide-react";
import { formatDisplayDate, formatBirthday } from "@/lib/utils/date-utils";

export default function Landlords() {
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState("list");
  const [editLandlord, setEditLandlord] = useState<any>(null);
  
  const rowsPerPage = 10;
  const { toast } = useToast();

  const { data: properties, isLoading, refetch } = useQuery({
    queryKey: ['/api/properties'],
    staleTime: 60000, // 1 minute
  });

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleEditLandlord = (landlord: any) => {
    setEditLandlord(landlord);
    setActiveTab("add");
  };

  const handleFormSuccess = () => {
    setActiveTab("list");
    setEditLandlord(null);
    refetch();
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
      header: "Owner Name",
      accessorKey: (row: any) => (
        <div>
          {row.landlordOwners?.map((owner: any, i: number) => (
            <div key={i} className={i > 0 ? "mt-1" : ""}>
              {owner.name}
              {owner.birthday && (
                <span className="ml-2 text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">
                  <Cake className="inline h-3 w-3 mr-1" />
                  {formatBirthday(owner.birthday)}
                </span>
              )}
            </div>
          )) || "No owner"}
        </div>
      ),
    },
    {
      header: "Contact",
      accessorKey: (row: any) => (
        <div>
          {row.landlordOwners?.map((owner: any, i: number) => (
            <div key={i} className={i > 0 ? "mt-1" : ""}>
              {owner.contactNumber || "N/A"}
            </div>
          ))}
        </div>
      ),
    },
    {
      header: "Strata Contact",
      accessorKey: "strataContactNumber",
      cell: (row: any) => row.strataContactNumber || "N/A",
    },
    {
      header: "Properties",
      accessorKey: (row: any) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
          <Building className="h-3 w-3 mr-1" />
          1
        </span>
      ),
    },
    {
      header: "Actions",
      accessorKey: (row: any) => (
        <div className="flex justify-end space-x-2">
          <Button 
            variant="link" 
            size="sm"
            onClick={() => handleEditLandlord(row)}
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
        <h1 className="text-2xl font-semibold mb-2 md:mb-0">Landlords</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="list">Landlord List</TabsTrigger>
          <TabsTrigger value="add">
            {editLandlord ? "Edit Landlord" : "Add Landlord"}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="list">
          <div className="flex justify-end mb-4">
            <Button onClick={() => {
              setEditLandlord(null);
              setActiveTab("add");
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Landlord
            </Button>
          </div>
          
          <DataTable
            columns={columns}
            data={paginatedData}
            isLoading={isLoading}
            emptyMessage="No landlords found."
            rowsPerPage={rowsPerPage}
            currentPage={currentPage}
            totalItems={totalItems}
            onPageChange={handlePageChange}
          />
        </TabsContent>
        
        <TabsContent value="add">
          <LandlordForm 
            onSuccess={handleFormSuccess}
            onCancel={() => {
              setActiveTab("list");
              setEditLandlord(null);
            }}
            landlordData={editLandlord ? {
              propertyAddress: editLandlord.propertyAddress,
              keyNumber: editLandlord.keyNumber,
              strataContactNumber: editLandlord.strataContactNumber,
              owner: editLandlord.landlordOwners?.[0]
            } : undefined}
            isEdit={!!editLandlord}
          />
        </TabsContent>
      </Tabs>
    </Layout>
  );
}
