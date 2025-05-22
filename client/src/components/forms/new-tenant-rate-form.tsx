import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency } from "@/lib/utils/date-utils";

type NewTenantRateFormProps = {
  propertyAddress: string;
  tenantName: string;
  onSuccess: () => void;
  onCancel: () => void;
};

// Form schema for validation
const formSchema = z.object({
  rateDate: z.string().min(1, { message: "Date is required" }),
  newRate: z.string().min(1, { message: "New rate is required" }),
});

type FormData = z.infer<typeof formSchema>;

export function NewTenantRateForm({ 
  propertyAddress, 
  tenantName,
  onSuccess, 
  onCancel 
}: NewTenantRateFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      rateDate: new Date().toISOString().split('T')[0],
      newRate: "",
    },
  });

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    
    try {
      const payload = {
        propertyAddress,
        increaseDate: data.rateDate,
        previousRate: 0, // New tenant rate has no previous rate
        newRate: parseFloat(data.newRate),
        notes: `New tenant - Current tenant: ${tenantName}`
      };
      
      const response = await fetch('/api/rental-history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      toast({
        title: "Success",
        description: "New tenant rate has been recorded",
      });
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: [`/api/rental-history/${encodeURIComponent(propertyAddress)}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/properties/${encodeURIComponent(propertyAddress)}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/properties'] });
      
      onSuccess();
    } catch (error) {
      console.error("Failed to record new tenant rate:", error);
      toast({
        title: "Error",
        description: "Failed to record new tenant rate. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <h3 className="text-lg font-medium">New Tenant Rate</h3>
        
        <FormField
          control={form.control}
          name="rateDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Date</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="newRate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>New Rate</FormLabel>
              <FormControl>
                <Input type="number" placeholder="0.00" step="0.01" min="0" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="pt-2">
          <div className="mb-2 flex justify-between">
            <span className="text-sm font-medium">Previous Rate:</span>
            <span className="text-sm">N/A</span>
          </div>
          <div className="mb-2 flex justify-between">
            <span className="text-sm font-medium">Increase %:</span>
            <span className="text-sm">N/A</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm font-medium">Notes:</span>
            <span className="text-sm">New tenant - Current tenant: {tenantName}</span>
          </div>
        </div>
        
        <div className="flex justify-end space-x-2 pt-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={isSubmitting}
          >
            {isSubmitting ? "Saving..." : "Save"}
          </Button>
        </div>
      </form>
    </Form>
  );
}