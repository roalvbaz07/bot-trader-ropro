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

export type Timeframe = "1Min" | "5Min" | "15Min" | "1Hour";

export interface TimeframeDef {
  tf: Timeframe;
  label: string;
  limit: number;
}

export const TIMEFRAMES: TimeframeDef[] = [
  { tf: "1Min", label: "1m", limit: 200 },
  { tf: "5Min", label: "5m", limit: 200 },
  { tf: "15Min", label: "15m", limit: 150 },
  { tf: "1Hour", label: "1h", limit: 100 },
];

/**
 * Parse Firestore timestamp string "YYYYMMDD_HHMM" into ISO date string.
 */
export function parseFirestoreTs(t: string): string {
  if (!t || t.length < 13) return new Date().toISOString();
  return `${t.substring(0, 4)}-${t.substring(4, 6)}-${t.substring(6, 8)}T${t.substring(9, 11)}:${t.substring(11, 13)}:00`;
}
