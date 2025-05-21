import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  formatInputDate, 
  formatCurrency, 
  formatCurrencyInput,
  calculateNextAllowableRate,
  calculateNextAllowableDate,
  calculateReminderDate 
} from "@/lib/utils/date-utils";

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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";

const formSchema = z.object({
  propertyAddress: z.string().min(1, "Property address is required"),
  latestRateIncreaseDate: z.string().min(1, "Rate increase date is required"),
  latestRentalRate: z.string().min(1, "Rental rate is required"),
  notes: z.string().optional(),
});

type RateIncreaseFormProps = {
  onSuccess?: () => void;
  onCancel?: () => void;
  propertyAddress?: string;
  isEdit?: boolean;
};

export function RateIncreaseForm({
  onSuccess,
  onCancel,
  propertyAddress,
  isEdit = false,
}: RateIncreaseFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [increasePercent, setIncreasePercent] = useState<string>("3.0");
  
  // Fetch property details to get current rate
  const { data: property, isLoading } = useQuery({
    queryKey: [`/api/properties/${encodeURIComponent(propertyAddress || '')}`],
    enabled: !!propertyAddress,
    staleTime: 60000, // 1 minute
  });

  const currentDate = new Date();
  const currentFormattedDate = formatInputDate(currentDate);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      propertyAddress: propertyAddress || "",
      latestRateIncreaseDate: currentFormattedDate,
      latestRentalRate: "",
      notes: "Standard annual increase",
    },
  });

  // Update form when property data is loaded
  useEffect(() => {
    if (property?.rentalInfo) {
      // Default to calculated max rate (3% increase)
      const maxRate = property.rentalInfo.nextAllowableRentalRate;
      form.setValue("latestRentalRate", maxRate.toString());
    }
  }, [property, form]);

  const handleRateChange = (value: string) => {
    // Remove any non-numeric characters except dot
    const numericValue = value.replace(/[^\d.]/g, '');
    form.setValue("latestRentalRate", numericValue);
    
    // Calculate and update percentage if we have valid values
    if (numericValue && property?.rentalInfo?.latestRentalRate) {
      const currentRate = property.rentalInfo.latestRentalRate;
      const newRate = parseFloat(numericValue);
      const percentage = ((newRate - currentRate) / currentRate) * 100;
      setIncreasePercent(percentage.toFixed(1));
    }
  };

  const handlePercentChange = (value: string) => {
    // Remove any non-numeric characters except dot
    const numericValue = value.replace(/[^\d.]/g, '');
    setIncreasePercent(numericValue);
    
    // Calculate and update rate if we have valid values
    if (numericValue && property?.rentalInfo?.latestRentalRate) {
      const currentRate = property.rentalInfo.latestRentalRate;
      const percentage = parseFloat(numericValue) / 100;
      const newRate = currentRate * (1 + percentage);
      form.setValue("latestRentalRate", newRate.toFixed(2));
    }
  };

  const increaseMutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      const payload = {
        propertyAddress: values.propertyAddress,
        increaseDate: values.latestRateIncreaseDate,
        newRate: parseFloat(values.latestRentalRate),
        notes: values.notes,
      };
      
      const res = await apiRequest(
        "POST",
        "/api/process-rental-increase",
        payload
      );
      
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Rental increase processed successfully",
        description: "The rental rate increase has been recorded in the system.",
      });
      
      // Invalidate related queries
      queryClient.invalidateQueries({
        queryKey: [`/api/properties/${encodeURIComponent(propertyAddress || '')}`]
      });
      queryClient.invalidateQueries({
        queryKey: ['/api/properties']
      });
      queryClient.invalidateQueries({
        queryKey: ['/api/reminders/rental-increases']
      });
      queryClient.invalidateQueries({
        queryKey: [`/api/rental-history/${encodeURIComponent(propertyAddress || '')}`]
      });
      
      // Run success callback
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to process rental increase",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    increaseMutation.mutate(values);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Process Rate Increase</CardTitle>
          <CardDescription>Loading property details...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Process Rate Increase</CardTitle>
        <CardDescription>
          Enter the details for the new rental rate increase
        </CardDescription>
      </CardHeader>
      <CardContent>
        {property && (
          <div className="bg-neutral-lightest p-3 rounded-md mb-4">
            <p className="text-sm">
              <span className="font-medium">Property:</span>{" "}
              <span>{property.propertyAddress}</span>
            </p>
            <p className="text-sm">
              <span className="font-medium">Tenant:</span>{" "}
              <span>{property.tenant?.name || 'Vacant'}</span>
            </p>
            <p className="text-sm">
              <span className="font-medium">Current Rate:</span>{" "}
              <span>
                {property.rentalInfo 
                  ? formatCurrency(property.rentalInfo.latestRentalRate) + '/month' 
                  : 'N/A'
                }
              </span>
            </p>
            <p className="text-sm">
              <span className="font-medium">Last Increase:</span>{" "}
              <span>
                {property.rentalInfo 
                  ? formatInputDate(property.rentalInfo.latestRateIncreaseDate)
                  : 'N/A'
                }
              </span>
            </p>
          </div>
        )}
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="propertyAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Property Address</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g. 123 Main St, Unit 4B" 
                      {...field} 
                      disabled={!!propertyAddress}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="latestRateIncreaseDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Increase Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  {property?.rentalInfo && (
                    <p className="text-xs text-neutral-medium">
                      Next eligible date: {formatInputDate(property.rentalInfo.nextAllowableRentalIncreaseDate)}
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="latestRentalRate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Rental Rate</FormLabel>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-neutral-medium">$</span>
                    </div>
                    <FormControl>
                      <Input
                        className="pl-7 pr-16"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => handleRateChange(e.target.value)}
                      />
                    </FormControl>
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-neutral-medium">/month</span>
                    </div>
                  </div>
                  {property?.rentalInfo && (
                    <p className="text-xs text-neutral-medium">
                      Maximum allowed rate: {formatCurrency(property.rentalInfo.nextAllowableRentalRate)} (3% increase)
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div>
              <FormLabel>Increase Percentage</FormLabel>
              <div className="relative">
                <Input
                  className="pr-6"
                  placeholder="0.0"
                  value={increasePercent}
                  onChange={(e) => handlePercentChange(e.target.value)}
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-neutral-medium">%</span>
                </div>
              </div>
            </div>
            
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea rows={3} {...field} />
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
                disabled={increaseMutation.isPending}
              >
                {increaseMutation.isPending
                  ? "Processing..."
                  : "Save & Process"
                }
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
