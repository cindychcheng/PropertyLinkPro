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
  getMonthsSince
} from "@/lib/utils/date-utils";
import { TrendingUp } from "lucide-react";
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

  const { data: property = {}, isLoading, error } = useQuery({
    queryKey: [`/api/properties/${encodeURIComponent(propertyAddress || '')}`],
    enabled: isOpen && !!propertyAddress,
    staleTime: 60000, // 1 minute
  });

  const { data: rentalHistory = [], isLoading: isLoadingHistory } = useQuery({
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
                          <p className="font-medium">{property.propertyAddress || 'N/A'}</p>
                          {property.propertyAddress && property.propertyAddress.includes(',') && (
                            <p className="text-sm">{property.propertyAddress.split(',')[1]}</p>
                          )}
                        </div>
                        <div>
                          <p className="text-sm text-neutral-medium">Key Number</p>
                          <p className="font-medium">{property.keyNumber || 'N/A'}</p>
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
                            <p className="font-medium">{property.rentalInfo.latestRentalRate ? formatCurrency(property.rentalInfo.latestRentalRate) : '$0'}/month</p>
                          </div>
                          <div>
                            <p className="text-sm text-neutral-medium">Tenant Since</p>
                            <p className="font-medium">
                              {property.tenant && property.tenant.moveInDate ? formatDisplayDate(new Date(property.tenant.moveInDate)) : 'N/A'}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-neutral-medium">Last Increase</p>
                            <p className="font-medium">
                              {property.rentalInfo.latestRateIncreaseDate ? formatDisplayDate(new Date(property.rentalInfo.latestRateIncreaseDate)) : 'N/A'}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-neutral-medium">Next Eligible Increase</p>
                            <p className="font-medium">
                              {property.rentalInfo.nextAllowableRentalIncreaseDate ? formatDisplayDate(new Date(property.rentalInfo.nextAllowableRentalIncreaseDate)) : 'N/A'}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-neutral-medium">Max New Rate</p>
                            <p className="font-medium">
                              {property.rentalInfo.nextAllowableRentalRate ? formatCurrency(property.rentalInfo.nextAllowableRentalRate) : '$0'}/month (+3%)
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-neutral-medium">Increase Reminder</p>
                            <p className="font-medium text-warning">
                              {property.rentalInfo.reminderDate ? formatDisplayDate(new Date(property.rentalInfo.reminderDate)) : 'N/A'}
                            </p>
                          </div>
                        </div>
                        <div className="mt-4">
                          <Button 
                            className="bg-primary text-white"
                            onClick={() => property.propertyAddress && onProcessRateIncrease(property.propertyAddress)}
                            disabled={!property.propertyAddress}
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
                      {property.landlordOwners && Array.isArray(property.landlordOwners) && property.landlordOwners.length > 0 ? (
                        <div>
                          <p className="font-medium">{property.landlordOwners[0].name}</p>
                          <p className="text-sm">{property.landlordOwners[0].contactNumber || 'No contact number'}</p>
                          <p className="text-sm text-neutral-medium">
                            Birthday: {property.landlordOwners[0].birthday 
                              ? formatDisplayDate(new Date(property.landlordOwners[0].birthday)).split(',')[0] 
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
                              ? formatDisplayDate(new Date(property.tenant.birthday)).split(',')[0] 
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
              {isLoading ? (
                <div className="p-6">
                  <Skeleton className="h-6 w-40 mb-4" />
                  <div className="grid grid-cols-2 gap-4">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                  </div>
                </div>
              ) : property.landlordOwners && Array.isArray(property.landlordOwners) && property.landlordOwners.length > 0 ? (
                <div className="p-6">
                  <h4 className="font-medium mb-6">Landlord Information</h4>
                  <div className="bg-neutral-lightest rounded-lg p-4 mb-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <p className="text-sm text-neutral-medium">Name</p>
                        <p className="font-medium">{property.landlordOwners[0].name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-neutral-medium">Contact Number</p>
                        <p className="font-medium">{property.landlordOwners[0].contactNumber || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-neutral-medium">Birthday</p>
                        <p className="font-medium">
                          {property.landlordOwners[0].birthday 
                            ? formatDisplayDate(new Date(property.landlordOwners[0].birthday))
                            : 'Not provided'}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <h4 className="font-medium mb-4">Property Details</h4>
                  <div className="bg-neutral-lightest rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <p className="text-sm text-neutral-medium">Property Address</p>
                        <p className="font-medium">{property.propertyAddress || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-neutral-medium">Key Number</p>
                        <p className="font-medium">{property.keyNumber || 'N/A'}</p>
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
                </div>
              ) : (
                <div className="py-8 text-center">
                  <p className="text-neutral-medium">No landlord information available for this property.</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="tenant">
              {isLoading ? (
                <div className="p-6">
                  <Skeleton className="h-6 w-40 mb-4" />
                  <div className="grid grid-cols-2 gap-4">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                  </div>
                </div>
              ) : property.tenant ? (
                <div className="p-6">
                  <h4 className="font-medium mb-6">Tenant Information</h4>
                  <div className="bg-neutral-lightest rounded-lg p-4 mb-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <p className="text-sm text-neutral-medium">Name</p>
                        <p className="font-medium">{property.tenant.name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-neutral-medium">Contact Number</p>
                        <p className="font-medium">{property.tenant.contactNumber || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-neutral-medium">Email</p>
                        <p className="font-medium">{property.tenant.email || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-neutral-medium">Birthday</p>
                        <p className="font-medium">
                          {property.tenant.birthday 
                            ? formatDisplayDate(new Date(property.tenant.birthday))
                            : 'Not provided'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-neutral-medium">Move-in Date</p>
                        <p className="font-medium">
                          {property.tenant.moveInDate 
                            ? formatDisplayDate(new Date(property.tenant.moveInDate))
                            : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-neutral-medium">Tenancy Duration</p>
                        <p className="font-medium">
                          {property.tenant.moveInDate 
                            ? `${getMonthsSince(new Date(property.tenant.moveInDate))} months`
                            : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <h4 className="font-medium mb-4">Lease Information</h4>
                  <div className="bg-neutral-lightest rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <p className="text-sm text-neutral-medium">Current Rental Rate</p>
                        <p className="font-medium">
                          {property.rentalInfo && property.rentalInfo.latestRentalRate
                            ? `${formatCurrency(property.rentalInfo.latestRentalRate)}/month`
                            : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-neutral-medium">Last Increase Date</p>
                        <p className="font-medium">
                          {property.rentalInfo && property.rentalInfo.latestRateIncreaseDate
                            ? formatDisplayDate(new Date(property.rentalInfo.latestRateIncreaseDate))
                            : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center">
                  <p className="text-neutral-medium">This property is currently vacant. No tenant information available.</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="rental">
              {isLoadingHistory ? (
                <div className="p-6">
                  <Skeleton className="h-6 w-40 mb-4" />
                  <Skeleton className="h-40 w-full" />
                </div>
              ) : rentalHistory && rentalHistory.length > 0 ? (
                <div className="p-6">
                  <h4 className="font-medium mb-6">Rental Rate History</h4>
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
                                {formatDisplayDate(new Date(history.increaseDate))}
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
                  
                  {property.rentalInfo && (
                    <div className="mt-6 bg-neutral-lightest rounded-lg p-4">
                      <h4 className="font-medium mb-4">Next Rental Increase</h4>
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <p className="text-sm text-neutral-medium">Eligible Date</p>
                          <p className="font-medium">
                            {property.rentalInfo.nextAllowableRentalIncreaseDate
                              ? formatDisplayDate(new Date(property.rentalInfo.nextAllowableRentalIncreaseDate))
                              : 'N/A'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-neutral-medium">Maximum Allowable Rate</p>
                          <p className="font-medium">
                            {property.rentalInfo.nextAllowableRentalRate
                              ? `${formatCurrency(property.rentalInfo.nextAllowableRentalRate)}/month`
                              : 'N/A'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="mt-4">
                        <Button 
                          className="bg-primary text-white"
                          onClick={() => property.propertyAddress && onProcessRateIncrease(property.propertyAddress)}
                          disabled={!property.propertyAddress}
                        >
                          <TrendingUp className="h-4 w-4 mr-2" />
                          Process New Rate Increase
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <p className="text-neutral-medium">No rental increase history is available for this property.</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="notes">
              {isLoading ? (
                <div className="p-6">
                  <Skeleton className="h-6 w-40 mb-4" />
                  <Skeleton className="h-40 w-full" />
                </div>
              ) : (
                <div className="p-6">
                  <h4 className="font-medium mb-6">Property Notes</h4>
                  <div className="bg-neutral-lightest rounded-lg p-4 mb-6">
                    <div className="flex justify-between items-center mb-4">
                      <h5 className="text-sm font-medium">General Notes</h5>
                      <Button variant="outline" size="sm">Add Note</Button>
                    </div>
                    
                    <div className="bg-white rounded-md p-4 mb-4 border border-neutral-light">
                      <div className="flex justify-between items-start">
                        <div>
                          <h6 className="font-medium">Property inspection completed</h6>
                          <p className="text-sm mt-2">Annual inspection completed with no major issues found. Minor repairs needed for kitchen faucet.</p>
                        </div>
                        <div className="text-xs text-neutral-medium">May 10, 2025</div>
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-md p-4 border border-neutral-light">
                      <div className="flex justify-between items-start">
                        <div>
                          <h6 className="font-medium">Tenant request</h6>
                          <p className="text-sm mt-2">Tenant requested information about lease renewal terms. Follow up needed by June 1st.</p>
                        </div>
                        <div className="text-xs text-neutral-medium">April 25, 2025</div>
                      </div>
                    </div>
                  </div>
                  
                  <h4 className="font-medium mb-4">Maintenance History</h4>
                  <div className="bg-neutral-lightest rounded-lg p-4">
                    <div className="flex justify-between items-center mb-4">
                      <h5 className="text-sm font-medium">Recent Maintenance</h5>
                      <Button variant="outline" size="sm">Add Maintenance</Button>
                    </div>
                    
                    <p className="text-center p-4 text-neutral-medium">No maintenance records found.</p>
                  </div>
                </div>
              )}
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
