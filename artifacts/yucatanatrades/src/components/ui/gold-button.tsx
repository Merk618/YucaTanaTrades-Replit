import * as React from "react";
import { cn } from "@/lib/utils";

export interface GoldButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  glow?: boolean;
}

export const GoldButton = React.forwardRef<HTMLButtonElement, GoldButtonProps>(
  ({ className, glow = true, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "relative inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:pointer-events-none disabled:opacity-50",
          "bg-gradient-to-b from-[#E5C158] to-[#D4AF37] text-black shadow-sm",
          "hover:from-[#F5D76E] hover:to-[#E5C158]",
          "active:scale-[0.98]",
          glow && "hover:shadow-[0_0_15px_rgba(212,175,55,0.4)]",
          className
        )}
        {...props}
      >
        {children}
        <span className="absolute inset-0 rounded-md ring-1 ring-inset ring-black/10 pointer-events-none" />
      </button>
    );
  }
);
GoldButton.displayName = "GoldButton";
