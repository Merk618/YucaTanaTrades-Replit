export interface Position {
  ticker: string;
  name: string;
  shares: number;
  avgCost: number;
  sleeve: "Roth IRA" | "Individual" | "Crypto";
  sector: string;
}

export const POSITIONS: Position[] = [
  { ticker: "NVDA", name: "NVIDIA Corp.",    shares: 12,   avgCost: 650.00,   sleeve: "Roth IRA",   sector: "Semis"   },
  { ticker: "AVGO", name: "Broadcom Inc.",   shares: 5,    avgCost: 1100.00,  sleeve: "Roth IRA",   sector: "Semis"   },
  { ticker: "ASTS", name: "AST SpaceMobile", shares: 200,  avgCost: 10.50,    sleeve: "Roth IRA",   sector: "Space"   },
  { ticker: "MSFT", name: "Microsoft Corp.", shares: 18,   avgCost: 340.00,   sleeve: "Individual", sector: "Tech"    },
  { ticker: "SMR",  name: "NuScale Power",   shares: 400,  avgCost: 5.50,     sleeve: "Individual", sector: "Nuclear" },
  { ticker: "KTOS", name: "Kratos Defense",  shares: 150,  avgCost: 18.00,    sleeve: "Individual", sector: "Defense" },
  { ticker: "BTC",  name: "Bitcoin",         shares: 0.28, avgCost: 42000.00, sleeve: "Crypto",     sector: "Crypto"  },
  { ticker: "ETH",  name: "Ethereum",        shares: 2.1,  avgCost: 2100.00,  sleeve: "Crypto",     sector: "Crypto"  },
  { ticker: "SOL",  name: "Solana",          shares: 8.5,  avgCost: 100.00,   sleeve: "Crypto",     sector: "Crypto"  },
];

export const POSITION_SYMBOLS: string[] = POSITIONS.map((p) => p.ticker);
