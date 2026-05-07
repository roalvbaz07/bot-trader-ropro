import { useEffect, useRef } from "react";
import {
  createChart,
  CrosshairMode,
  LineStyle,
  type IChartApi,
  type ISeriesApi,
  type Time,
  type LogicalRange,
} from "lightweight-charts";
import type { Bar } from "@/hooks/useBars";
import type { SignalDoc } from "@/hooks/useSignals";
import type { IndicatorId } from "@/lib/indicators";
import { bollinger, sma, ema, vwap, rsi } from "@/lib/indicators";

export type ChartType = "candles" | "line";

interface PriceChartProps {
  bars: Bar[];
  signals: SignalDoc[];
  chartType?: ChartType;
  indicators?: IndicatorId[];
  onVisibleRangeChange?: (range: LogicalRange | null) => void;
  onChartReady?: (chart: IChartApi) => void;
}

const COLORS = {
  bg: "#000000",
  text: "#8a9bb0",
  grid: "rgba(255,255,255,0.05)",
  border: "rgba(255,255,255,0.08)",
  bull: "#4fffb0",
  bear: "#ff5c7a",
  line: "#4fffb0",
  bbBand: "#5fb8ff",
  bbBandFill: "rgba(95,184,255,0.12)",
  bbMiddle: "#ff9a3c",
  sma20: "#ffd166",
  sma50: "#f78ca0",
  ema20: "#a0e7e5",
  ema50: "#b8b3ff",
  vwap: "#ff77e9",
  rsi: "#ffa94d",
};

export function PriceChart({
  bars,
  signals,
  chartType = "candles",
  indicators = ["bb"],
  onVisibleRangeChange,
  onChartReady,
}: PriceChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const lineRef = useRef<ISeriesApi<"Line"> | null>(null);
  const volumeRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const bbFillUpperRef = useRef<ISeriesApi<"Area"> | null>(null);
  const bbFillLowerRef = useRef<ISeriesApi<"Area"> | null>(null);
  const bbUpperRef = useRef<ISeriesApi<"Line"> | null>(null);
  const bbMiddleRef = useRef<ISeriesApi<"Line"> | null>(null);
  const bbLowerRef = useRef<ISeriesApi<"Line"> | null>(null);
  const sma20Ref = useRef<ISeriesApi<"Line"> | null>(null);
  const sma50Ref = useRef<ISeriesApi<"Line"> | null>(null);
  const ema20Ref = useRef<ISeriesApi<"Line"> | null>(null);
  const ema50Ref = useRef<ISeriesApi<"Line"> | null>(null);
  const vwapRef = useRef<ISeriesApi<"Line"> | null>(null);
  const rsiRef = useRef<ISeriesApi<"Line"> | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const chart = createChart(containerRef.current, {
      layout: {
        background: { color: COLORS.bg },
        textColor: COLORS.text,
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: 10,
      },
      grid: {
        vertLines: { color: COLORS.grid },
        horzLines: { color: COLORS.grid },
      },
      rightPriceScale: { borderColor: COLORS.border },
      timeScale: { borderColor: COLORS.border, timeVisible: true, secondsVisible: false },
      crosshair: { mode: CrosshairMode.Normal },
      autoSize: true,
    });

    const bbFillUpper = chart.addAreaSeries({
      topColor: COLORS.bbBandFill,
      bottomColor: COLORS.bbBandFill,
      lineColor: "transparent",
      lineWidth: 1,
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: false,
    });
    const bbFillLower = chart.addAreaSeries({
      topColor: COLORS.bg,
      bottomColor: COLORS.bg,
      lineColor: "transparent",
      lineWidth: 1,
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: false,
    });

    const candle = chart.addCandlestickSeries({
      upColor: COLORS.bull,
      downColor: COLORS.bear,
      borderUpColor: COLORS.bull,
      borderDownColor: COLORS.bear,
      wickUpColor: COLORS.bull,
      wickDownColor: COLORS.bear,
      priceFormat: { type: "price", precision: 2, minMove: 0.01 },
    });

    const line = chart.addLineSeries({
      color: COLORS.line,
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: true,
      crosshairMarkerVisible: true,
      priceFormat: { type: "price", precision: 2, minMove: 0.01 },
    });

    const volume = chart.addHistogramSeries({
      priceFormat: { type: "volume" },
      priceScaleId: "vol",
      color: "rgba(79,255,176,0.4)",
    });
    chart.priceScale("vol").applyOptions({
      scaleMargins: { top: 0.85, bottom: 0 },
    });

    const mkLine = (color: string, width: 1 | 2 | 3 | 4 = 2, style = LineStyle.Solid, priceScaleId?: string) =>
      chart.addLineSeries({
        color,
        lineWidth: width,
        lineStyle: style,
        priceLineVisible: false,
        lastValueVisible: true,
        crosshairMarkerVisible: false,
        ...(priceScaleId ? { priceScaleId } : {}),
      });

    const bbUpper = mkLine(COLORS.bbBand, 2);
    const bbMiddle = mkLine(COLORS.bbMiddle, 2);
    const bbLower = mkLine(COLORS.bbBand, 2);
    const sma20 = mkLine(COLORS.sma20, 1);
    const sma50 = mkLine(COLORS.sma50, 1);
    const ema20 = mkLine(COLORS.ema20, 1, LineStyle.Dashed);
    const ema50 = mkLine(COLORS.ema50, 1, LineStyle.Dashed);
    const vwapS = mkLine(COLORS.vwap, 1);
    const rsiS = mkLine(COLORS.rsi, 1, LineStyle.Solid, "rsi");
    chart.priceScale("rsi").applyOptions({
      scaleMargins: { top: 0, bottom: 0.7 },
    });

    chartRef.current = chart;
    candleRef.current = candle;
    lineRef.current = line;
    volumeRef.current = volume;
    bbFillUpperRef.current = bbFillUpper;
    bbFillLowerRef.current = bbFillLower;
    bbUpperRef.current = bbUpper;
    bbMiddleRef.current = bbMiddle;
    bbLowerRef.current = bbLower;
    sma20Ref.current = sma20;
    sma50Ref.current = sma50;
    ema20Ref.current = ema20;
    ema50Ref.current = ema50;
    vwapRef.current = vwapS;
    rsiRef.current = rsiS;
    onChartReady?.(chart);

    const sub = chart.timeScale().subscribeVisibleLogicalRangeChange((range) => {
      onVisibleRangeChange?.(range);
    });

    return () => {
      chart.timeScale().unsubscribeVisibleLogicalRangeChange(sub as never);
      chart.remove();
      chartRef.current = null;
      candleRef.current = null;
      lineRef.current = null;
      volumeRef.current = null;
      bbFillUpperRef.current = null;
      bbFillLowerRef.current = null;
      bbUpperRef.current = null;
      bbMiddleRef.current = null;
      bbLowerRef.current = null;
      sma20Ref.current = null;
      sma50Ref.current = null;
      ema20Ref.current = null;
      ema50Ref.current = null;
      vwapRef.current = null;
      rsiRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Toggle chart type
  useEffect(() => {
    candleRef.current?.applyOptions({ visible: chartType === "candles" });
    lineRef.current?.applyOptions({ visible: chartType === "line" });
  }, [chartType]);

  // Update bars
  useEffect(() => {
    if (!candleRef.current || !lineRef.current || !volumeRef.current || !bars.length) return;
    const candleData = bars.map((b) => ({
      time: (new Date(b.t).getTime() / 1000) as Time,
      open: b.o,
      high: b.h,
      low: b.l,
      close: b.c,
    }));
    const lineData = bars.map((b) => ({
      time: (new Date(b.t).getTime() / 1000) as Time,
      value: b.c,
    }));
    const volData = bars.map((b, i) => ({
      time: (new Date(b.t).getTime() / 1000) as Time,
      value: b.v,
      color: i > 0 && b.c >= bars[i - 1].c ? "rgba(79,255,176,0.25)" : "rgba(255,92,122,0.25)",
    }));
    candleRef.current.setData(candleData);
    lineRef.current.setData(lineData);
    volumeRef.current.setData(volData);
    chartRef.current?.timeScale().fitContent();
  }, [bars]);

  // Compute & apply indicators from bars (no Firestore dependency)
  useEffect(() => {
    if (!bars.length) return;
    const has = (id: IndicatorId) => indicators.includes(id);

    // Bollinger
    if (has("bb")) {
      const { upper, middle, lower } = bollinger(bars, 20, 2);
      const toData = (arr: { time: number; value: number }[]) =>
        arr.map((p) => ({ time: p.time as Time, value: p.value }));
      bbUpperRef.current?.setData(toData(upper));
      bbMiddleRef.current?.setData(toData(middle));
      bbLowerRef.current?.setData(toData(lower));
      bbFillUpperRef.current?.setData(toData(upper));
      bbFillLowerRef.current?.setData(toData(lower));
      bbUpperRef.current?.applyOptions({ visible: true });
      bbMiddleRef.current?.applyOptions({ visible: true });
      bbLowerRef.current?.applyOptions({ visible: true });
      bbFillUpperRef.current?.applyOptions({ visible: true });
      bbFillLowerRef.current?.applyOptions({ visible: true });
    } else {
      bbUpperRef.current?.applyOptions({ visible: false });
      bbMiddleRef.current?.applyOptions({ visible: false });
      bbLowerRef.current?.applyOptions({ visible: false });
      bbFillUpperRef.current?.applyOptions({ visible: false });
      bbFillLowerRef.current?.applyOptions({ visible: false });
    }

    const apply = (
      ref: React.MutableRefObject<ISeriesApi<"Line"> | null>,
      visible: boolean,
      data: { time: number; value: number }[],
    ) => {
      if (!ref.current) return;
      if (visible) {
        ref.current.setData(data.map((p) => ({ time: p.time as Time, value: p.value })));
        ref.current.applyOptions({ visible: true });
      } else {
        ref.current.applyOptions({ visible: false });
      }
    };

    apply(sma20Ref, has("sma20"), has("sma20") ? sma(bars, 20) : []);
    apply(sma50Ref, has("sma50"), has("sma50") ? sma(bars, 50) : []);
    apply(ema20Ref, has("ema20"), has("ema20") ? ema(bars, 20) : []);
    apply(ema50Ref, has("ema50"), has("ema50") ? ema(bars, 50) : []);
    apply(vwapRef, has("vwap"), has("vwap") ? vwap(bars) : []);
    apply(rsiRef, has("rsi"), has("rsi") ? rsi(bars, 14) : []);
  }, [bars, indicators]);

  // Markers from signals
  useEffect(() => {
    if (!candleRef.current || !lineRef.current) return;
    const markers = signals
      .filter((s) => s.señal === "COMPRAR" || s.señal === "VENDER")
      .map((s) => {
        const isBuy = s.señal === "COMPRAR";
        return {
          time: (s.dateMs / 1000) as Time,
          position: (isBuy ? "belowBar" : "aboveBar") as "belowBar" | "aboveBar",
          color: isBuy ? COLORS.bull : COLORS.bear,
          shape: (isBuy ? "arrowUp" : "arrowDown") as "arrowUp" | "arrowDown",
          text: isBuy ? "B" : "S",
        };
      })
      .sort((a, b) => (a.time as number) - (b.time as number));
    candleRef.current.setMarkers(markers);
    lineRef.current.setMarkers(markers);
  }, [signals]);

  return <div ref={containerRef} className="w-full h-full" />;
}
