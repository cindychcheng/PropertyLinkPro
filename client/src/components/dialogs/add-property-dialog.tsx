import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogHeader,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PropertyForm } from "@/components/forms/property-form";

type AddPropertyDialogProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function AddPropertyDialog({ isOpen, onClose }: AddPropertyDialogProps) {
  const handleSuccess = () => {
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Add New Property</DialogTitle>
          <DialogDescription>
            Enter the property details, landlord, tenant, and rental information.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-scroll py-4" style={{ maxHeight: 'calc(90vh - 200px)' }}>
          <PropertyForm 
            onSuccess={handleSuccess}
            onCancel={onClose}
          />
        </div>
        
        <DialogFooter className="flex-shrink-0">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
