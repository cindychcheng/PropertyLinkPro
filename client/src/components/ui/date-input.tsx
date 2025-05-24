import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface DateInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {}

const DateInput = React.forwardRef<HTMLInputElement, DateInputProps>(
  ({ className, ...props }, ref) => {
    return (
      <Input
        type="date"
        className={cn(className)}
        ref={ref}
        {...props}
      />
    );
  }
);

DateInput.displayName = "DateInput";

export { DateInput };