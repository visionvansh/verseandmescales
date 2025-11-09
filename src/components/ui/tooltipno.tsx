"use client";

import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

// Define tooltip content variants using class-variance-authority
const tooltipContentVariants = cva(
  "z-50 overflow-hidden rounded-md border px-3 py-1.5 text-sm shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
  {
    variants: {
      variant: {
        default: "bg-gray-800/95 border-gray-700 text-gray-200",
        dark: "bg-gray-900/95 border-gray-800 text-gray-100",
        light: "bg-white border-gray-200 text-gray-800",
        warning: "bg-yellow-900/90 border-yellow-700/60 text-yellow-100",
        danger: "bg-red-900/90 border-red-700/60 text-red-100",
        success: "bg-green-900/90 border-green-700/60 text-green-100",
        info: "bg-blue-900/90 border-blue-700/60 text-blue-100",
      },
      size: {
        sm: "max-w-[200px]",
        md: "max-w-[300px]",
        lg: "max-w-[450px]",
        auto: "max-w-none",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);

const TooltipProvider = TooltipPrimitive.Provider;

const Tooltip = ({ delayDuration = 300, skipDelayDuration = 300, disableHoverableContent = false, ...props }: React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Root> & { 
  delayDuration?: number;
  skipDelayDuration?: number;
  disableHoverableContent?: boolean;
}) => (
  <TooltipPrimitive.Root
    delayDuration={delayDuration}

    disableHoverableContent={disableHoverableContent}
    {...props}
  />
);

const TooltipTrigger = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TooltipPrimitive.Trigger
    ref={ref}
    className={cn("outline-none", className)}
    {...props}
  />
));
TooltipTrigger.displayName = TooltipPrimitive.Trigger.displayName;

interface TooltipContentProps 
  extends React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>,
  VariantProps<typeof tooltipContentVariants> {
  withArrow?: boolean;
  arrowClassName?: string;
  motionProps?: Record<string, unknown>;
}

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  TooltipContentProps
>(({ 
  className, 
  sideOffset = 4, 
  variant,
  size,
  withArrow = true,
  arrowClassName,
  motionProps = {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
    transition: { duration: 0.15 }
  },
  ...props 
}, ref) => {
  // Add this type assertion to help TypeScript understand the data-state property
  const dataState = (props as { 'data-state'?: string })['data-state'];
  
  return (
    <TooltipPrimitive.Portal>
      <AnimatePresence>
        {dataState === 'delayed-open' || dataState === 'instant-open' ? (
          <TooltipPrimitive.Content
            ref={ref}
            sideOffset={sideOffset}
            className={cn(
              tooltipContentVariants({ variant, size }),
              "backdrop-blur-md",
              className
            )}
            asChild
            {...props}
          >
            <motion.div {...motionProps}>
              {props.children}
              {withArrow && (
                <TooltipPrimitive.Arrow 
                  className={cn("fill-current", arrowClassName)} 
                  width={12} 
                  height={6} 
                />
              )}
            </motion.div>
          </TooltipPrimitive.Content>
        ) : null}
      </AnimatePresence>
    </TooltipPrimitive.Portal>
  );
});
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

// Export all components
export {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
  type TooltipContentProps,
  tooltipContentVariants,
};