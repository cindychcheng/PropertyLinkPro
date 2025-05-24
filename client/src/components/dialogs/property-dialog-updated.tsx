import { useState, useEffect } from "react";
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

// Function to check if tenant has lived in property for at least 12 months
function hasTenantLivedForMinimumPeriod(moveInDate: Date | string | undefined): boolean {
  if (!moveInDate) return false;
  
  const today = new Date();
  const moveInDateObj = moveInDate instanceof Date ? moveInDate : new Date(moveInDate);
  
  // Ensure we have a valid date
  if (isNaN(moveInDateObj.getTime())) return false;
  
  const diffInMonths = (today.getFullYear() - moveInDateObj.getFullYear()) * 12 + 
    (today.getMonth() - moveInDateObj.getMonth());
  
  return diffInMonths >= 12;
}
import { PropertyForm } from "@/components/forms/property-form";
import { TenantForm } from "@/components/forms/tenant-form";
import { LandlordForm } from "@/components/forms/landlord-form";
import { RateIncreaseForm } from "@/components/forms/rate-increase-form";
import { InitialRentalRateForm } from "@/components/forms/initial-rental-rate-form";
import { NewTenantRateForm } from "@/components/forms/new-tenant-rate-form";
import { Pencil, TrendingUp, UserPlus } from "lucide-react";
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
  const [addingNewTenantRate, setAddingNewTenantRate] = useState(false);

  // Query for property data - simplified approach
  const {
    data: property,
    isLoading: isLoadingProperty,
    error: propertyError,
  } = useQuery<PropertyWithDetails>({
    queryKey: [`/api/properties/${encodeURIComponent(propertyAddress || '')}`],
    enabled: isOpen && !!propertyAddress,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
    retry: false,
  });

  // Debug what data the client receives
  useEffect(() => {
    if (isOpen && propertyAddress) {
      console.log("=== DIALOG OPENED WITH ADDRESS ===");
      console.log("Property address:", propertyAddress);
      console.log("Dialog open:", isOpen);
    }
    
    if (property) {
      console.log("=== CLIENT RECEIVED DATA ===");
      console.log("Full property object:", JSON.stringify(property, null, 2));
      console.log("Tenant data:", property?.tenant);
      console.log("Has tenant?", !!property?.tenant);
    }
  }, [property, isOpen, propertyAddress]);

  // Query for rental history
  const {
    data: rentalHistory,
    isLoading: isLoadingHistory,
  } = useQuery({
    queryKey: [`/api/rental-history/${encodeURIComponent(propertyAddress || '')}`],
    enabled: isOpen && !!propertyAddress,
  });

  // Reset to overview tab when dialog opens and force fresh data
  useEffect(() => {
    if (isOpen && propertyAddress) {
      console.log("=== DIALOG OPENING ===");
      console.log("Property address:", propertyAddress);
      setActiveTab("overview");
      
      // Force fresh data by invalidating cache and refetching
      queryClient.invalidateQueries({
        queryKey: [`/api/properties/${encodeURIComponent(propertyAddress)}`],
      });
      
      // Also force refetch
      queryClient.refetchQueries({
        queryKey: [`/api/properties/${encodeURIComponent(propertyAddress)}`],
      });
    }
  }, [isOpen, propertyAddress, queryClient]);

  // Handle success of edit operations
  const handleEditSuccess = () => {
    // Close edit forms
    setEditingProperty(false);
    setEditingTenant(false);
    setEditingLandlord(false);
    setEditingRentalRate(false);
    setAddingNewTenantRate(false);
    
    // Invalidate queries to refresh data
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
  };

  // Debug at render time
  console.log("=== DIALOG RENDER ===");
  console.log("isOpen:", isOpen);
  console.log("propertyAddress prop:", propertyAddress);
  console.log("property data:", property);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {isLoadingProperty ? (
              <Skeleton className="h-8 w-64" />
            ) : (
              property?.propertyAddress || propertyAddress || "Property Details"
            )}
          </DialogTitle>
        </DialogHeader>
        
        <div className="mt-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-5 mb-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="landlord">Landlord</TabsTrigger>
              <TabsTrigger value="tenant">Tenant</TabsTrigger>
              <TabsTrigger value="rental">Rental History</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="py-4">
              {isLoadingProperty ? (
                <div className="space-y-4">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-6 w-1/2" />
                </div>
              ) : (
                <div className="bg-neutral-lightest p-4 rounded-lg">
                  <div className="flex justify-between items-start mb-4">
                    <h2 className="text-xl font-semibold">Property Details</h2>
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
                  
                  {editingProperty && property ? (
                    <PropertyForm 
                      propertyData={{
                        propertyAddress: property.propertyAddress,
                        keyNumber: property.keyNumber,
                        strataContactNumber: property.strataContactNumber,
                        strataManagementCompany: property.strataManagementCompany,
                        strataContactPerson: property.strataContactPerson,
                        serviceType: property.serviceType
                      }}
                      isEdit={true}
                      onSuccess={handleEditSuccess}
                      onCancel={() => setEditingProperty(false)}
                    />
                  ) : property ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium mb-4">Property Information</h4>
                          <p><strong>Address:</strong> {property.propertyAddress}</p>
                          <p><strong>Key Number:</strong> {property.keyNumber}</p>
                          <p><strong>Service Type:</strong> {property.serviceType}</p>
                        </div>
                        
                        <div>
                          <h4 className="font-medium mb-4">Strata Information</h4>
                          <p><strong>Strata Management:</strong> {property.strataManagementCompany || 'Not provided'}</p>
                          <p><strong>Contact Person:</strong> {property.strataContactPerson || 'Not provided'}</p>
                          <p><strong>Contact Number:</strong> {property.strataContactNumber || 'Not provided'}</p>
                        </div>
                      </div>
                      
                      <hr className="my-4 border-neutral-light" />
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium mb-4">Owners</h4>
                          {property.landlordOwners && property.landlordOwners.length > 0 ? (
                            <div className="space-y-4">
                              {property.landlordOwners.map((owner, index) => (
                                <div key={index} className={index > 0 ? "border-t pt-4" : ""}>
                                  <p className="font-medium">{owner.name}</p>
                                  <p className="text-sm">{owner.contactNumber || 'No contact number'}</p>
                                  <p className="text-sm">
                                    {owner.residentialAddress || 'No residential address'}
                                  </p>
                                  <p className="text-sm text-neutral-medium">
                                    Birthday: {owner.birthday 
                                      ? formatDisplayDate(owner.birthday) 
                                      : 'Not provided'}
                                  </p>
                                </div>
                              ))}
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
                                  ? formatDisplayDate(property.tenant.birthday) 
                                  : 'Not provided'}
                              </p>
                              <p className="text-sm">
                                <strong>Move-in Date:</strong> {formatDisplayDate(property.tenant.moveInDate)}
                              </p>
                              {property.tenant.moveOutDate && (
                                <p className="text-sm text-warning">
                                  <strong>Move-out Date:</strong> {formatDisplayDate(property.tenant.moveOutDate)}
                                </p>
                              )}
                            </div>
                          ) : (
                            <p className="text-sm text-warning italic">Vacant</p>
                          )}
                          
                          {/* Tenant History Section - Debug and improved version */}
                          <h4 className="font-medium mb-2 mt-6">Tenant History</h4>
                          {property.tenantHistory ? (
                            <div className="space-y-4">
                              {property.tenantHistory.map((tenant, index) => (
                                <div key={index} className="border-l-2 border-neutral-lighter pl-3 py-1 mt-2">
                                  <p className="font-medium">{tenant.name}</p>
                                  <p className="text-xs text-neutral-medium">
                                    {formatDisplayDate(tenant.moveInDate)} - {tenant.moveOutDate ? formatDisplayDate(tenant.moveOutDate) : 'Present'}
                                  </p>
                                  <p className="text-xs">{tenant.contactNumber || 'No contact number'}</p>
                                  <p className="text-xs">{tenant.email || 'No email'}</p>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm">No tenant history available</p>
                          )}
                        </div>
                        
                        <div>
                          <h4 className="font-medium mb-4">Rental Information</h4>
                          {property.rentalInfo ? (
                            <div>
                              <p><strong>Current Rental Rate:</strong> {formatCurrency(property.rentalInfo.latestRentalRate)}</p>
                              <p><strong>Last Increase Date:</strong> {formatDisplayDate(property.rentalInfo.latestRateIncreaseDate)}</p>
                              <p><strong>Next Allowable Increase:</strong> {formatDisplayDate(property.rentalInfo.nextAllowableRentalIncreaseDate)}</p>
                              <p><strong>Next Allowable Rate:</strong> {formatCurrency(property.rentalInfo.nextAllowableRentalRate)}</p>
                              <p><strong>Reminder Date:</strong> {formatDisplayDate(property.rentalInfo.reminderDate)}</p>
                              <p><strong>Months Since Increase:</strong> {getMonthsSince(property.rentalInfo.latestRateIncreaseDate)}</p>
                              
                              <div className="mt-4">
                                {property.tenant && hasTenantLivedForMinimumPeriod(property.tenant.moveInDate) ? (
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => {
                                      if (propertyAddress) {
                                        onProcessRateIncrease(propertyAddress);
                                        onClose();
                                      }
                                    }}
                                  >
                                    <TrendingUp className="h-4 w-4 mr-1" />
                                    Process Rate Increase
                                  </Button>
                                ) : (
                                  <div className="text-warning text-sm italic mt-2">
                                    {property.tenant ? 
                                      "Tenant must live in property for at least 12 months before processing a rate increase" : 
                                      "No tenant currently in property"}
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div>
                              <p className="text-warning italic">No rental information available</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p>No property information available</p>
                  )}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="rental" className="py-4">
              <div className="bg-neutral-lightest p-4 rounded-lg">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-xl font-semibold">Rental History</h2>
                  <div className="space-x-2">
                    {/* Conditional functions based on tenant status */}
                    {(() => {
                      // Debug: Let's see what we have
                      console.log('=== RENTAL HISTORY DEBUG ===');
                      console.log('Property object exists:', !!property);
                      console.log('Property type:', typeof property);
                      console.log('Property tenant exists:', !!property?.tenant);
                      console.log('Property tenant name:', property?.tenant?.name);
                      console.log('Raw property:', property);
                      
                      // Case 1: Property is vacant (no tenant OR tenant moved out)
                      if (!property?.tenant || property?.tenant?.moveOutDate) {
                        return (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => setActiveTab("tenant")}
                            className="h-8 px-2"
                          >
                            <UserPlus className="h-4 w-4 mr-1" />
                            Add Tenants to the Property
                          </Button>
                        );
                      }
                      
                      // Case 2: Tenant exists but no rental rate has been set - PRIORITY
                      if (property?.tenant && (!property?.rentalInfo || !property?.rentalInfo?.latestRentalRate || property?.rentalInfo?.latestRentalRate === 0)) {
                        return (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => setEditingRentalRate(true)}
                            className="h-8 px-2"
                          >
                            <UserPlus className="h-4 w-4 mr-1" />
                            Add Initial Rental Rate
                          </Button>
                        );
                      }
                      
                      // Case 3: Tenant has lived for more than 12 months AND has rental info set
                      if (property?.tenant && property?.rentalInfo && property?.rentalInfo?.latestRentalRate && property?.rentalInfo?.latestRentalRate > 0) {
                        // Check if it's been at least 12 months (required for rental increases)
                        const today = new Date();
                        const moveInDateObj = new Date(property.tenant.moveInDate);
                        const diffInMonths = (today.getFullYear() - moveInDateObj.getFullYear()) * 12 + 
                          (today.getMonth() - moveInDateObj.getMonth());
                        
                        if (diffInMonths >= 12) {
                          return (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => setEditingRentalRate(true)}
                              className="h-8 px-2 text-neutral-medium hover:text-primary"
                            >
                              <Pencil className="h-4 w-4 mr-1" />
                              Set New Rate for Existing Tenant
                            </Button>
                          );
                        }
                      }
                      
                      // Case 4: Other situations - don't show any buttons
                      return null;
                    })()}
                  </div>
                </div>
                
                {addingNewTenantRate ? (
                  property?.tenant ? (
                    <NewTenantRateForm 
                      propertyAddress={property.propertyAddress}
                      tenantName={property.tenant.name}
                      onSuccess={handleEditSuccess}
                      onCancel={() => setAddingNewTenantRate(false)}
                    />
                  ) : null
                ) : editingRentalRate ? (
                  property?.rentalInfo ? (
                    <RateIncreaseForm 
                      propertyData={{
                        propertyAddress: property.propertyAddress,
                        rentalRate: property.rentalInfo.latestRentalRate,
                        rateIncreaseDate: property.rentalInfo.latestRateIncreaseDate
                      }}
                      isEdit={true}
                      onSuccess={handleEditSuccess}
                      onCancel={() => setEditingRentalRate(false)}
                    />
                  ) : property ? (
                    <InitialRentalRateForm 
                      propertyAddress={property.propertyAddress}
                      defaultStartDate={property.tenant?.moveInDate}
                      onSuccess={handleEditSuccess}
                      onCancel={() => setEditingRentalRate(false)}
                    />
                  ) : null
                ) : isLoadingHistory ? (
                  <div className="flex justify-center items-center h-40">
                    <p>Loading rental history...</p>
                  </div>
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
                          const percentageIncrease = previousRate > 0
                            ? ((newRate - previousRate) / previousRate) * 100
                            : 0;
                          
                          return (
                            <tr key={index}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                {formatDisplayDate(history.increaseDate)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                {previousRate === 0 ? 'N/A' : formatCurrency(previousRate)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                {formatCurrency(newRate)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                {previousRate === 0 ? 'N/A' : `+${percentageIncrease.toFixed(1)}%`}
                              </td>
                              <td className="px-6 py-4 text-sm">
                                {history.notes && (
                                  <div dangerouslySetInnerHTML={{ __html: history.notes.replace(/\n/g, '<br/>') }} />
                                )}
                                {!history.notes && 'No additional notes'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-4 bg-neutral-lightest rounded-lg">
                    {property?.rentalInfo ? (
                      <p className="text-neutral-medium">No rental increase history available</p>
                    ) : (
                      <p className="text-neutral-medium">No rental rate information has been set for this property.</p>
                    )}
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="landlord" className="py-4">
              <div className="bg-neutral-lightest p-4 rounded-lg">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-xl font-semibold">Landlord Details</h2>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setEditingLandlord(true)}
                    className="h-8 px-2 text-neutral-medium hover:text-primary"
                  >
                    <Pencil className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                </div>
                
                {editingLandlord && property ? (
                  <LandlordForm 
                    landlordData={{
                      propertyAddress: property.propertyAddress,
                      keyNumber: property.keyNumber,
                      strataContactNumber: property.strataContactNumber,
                      strataManagementCompany: property.strataManagementCompany,
                      strataContactPerson: property.strataContactPerson,
                      landlordOwners: property.landlordOwners
                    }}
                    isEdit={true}
                    onSuccess={handleEditSuccess}
                    onCancel={() => setEditingLandlord(false)}
                  />
                ) : (
                  property && property.landlordOwners && property.landlordOwners.length > 0 ? (
                    <div className="space-y-4">
                      {property.landlordOwners.map((owner, index) => (
                        <div key={index} className={index > 0 ? "border-t pt-4" : ""}>
                          <p className="font-medium">{owner.name}</p>
                          <p className="text-sm">{owner.contactNumber || 'No contact number'}</p>
                          <p className="text-sm">
                            {owner.residentialAddress || 'No residential address'}
                          </p>
                          <p className="text-sm text-neutral-medium">
                            Birthday: {owner.birthday 
                              ? formatDisplayDate(owner.birthday) 
                              : 'Not provided'}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-neutral-medium">No landlord information available</p>
                  )
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="tenant" className="py-4">
              <div className="bg-neutral-lightest p-4 rounded-lg">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-xl font-semibold">Tenant Details</h2>
                  {/* Show different buttons based on property status */}
                  {(!property?.tenant || property?.tenant?.moveOutDate) ? (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setEditingTenant(true)}
                      className="h-8 px-2"
                    >
                      <UserPlus className="h-4 w-4 mr-1" />
                      Add Tenants to the Property
                    </Button>
                  ) : (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setEditingTenant(true)}
                      className="h-8 px-2 text-neutral-medium hover:text-primary"
                    >
                      <Pencil className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                  )}
                </div>
                
                {editingTenant && property ? (
                  <TenantForm 
                    tenantData={{
                      propertyAddress: property.propertyAddress,
                      serviceType: property.serviceType || "Full-Service Management",
                      tenants: (property.tenant && !property.tenant.moveOutDate) ? [{
                        id: property.tenant.id,
                        name: property.tenant.name,
                        contactNumber: property.tenant.contactNumber,
                        email: property.tenant.email,
                        birthday: property.tenant.birthday,
                        moveInDate: property.tenant.moveInDate,
                        moveOutDate: property.tenant.moveOutDate,
                        isPrimary: true
                      }] : []
                    }}
                    isEdit={!!(property.tenant && !property.tenant.moveOutDate)}
                    onSuccess={handleEditSuccess}
                    onCancel={() => setEditingTenant(false)}
                  />
                ) : (
                  property && property.tenantHistory && property.tenantHistory.length > 0 ? (
                    <div className="space-y-4">
                      {property.tenantHistory.map((tenant, index) => (
                        <div key={index} className={index > 0 ? "border-t pt-4" : ""}>
                          <p className="font-medium">
                            {tenant.name}
                            {tenant.moveOutDate ? " (Previous)" : ""}
                            {!tenant.moveOutDate && index === 0 ? " (Primary)" : ""}
                          </p>
                          <p className="text-sm">{tenant.contactNumber || 'No contact number'}</p>
                          <p className="text-sm">{tenant.email || 'No email provided'}</p>
                          <p className="text-sm text-neutral-medium">
                            Birthday: {tenant.birthday 
                              ? formatDisplayDate(tenant.birthday) 
                              : 'Not provided'}
                          </p>
                          <p className="mt-2"><strong>Move-in Date:</strong> {tenant.moveInDate 
                            ? formatDisplayDate(tenant.moveInDate) 
                            : 'Not specified'}</p>
                          
                          {tenant.moveOutDate && (
                            <p><strong>Move-out Date:</strong> {formatDisplayDate(tenant.moveOutDate)}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-warning italic">Vacant</p>
                  )
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