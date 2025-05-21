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
import { Card, CardContent } from "@/components/ui/card";

const formSchema = z.object({
  propertyAddress: z.string().min(1, "Property address is required"),
  initialRentalRate: z.string().min(1, "Initial rental rate is required"),
  startDate: z.string().min(1, "Start date is required"),
});

type InitialRentalRateFormProps = {
  propertyAddress: string;
  onSuccess?: () => void;
  onCancel?: () => void;
};

export function InitialRentalRateForm({
  propertyAddress,
  onSuccess,
  onCancel,
}: InitialRentalRateFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      propertyAddress: propertyAddress,
      initialRentalRate: "",
      startDate: new Date().toISOString().split('T')[0],
    },
  });

  const createRentalRateMutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      // Parse the rental rate as a number
      const initialRate = parseFloat(values.initialRentalRate);
      if (isNaN(initialRate)) {
        throw new Error("Initial rental rate must be a valid number");
      }
      
      // Create initial rental rate record
      const result = await apiRequest(
        "POST",
        "/api/rental-increases/initial",
        {
          propertyAddress: values.propertyAddress,
          initialRentalRate: initialRate,
          startDate: values.startDate
        }
      );
      
      return result.json();
    },
    onSuccess: () => {
      toast({
        title: "Initial rental rate set",
        description: "The initial rental rate has been recorded successfully.",
      });
      
      // Invalidate related queries
      queryClient.invalidateQueries({
        queryKey: ['/api/rental-increases'],
      });
      queryClient.invalidateQueries({
        queryKey: ['/api/properties'],
      });
      queryClient.invalidateQueries({
        queryKey: [`/api/rental-history/${encodeURIComponent(propertyAddress)}`],
      });
      queryClient.invalidateQueries({
        queryKey: [`/api/properties/${encodeURIComponent(propertyAddress)}`],
      });
      
      // Run success callback
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to set initial rental rate",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    createRentalRateMutation.mutate(values);
  };

  return (
    <Card className="border-0 shadow-none">
      <CardContent className="p-0">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start Date</FormLabel>
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
            
            <FormField
              control={form.control}
              name="initialRentalRate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Initial Rental Rate ($)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g. 1500.00" 
                      {...field} 
                      type="number"
                      step="0.01" 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex justify-end space-x-2 pt-2">
              {onCancel && (
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={onCancel}
                  disabled={createRentalRateMutation.isPending}
                >
                  Cancel
                </Button>
              )}
              <Button 
                type="submit" 
                disabled={createRentalRateMutation.isPending}
              >
                {createRentalRateMutation.isPending 
                  ? "Setting..." 
                  : "Set Initial Rate"
                }
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}