import * as React from "react";
import { cn } from "@/lib/utils";

interface MetricCardProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: string | number;
  change?: number;
  changePercent?: number;
  prefix?: string;
  suffix?: string;
  icon?: React.ReactNode;
}

export function MetricCard({
  label,
  value,
  change,
  changePercent,
  prefix = "",
  suffix = "",
  icon,
  className,
  ...props
}: MetricCardProps) {
  const isPositive = change !== undefined && change >= 0;
  const isNegative = change !== undefined && change < 0;

  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card/80 backdrop-blur p-5 flex flex-col gap-2 relative overflow-hidden",
        className
      )}
      {...props}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </div>
      <div className="flex items-baseline gap-2">
        <span className="font-mono text-2xl font-bold text-foreground">
          {prefix}{value}{suffix}
        </span>
      </div>
      {(change !== undefined || changePercent !== undefined) && (
        <div className="flex items-center gap-2 text-sm font-medium mt-1">
          {change !== undefined && (
            <span className={cn(isPositive ? "text-accent" : isNegative ? "text-destructive" : "text-muted-foreground")}>
              {isPositive ? "+" : ""}{change}
            </span>
          )}
          {changePercent !== undefined && (
            <span className={cn(isPositive ? "text-accent" : isNegative ? "text-destructive" : "text-muted-foreground")}>
              ({isPositive ? "+" : ""}{changePercent}%)
            </span>
          )}
        </div>
      )}
      <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-primary/5 rounded-full blur-xl pointer-events-none" />
    </div>
  );
}
