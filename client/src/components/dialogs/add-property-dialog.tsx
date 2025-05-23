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
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <PropertyForm 
          onSuccess={handleSuccess}
          onCancel={onClose}
        />
      </DialogContent>
    </Dialog>
  );
}
