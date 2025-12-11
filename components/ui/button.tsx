import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline:
          "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
      fill: {
        filled: "",
        outlined: "bg-transparent border",
      },
    },
    compoundVariants: [
      // Default variant
      {
        variant: "default",
        fill: "filled",
        className:
          "bg-primary text-primary-foreground shadow hover:bg-primary/90",
      },
      {
        variant: "default",
        fill: "outlined",
        className: "border-black text-black hover:bg-black/5",
      },
      // Destructive variant
      {
        variant: "destructive",
        fill: "filled",
        className:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
      },
      {
        variant: "destructive",
        fill: "outlined",
        className: "border-black text-destructive hover:bg-destructive/10",
      },
      // Secondary variant
      {
        variant: "secondary",
        fill: "filled",
        className:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
      },
      {
        variant: "secondary",
        fill: "outlined",
        className: "border-black text-secondary hover:bg-secondary/10",
      },
    ],
    defaultVariants: {
      variant: "default",
      size: "default",
      fill: "filled",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  icon?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      fill,
      asChild = false,
      leftIcon,
      rightIcon,
      icon,
      children,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button";

    // If icon is provided, use icon size by default
    const buttonSize = icon && !size ? "icon" : size;

    return (
      <Comp
        className={cn(
          buttonVariants({ variant, size: buttonSize, fill, className })
        )}
        ref={ref}
        {...props}
      >
        {icon ? (
          <span className="inline-flex">{icon}</span>
        ) : (
          <>
            {leftIcon && <span className="inline-flex">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="inline-flex">{rightIcon}</span>}
          </>
        )}
      </Comp>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
