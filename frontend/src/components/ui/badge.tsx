import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        destructive: "border-transparent bg-destructive text-destructive-foreground",
        outline: "border-border text-foreground",
        // Semantic variants
        success: "border-transparent bg-success/20 text-success border-success/30",
        warning: "border-transparent bg-warning/20 text-warning border-warning/30",
        info: "border-transparent bg-info/20 text-info border-info/30",
        // Sentiment badges
        positive: "border-transparent bg-sentiment-positive/20 text-sentiment-positive border-sentiment-positive/30",
        neutral: "border-transparent bg-warning/20 text-warning border-warning/30",
        negative: "border-transparent bg-sentiment-negative/20 text-sentiment-negative border-sentiment-negative/30",
        // Category badges
        question: "border-transparent bg-info/20 text-info border-info/30",
        praise: "border-transparent bg-success/20 text-success border-success/30",
        complaint: "border-transparent bg-destructive/20 text-destructive border-destructive/30",
        suggestion: "border-transparent bg-chart-4/20 text-chart-4 border-chart-4/30",
        spam: "border-transparent bg-muted text-muted-foreground border-border",
        toxic: "border-transparent bg-destructive text-destructive-foreground",
        // Plan badges
        starter: "border-transparent bg-muted text-muted-foreground",
        pro: "border-transparent bg-primary/20 text-primary border-primary/30",
        business: "border-transparent bg-chart-4/20 text-chart-4 border-chart-4/30",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
