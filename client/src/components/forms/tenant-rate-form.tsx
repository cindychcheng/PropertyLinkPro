import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { formatCurrency, formatInputDate } from "@/lib/utils/date-utils";
import { DollarSign, Save, X } from "lucide-react";

const formSchema = z.object({
  rateDate: z.string().min(1, "Rate date is required"),
  newRate: z.string().min(1, "Rental rate is required"),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface TenantRateFormProps {
  propertyAddress: string;
  tenantName: string;
  tenantId: number;
  moveInDate: string;
  moveOutDate?: string | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export function TenantRateForm({
  propertyAddress,
  tenantName,
  tenantId,
  moveInDate,
  moveOutDate,
  onSuccess,
  onCancel,
}: TenantRateFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      rateDate: formatInputDate(new Date(moveInDate)), // Default to move-in date
      newRate: "",
      notes: "",
    },
  });

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    
    try {
      const payload = {
        propertyAddress,
        increaseDate: data.rateDate,
        previousRate: 0, // Default for new rate entry
        newRate: parseFloat(data.newRate),
        notes: data.notes 
          ? `${data.notes}\n\nTenant: ${tenantName} (ID: ${tenantId})`
          : `Rate set for tenant: ${tenantName} (ID: ${tenantId})`,
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
        description: `Rental rate has been set for ${tenantName}`,
      });
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: [`/api/rental-history/${encodeURIComponent(propertyAddress)}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/properties/${encodeURIComponent(propertyAddress)}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/properties'] });
      
      onSuccess();
    } catch (error) {
      console.error("Failed to set rental rate:", error);
      toast({
        title: "Error",
        description: "Failed to set rental rate. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const validateRate = (rateStr: string) => {
    const rate = parseFloat(rateStr);
    if (isNaN(rate) || rate <= 0) {
      return "Rate must be a positive number";
    }
    if (rate < 100) {
      return "Rate seems too low. Please verify.";
    }
    if (rate > 10000) {
      return "Rate seems too high. Please verify.";
    }
    return true;
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Set Rental Rate for {tenantName}
        </CardTitle>
        <div className="text-sm text-neutral-medium">
          <p><strong>Property:</strong> {propertyAddress}</p>
          <p><strong>Move-in Date:</strong> {new Date(moveInDate).toLocaleDateString()}</p>
          {moveOutDate && (
            <p><strong>Move-out Date:</strong> {new Date(moveOutDate).toLocaleDateString()}</p>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="rateDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rate Effective Date</FormLabel>
                  <FormControl>
                    <Input 
                      type="date" 
                      {...field}
                      min={formatInputDate(new Date(moveInDate))}
                      max={moveOutDate ? formatInputDate(new Date(moveOutDate)) : undefined}
                    />
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
                  <FormLabel>Monthly Rental Rate ($)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="e.g., 1200.00"
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        const value = e.target.value;
                        if (value) {
                          const validation = validateRate(value);
                          if (validation !== true) {
                            form.setError("newRate", { message: validation });
                          } else {
                            form.clearErrors("newRate");
                          }
                        }
                      }}
                    />
                  </FormControl>
                  {field.value && !form.formState.errors.newRate && (
                    <p className="text-sm text-neutral-medium">
                      Rate: {formatCurrency(parseFloat(field.value) || 0)}
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Additional notes about this rental rate..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1"
              >
                <Save className="h-4 w-4 mr-2" />
                {isSubmitting ? "Setting Rate..." : "Set Rate"}
              </Button>
              
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}