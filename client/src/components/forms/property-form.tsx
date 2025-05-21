import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ServiceType } from "@shared/schema";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const formSchema = z.object({
  propertyAddress: z.string().min(1, "Property address is required"),
  keyNumber: z.string().min(1, "Key number is required"),
  strataContactNumber: z.string().optional(),
  strataManagementCompany: z.string().optional(),
  strataContactPerson: z.string().optional(),
  serviceType: z.string().min(1, "Service type is required"),
  // Tenant information
  includeTenant: z.boolean().default(false),
  tenantName: z.string().optional(),
  tenantContactNumber: z.string().optional(),
  tenantEmail: z.string().email("Invalid email address").optional().or(z.literal("")),
  tenantBirthday: z.string().optional(),
  moveInDate: z.string().optional(),
  moveOutDate: z.string().optional(),
  // Rental rate information
  includeRentalRate: z.boolean().default(false),
  currentRentalRate: z.string().optional(),
  lastIncreaseDate: z.string().optional(),
});

type PropertyFormProps = {
  onSuccess?: () => void;
  onCancel?: () => void;
  propertyData?: {
    propertyAddress: string;
    keyNumber: string;
    strataContactNumber?: string;
  };
  isEdit?: boolean;
};

export function PropertyForm({
  onSuccess,
  onCancel,
  propertyData,
  isEdit = false,
}: PropertyFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("property");
  const [includeTenant, setIncludeTenant] = useState(false);
  const [includeRentalRate, setIncludeRentalRate] = useState(false);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      propertyAddress: propertyData?.propertyAddress || "",
      keyNumber: propertyData?.keyNumber || "",
      strataContactNumber: propertyData?.strataContactNumber || "",
      strataManagementCompany: propertyData?.strataManagementCompany || "",
      strataContactPerson: propertyData?.strataContactPerson || "", 
      serviceType: propertyData?.serviceType || ServiceType.FULL_SERVICE,
      includeTenant: false,
      tenantName: "",
      tenantContactNumber: "",
      tenantEmail: "",
      tenantBirthday: "",
      moveInDate: "",
      moveOutDate: "",
      includeRentalRate: false,
      currentRentalRate: "",
      lastIncreaseDate: "",
    },
  });

  const createPropertyMutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      // First, create or update the property (landlord)
      const propertyRes = await apiRequest(
        isEdit ? "PUT" : "POST",
        isEdit 
          ? `/api/landlords/${encodeURIComponent(propertyData?.propertyAddress || '')}`
          : "/api/landlords",
        {
          propertyAddress: values.propertyAddress,
          keyNumber: values.keyNumber,
          strataContactNumber: values.strataContactNumber || undefined,
          strataManagementCompany: values.strataManagementCompany || undefined,
          strataContactPerson: values.strataContactPerson || undefined,
          serviceType: values.serviceType
        }
      );
      
      const propertyResult = await propertyRes.json();
      
      // If tenant information should be included
      if (values.includeTenant) {
        // Create tenant with the move-in date
        await apiRequest(
          "POST",
          "/api/tenants",
          {
            propertyAddress: values.propertyAddress,
            serviceType: values.serviceType,
            moveInDate: values.moveInDate,
            moveOutDate: values.moveOutDate || undefined,
            name: values.tenantName,
            contactNumber: values.tenantContactNumber || undefined,
            email: values.tenantEmail || undefined,
            birthday: values.tenantBirthday || undefined
          }
        );
      }
      
      // If rental rate information should be included
      if (values.includeRentalRate && values.currentRentalRate) {
        // Parse the rental rate as a number
        const rate = parseFloat(values.currentRentalRate);
        if (!isNaN(rate)) {
          // Create rental rate increase record
          await apiRequest(
            "POST",
            "/api/rental-increases",
            {
              propertyAddress: values.propertyAddress,
              latestRateIncreaseDate: values.lastIncreaseDate || new Date().toISOString().split('T')[0],
              latestRentalRate: rate
            }
          );
        }
      }
      
      return propertyResult;
    },
    onSuccess: () => {
      toast({
        title: `Property ${isEdit ? "updated" : "created"} successfully`,
        description: isEdit
          ? "The property details have been updated."
          : "A new property has been added to the system.",
      });
      
      // Invalidate related queries
      queryClient.invalidateQueries({
        queryKey: ['/api/landlords'],
      });
      queryClient.invalidateQueries({
        queryKey: ['/api/properties'],
      });
      
      // Run success callback
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error: Error) => {
      toast({
        title: `Failed to ${isEdit ? "update" : "create"} property`,
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    createPropertyMutation.mutate(values);
  };

  // Update the includeTenant flag when checkbox is changed
  const handleTenantToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIncludeTenant(e.target.checked);
    form.setValue('includeTenant', e.target.checked);
  };

  // Update the includeRentalRate flag when checkbox is changed
  const handleRentalRateToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIncludeRentalRate(e.target.checked);
    form.setValue('includeRentalRate', e.target.checked);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEdit ? "Edit Property" : "Add New Property"}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="property">Property Details</TabsTrigger>
                <TabsTrigger value="tenant">Tenant Information</TabsTrigger>
                <TabsTrigger value="rental">Rental Information</TabsTrigger>
              </TabsList>
              
              <TabsContent value="property" className="space-y-4 py-4">
                <FormField
                  control={form.control}
                  name="propertyAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Property Address</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. 123 Main St, Unit 4B" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="keyNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Key Number</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. K-1234" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="strataManagementCompany"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Strata Management Company (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. ABC Property Management" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="strataContactPerson"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Strata Contact Person (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. John Smith" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="strataContactNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Strata Contact Number (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. (555) 123-4567" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="serviceType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Service Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select service type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={ServiceType.FULL_SERVICE}>
                            Full-Service Management
                          </SelectItem>
                          <SelectItem value={ServiceType.TENANT_REPLACEMENT}>
                            Tenant Replacement Service
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
              
              <TabsContent value="tenant" className="space-y-4 py-4">
                <div className="flex items-center space-x-2 pb-4">
                  <input
                    type="checkbox"
                    id="includeTenant"
                    checked={includeTenant}
                    onChange={handleTenantToggle}
                    className="rounded border-gray-300"
                  />
                  <label htmlFor="includeTenant" className="text-sm font-medium">
                    Include tenant information
                  </label>
                </div>
                
                {includeTenant && (
                  <>
                    <FormField
                      control={form.control}
                      name="tenantName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tenant Name</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. John Smith" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="tenantContactNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Contact Number (Optional)</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. (555) 123-4567" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="tenantEmail"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email Address (Optional)</FormLabel>
                            <FormControl>
                              <Input 
                                type="email" 
                                placeholder="e.g. john.smith@example.com" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="tenantBirthday"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Birthday (Optional)</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="moveInDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Move-in Date</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="moveOutDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Move-out Date (Optional)</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </>
                )}
              </TabsContent>
              
              <TabsContent value="rental" className="space-y-4 py-4">
                <div className="flex items-center space-x-2 pb-4">
                  <input
                    type="checkbox"
                    id="includeRentalRate"
                    checked={includeRentalRate}
                    onChange={handleRentalRateToggle}
                    className="rounded border-gray-300"
                  />
                  <label htmlFor="includeRentalRate" className="text-sm font-medium">
                    Include rental rate information
                  </label>
                </div>
                
                {includeRentalRate && (
                  <>
                    <FormField
                      control={form.control}
                      name="currentRentalRate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Current Rental Rate ($)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="e.g. 1500" 
                              step="0.01"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="lastIncreaseDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Increase Date</FormLabel>
                          <FormControl>
                            <Input 
                              type="date" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}
              </TabsContent>
            </Tabs>
            
            <div className="pt-4 flex justify-end space-x-2">
              {onCancel && (
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={onCancel}
                >
                  Cancel
                </Button>
              )}
              <Button 
                type="submit" 
                disabled={createPropertyMutation.isPending}
              >
                {createPropertyMutation.isPending
                  ? "Saving..."
                  : isEdit
                    ? "Update Property"
                    : "Add Property"
                }
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
