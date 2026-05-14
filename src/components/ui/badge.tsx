// @ts-nocheck
import * as React from "react"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium tracking-[0.02em] transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/85",
        dark:
          "border-transparent bg-foreground text-background hover:bg-foreground/85",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/85",
        outline: "border-[var(--line-2)] text-ink-2",
        // Clinical status pills — soft tint background, saturated text
        success:
          "border-transparent bg-[var(--opt-soft)] text-[var(--opt)]",
        warning:
          "border-transparent bg-[var(--bord-soft)] text-[var(--bord)]",
        danger:
          "border-transparent bg-[var(--att-soft)] text-[var(--att)]",
        info: "border-transparent bg-[var(--info-soft)] text-[var(--info)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant,
  ...props
}) {
  return (<div className={cn(badgeVariants({ variant }), className)} {...props} />);
}

export { Badge, badgeVariants }
