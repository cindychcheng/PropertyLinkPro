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
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";

// Enhanced form schema to support multiple owners
const formSchema = z.object({
  propertyAddress: z.string().min(1, "Property address is required"),
  keyNumber: z.string().min(1, "Key number is required"),
  strataContactNumber: z.string().optional(),
  strataManagementCompany: z.string().optional(),
  strataContactPerson: z.string().optional(),
  owners: z.array(
    z.object({
      id: z.number().optional(),
      name: z.string().min(1, "Owner name is required"),
      contactNumber: z.string().optional(),
      birthday: z.string().optional(),
    })
  ).min(1, "At least one owner is required"),
});

type LandlordFormProps = {
  onSuccess?: () => void;
  onCancel?: () => void;
  landlordData?: {
    propertyAddress: string;
    keyNumber: string;
    strataContactNumber?: string;
    strataManagementCompany?: string;
    strataContactPerson?: string;
    landlordOwners?: Array<{
      id?: number;
      name: string;
      contactNumber?: string;
      birthday?: Date;
    }>;
  };
  isEdit?: boolean;
};

export function LandlordForm({
  onSuccess,
  onCancel,
  landlordData,
  isEdit = false,
}: LandlordFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Default owner if none provided
  const defaultOwners = landlordData?.landlordOwners?.length ? 
    landlordData.landlordOwners.map(owner => ({
      id: owner.id,
      name: owner.name,
      contactNumber: owner.contactNumber || "",
      birthday: owner.birthday ? formatInputDate(owner.birthday) : ""
    })) : 
    [{ name: "", contactNumber: "", birthday: "" }];
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      propertyAddress: landlordData?.propertyAddress || "",
      keyNumber: landlordData?.keyNumber || "",
      strataContactNumber: landlordData?.strataContactNumber || "",
      strataManagementCompany: landlordData?.strataManagementCompany || "",
      strataContactPerson: landlordData?.strataContactPerson || "",
      owners: defaultOwners
    },
  });
  
  // Setup field array for dynamic owner inputs
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "owners",
  });

  const createLandlordMutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      // First create/update the landlord
      const landlordPayload = {
        propertyAddress: values.propertyAddress,
        keyNumber: values.keyNumber,
        strataContactNumber: values.strataContactNumber || undefined,
        strataManagementCompany: values.strataManagementCompany || undefined,
        strataContactPerson: values.strataContactPerson || undefined
      };
      
      const landlordRes = await apiRequest(
        isEdit ? "PUT" : "POST",
        isEdit 
          ? `/api/landlords/${encodeURIComponent(landlordData?.propertyAddress || '')}`
          : "/api/landlords",
        landlordPayload
      );
      
      const landlord = await landlordRes.json();
      
      // For edit, first get the existing owners to handle updates/deletes
      let existingOwners: any[] = [];
      if (isEdit) {
        const ownersRes = await fetch(`/api/landlords/${encodeURIComponent(values.propertyAddress)}/owners`);
        existingOwners = await ownersRes.json();
      }
      
      // Handle each owner from the form
      for (const owner of values.owners) {
        // Format birthday date correctly for PostgreSQL, ensuring local date preservation
        const formattedBirthday = owner.birthday || undefined;
        
        const ownerPayload = {
          landlordId: landlord.id,
          name: owner.name,
          contactNumber: owner.contactNumber || undefined,
          birthday: formattedBirthday,
        };
        
        if (isEdit && owner.id) {
          // Update existing owner
          await apiRequest(
            "PUT",
            `/api/landlord-owners/${owner.id}`,
            ownerPayload
          );
        } else {
          // Create new owner
          await apiRequest(
            "POST",
            "/api/landlord-owners",
            ownerPayload
          );
        }
      }
      
      // If editing, check for owners that may need to be deleted
      // (owners in existingOwners but not in values.owners)
      if (isEdit) {
        const currentOwnerIds = values.owners
          .filter(owner => owner.id !== undefined)
          .map(owner => owner.id);
          
        for (const existingOwner of existingOwners) {
          if (!currentOwnerIds.includes(existingOwner.id)) {
            // This owner was removed in the form, delete from database
            await apiRequest(
              "DELETE",
              `/api/landlord-owners/${existingOwner.id}`,
              {}
            );
          }
        }
      }
      
      return landlord;
    },
    onSuccess: () => {
      toast({
        title: `Landlord ${isEdit ? "updated" : "created"} successfully`,
        description: isEdit
          ? "The landlord details have been updated."
          : "A new landlord has been added to the system.",
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
        title: `Failed to ${isEdit ? "update" : "create"} landlord`,
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    createLandlordMutation.mutate(values);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEdit ? "Edit Landlord" : "Add New Landlord"}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-4">
              <h3 className="text-md font-medium">Property Information</h3>
              
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
                      <Input placeholder="e.g. Jane Smith" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="space-y-4 pt-4">
              <div className="flex items-center justify-between">
                <h3 className="text-md font-medium">Owner Information</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ name: "", contactNumber: "", birthday: "" })}
                >
                  <Plus className="h-4 w-4 mr-1" /> Add Owner
                </Button>
              </div>
              
              {fields.map((field, index) => (
                <div key={field.id} className="border rounded-md p-4 relative">
                  {index > 0 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2 text-destructive hover:text-destructive"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                  
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name={`owners.${index}.name`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Owner Name</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. John Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name={`owners.${index}.contactNumber`}
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
                      name={`owners.${index}.birthday`}
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
                </div>
              ))}
              
              {form.formState.errors.owners?.root && (
                <div className="text-sm text-destructive">
                  {form.formState.errors.owners.root.message}
                </div>
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
                disabled={createLandlordMutation.isPending}
              >
                {createLandlordMutation.isPending
                  ? "Saving..."
                  : isEdit
                    ? "Update Landlord"
                    : "Add Landlord"
                }
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
