import { MarketStrip } from "@/components/ui1/market-strip";
import { AtmosphericHero } from "@/components/ui1/atmospheric-hero";
import { PortfolioBand } from "@/components/ui1/portfolio-band";
import { MarketChart } from "@/components/ui1/market-chart";
import { IntelligenceRail } from "@/components/ui1/intelligence-rail";
import { SupportingAnalytics } from "@/components/ui1/supporting-analytics";
import { dashboardDemo } from "@/data/ui1-demo";
import { previewChartData } from "@/pages/preview-route";
import { OverviewIntelligenceBand } from "@/components/ui2/overview-intelligence-band";

export default function Home() {
  return (
    <div className="yt-dashboard">
      <MarketStrip
        sessionLabel={dashboardDemo.marketSession.label}
        stateLabel="Demo · Fixed"
        items={dashboardDemo.marketStrip.items.map((item) => ({
          label: item.label,
          symbol: item.symbol,
          value: item.displayValue,
          changePercent: item.changePercent,
          sparkline: item.sparkline,
        }))}
      />

      <div className="yt-dashboard-columns">
        <div className="yt-primary-stack">
          <AtmosphericHero data={dashboardDemo.briefing} />
          <PortfolioBand data={dashboardDemo.portfolio} />
          <section
            className="yt-overview-analysis-row"
            aria-label="Primary market analysis and supporting context"
          >
            <div className="yt-overview-chart-column">
              <MarketChart data={previewChartData} />
            </div>
            <div className="yt-overview-analysis-context">
              <SupportingAnalytics
                breadth={{
                  advancing: dashboardDemo.breadth.advancingPercent,
                  declining: dashboardDemo.breadth.decliningPercent,
                  unchanged: dashboardDemo.breadth.unchangedPercent,
                  stateLabel: "Demo",
                }}
                heatmap={dashboardDemo.heatmap.cells.map((cell) => ({
                  sector: cell.sector,
                  changePercent: cell.changePercent,
                  weight: cell.weight,
                }))}
                watchlist={{
                  stateLabel: "Demo",
                  items: dashboardDemo.watchlist.items.map((item) => ({
                    symbol: item.symbol,
                    company: item.company,
                    price: item.displayPrice,
                    changePercent: item.changePercent,
                  })),
                }}
              />
            </div>
          </section>
        </div>

        <IntelligenceRail
          aiInsight={dashboardDemo.aiInsight}
          opportunities={dashboardDemo.opportunities}
          calendar={dashboardDemo.calendar}
          fearGreed={dashboardDemo.fearGreed}
          risk={dashboardDemo.risk}
          news={dashboardDemo.news}
          providers={dashboardDemo.providers}
          system={dashboardDemo.system}
        />
      </div>

      <OverviewIntelligenceBand />
    </div>
  );
}
