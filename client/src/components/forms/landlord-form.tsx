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
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";

const formSchema = z.object({
  propertyAddress: z.string().min(1, "Property address is required"),
  keyNumber: z.string().min(1, "Key number is required"),
  strataContactNumber: z.string().optional(),
  ownerName: z.string().min(1, "Owner name is required"),
  ownerContactNumber: z.string().optional(),
  ownerBirthday: z.string().optional(),
});

type LandlordFormProps = {
  onSuccess?: () => void;
  onCancel?: () => void;
  landlordData?: {
    propertyAddress: string;
    keyNumber: string;
    strataContactNumber?: string;
    owner?: {
      name: string;
      contactNumber?: string;
      birthday?: Date;
    };
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
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      propertyAddress: landlordData?.propertyAddress || "",
      keyNumber: landlordData?.keyNumber || "",
      strataContactNumber: landlordData?.strataContactNumber || "",
      ownerName: landlordData?.owner?.name || "",
      ownerContactNumber: landlordData?.owner?.contactNumber || "",
      ownerBirthday: landlordData?.owner?.birthday ? formatInputDate(landlordData.owner.birthday) : "",
    },
  });

  const createLandlordMutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      // First create/update the landlord
      const landlordPayload = {
        propertyAddress: values.propertyAddress,
        keyNumber: values.keyNumber,
        strataContactNumber: values.strataContactNumber || undefined,
      };
      
      const landlordRes = await apiRequest(
        isEdit ? "PUT" : "POST",
        isEdit 
          ? `/api/landlords/${encodeURIComponent(landlordData?.propertyAddress || '')}`
          : "/api/landlords",
        landlordPayload
      );
      
      const landlord = await landlordRes.json();
      
      // Then create/update the owner
      // Format birthday date correctly for PostgreSQL, ensuring local date preservation
      // Important: When using date-only fields, we need to preserve the day exactly as selected
      // This ensures the birthday doesn't shift due to timezone conversion
      let formattedBirthday = undefined;
      
      if (values.ownerBirthday) {
        // If it's a date-only string like "1983-02-04", extract the exact components
        const [year, month, day] = values.ownerBirthday.split('-').map(n => parseInt(n, 10));
        
        // Set date with explicit UTC to prevent any timezone shifting
        const utcDate = new Date(Date.UTC(year, month-1, day, 12, 0, 0));
        formattedBirthday = utcDate.toISOString().split('T')[0]; // Get YYYY-MM-DD format
      }
      
      // Log for debugging
      console.log("Birthday being sent to server:", formattedBirthday);
      
      const ownerPayload = {
        landlordId: landlord.id,
        name: values.ownerName,
        contactNumber: values.ownerContactNumber || undefined,
        birthday: formattedBirthday,
      };
      
      // For edit, we need to get the owners first to find their IDs
      if (isEdit) {
        const ownersRes = await fetch(`/api/landlords/${encodeURIComponent(values.propertyAddress)}/owners`);
        const owners = await ownersRes.json();
        
        if (owners && owners.length > 0) {
          // Update existing owner
          await apiRequest(
            "PUT",
            `/api/landlord-owners/${owners[0].id}`,
            ownerPayload
          );
        } else {
          // Create new owner if none exists
          await apiRequest(
            "POST",
            "/api/landlord-owners",
            ownerPayload
          );
        }
      } else {
        // Create new owner
        await apiRequest(
          "POST",
          "/api/landlord-owners",
          ownerPayload
        );
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
            </div>
            
            <div className="space-y-4 pt-4">
              <h3 className="text-md font-medium">Owner Information</h3>
              
              <FormField
                control={form.control}
                name="ownerName"
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
                name="ownerContactNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Owner Contact Number (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. (555) 123-4567" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="ownerBirthday"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Owner Birthday (Optional)</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
