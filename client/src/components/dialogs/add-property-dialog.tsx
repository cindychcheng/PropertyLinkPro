import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogHeader,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PropertyForm } from "@/components/forms/property-form";
import { LandlordForm } from "@/components/forms/landlord-form";
import { TenantForm } from "@/components/forms/tenant-form";
import { RateIncreaseForm } from "@/components/forms/rate-increase-form";
import { useState } from "react";

type AddPropertyDialogProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function AddPropertyDialog({ isOpen, onClose }: AddPropertyDialogProps) {
  const [activeTab, setActiveTab] = useState("property");
  const [propertyAddress, setPropertyAddress] = useState<string | undefined>();
  
  const handleSuccess = () => {
    onClose();
  };
  
  const handlePropertySuccess = (address: string) => {
    setPropertyAddress(address);
    setActiveTab("tenant");
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add New Property</DialogTitle>
          <DialogDescription>
            Enter the property details, landlord, tenant, and rental information.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="property">Property</TabsTrigger>
            <TabsTrigger value="landlord">Landlord</TabsTrigger>
            <TabsTrigger value="tenant">Tenant</TabsTrigger>
            <TabsTrigger value="rental">Rental Rate</TabsTrigger>
          </TabsList>
          
          <TabsContent value="property">
            <PropertyForm 
              onSuccess={handleSuccess}
              onCancel={onClose}
            />
          </TabsContent>
          
          <TabsContent value="landlord">
            <LandlordForm 
              onSuccess={handleSuccess}
              onCancel={onClose}
            />
          </TabsContent>
          
          <TabsContent value="tenant">
            <TenantForm 
              onSuccess={handleSuccess}
              onCancel={onClose}
              propertyAddress={propertyAddress}
            />
          </TabsContent>
          
          <TabsContent value="rental">
            <RateIncreaseForm 
              onSuccess={handleSuccess}
              onCancel={onClose}
              propertyAddress={propertyAddress}
            />
          </TabsContent>
        </Tabs>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
