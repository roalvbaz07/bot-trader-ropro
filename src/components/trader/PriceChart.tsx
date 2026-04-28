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

export type ChartType = "candles" | "line";

interface PriceChartProps {
  bars: Bar[];
  signals: SignalDoc[];
  chartType?: ChartType;
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
};

export function PriceChart({ bars, signals, chartType = "candles", onVisibleRangeChange, onChartReady }: PriceChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const lineRef = useRef<ISeriesApi<"Line"> | null>(null);
  const volumeRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  // Relleno: baseline entre lower y upper. Usamos una serie Baseline:
  // - topValue = upper (azul translúcido encima de la base)
  // - baseValue = lower (transparente debajo)
  // Para hacerlo simple y compatible, usaremos dos series Area apiladas
  // con priceScale propio invertido NO funciona bien; mejor:
  // Pintamos un Area de "upper - lower" sobre un priceScale oculto.
  // Solución limpia: usar una serie Area con value=upper y baseLineColor;
  // pero lightweight-charts no soporta fill-between nativo.
  // => Truco: dibujar Area con datos = upper, y otra Area con datos = lower
  // del mismo color de fondo (#000) para "borrar" la parte inferior.
  const bbFillUpperRef = useRef<ISeriesApi<"Area"> | null>(null);
  const bbFillLowerRef = useRef<ISeriesApi<"Area"> | null>(null);
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

    // Relleno azul desde upper hacia abajo, luego "tapamos" desde lower hacia abajo con color de fondo
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

    // Bollinger Bands líneas (encima del relleno)
    const bbUpper = chart.addLineSeries({
      color: COLORS.bbBand,
      lineWidth: 2,
      lineStyle: LineStyle.Solid,
      priceLineVisible: false,
      lastValueVisible: true,
      crosshairMarkerVisible: false,
    });
    const bbMiddle = chart.addLineSeries({
      color: COLORS.bbMiddle,
      lineWidth: 2,
      lineStyle: LineStyle.Solid,
      priceLineVisible: false,
      lastValueVisible: true,
      crosshairMarkerVisible: false,
    });
    const bbLower = chart.addLineSeries({
      color: COLORS.bbBand,
      lineWidth: 2,
      lineStyle: LineStyle.Solid,
      priceLineVisible: false,
      lastValueVisible: true,
      crosshairMarkerVisible: false,
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
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Toggle visibility based on chartType
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

  // Update Bollinger Bands from signals
  useEffect(() => {
    if (!bbUpperRef.current || !bbMiddleRef.current || !bbLowerRef.current) return;

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

    const upperData = toSeries(upMap);
    const middleData = toSeries(midMap);
    const lowerData = toSeries(lowMap);

    bbUpperRef.current.setData(upperData);
    bbMiddleRef.current.setData(middleData);
    bbLowerRef.current.setData(lowerData);

    // Relleno entre bandas: pintamos área hasta upper (azul) y "tapamos" hasta lower (negro)
    bbFillUpperRef.current?.setData(upperData);
    bbFillLowerRef.current?.setData(lowerData);
  }, [signals]);

  // Update markers from signals — sólo en velas (los markers de línea no se ven igual)
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
