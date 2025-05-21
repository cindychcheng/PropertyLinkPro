import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
} from "@/lib/utils/date-utils";
import { TrendingUp } from "lucide-react";

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

  const { data: property, isLoading, error } = useQuery({
    queryKey: [`/api/properties/${encodeURIComponent(propertyAddress || '')}`],
    enabled: isOpen && !!propertyAddress,
    staleTime: 60000, // 1 minute
  });

  const { data: rentalHistory, isLoading: isLoadingHistory } = useQuery({
    queryKey: [`/api/rental-history/${encodeURIComponent(propertyAddress || '')}`],
    enabled: isOpen && !!propertyAddress,
    staleTime: 60000, // 1 minute
  });

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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2">
                    <div className="bg-neutral-lightest rounded-lg p-4">
                      <Skeleton className="h-6 w-40 mb-4" />
                      <div className="grid grid-cols-2 gap-4">
                        <Skeleton className="h-24 w-full" />
                        <Skeleton className="h-24 w-full" />
                        <Skeleton className="h-24 w-full" />
                        <Skeleton className="h-24 w-full" />
                      </div>
                    </div>
                    <div className="mt-4 bg-neutral-lightest rounded-lg p-4">
                      <Skeleton className="h-6 w-48 mb-4" />
                      <div className="grid grid-cols-2 gap-4">
                        <Skeleton className="h-20 w-full" />
                        <Skeleton className="h-20 w-full" />
                        <Skeleton className="h-20 w-full" />
                        <Skeleton className="h-20 w-full" />
                        <Skeleton className="h-20 w-full" />
                        <Skeleton className="h-20 w-full" />
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="bg-neutral-lightest rounded-lg p-4">
                      <Skeleton className="h-6 w-24 mb-4" />
                      <Skeleton className="h-16 w-full mb-2" />
                      <Skeleton className="h-16 w-full mb-4" />
                      <Skeleton className="h-6 w-32 mb-4 mt-6" />
                      <Skeleton className="h-16 w-full mb-2" />
                      <Skeleton className="h-16 w-full" />
                    </div>
                  </div>
                </div>
              ) : property ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2">
                    <div className="bg-neutral-lightest rounded-lg p-4">
                      <h4 className="font-medium mb-4">Property Information</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-neutral-medium">Address</p>
                          <p className="font-medium">{property.propertyAddress}</p>
                          {property.propertyAddress.includes(',') && (
                            <p className="text-sm">{property.propertyAddress.split(',')[1]}</p>
                          )}
                        </div>
                        <div>
                          <p className="text-sm text-neutral-medium">Key Number</p>
                          <p className="font-medium">{property.keyNumber}</p>
                        </div>
                        <div>
                          <p className="text-sm text-neutral-medium">Service Type</p>
                          <p className="font-medium">{property.serviceType || 'Not specified'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-neutral-medium">Strata Contact</p>
                          <p className="font-medium">{property.strataContactNumber || 'Not provided'}</p>
                        </div>
                      </div>
                    </div>
                    
                    {property.rentalInfo && (
                      <div className="mt-4 bg-neutral-lightest rounded-lg p-4">
                        <h4 className="font-medium mb-4">Current Rental Information</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-neutral-medium">Current Rate</p>
                            <p className="font-medium">{formatCurrency(property.rentalInfo.latestRentalRate)}/month</p>
                          </div>
                          <div>
                            <p className="text-sm text-neutral-medium">Tenant Since</p>
                            <p className="font-medium">
                              {property.tenant ? formatDisplayDate(property.tenant.moveInDate) : 'N/A'}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-neutral-medium">Last Increase</p>
                            <p className="font-medium">{formatDisplayDate(property.rentalInfo.latestRateIncreaseDate)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-neutral-medium">Next Eligible Increase</p>
                            <p className="font-medium">{formatDisplayDate(property.rentalInfo.nextAllowableRentalIncreaseDate)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-neutral-medium">Max New Rate</p>
                            <p className="font-medium">
                              {formatCurrency(property.rentalInfo.nextAllowableRentalRate)}/month (+3%)
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-neutral-medium">Increase Reminder</p>
                            <p className="font-medium text-warning">{formatDisplayDate(property.rentalInfo.reminderDate)}</p>
                          </div>
                        </div>
                        <div className="mt-4">
                          <Button 
                            className="bg-primary text-white"
                            onClick={() => property && onProcessRateIncrease(property.propertyAddress)}
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
                            <a href="#" className="text-primary text-sm hover:underline">View full details</a>
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
                            <a href="#" className="text-primary text-sm hover:underline">View full details</a>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-warning italic">Vacant</p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-10">
                  <p className="text-neutral-medium">No property details available</p>
                </div>
              )}
              
              <div className="mt-6">
                <h4 className="font-medium mb-4">Rental Increase History</h4>
                {isLoadingHistory ? (
                  <Skeleton className="h-40 w-full" />
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
            
            <TabsContent value="landlord">
              <div className="py-8 text-center">
                <p className="text-neutral-medium">Landlord details will be implemented in a future update.</p>
              </div>
            </TabsContent>
            
            <TabsContent value="tenant">
              <div className="py-8 text-center">
                <p className="text-neutral-medium">Tenant details will be implemented in a future update.</p>
              </div>
            </TabsContent>
            
            <TabsContent value="rental">
              <div className="py-8 text-center">
                <p className="text-neutral-medium">Full rental history will be implemented in a future update.</p>
              </div>
            </TabsContent>
            
            <TabsContent value="notes">
              <div className="py-8 text-center">
                <p className="text-neutral-medium">Notes will be implemented in a future update.</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
