export type AssetCategory = "Tecnología" | "ETFs";

export interface AssetDef {
  symbol: string;
  name: string;
  category: AssetCategory;
}

export const ASSETS: AssetDef[] = [
  { symbol: "NVDA", name: "NVIDIA Corp.", category: "Tecnología" },
  { symbol: "AAPL", name: "Apple Inc.", category: "Tecnología" },
  { symbol: "AMZN", name: "Amazon.com", category: "Tecnología" },
  { symbol: "MSFT", name: "Microsoft Corp.", category: "Tecnología" },
  { symbol: "QQQ", name: "Nasdaq 100 ETF", category: "ETFs" },
  { symbol: "VOO", name: "S&P 500 ETF", category: "ETFs" },
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
