import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { 
  Dialog, 
  DialogContent, 
  DialogTitle, 
  DialogHeader,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  formatDisplayDate, 
  formatInputDate,
  formatCurrency,
  formatCurrencyInput,
  calculateNextAllowableRate
} from "@/lib/utils/date-utils";
import { apiRequest } from "@/lib/queryClient";

type RateIncreaseDialogProps = {
  propertyAddress: string | null;
  isOpen: boolean;
  onClose: () => void;
};

export function RateIncreaseDialog({
  propertyAddress,
  isOpen,
  onClose,
}: RateIncreaseDialogProps) {
  const [newIncreaseDate, setNewIncreaseDate] = useState<string>("");
  const [newRentalRate, setNewRentalRate] = useState<string>("");
  const [increasePercent, setIncreasePercent] = useState<string>("");
  const [notes, setNotes] = useState<string>("Standard annual increase");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: property, isLoading, error } = useQuery({
    queryKey: [`/api/properties/${encodeURIComponent(propertyAddress || '')}`],
    enabled: isOpen && !!propertyAddress,
    staleTime: 60000, // 1 minute
  });

  useEffect(() => {
    if (property?.rentalInfo) {
      // Default to today's date
      setNewIncreaseDate(formatInputDate(new Date()));
      
      // Default to calculated max rate (3% increase)
      const maxRate = property.rentalInfo.nextAllowableRentalRate;
      setNewRentalRate(formatCurrencyInput(maxRate));
      
      // Default to 3% increase
      setIncreasePercent("3.0");
    }
  }, [property]);

  const processIncreaseMutation = useMutation({
    mutationFn: async (data: { 
      propertyAddress: string; 
      increaseDate: string; 
      newRate: number; 
      notes?: string 
    }) => {
      const res = await apiRequest("POST", "/api/process-rental-increase", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Rental increase processed",
        description: "The rental rate increase has been successfully processed.",
      });
      
      // Invalidate relevant queries
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
      
      // Close the dialog
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Error processing rental increase",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleRateChange = (value: string) => {
    // Remove any non-numeric characters except dot
    const numericValue = value.replace(/[^\d.]/g, '');
    setNewRentalRate(numericValue);
    
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
      setNewRentalRate(newRate.toFixed(2));
    }
  };

  const handleSubmit = () => {
    if (!property || !propertyAddress) return;
    
    // Validate the inputs
    if (!newIncreaseDate) {
      toast({
        title: "Missing information",
        description: "Please enter the increase date.",
        variant: "destructive",
      });
      return;
    }
    
    if (!newRentalRate) {
      toast({
        title: "Missing information",
        description: "Please enter the new rental rate.",
        variant: "destructive",
      });
      return;
    }
    
    // Parse the values
    const newRate = parseFloat(newRentalRate.replace(/,/g, ''));
    
    if (isNaN(newRate) || newRate <= 0) {
      toast({
        title: "Invalid rental rate",
        description: "Please enter a valid rental rate.",
        variant: "destructive",
      });
      return;
    }
    
    // Process the rental increase
    processIncreaseMutation.mutate({
      propertyAddress,
      increaseDate: newIncreaseDate,
      newRate,
      notes,
    });
  };

  if (error) {
    toast({
      title: "Error fetching property details",
      description: (error as Error).message,
      variant: "destructive",
    });
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Process Rate Increase</DialogTitle>
          <DialogDescription>
            Enter the details for the new rental rate increase.
          </DialogDescription>
        </DialogHeader>
        
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : property ? (
          <div>
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
                <span>{property.rentalInfo ? formatCurrency(property.rentalInfo.latestRentalRate) + '/month' : 'N/A'}</span>
              </p>
              <p className="text-sm">
                <span className="font-medium">Last Increase:</span>{" "}
                <span>
                  {property.rentalInfo 
                    ? `${formatDisplayDate(property.rentalInfo.latestRateIncreaseDate)}` 
                    : 'N/A'
                  }
                </span>
              </p>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="new-increase-date">New Increase Date</Label>
                <Input
                  id="new-increase-date"
                  type="date"
                  value={newIncreaseDate}
                  onChange={(e) => setNewIncreaseDate(e.target.value)}
                />
                <p className="mt-1 text-xs text-neutral-medium">
                  Next eligible date: {property.rentalInfo 
                    ? formatDisplayDate(property.rentalInfo.nextAllowableRentalIncreaseDate) 
                    : 'N/A'
                  }
                </p>
              </div>
              
              <div>
                <Label htmlFor="new-rental-rate">New Rental Rate</Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-neutral-medium">$</span>
                  </div>
                  <Input
                    id="new-rental-rate"
                    className="pl-7 pr-16"
                    value={newRentalRate}
                    onChange={(e) => handleRateChange(e.target.value)}
                    placeholder="0.00"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-neutral-medium">/month</span>
                  </div>
                </div>
                <p className="mt-1 text-xs text-neutral-medium">
                  Maximum allowed rate: {property.rentalInfo 
                    ? `${formatCurrency(property.rentalInfo.nextAllowableRentalRate)} (3% increase)` 
                    : 'N/A'
                  }
                </p>
              </div>
              
              <div>
                <Label htmlFor="increase-percent">Increase Percentage</Label>
                <div className="relative">
                  <Input
                    id="increase-percent"
                    className="pr-6"
                    value={increasePercent}
                    onChange={(e) => handlePercentChange(e.target.value)}
                    placeholder="0.0"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-neutral-medium">%</span>
                  </div>
                </div>
              </div>
              
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-10">
            <p className="text-neutral-medium">No property details available</p>
          </div>
        )}
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={processIncreaseMutation.isPending || !property}
          >
            {processIncreaseMutation.isPending ? "Processing..." : "Save & Process"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
