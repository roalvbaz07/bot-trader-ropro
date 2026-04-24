export type AssetCategory =
  | "Tecnología"
  | "Salud"
  | "Finanzas"
  | "ETFs"
  | "Energía"
  | "Consumo";

export interface AssetDef {
  symbol: string;
  name: string;
  category: AssetCategory;
}

export const ASSETS: AssetDef[] = [
  // --- TECNOLOGÍA ---
  { symbol: "AAPL", name: "Apple Inc.", category: "Tecnología" },
  { symbol: "AMZN", name: "Amazon.com Inc.", category: "Tecnología" },
  { symbol: "AVGO", name: "Broadcom Inc.", category: "Tecnología" },
  { symbol: "MSFT", name: "Microsoft Corp.", category: "Tecnología" },
  { symbol: "NVDA", name: "NVIDIA Corp.", category: "Tecnología" },
  { symbol: "ORCL", name: "Oracle Corp.", category: "Tecnología" },

  // --- SALUD ---
  { symbol: "ABBV", name: "AbbVie Inc.", category: "Salud" },
  { symbol: "ISRG", name: "Intuitive Surgical", category: "Salud" },
  { symbol: "LLY", name: "Eli Lilly and Company", category: "Salud" },
  { symbol: "UNH", name: "UnitedHealth Group", category: "Salud" },

  // --- FINANZAS ---
  { symbol: "BAC", name: "Bank of America", category: "Finanzas" },
  { symbol: "JPM", name: "JPMorgan Chase", category: "Finanzas" },
  { symbol: "MA", name: "Mastercard Inc.", category: "Finanzas" },
  { symbol: "V", name: "Visa Inc.", category: "Finanzas" },

  // --- ETFs ---
  { symbol: "QQQ", name: "Invesco QQQ Trust", category: "ETFs" },
  { symbol: "VOO", name: "Vanguard S&P 500", category: "ETFs" },
  { symbol: "VT", name: "Vanguard Total World Stock", category: "ETFs" },
  { symbol: "VTI", name: "Vanguard Total Stock Market", category: "ETFs" },

  // --- ENERGÍA ---
  { symbol: "CVX", name: "Chevron Corp.", category: "Energía" },
  { symbol: "NEE", name: "NextEra Energy", category: "Energía" },
  { symbol: "XOM", name: "Exxon Mobil", category: "Energía" },

  // --- CONSUMO ---
  { symbol: "COST", name: "Costco Wholesale", category: "Consumo" },
  { symbol: "KO", name: "Coca-Cola Co.", category: "Consumo" },
  { symbol: "MCD", name: "McDonald's Corp.", category: "Consumo" },
  { symbol: "WMT", name: "Walmart", category: "Consumo" },
];

export type Timeframe = "1Hour" | "1Day" | "1Week" | "1Month";

export interface TimeframeDef {
  tf: Timeframe;
  label: string;
  limit: number;
}

export const TIMEFRAMES: TimeframeDef[] = [
  { tf: "1Hour", label: "1h", limit: 200 },
  { tf: "1Day", label: "1d", limit: 200 },
  { tf: "1Week", label: "1s", limit: 200 },
  { tf: "1Month", label: "1m", limit: 120 },
];

/**
 * Parse Firestore timestamp string "YYYYMMDD_HHMM" into ISO date string.
 */
export function parseFirestoreTs(t: string): string {
  if (!t || t.length < 13) return new Date().toISOString();
  return `${t.substring(0, 4)}-${t.substring(4, 6)}-${t.substring(6, 8)}T${t.substring(9, 11)}:${t.substring(11, 13)}:00`;
}
