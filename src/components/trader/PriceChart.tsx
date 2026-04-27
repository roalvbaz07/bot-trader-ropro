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

interface PriceChartProps {
  bars: Bar[];
  signals: SignalDoc[];
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
  bbBand: "#5fb8ff",       // azul claro (banda superior e inferior)
  bbBandFill: "rgba(95,184,255,0.08)", // relleno suave entre bandas
  bbMiddle: "#ff9a3c",     // naranja (banda media)
};

export function PriceChart({ bars, signals, onVisibleRangeChange, onChartReady }: PriceChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const bbFillTopRef = useRef<ISeriesApi<"Area"> | null>(null);
  const bbFillBottomRef = useRef<ISeriesApi<"Area"> | null>(null);
  const bbUpperRef = useRef<ISeriesApi<"Line"> | null>(null);
  const bbMiddleRef = useRef<ISeriesApi<"Line"> | null>(null);
  const bbLowerRef = useRef<ISeriesApi<"Line"> | null>(null);

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

    const candle = chart.addCandlestickSeries({
      upColor: COLORS.bull,
      downColor: COLORS.bear,
      borderUpColor: COLORS.bull,
      borderDownColor: COLORS.bear,
      wickUpColor: COLORS.bull,
      wickDownColor: COLORS.bear,
      priceFormat: { type: "price", precision: 2, minMove: 0.01 },
    });

    const volume = chart.addHistogramSeries({
      priceFormat: { type: "volume" },
      priceScaleId: "vol",
      color: COLORS.bullSoft,
    });
    chart.priceScale("vol").applyOptions({
      scaleMargins: { top: 0.85, bottom: 0 },
    });

    // Bollinger Bands overlays
    const bbUpper = chart.addLineSeries({
      color: COLORS.bbUpper,
      lineWidth: 1,
      lineStyle: LineStyle.Solid,
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: false,
    });
    const bbMiddle = chart.addLineSeries({
      color: COLORS.bbMiddle,
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: false,
    });
    const bbLower = chart.addLineSeries({
      color: COLORS.bbLower,
      lineWidth: 1,
      lineStyle: LineStyle.Solid,
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: false,
    });

    chartRef.current = chart;
    candleRef.current = candle;
    volumeRef.current = volume;
    bbUpperRef.current = bbUpper;
    bbMiddleRef.current = bbMiddle;
    bbLowerRef.current = bbLower;
    onChartReady?.(chart);

    const sub = chart.timeScale().subscribeVisibleLogicalRangeChange((range) => {
      onVisibleRangeChange?.(range);
    });

    return () => {
      chart.timeScale().unsubscribeVisibleLogicalRangeChange(sub as never);
      chart.remove();
      chartRef.current = null;
      candleRef.current = null;
      volumeRef.current = null;
      bbUpperRef.current = null;
      bbMiddleRef.current = null;
      bbLowerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update bars
  useEffect(() => {
    if (!candleRef.current || !volumeRef.current || !bars.length) return;
    const candleData = bars.map((b) => ({
      time: (new Date(b.t).getTime() / 1000) as Time,
      open: b.o,
      high: b.h,
      low: b.l,
      close: b.c,
    }));
    const volData = bars.map((b, i) => ({
      time: (new Date(b.t).getTime() / 1000) as Time,
      value: b.v,
      color: i > 0 && b.c >= bars[i - 1].c ? "rgba(79,255,176,0.25)" : "rgba(255,92,122,0.25)",
    }));
    candleRef.current.setData(candleData);
    volumeRef.current.setData(volData);
    chartRef.current?.timeScale().fitContent();
  }, [bars]);

  // Update Bollinger Bands from signals
  useEffect(() => {
    if (!bbUpperRef.current || !bbMiddleRef.current || !bbLowerRef.current) return;

    // Deduplicate by timestamp (seconds), keep latest per bucket
    const upMap = new Map<number, number>();
    const midMap = new Map<number, number>();
    const lowMap = new Map<number, number>();

    signals.forEach((s) => {
      const t = Math.floor(s.dateMs / 1000);
      const up = parseFloat(String(s.banda_superior));
      const mid = parseFloat(String(s.banda_media));
      const low = parseFloat(String(s.banda_inferior));
      if (!isNaN(up)) upMap.set(t, up);
      if (!isNaN(mid)) midMap.set(t, mid);
      if (!isNaN(low)) lowMap.set(t, low);
    });

    const toSeries = (m: Map<number, number>) =>
      Array.from(m.entries())
        .sort((a, b) => a[0] - b[0])
        .map(([t, value]) => ({ time: t as Time, value }));

    bbUpperRef.current.setData(toSeries(upMap));
    bbMiddleRef.current.setData(toSeries(midMap));
    bbLowerRef.current.setData(toSeries(lowMap));
  }, [signals]);

  // Update markers from signals
  useEffect(() => {
    if (!candleRef.current) return;
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
  }, [signals]);

  return <div ref={containerRef} className="w-full h-full" />;
}
