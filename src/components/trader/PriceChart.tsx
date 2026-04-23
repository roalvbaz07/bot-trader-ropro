import { useEffect, useRef } from "react";
import {
  createChart,
  CrosshairMode,
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
  bg: "#070a0f",
  text: "#5e7a96",
  grid: "rgba(255,255,255,0.04)",
  border: "rgba(255,255,255,0.06)",
  bull: "#4fffb0",
  bear: "#ff5c7a",
  bullSoft: "rgba(79,255,176,0.4)",
  bearSoft: "rgba(255,92,122,0.4)",
};

export function PriceChart({ bars, signals, onVisibleRangeChange, onChartReady }: PriceChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeRef = useRef<ISeriesApi<"Histogram"> | null>(null);

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

    chartRef.current = chart;
    candleRef.current = candle;
    volumeRef.current = volume;
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
