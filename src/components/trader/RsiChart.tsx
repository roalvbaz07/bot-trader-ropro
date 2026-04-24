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
import type { SignalDoc } from "@/hooks/useSignals";

interface RsiChartProps {
  signals: SignalDoc[];
  onVisibleRangeChange?: (range: LogicalRange | null) => void;
  onChartReady?: (chart: IChartApi) => void;
}

const COLORS = {
  bg: "#070a0f",
  text: "#5e7a96",
  grid: "rgba(255,255,255,0.04)",
  border: "rgba(255,255,255,0.06)",
  blue: "#48b8ff",
  bull: "#4fffb0",
  bear: "#ff5c7a",
};

export function RsiChart({ signals, onVisibleRangeChange, onChartReady }: RsiChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const lineRef = useRef<ISeriesApi<"Line"> | null>(null);

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

    const line = chart.addLineSeries({
      color: COLORS.blue,
      lineWidth: 2,
      priceFormat: { type: "price", precision: 1, minMove: 0.1 },
    });

    line.createPriceLine({
      price: 55,
      color: "rgba(255,92,122,0.5)",
      lineWidth: 1,
      lineStyle: LineStyle.Dotted,
      axisLabelVisible: true,
      title: "OB",
    });
    line.createPriceLine({
      price: 45,
      color: "rgba(79,255,176,0.5)",
      lineWidth: 1,
      lineStyle: LineStyle.Dotted,
      axisLabelVisible: true,
      title: "OS",
    });
    line.createPriceLine({
      price: 50,
      color: "rgba(255,255,255,0.08)",
      lineWidth: 1,
      lineStyle: LineStyle.Dotted,
      axisLabelVisible: false,
    });

    chartRef.current = chart;
    lineRef.current = line;
    onChartReady?.(chart);

    const sub = chart.timeScale().subscribeVisibleLogicalRangeChange((range) => {
      onVisibleRangeChange?.(range);
    });

    return () => {
      chart.timeScale().unsubscribeVisibleLogicalRangeChange(sub as never);
      chart.remove();
      chartRef.current = null;
      lineRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!lineRef.current) return;
    const data = signals
      .filter((d) => d.rsi != null && !Number.isNaN(parseFloat(String(d.rsi))))
      .map((d) => ({ time: (d.dateMs / 1000) as Time, value: parseFloat(String(d.rsi)) }));
    lineRef.current.setData(data);
  }, [signals]);

  return <div ref={containerRef} className="w-full h-full" />;
}
