import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 font-nunito",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-playful hover:bg-primary/90 hover:shadow-elevated hover:-translate-y-0.5 active:translate-y-0",
        destructive:
          "bg-destructive text-destructive-foreground shadow-playful hover:bg-destructive/90 hover:shadow-elevated",
        outline:
          "border-2 border-primary bg-transparent text-primary hover:bg-primary hover:text-primary-foreground",
        secondary:
          "bg-secondary text-secondary-foreground shadow-playful hover:bg-secondary/80 hover:shadow-elevated",
        ghost: "hover:bg-muted hover:text-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        // Game-specific variants
        game: "bg-accent text-accent-foreground shadow-glow-accent hover:shadow-elevated hover:-translate-y-1 active:translate-y-0 font-fredoka text-lg tracking-wide",
        gameSuccess: "bg-success text-success-foreground shadow-glow-success hover:shadow-elevated hover:-translate-y-1 active:translate-y-0 font-fredoka text-lg tracking-wide",
        gamePrimary: "bg-primary text-primary-foreground shadow-glow-primary hover:shadow-elevated hover:-translate-y-1 active:translate-y-0 font-fredoka text-lg tracking-wide",
        gameSecondary: "bg-secondary text-secondary-foreground shadow-playful hover:shadow-elevated hover:-translate-y-1 active:translate-y-0 font-fredoka text-lg tracking-wide border-2 border-secondary-foreground/20",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-12 rounded-xl px-8 text-base",
        xl: "h-14 rounded-2xl px-10 text-lg",
        icon: "h-10 w-10",
        iconLg: "h-12 w-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"
  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props} />
  );
})
Button.displayName = "Button"

export { Button, buttonVariants }
