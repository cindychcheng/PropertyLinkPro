import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
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

const formSchema = z.object({
  propertyAddress: z.string().min(1, "Property address is required"),
  serviceType: z.string().min(1, "Service type is required"),
  moveInDate: z.string().min(1, "Move-in date is required"),
  moveOutDate: z.string().optional(),
  name: z.string().min(1, "Tenant name is required"),
  contactNumber: z.string().optional(),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  birthday: z.string().optional(),
});

type TenantFormProps = {
  onSuccess?: () => void;
  onCancel?: () => void;
  tenantData?: {
    id?: number;
    propertyAddress: string;
    serviceType: string;
    moveInDate: Date;
    moveOutDate?: Date;
    name: string;
    contactNumber?: string;
    email?: string;
    birthday?: Date;
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
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      propertyAddress: tenantData?.propertyAddress || "",
      serviceType: tenantData?.serviceType || "",
      moveInDate: tenantData?.moveInDate ? formatInputDate(tenantData.moveInDate) : "",
      moveOutDate: tenantData?.moveOutDate ? formatInputDate(tenantData.moveOutDate) : "",
      name: tenantData?.name || "",
      contactNumber: tenantData?.contactNumber || "",
      email: tenantData?.email || "",
      birthday: tenantData?.birthday ? formatInputDate(tenantData.birthday) : "",
    },
  });

  const tenantMutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      const payload = {
        propertyAddress: values.propertyAddress,
        serviceType: values.serviceType,
        moveInDate: new Date(values.moveInDate + 'T12:00:00').toISOString(),
        moveOutDate: values.moveOutDate ? new Date(values.moveOutDate + 'T12:00:00').toISOString() : undefined,
        name: values.name,
        contactNumber: values.contactNumber || undefined,
        email: values.email || undefined,
        birthday: values.birthday ? new Date(values.birthday + 'T12:00:00').toISOString() : undefined,
      };
      
      // Make sure we have a valid tenant ID when editing
      if (isEdit && !tenantData?.id) {
        throw new Error("Cannot update tenant: Missing tenant ID");
      }
      
      const res = await apiRequest(
        isEdit ? "PUT" : "POST",
        isEdit 
          ? `/api/tenants/${tenantData?.id}`
          : "/api/tenants",
        payload
      );
      
      return res.json();
    },
    onSuccess: () => {
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
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
            
            <FormField
              control={form.control}
              name="name"
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
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="contactNumber"
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
                name="email"
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
            
            <FormField
              control={form.control}
              name="birthday"
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
                    ? "Update Tenant"
                    : "Add Tenant"
                }
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
