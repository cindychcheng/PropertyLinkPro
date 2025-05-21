import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { 
  Dialog, 
  DialogContent, 
  DialogTitle, 
  DialogHeader,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  formatDisplayDate, 
  formatCurrency,
  getMonthsSince
} from "@/lib/utils/date-utils";
import { PropertyForm } from "@/components/forms/property-form";
import { TenantForm } from "@/components/forms/tenant-form";
import { LandlordForm } from "@/components/forms/landlord-form";
import { RateIncreaseForm } from "@/components/forms/rate-increase-form";
import { Pencil, TrendingUp } from "lucide-react";
import { PropertyWithDetails } from "@shared/schema";

type PropertyDialogProps = {
  propertyAddress: string | null;
  isOpen: boolean;
  onClose: () => void;
  onProcessRateIncrease: (address: string) => void;
};

export function PropertyDialog({
  propertyAddress,
  isOpen,
  onClose,
  onProcessRateIncrease,
}: PropertyDialogProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State for edit modes
  const [editingProperty, setEditingProperty] = useState(false);
  const [editingTenant, setEditingTenant] = useState(false);
  const [editingLandlord, setEditingLandlord] = useState(false);
  const [editingRentalRate, setEditingRentalRate] = useState(false);

  // Query for property data
  const { data: property, isLoading, error } = useQuery<PropertyWithDetails>({
    queryKey: [`/api/properties/${encodeURIComponent(propertyAddress || '')}`],
    enabled: isOpen && !!propertyAddress,
    staleTime: 60000, // 1 minute
  });

  // Query for rental history
  const { data: rentalHistory = [], isLoading: isLoadingHistory } = useQuery<any[]>({
    queryKey: [`/api/rental-history/${encodeURIComponent(propertyAddress || '')}`],
    enabled: isOpen && !!propertyAddress,
    staleTime: 60000, // 1 minute
  });
  
  // Handler for when editing is complete
  const handleEditSuccess = () => {
    // Reset all edit states
    setEditingProperty(false);
    setEditingTenant(false);
    setEditingLandlord(false);
    setEditingRentalRate(false);
    
    // Refresh data
    if (propertyAddress) {
      queryClient.invalidateQueries({
        queryKey: [`/api/properties/${encodeURIComponent(propertyAddress)}`],
      });
      queryClient.invalidateQueries({
        queryKey: [`/api/rental-history/${encodeURIComponent(propertyAddress)}`],
      });
      queryClient.invalidateQueries({
        queryKey: ['/api/properties'],
      });
    }
    
    toast({
      title: "Changes saved",
      description: "Your changes have been saved successfully.",
    });
  };

  // Handle errors
  if (error) {
    toast({
      title: "Error fetching property details",
      description: (error as Error).message,
      variant: "destructive",
    });
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Property Details</DialogTitle>
        </DialogHeader>
        
        <div className="mt-4 flex-grow overflow-y-auto pr-1">
          <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5 sticky top-0 z-10 bg-background">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="landlord">Landlord</TabsTrigger>
              <TabsTrigger value="tenant">Tenant</TabsTrigger>
              <TabsTrigger value="rental">Rental History</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="py-4">
              {isLoading ? (
                <div className="flex justify-center items-center h-40">
                  <p>Loading property details...</p>
                </div>
              ) : !property ? (
                <div className="text-center py-10">
                  <p className="text-neutral-medium">No property details available</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2">
                    <div className="bg-neutral-lightest rounded-lg p-4">
                      <h4 className="font-medium mb-4">Property Information</h4>
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium">Property Details</h4>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setEditingProperty(true)}
                          className="h-8 px-2 text-neutral-medium hover:text-primary"
                        >
                          <Pencil className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      </div>
                      
                      {editingProperty ? (
                        <PropertyForm 
                          propertyData={{
                            propertyAddress: property.propertyAddress,
                            keyNumber: property.keyNumber,
                            strataContactNumber: property.strataContactNumber,
                            serviceType: property.serviceType || ""
                          }}
                          isEdit={true}
                          onSuccess={handleEditSuccess}
                          onCancel={() => setEditingProperty(false)}
                        />
                      ) : (
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-neutral-medium">Address</p>
                            <p className="font-medium">{property.propertyAddress}</p>
                            {property.propertyAddress && property.propertyAddress.includes(',') && (
                              <p className="text-sm">{property.propertyAddress.split(',')[1]}</p>
                            )}
                          </div>
                          <div>
                            <p className="text-sm text-neutral-medium">Key Number</p>
                            <p className="font-medium">{property.keyNumber}</p>
                          </div>
                          <div>
                            <p className="text-sm text-neutral-medium">Service Type</p>
                            <p className="font-medium">{property.serviceType}</p>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {property.rentalInfo && (
                      <div className="mt-4 bg-neutral-lightest rounded-lg p-4">
                        <h4 className="font-medium mb-4">Current Rental Information</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-neutral-medium">Current Rate</p>
                            <p className="font-medium">
                              {property.rentalInfo.latestRentalRate 
                                ? formatCurrency(property.rentalInfo.latestRentalRate) 
                                : '$0'}/month
                            </p>
                          </div>
                          {property.tenant && (
                            <div>
                              <p className="text-sm text-neutral-medium">Tenant Since</p>
                              <p className="font-medium">
                                {property.tenant.moveInDate 
                                  ? formatDisplayDate(property.tenant.moveInDate) 
                                  : 'N/A'}
                              </p>
                            </div>
                          )}
                          <div>
                            <p className="text-sm text-neutral-medium">Last Increase</p>
                            <p className="font-medium">
                              {property.rentalInfo.latestRateIncreaseDate 
                                ? formatDisplayDate(property.rentalInfo.latestRateIncreaseDate) 
                                : 'N/A'}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-neutral-medium">Next Eligible</p>
                            <p className="font-medium">
                              {property.rentalInfo.nextAllowableRentalIncreaseDate 
                                ? formatDisplayDate(property.rentalInfo.nextAllowableRentalIncreaseDate) 
                                : 'N/A'}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-neutral-medium">Max New Rate</p>
                            <p className="font-medium">
                              {property.rentalInfo.nextAllowableRentalRate 
                                ? formatCurrency(property.rentalInfo.nextAllowableRentalRate) 
                                : '$0'}/month
                            </p>
                          </div>
                        </div>
                        
                        <div className="mt-4">
                          <Button 
                            className="bg-primary text-white"
                            onClick={() => onProcessRateIncrease(property.propertyAddress)}
                          >
                            <TrendingUp className="h-4 w-4 mr-2" />
                            Process Rate Increase
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <div className="bg-neutral-lightest rounded-lg p-4">
                      <h4 className="font-medium mb-4">Landlord</h4>
                      {property.landlordOwners && property.landlordOwners.length > 0 ? (
                        <div>
                          <p className="font-medium">{property.landlordOwners[0].name}</p>
                          <p className="text-sm">{property.landlordOwners[0].contactNumber || 'No contact number'}</p>
                          <p className="text-sm text-neutral-medium">
                            Birthday: {property.landlordOwners[0].birthday 
                              ? formatDisplayDate(property.landlordOwners[0].birthday).split(',')[0] 
                              : 'Not provided'}
                          </p>
                          <div className="mt-2">
                            <a href="#" className="text-primary text-sm hover:underline">View details</a>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-neutral-medium">No landlord information available</p>
                      )}
                      
                      <h4 className="font-medium mb-4 mt-6">Current Tenant</h4>
                      {property.tenant ? (
                        <div>
                          <p className="font-medium">{property.tenant.name}</p>
                          <p className="text-sm">{property.tenant.contactNumber || 'No contact number'}</p>
                          <p className="text-sm">{property.tenant.email || 'No email provided'}</p>
                          <p className="text-sm text-neutral-medium">
                            Birthday: {property.tenant.birthday 
                              ? formatDisplayDate(property.tenant.birthday).split(',')[0] 
                              : 'Not provided'}
                          </p>
                          <div className="mt-2">
                            <a href="#" className="text-primary text-sm hover:underline">View details</a>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-warning italic">Vacant</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              <div className="mt-6">
                <h4 className="font-medium mb-4">Rental Increase History</h4>
                {isLoadingHistory ? (
                  <div className="flex justify-center items-center h-40">
                    <p>Loading rental history...</p>
                  </div>
                ) : rentalHistory.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-neutral-light">
                      <thead className="bg-neutral-lightest">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-dark uppercase tracking-wider">
                            Date
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-dark uppercase tracking-wider">
                            Previous Rate
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-dark uppercase tracking-wider">
                            New Rate
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-dark uppercase tracking-wider">
                            Increase %
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-dark uppercase tracking-wider">
                            Notes
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-neutral-light">
                        {rentalHistory.map((history: any, index: number) => {
                          const previousRate = parseFloat(history.previousRate);
                          const newRate = parseFloat(history.newRate);
                          const percentageIncrease = ((newRate - previousRate) / previousRate) * 100;
                          
                          return (
                            <tr key={index}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                {formatDisplayDate(history.increaseDate)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                {formatCurrency(previousRate)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                {formatCurrency(newRate)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                +{percentageIncrease.toFixed(1)}%
                              </td>
                              <td className="px-6 py-4 text-sm">
                                {history.notes || 'No notes'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-4 bg-neutral-lightest rounded-lg">
                    <p className="text-neutral-medium">No rental increase history available</p>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="landlord" className="py-4">
              <div className="bg-neutral-lightest p-4 rounded-lg">
                <h2 className="text-xl font-semibold mb-4">Landlord Details</h2>
                {property && property.landlordOwners && property.landlordOwners.length > 0 ? (
                  <div>
                    <p className="font-medium">{property.landlordOwners[0].name}</p>
                    <p className="text-sm">{property.landlordOwners[0].contactNumber || 'No contact number'}</p>
                    <p className="text-sm text-neutral-medium">
                      Birthday: {property.landlordOwners[0].birthday 
                        ? formatDisplayDate(property.landlordOwners[0].birthday) 
                        : 'Not provided'}
                    </p>
                  </div>
                ) : (
                  <p className="text-neutral-medium">No landlord information available</p>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="tenant" className="py-4">
              <div className="bg-neutral-lightest p-4 rounded-lg">
                <h2 className="text-xl font-semibold mb-4">Tenant Details</h2>
                {property && property.tenant ? (
                  <div>
                    <p className="font-medium">{property.tenant.name}</p>
                    <p className="text-sm">{property.tenant.contactNumber || 'No contact number'}</p>
                    <p className="text-sm">{property.tenant.email || 'No email provided'}</p>
                    <p className="text-sm text-neutral-medium">
                      Birthday: {property.tenant.birthday 
                        ? formatDisplayDate(property.tenant.birthday) 
                        : 'Not provided'}
                    </p>
                    <p className="mt-4"><strong>Move-in Date:</strong> {property.tenant.moveInDate 
                      ? formatDisplayDate(property.tenant.moveInDate) 
                      : 'Not specified'}</p>
                    
                    {property.tenant.moveOutDate && (
                      <p><strong>Move-out Date:</strong> {formatDisplayDate(property.tenant.moveOutDate)}</p>
                    )}
                  </div>
                ) : (
                  <p className="text-warning italic">Vacant</p>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="rental" className="py-4">
              <div className="bg-neutral-lightest p-4 rounded-lg">
                <h2 className="text-xl font-semibold mb-4">Rental History</h2>
                {isLoadingHistory ? (
                  <p>Loading...</p>
                ) : rentalHistory && rentalHistory.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-neutral-light">
                      <thead className="bg-neutral-lightest">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-dark uppercase tracking-wider">
                            Date
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-dark uppercase tracking-wider">
                            Previous Rate
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-dark uppercase tracking-wider">
                            New Rate
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-dark uppercase tracking-wider">
                            Notes
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-neutral-light">
                        {rentalHistory.map((history: any, index: number) => (
                          <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {formatDisplayDate(history.increaseDate)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {formatCurrency(history.previousRate)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {formatCurrency(history.newRate)}
                            </td>
                            <td className="px-6 py-4 text-sm">
                              {history.notes || 'No notes'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-neutral-medium">No rental history available</p>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="notes" className="py-4">
              <div className="bg-neutral-lightest p-4 rounded-lg">
                <h2 className="text-xl font-semibold mb-4">Notes</h2>
                <p className="text-neutral-medium italic">No notes available for this property.</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}