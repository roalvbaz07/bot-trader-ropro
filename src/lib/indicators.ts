import type { Bar } from "@/hooks/useBars";

export type IndicatorId = "bb" | "sma20" | "sma50" | "ema20" | "ema50" | "vwap" | "rsi";

export interface IndicatorDef {
  id: IndicatorId;
  label: string;
  description: string;
}

export const INDICATORS: IndicatorDef[] = [
  { id: "bb", label: "Bollinger (20, 2)", description: "Bandas de Bollinger" },
  { id: "sma20", label: "SMA 20", description: "Media móvil simple 20" },
  { id: "sma50", label: "SMA 50", description: "Media móvil simple 50" },
  { id: "ema20", label: "EMA 20", description: "Media móvil exponencial 20" },
  { id: "ema50", label: "EMA 50", description: "Media móvil exponencial 50" },
  { id: "vwap", label: "VWAP", description: "Precio medio ponderado por volumen" },
  { id: "rsi", label: "RSI 14", description: "Índice de fuerza relativa" },
];

export interface Point {
  time: number; // unix seconds
  value: number;
}

const toSec = (b: Bar) => Math.floor(new Date(b.t).getTime() / 1000);

export function sma(bars: Bar[], period: number): Point[] {
  const out: Point[] = [];
  let sum = 0;
  for (let i = 0; i < bars.length; i++) {
    sum += bars[i].c;
    if (i >= period) sum -= bars[i - period].c;
    if (i >= period - 1) out.push({ time: toSec(bars[i]), value: sum / period });
  }
  return out;
}

export function ema(bars: Bar[], period: number): Point[] {
  const out: Point[] = [];
  if (!bars.length) return out;
  const k = 2 / (period + 1);
  let prev = bars[0].c;
  for (let i = 0; i < bars.length; i++) {
    prev = i === 0 ? bars[i].c : bars[i].c * k + prev * (1 - k);
    if (i >= period - 1) out.push({ time: toSec(bars[i]), value: prev });
  }
  return out;
}

export function bollinger(bars: Bar[], period = 20, mult = 2) {
  const upper: Point[] = [];
  const middle: Point[] = [];
  const lower: Point[] = [];
  for (let i = period - 1; i < bars.length; i++) {
    let sum = 0;
    for (let j = i - period + 1; j <= i; j++) sum += bars[j].c;
    const mean = sum / period;
    let variance = 0;
    for (let j = i - period + 1; j <= i; j++) variance += (bars[j].c - mean) ** 2;
    const sd = Math.sqrt(variance / period);
    const t = toSec(bars[i]);
    middle.push({ time: t, value: mean });
    upper.push({ time: t, value: mean + mult * sd });
    lower.push({ time: t, value: mean - mult * sd });
  }
  return { upper, middle, lower };
}

export function vwap(bars: Bar[]): Point[] {
  const out: Point[] = [];
  let pv = 0;
  let vv = 0;
  for (const b of bars) {
    const tp = (b.h + b.l + b.c) / 3;
    pv += tp * b.v;
    vv += b.v;
    out.push({ time: toSec(b), value: vv ? pv / vv : tp });
  }
  return out;
}

export function rsi(bars: Bar[], period = 14): Point[] {
  const out: Point[] = [];
  if (bars.length <= period) return out;
  let gain = 0;
  let loss = 0;
  for (let i = 1; i <= period; i++) {
    const diff = bars[i].c - bars[i - 1].c;
    if (diff >= 0) gain += diff;
    else loss -= diff;
  }
  let avgGain = gain / period;
  let avgLoss = loss / period;
  const rsiVal = (g: number, l: number) => (l === 0 ? 100 : 100 - 100 / (1 + g / l));
  out.push({ time: toSec(bars[period]), value: rsiVal(avgGain, avgLoss) });
  for (let i = period + 1; i < bars.length; i++) {
    const diff = bars[i].c - bars[i - 1].c;
    const g = diff > 0 ? diff : 0;
    const l = diff < 0 ? -diff : 0;
    avgGain = (avgGain * (period - 1) + g) / period;
    avgLoss = (avgLoss * (period - 1) + l) / period;
    out.push({ time: toSec(bars[i]), value: rsiVal(avgGain, avgLoss) });
  }
  return out;
}
