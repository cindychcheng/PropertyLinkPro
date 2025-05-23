import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { formatInputDate } from "@/lib/utils/date-utils";

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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ServiceType } from "@shared/schema";
import { Plus, Trash2 } from "lucide-react";

// Enhanced schema to support multiple tenants
const formSchema = z.object({
  propertyAddress: z.string().min(1, "Property address is required"),
  serviceType: z.string().min(1, "Service type is required"),
  tenants: z.array(
    z.object({
      id: z.number().optional(),
      name: z.string().min(1, "Tenant name is required"),
      contactNumber: z.string().optional(),
      email: z.string().email("Invalid email address").optional().or(z.literal("")),
      birthday: z.string().optional(),
      moveInDate: z.string().min(1, "Move-in date is required"),
      moveOutDate: z.string().optional(),
      isPrimary: z.boolean().optional().default(false),
    })
  ).min(1, "At least one tenant is required"),
});

type TenantFormProps = {
  onSuccess?: () => void;
  onCancel?: () => void;
  tenantData?: {
    propertyAddress: string;
    serviceType: string;
    tenants?: Array<{
      id?: number;
      name: string;
      contactNumber?: string;
      email?: string;
      birthday?: Date;
      moveInDate: Date;
      moveOutDate?: Date;
      isPrimary?: boolean;
    }>;
  };
  isEdit?: boolean;
};

export function TenantForm({
  onSuccess,
  onCancel,
  tenantData,
  isEdit = false,
}: TenantFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Default tenant if none provided
  const defaultTenants = tenantData?.tenants?.length ? 
    tenantData.tenants.map(tenant => ({
      id: tenant.id,
      name: tenant.name,
      contactNumber: tenant.contactNumber || "",
      email: tenant.email || "",
      birthday: tenant.birthday ? formatInputDate(tenant.birthday) : "",
      moveInDate: tenant.moveInDate ? formatInputDate(tenant.moveInDate) : "",
      moveOutDate: tenant.moveOutDate ? formatInputDate(tenant.moveOutDate) : "",
      isPrimary: tenant.isPrimary || false
    })) : 
    [{ name: "", contactNumber: "", email: "", birthday: "", moveInDate: "", moveOutDate: "", isPrimary: true }];
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      propertyAddress: tenantData?.propertyAddress || "",
      serviceType: tenantData?.serviceType || "",
      tenants: defaultTenants
    },
  });
  
  // Setup field array for dynamic tenant inputs
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "tenants",
  });

  const tenantMutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      // Add debug logs for better troubleshooting
      console.log("Multiple tenants form submission:", { 
        isEdit, 
        tenantData, 
        values 
      });
      
      // Prepare tenants data
      const tenants = values.tenants.map(tenant => ({
        id: tenant.id,
        name: tenant.name,
        contactNumber: tenant.contactNumber || undefined,
        email: tenant.email || undefined,
        birthday: tenant.birthday || undefined,
        moveInDate: tenant.moveInDate,
        moveOutDate: tenant.moveOutDate || undefined,
        isPrimary: tenant.isPrimary
      }));
      
      const payload = {
        propertyAddress: values.propertyAddress,
        serviceType: values.serviceType,
        tenants: tenants
      };
      
      // If we're editing, use the property address endpoint
      const res = await apiRequest(
        isEdit ? "PUT" : "POST",
        isEdit 
          ? `/api/tenants/property/${encodeURIComponent(values.propertyAddress)}`
          : "/api/tenants",
        payload
      );
      
      return res.json();
    },
    onSuccess: (data, variables) => {
      toast({
        title: `Tenant ${isEdit ? "updated" : "created"} successfully`,
        description: isEdit
          ? "The tenant details have been updated."
          : "A new tenant has been added to the system.",
      });
      
      // Invalidate related queries
      queryClient.invalidateQueries({
        queryKey: ['/api/tenants'],
      });
      queryClient.invalidateQueries({
        queryKey: ['/api/properties'],
      });
      // Also invalidate the specific property to force refresh
      queryClient.invalidateQueries({
        queryKey: [`/api/properties/${encodeURIComponent(variables.propertyAddress)}`]
      });
      // Invalidate reminders since tenant status affects them
      queryClient.invalidateQueries({
        queryKey: ['/api/reminders/rental-increases']
      });
      queryClient.invalidateQueries({
        queryKey: ['/api/reminders/birthdays']
      });
      
      // Run success callback
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error: Error) => {
      toast({
        title: `Failed to ${isEdit ? "update" : "create"} tenant`,
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    tenantMutation.mutate(values);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEdit ? "Edit Tenant" : "Add New Tenant"}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Property Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Property Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  name="serviceType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Service Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={isEdit} // Disable editing service type when editing tenant
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
              </div>
            </div>
            
            {/* Tenants Section */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Tenant Information</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({
                    name: "",
                    contactNumber: "",
                    email: "",
                    birthday: "",
                    moveInDate: "",
                    moveOutDate: "",
                    isPrimary: false
                  })}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Tenant
                </Button>
              </div>
              
              {/* Tenant Form Fields */}
              {fields.map((field, index) => (
                <div key={field.id} className="border rounded-md p-4 space-y-4 relative">
                  {/* Remove button */}
                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                  
                  {/* Primary tenant toggle */}
                  <FormField
                    control={form.control}
                    name={`tenants.${index}.isPrimary`}
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <input 
                            type="checkbox"
                            className="text-primary border-primary focus:ring-primary h-4 w-4 rounded"
                            checked={field.value}
                            onChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="!mt-0">Primary Tenant</FormLabel>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Tenant Name */}
                  <FormField
                    control={form.control}
                    name={`tenants.${index}.name`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tenant Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Jane Smith" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Dates */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name={`tenants.${index}.moveInDate`}
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
                      name={`tenants.${index}.moveOutDate`}
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
                  
                  {/* Contact Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name={`tenants.${index}.contactNumber`}
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
                      name={`tenants.${index}.email`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address (Optional)</FormLabel>
                          <FormControl>
                            <Input 
                              type="email" 
                              placeholder="e.g. jane.smith@example.com" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  {/* Birthday */}
                  <FormField
                    control={form.control}
                    name={`tenants.${index}.birthday`}
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
                </div>
              ))}
              
              {form.formState.errors.tenants && (
                <p className="text-sm font-medium text-destructive">{form.formState.errors.tenants.message}</p>
              )}
            </div>
            
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
                disabled={tenantMutation.isPending}
              >
                {tenantMutation.isPending
                  ? "Saving..."
                  : isEdit
                    ? "Update Tenants"
                    : "Add Tenants"
                }
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
