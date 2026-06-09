import { db, journalEntriesTable, watchlistTable, positionsTable } from "@workspace/db";
import { sql } from "drizzle-orm";

const JOURNAL_ENTRIES = [
  {
    ticker: "NVDA",
    setupType: "Momentum Breakout",
    side: "long",
    entryPrice: "620.00",
    exitPrice: "685.50",
    pnl: "655.00",
    pnlPercent: "10.56",
    thesis: "Breaking out of 3-month consolidation on heavy volume. AI capex cycle accelerating.",
    mistakes: null,
    lessons: "Held through the dip at $650 — patience paid off.",
    outcome: "win",
    sector: "Semis",
    tags: "ai,breakout,high-conviction",
    tradeDate: "2024-11-15",
  },
  {
    ticker: "SMR",
    setupType: "Dip Buy",
    side: "long",
    entryPrice: "6.20",
    exitPrice: "5.10",
    pnl: "-110.00",
    pnlPercent: "-17.74",
    thesis: "Nuclear energy narrative strong; pulled back to support on no news.",
    mistakes: "Bought too early before real support confirmed. Stop was too loose.",
    lessons: "Wait for volume confirmation before entering on dip buys.",
    outcome: "loss",
    sector: "Nuclear",
    tags: "nuclear,dip-buy",
    tradeDate: "2024-10-22",
  },
  {
    ticker: "BTC",
    setupType: "Momentum Breakout",
    side: "long",
    entryPrice: "41500.00",
    exitPrice: "52000.00",
    pnl: "10500.00",
    pnlPercent: "25.30",
    thesis: "ETF approval catalysts driving institutional inflows. Halving narrative building.",
    mistakes: null,
    lessons: "Macro-driven moves require wider stops — normal technical levels get blown through.",
    outcome: "win",
    sector: "Crypto",
    tags: "crypto,macro,etf",
    tradeDate: "2024-01-10",
  },
  {
    ticker: "ASTS",
    setupType: "Catalyst Play",
    side: "long",
    entryPrice: "9.80",
    exitPrice: null,
    pnl: null,
    pnlPercent: null,
    thesis: "Satellite broadband deal news imminent per technical setup and options flow.",
    mistakes: null,
    lessons: null,
    outcome: "open",
    sector: "Space",
    tags: "space,catalyst,options-flow",
    tradeDate: "2024-12-01",
  },
  {
    ticker: "KTOS",
    setupType: "Sector Rotation",
    side: "long",
    entryPrice: "17.50",
    exitPrice: "22.30",
    pnl: "720.00",
    pnlPercent: "27.43",
    thesis: "Defense spending bill passed; Kratos wins contract coverage building.",
    mistakes: null,
    lessons: "Sector rotation plays work best when you size into sector ETF strength first.",
    outcome: "win",
    sector: "Defense",
    tags: "defense,sector-rotation,catalyst",
    tradeDate: "2024-09-05",
  },
  {
    ticker: "MSFT",
    setupType: "Earnings Play",
    side: "long",
    entryPrice: "330.00",
    exitPrice: "358.00",
    pnl: "504.00",
    pnlPercent: "8.48",
    thesis: "Azure cloud growth acceleration expected. Copilot monetization beginning.",
    mistakes: "Sold too early — ran another 8% after exit.",
    lessons: "For mega-cap quality, give more room after a strong earnings reaction.",
    outcome: "win",
    sector: "Tech",
    tags: "earnings,cloud,ai",
    tradeDate: "2024-07-25",
  },
  {
    ticker: "ETH",
    setupType: "Momentum Breakout",
    side: "long",
    entryPrice: "2050.00",
    exitPrice: "1820.00",
    pnl: "-483.00",
    pnlPercent: "-11.22",
    thesis: "ETH ETF approval expected to follow BTC. Breaking above key resistance.",
    mistakes: "Sized too large for a crypto position. Correlation to BTC pullback hurt.",
    lessons: "Crypto positions need tighter correlation-adjusted sizing.",
    outcome: "loss",
    sector: "Crypto",
    tags: "crypto,etf,breakout",
    tradeDate: "2024-03-12",
  },
  {
    ticker: "AVGO",
    setupType: "Momentum Breakout",
    side: "long",
    entryPrice: "1050.00",
    exitPrice: "1280.00",
    pnl: "1150.00",
    pnlPercent: "21.90",
    thesis: "Custom AI chip orders from hyperscalers growing. VMware integration upside.",
    mistakes: null,
    lessons: "High-conviction setups deserve a full position from the start.",
    outcome: "win",
    sector: "Semis",
    tags: "ai,semis,custom-silicon",
    tradeDate: "2024-05-20",
  },
  {
    ticker: "SOL",
    setupType: "Dip Buy",
    side: "long",
    entryPrice: "95.00",
    exitPrice: null,
    pnl: null,
    pnlPercent: null,
    thesis: "Solana ecosystem growing fast — DeFi TVL and NFT volume recovering.",
    mistakes: null,
    lessons: null,
    outcome: "open",
    sector: "Crypto",
    tags: "crypto,defi,dip-buy",
    tradeDate: "2024-11-28",
  },
  {
    ticker: "PLTR",
    setupType: "Catalyst Play",
    side: "long",
    entryPrice: "18.40",
    exitPrice: "23.10",
    pnl: "470.00",
    pnlPercent: "25.54",
    thesis: "Government AI contracts accelerating. AIP platform gaining commercial traction.",
    mistakes: null,
    lessons: "AI-adjacent names can run hard on contract news — trail stops after 15% gain.",
    outcome: "win",
    sector: "AI/Data",
    tags: "ai,government,catalyst",
    tradeDate: "2024-08-14",
  },
] as const;

const WATCHLIST_ITEMS = [
  { ticker: "META",  sector: "Tech",      priority: "high",   notes: "AI ad targeting + Llama ecosystem. Watching for breakout above ATH." },
  { ticker: "AMD",   sector: "Semis",     priority: "high",   notes: "MI300 GPU ramp competing with NVDA. Earnings catalyst upcoming." },
  { ticker: "IONQ",  sector: "Quantum",   priority: "medium", notes: "Quantum computing pure-play. Speculative — small starter only." },
  { ticker: "RKLB",  sector: "Space",     priority: "high",   notes: "Rocket Lab launch cadence accelerating. Neutron rocket development." },
  { ticker: "TSM",   sector: "Semis",     priority: "medium", notes: "Arizona fab progress. NVDA/AMD supply chain leverage." },
  { ticker: "PLTR",  sector: "AI/Data",   priority: "medium", notes: "AIP commercial traction. Government contracts steady." },
  { ticker: "COIN",  sector: "Crypto",    priority: "medium", notes: "Crypto volume proxy. Correlated to BTC price action." },
  { ticker: "MSTR",  sector: "Crypto",    priority: "low",    notes: "BTC proxy with leverage. High volatility — position sizing critical." },
  { ticker: "LUNR",  sector: "Space",     priority: "low",    notes: "Lunar lander — speculative NASA contract play." },
  { ticker: "BWXT",  sector: "Nuclear",   priority: "medium", notes: "Nuclear propulsion for defense + commercial reactor servicing." },
  { ticker: "OKLO",  sector: "Nuclear",   priority: "high",   notes: "Small modular reactor. Sam Altman backed. Watching for NRC approval news." },
  { ticker: "GEHC",  sector: "Healthcare",priority: "low",    notes: "GE HealthCare spin-off. AI diagnostics revenue growing." },
  { ticker: "ARM",   sector: "Semis",     priority: "medium", notes: "CPU licensing + royalties. AI edge compute architecture bet." },
  { ticker: "HOOD",  sector: "Fintech",   priority: "low",    notes: "Retail brokerage recovery. Options/crypto volumes key." },
  { ticker: "DOGE",  sector: "Crypto",    priority: "low",    notes: "Meme coin speculation only — tiny size if entered." },
] as const;

const POSITIONS = [
  { ticker: "NVDA", name: "NVIDIA Corp.",    shares: "12",   avgCost: "650.00",   sleeve: "rothIra",    sector: "Semis"   },
  { ticker: "AVGO", name: "Broadcom Inc.",   shares: "5",    avgCost: "1100.00",  sleeve: "rothIra",    sector: "Semis"   },
  { ticker: "ASTS", name: "AST SpaceMobile", shares: "200",  avgCost: "10.50",    sleeve: "rothIra",    sector: "Space"   },
  { ticker: "MSFT", name: "Microsoft Corp.", shares: "18",   avgCost: "340.00",   sleeve: "individual", sector: "Tech"    },
  { ticker: "SMR",  name: "NuScale Power",   shares: "400",  avgCost: "5.50",     sleeve: "individual", sector: "Nuclear" },
  { ticker: "KTOS", name: "Kratos Defense",  shares: "150",  avgCost: "18.00",    sleeve: "individual", sector: "Defense" },
  { ticker: "BTC",  name: "Bitcoin",         shares: "0.28", avgCost: "42000.00", sleeve: "crypto",     sector: "Crypto"  },
  { ticker: "ETH",  name: "Ethereum",        shares: "2.1",  avgCost: "2100.00",  sleeve: "crypto",     sector: "Crypto"  },
  { ticker: "SOL",  name: "Solana",          shares: "8.5",  avgCost: "100.00",   sleeve: "crypto",     sector: "Crypto"  },
] as const;

async function seedTable<T extends Record<string, unknown>>(
  label: string,
  table: Parameters<typeof db.select>[0] extends undefined
    ? never
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    : any,
  rows: readonly T[],
) {
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(table);

  if (count > 0) {
    console.log(`[seed] ${label}: already has ${count} rows — skipping`);
    return;
  }

  await db.insert(table).values(rows.map((r) => ({ ...r })));
  console.log(`[seed] ${label}: inserted ${rows.length} rows`);
}

async function main() {
  console.log("[seed] Starting database seed...");

  await seedTable("journal_entries", journalEntriesTable, JOURNAL_ENTRIES);
  await seedTable("watchlist", watchlistTable, WATCHLIST_ITEMS);
  await seedTable("positions", positionsTable, POSITIONS);

  console.log("[seed] Done.");
  process.exit(0);
}

main().catch((err) => {
  console.error("[seed] Fatal error:", err);
  process.exit(1);
});
