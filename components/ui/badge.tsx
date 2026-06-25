import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold",
  {
    variants: {
      variant: {
        default: "border-transparent bg-sky-400 text-slate-950",
        secondary: "border-white/10 bg-white/5 text-slate-300",
        outline: "border-white/15 text-slate-200",
        success: "border-emerald-300/20 bg-emerald-400/10 text-emerald-200",
        warning: "border-amber-300/20 bg-amber-400/10 text-amber-200",
        danger: "border-rose-300/20 bg-rose-400/10 text-rose-200",
        info: "border-sky-300/20 bg-sky-400/10 text-sky-200"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
