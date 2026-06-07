import * as React from "react";
import { mockMarketData } from "@/data/mockData";
import { cn } from "@/lib/utils";

export function TickerTape() {
  return (
    <div className="flex overflow-hidden bg-background border-b border-border/50 py-1.5 font-mono text-xs whitespace-nowrap z-50 relative">
      <div className="flex animate-[ticker_30s_linear_infinite]">
        {/* Double the data to ensure seamless loop */}
        {[...mockMarketData, ...mockMarketData, ...mockMarketData].map((item, i) => (
          <div key={`${item.symbol}-${i}`} className="flex items-center mx-4 gap-2">
            <span className="font-bold text-foreground">{item.symbol}</span>
            <span className="text-muted-foreground">{item.price.toFixed(2)}</span>
            <span
              className={cn(
                "font-medium",
                item.change >= 0 ? "text-accent" : "text-destructive"
              )}
            >
              {item.change >= 0 ? "+" : ""}
              {item.change.toFixed(2)} ({item.changePercent >= 0 ? "+" : ""}
              {item.changePercent.toFixed(2)}%)
            </span>
          </div>
        ))}
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33.33%); }
        }
      `}} />
    </div>
  );
}
