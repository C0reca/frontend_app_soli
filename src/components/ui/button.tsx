import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow hover:bg-primary/90 active:scale-95",
        destructive:
          "bg-destructive text-destructive-foreground shadow hover:bg-destructive/90 active:scale-95",
        success:
          "bg-success text-success-foreground shadow hover:bg-success/90 active:scale-95",
        warning:
          "bg-warning text-warning-foreground shadow hover:bg-warning/90 active:scale-95",
        info:
          "bg-info text-info-foreground shadow hover:bg-info/90 active:scale-95",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground active:scale-95",
        "outline-primary":
          "border border-primary text-primary bg-background hover:bg-primary hover:text-primary-foreground active:scale-95",
        "outline-destructive":
          "border border-destructive text-destructive bg-background hover:bg-destructive hover:text-destructive-foreground active:scale-95",
        "outline-success":
          "border border-success text-success bg-background hover:bg-success hover:text-success-foreground active:scale-95",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80 active:scale-95",
        ghost: "hover:bg-accent hover:text-accent-foreground active:scale-95",
        "ghost-primary": "text-primary hover:bg-primary/10 hover:text-primary active:scale-95",
        "ghost-destructive": "text-destructive hover:bg-destructive/10 hover:text-destructive active:scale-95",
        "ghost-success": "text-success hover:bg-success/10 hover:text-success active:scale-95",
        link: "text-primary underline-offset-4 hover:underline active:scale-95",
        gradient: "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow hover:from-primary/90 hover:to-primary/70 active:scale-95",
        floating: "bg-primary text-primary-foreground shadow-lg hover:shadow-xl hover:bg-primary/90 active:scale-95 hover:-translate-y-0.5",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3 text-xs",
        lg: "h-11 rounded-md px-8 text-base",
        xl: "h-12 rounded-lg px-10 text-lg",
        icon: "h-10 w-10",
        "icon-sm": "h-9 w-9",
        "icon-lg": "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
