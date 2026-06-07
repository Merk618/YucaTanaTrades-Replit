import * as React from "react";
import { cn } from "@/lib/utils";

export interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  glow?: boolean;
}

export const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, glow = false, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "relative rounded-xl border bg-card/80 backdrop-blur-md overflow-hidden",
          glow && "hover:shadow-[0_0_15px_rgba(212,175,55,0.15)] transition-shadow duration-300",
          className
        )}
        {...props}
      >
        {glow && (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
        )}
        {children}
      </div>
    );
  }
);
GlassCard.displayName = "GlassCard";
