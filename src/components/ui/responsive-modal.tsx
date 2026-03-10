import * as React from "react";
import { isMobileUserAgent } from "@/hooks/use-mobile";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";

interface ResponsiveModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  className?: string;
}

export function ResponsiveModal({ open, onOpenChange, children, className }: ResponsiveModalProps) {
  const isMobile = isMobileUserAgent();

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className={cn("max-h-[90vh]", className)}>
          <div className="overflow-y-auto px-2 max-h-[calc(90vh-2rem)]">
            {children}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn("max-h-[90vh] overflow-y-auto", className)}>
        {children}
      </DialogContent>
    </Dialog>
  );
}

export function ResponsiveModalHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const isMobile = isMobileUserAgent();
  if (isMobile) {
    return <DrawerHeader className={className} {...props} />;
  }
  return <DialogHeader className={className} {...props} />;
}

export function ResponsiveModalFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const isMobile = isMobileUserAgent();
  if (isMobile) {
    return <DrawerFooter className={className} {...props} />;
  }
  return <DialogFooter className={className} {...props} />;
}

export function ResponsiveModalTitle({ className, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  const isMobile = isMobileUserAgent();
  if (isMobile) {
    return <DrawerTitle className={className} {...props}>{children}</DrawerTitle>;
  }
  return <DialogTitle className={className} {...props}>{children}</DialogTitle>;
}

export function ResponsiveModalDescription({ className, children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  const isMobile = isMobileUserAgent();
  if (isMobile) {
    return <DrawerDescription className={className} {...props}>{children}</DrawerDescription>;
  }
  return <DialogDescription className={className} {...props}>{children}</DialogDescription>;
}
