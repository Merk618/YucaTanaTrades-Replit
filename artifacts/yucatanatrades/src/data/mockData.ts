export const mockMarketData = [
  { symbol: "SPY", price: 512.34, change: 1.2, changePercent: 0.23 },
  { symbol: "QQQ", price: 440.12, change: 2.3, changePercent: 0.52 },
  { symbol: "IWM", price: 205.67, change: -0.4, changePercent: -0.19 },
  { symbol: "DIA", price: 390.45, change: 0.8, changePercent: 0.21 },
  { symbol: "BTC", price: 65432.10, change: 1200.5, changePercent: 1.87 },
  { symbol: "ETH", price: 3456.78, change: 45.6, changePercent: 1.34 },
  { symbol: "SOL", price: 145.20, change: -2.3, changePercent: -1.56 },
  { symbol: "SUI", price: 1.85, change: 0.12, changePercent: 6.93 },
  { symbol: "MSFT", price: 420.55, change: 3.4, changePercent: 0.82 },
  { symbol: "NVDA", price: 890.12, change: 12.5, changePercent: 1.42 },
  { symbol: "AVGO", price: 1340.50, change: 25.6, changePercent: 1.95 },
];

export const mockPortfolioData = {
  rothIra: { total: 125430.50, dayChange: 450.20, dayChangePercent: 0.36 },
  individual: { total: 67890.25, dayChange: -120.40, dayChangePercent: -0.18 },
  crypto: { total: 28450.00, dayChange: 850.75, dayChangePercent: 3.08 },
};

export const mockScannerResults = [
  { symbol: "ASTS", name: "AST SpaceMobile", price: 15.40, volume: "12.5M", setup: "Momentum", score: 98, change: 12.5 },
  { symbol: "RGTI", name: "Rigetti Computing", price: 2.15, volume: "5.2M", setup: "Breakout", score: 95, change: 8.4 },
  { symbol: "QUBT", name: "Quantum Computing", price: 1.85, volume: "3.4M", setup: "Unusual Vol", score: 92, change: 15.2 },
  { symbol: "SMR", name: "NuScale Power", price: 8.90, volume: "8.1M", setup: "Dip-Buy", score: 88, change: -4.5 },
  { symbol: "CRDO", name: "Credo Technology", price: 24.50, volume: "4.2M", setup: "Momentum", score: 85, change: 5.2 },
  { symbol: "ZETA", name: "Zeta Global", price: 32.15, volume: "2.8M", setup: "Breakout", score: 84, change: 3.8 },
  { symbol: "KTOS", name: "Kratos Defense", price: 21.40, volume: "1.5M", setup: "Oversold", score: 82, change: -1.2 },
  { symbol: "CLSK", name: "CleanSpark", price: 18.75, volume: "15.4M", setup: "Momentum", score: 90, change: 6.5 },
  { symbol: "NXE", name: "NexGen Energy", price: 7.80, volume: "6.7M", setup: "Breakout", score: 87, change: 4.1 },
  { symbol: "URA", name: "Global X Uranium", price: 31.20, volume: "2.1M", setup: "Momentum", score: 81, change: 1.8 },
];

export const mockBotStatus = {
  moomoo: { status: "online", lastScan: "4min ago", scansToday: 124, isReadOnly: true },
  cryptoHunter: { status: "scanning", lastScan: "Just now", scansToday: 458, isReadOnly: true },
};

export const mockNewsCatalysts = [
  { id: 1, symbol: "MSFT", headline: "Announces new AI infrastructure investment", time: "10m ago", sentiment: "bullish" },
  { id: 2, symbol: "NVDA", headline: "Secures next-gen supply chain agreements", time: "45m ago", sentiment: "bullish" },
  { id: 3, symbol: "BTC", headline: "Institutional inflows reach record highs", time: "1h ago", sentiment: "bullish" },
  { id: 4, symbol: "AVGO", headline: "Analyst upgrades price target on custom silicon demand", time: "2h ago", sentiment: "bullish" },
  { id: 5, symbol: "ASTS", headline: "Successful deployment of BlueBird satellite array", time: "3h ago", sentiment: "bullish" },
  { id: 6, symbol: "META", headline: "Regulatory scrutiny over data practices in EU", time: "4h ago", sentiment: "bearish" },
];
