import { useEffect, useRef } from "react";
import {
  createChart,
  CrosshairMode,
  type IChartApi,
  type ISeriesApi,
  type Time,
  type LogicalRange,
} from "lightweight-charts";
import type { SignalDoc } from "@/hooks/useSignals";

interface MacdChartProps {
  signals: SignalDoc[];
  onVisibleRangeChange?: (range: LogicalRange | null) => void;
  onChartReady?: (chart: IChartApi) => void;
}

const COLORS = {
  bg: "#070a0f",
  text: "#5e7a96",
  grid: "rgba(255,255,255,0.04)",
  border: "rgba(255,255,255,0.06)",
  bull: "rgba(79,255,176,0.7)",
  bear: "rgba(255,92,122,0.7)",
};

export function MacdChart({ signals, onVisibleRangeChange, onChartReady }: MacdChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const histRef = useRef<ISeriesApi<"Histogram"> | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const chart = createChart(containerRef.current, {
      layout: {
        background: { color: COLORS.bg },
        textColor: COLORS.text,
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: 10,
      },
      grid: { vertLines: { color: COLORS.grid }, horzLines: { color: COLORS.grid } },
      rightPriceScale: { borderColor: COLORS.border },
      timeScale: { borderColor: COLORS.border, timeVisible: true, secondsVisible: false },
      crosshair: { mode: CrosshairMode.Normal },
      autoSize: true,
    });

    const hist = chart.addHistogramSeries({
      priceFormat: { type: "price", precision: 4, minMove: 0.0001 },
      base: 0,
    });

    chartRef.current = chart;
    histRef.current = hist;
    onChartReady?.(chart);

    const sub = chart.timeScale().subscribeVisibleLogicalRangeChange((range) => {
      onVisibleRangeChange?.(range);
    });

    return () => {
      chart.timeScale().unsubscribeVisibleLogicalRangeChange(sub as never);
      chart.remove();
      chartRef.current = null;
      histRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!histRef.current) return;
    const data = signals
      .filter((d) => d.macd != null && !Number.isNaN(parseFloat(String(d.macd))))
      .map((d) => {
        const v = parseFloat(String(d.macd));
        return {
          time: (d.dateMs / 1000) as Time,
          value: v,
          color: v >= 0 ? COLORS.bull : COLORS.bear,
        };
      });
    histRef.current.setData(data);
  }, [signals]);

  return <div ref={containerRef} className="w-full h-full" />;
}
