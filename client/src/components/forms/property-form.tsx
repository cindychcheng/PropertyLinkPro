import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

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
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      propertyAddress: propertyData?.propertyAddress || "",
      keyNumber: propertyData?.keyNumber || "",
      strataContactNumber: propertyData?.strataContactNumber || "",
    },
  });

  const createPropertyMutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      const res = await apiRequest(
        isEdit ? "PUT" : "POST",
        isEdit 
          ? `/api/landlords/${encodeURIComponent(propertyData?.propertyAddress || '')}`
          : "/api/landlords",
        values
      );
      return res.json();
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEdit ? "Edit Property" : "Add New Property"}</CardTitle>
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
