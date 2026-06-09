import { db, positionsTable } from "@workspace/db";
import { sql } from "drizzle-orm";
import { logger } from "./lib/logger";

const SEED_POSITIONS = [
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

export async function seedPositionsIfEmpty(): Promise<void> {
  try {
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(positionsTable);

    if (count > 0) {
      logger.info({ count }, "Positions table already seeded, skipping");
      return;
    }

    await db.insert(positionsTable).values(SEED_POSITIONS.map((p) => ({ ...p })));
    logger.info({ count: SEED_POSITIONS.length }, "Seeded positions table");
  } catch (err) {
    logger.error({ err }, "Failed to seed positions table");
  }
}
