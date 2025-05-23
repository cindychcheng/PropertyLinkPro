import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils/date-utils";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type PropertyTableProps = {
  onViewProperty: (address: string) => void;
  onEditProperty: (address: string) => void;
};

export function PropertiesTable({ onViewProperty, onEditProperty }: PropertyTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [serviceTypeFilter, setServiceTypeFilter] = useState("all");
  const [tenantStatusFilter, setTenantStatusFilter] = useState("all");
  const itemsPerPage = 4;
  
  const { toast } = useToast();

  const { data: properties = [], isLoading, error } = useQuery({
    queryKey: ['/api/properties'],
    staleTime: 60000, // 1 minute
  });

  if (error) {
    toast({
      title: "Error fetching properties",
      description: (error as Error).message,
      variant: "destructive",
    });
  }

  // Filter properties based on selected filters
  const filteredProperties = properties 
    ? properties.filter((property: any) => {
        // Service type filter
        if (serviceTypeFilter !== "all") {
          if (property.serviceType !== serviceTypeFilter) {
            return false;
          }
        }
        
        // Tenant status filter
        if (tenantStatusFilter === "with-tenants" && !property.tenant) {
          return false;
        }
        if (tenantStatusFilter === "vacant" && property.tenant) {
          return false;
        }
        
        return true;
      })
    : [];
  
  // Calculate pagination
  const totalItems = filteredProperties.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const pageItems = filteredProperties.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Properties Overview</h2>
        <div className="flex space-x-2">
          <Select value={serviceTypeFilter} onValueChange={setServiceTypeFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Service Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Service Types</SelectItem>
              <SelectItem value="Full-Service Management">Full-Service Management</SelectItem>
              <SelectItem value="Tenant Replacement Service">Tenant Replacement Service</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={tenantStatusFilter} onValueChange={setTenantStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Tenant Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Properties</SelectItem>
              <SelectItem value="with-tenants">With Tenants</SelectItem>
              <SelectItem value="vacant">Vacant</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-neutral-light">
            <thead>
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-dark uppercase tracking-wider">
                  Property Address
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-dark uppercase tracking-wider">
                  Key #
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-dark uppercase tracking-wider">
                  Landlord
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-dark uppercase tracking-wider">
                  Tenant
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-dark uppercase tracking-wider">
                  Service Type
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-dark uppercase tracking-wider">
                  Rental Rate
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-neutral-dark uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-neutral-light">
              {isLoading ? (
                Array(4).fill(0).map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4">
                      <Skeleton className="h-5 w-full mb-1" />
                      <Skeleton className="h-3 w-3/4" />
                    </td>
                    <td className="px-6 py-4"><Skeleton className="h-5 w-16" /></td>
                    <td className="px-6 py-4">
                      <Skeleton className="h-5 w-full mb-1" />
                      <Skeleton className="h-3 w-3/4" />
                    </td>
                    <td className="px-6 py-4">
                      <Skeleton className="h-5 w-full mb-1" />
                      <Skeleton className="h-3 w-3/4" />
                    </td>
                    <td className="px-6 py-4"><Skeleton className="h-5 w-20" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-5 w-16" /></td>
                    <td className="px-6 py-4 text-right">
                      <Skeleton className="h-5 w-24 ml-auto" />
                    </td>
                  </tr>
                ))
              ) : pageItems && pageItems.length > 0 ? (
                pageItems.map((property: any, index: number) => (
                  <tr key={index} className="hover:bg-neutral-lightest">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-neutral-darkest">{property.propertyAddress}</div>
                      {property.propertyAddress.includes(',') && (
                        <div className="text-xs text-neutral-medium">
                          {property.propertyAddress.split(',')[1]}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {property.keyNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        {property.landlordOwners && property.landlordOwners.length > 0 
                          ? property.landlordOwners[0].name 
                          : 'No owner'}
                      </div>
                      <div className="text-xs text-neutral-medium">
                        {property.landlordOwners && property.landlordOwners.length > 0 
                          ? property.landlordOwners[0].contactNumber 
                          : ''}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {property.tenant ? (
                        <>
                          <div className="text-sm">{property.tenant.name}</div>
                          <div className="text-xs text-neutral-medium">
                            Since {new Date(property.tenant.moveInDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                          </div>
                        </>
                      ) : (
                        <span className="text-sm text-warning italic">Vacant</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        property.serviceType === 'Full-Service Management' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {property.serviceType === 'Full-Service Management' ? 'Full-Service' : 'Tenant Replacement'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {property.rentalInfo 
                        ? `${formatCurrency(property.rentalInfo.latestRentalRate)}/mo` 
                        : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Button 
                        variant="link" 
                        onClick={() => {
                          console.log("=== VIEW BUTTON CLICKED ===");
                          console.log("Property address:", property.propertyAddress);
                          onViewProperty(property.propertyAddress);
                        }}
                        className="text-primary hover:text-primary-dark"
                      >
                        View
                      </Button>
                      <Button 
                        variant="link" 
                        onClick={() => onEditProperty(property.propertyAddress)}
                        className="text-primary hover:text-primary-dark ml-4"
                      >
                        Edit
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-neutral-medium">
                    No properties found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="bg-neutral-lightest px-4 py-3 border-t border-neutral-light sm:px-6">
            <div className="flex items-center justify-between">
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-neutral-dark">
                    Showing <span className="font-medium">{Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)}</span> to{" "}
                    <span className="font-medium">{Math.min(currentPage * itemsPerPage, totalItems)}</span> of{" "}
                    <span className="font-medium">{totalItems}</span> properties
                  </p>
                </div>
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        href="#" 
                        onClick={(e) => {
                          e.preventDefault();
                          if (currentPage > 1) setCurrentPage(currentPage - 1);
                        }} 
                      />
                    </PaginationItem>
                    
                    {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                      let pageNum: number;
                      
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                        if (i === 4) pageNum = totalPages;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                        if (i === 0) pageNum = 1;
                      } else {
                        pageNum = currentPage - 2 + i;
                        if (i === 0) pageNum = 1;
                        if (i === 4) pageNum = totalPages;
                      }
                      
                      if ((i === 1 && pageNum !== 2) || (i === 3 && pageNum !== totalPages - 1)) {
                        return (
                          <PaginationItem key={i}>
                            <PaginationEllipsis />
                          </PaginationItem>
                        );
                      }
                      
                      return (
                        <PaginationItem key={i}>
                          <PaginationLink
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              setCurrentPage(pageNum);
                            }}
                            isActive={currentPage === pageNum}
                          >
                            {pageNum}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    })}
                    
                    <PaginationItem>
                      <PaginationNext 
                        href="#" 
                        onClick={(e) => {
                          e.preventDefault();
                          if (currentPage < totalPages) setCurrentPage(currentPage + 1);
                        }} 
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
