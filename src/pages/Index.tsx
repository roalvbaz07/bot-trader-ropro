import { useCallback, useMemo, useRef, useState } from "react";
import type { IChartApi, LogicalRange } from "lightweight-charts";
import { Sidebar } from "@/components/trader/Sidebar";
import { Topbar } from "@/components/trader/Topbar";
import { PriceChart } from "@/components/trader/PriceChart";
import { RsiChart } from "@/components/trader/RsiChart";
import { MacdChart } from "@/components/trader/MacdChart";
import { SignalsTable } from "@/components/trader/SignalsTable";
import { ASSETS, TIMEFRAMES, type Timeframe } from "@/lib/assets";
import { useBars } from "@/hooks/useBars";
import { useSignals } from "@/hooks/useSignals";

const Index = () => {
  const [symbol, setSymbol] = useState<string>("NVDA");
  const [tfState, setTfState] = useState<{ tf: Timeframe; limit: number }>({
    tf: TIMEFRAMES[0].tf,
    limit: TIMEFRAMES[0].limit,
  });

  const { bars, loading: barsLoading, error: barsError } = useBars(symbol, tfState.tf, tfState.limit);
  const { signals, loading: sigLoading, error: sigError } = useSignals(symbol);

  // Topbar derived
  const { price, change, name } = useMemo(() => {
    const def = ASSETS.find((a) => a.symbol === symbol);
    if (!bars.length) return { price: null as number | null, change: null as number | null, name: def?.name ?? symbol };
    const last = bars[bars.length - 1].c;
    const first = bars[0].c;
    const chg = ((last - first) / first) * 100;
    return { price: last, change: chg, name: def?.name ?? symbol };
  }, [bars, symbol]);

  // Sidebar derived
  const stats = useMemo(() => {
    const today = new Date();
    const todayKey = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, "0")}${String(today.getDate()).padStart(2, "0")}`;
    let buys = 0;
    let sells = 0;
    let lastTime = "—";
    [...signals]
      .sort((a, b) => b.dateMs - a.dateMs)
      .forEach((s) => {
        if (s.timestamp.startsWith(todayKey)) {
          if (s.señal === "COMPRAR") buys++;
          if (s.señal === "VENDER") sells++;
        }
        if (lastTime === "—" && s.señal !== "ESPERAR") {
          const h = s.timestamp.split("_")[1] ?? "—";
          lastTime = h.length === 4 ? `${h.substring(0, 2)}:${h.substring(2, 4)}` : h;
        }
      });
    return { buys, sells, lastTime };
  }, [signals]);

  // Sync zoom across the 3 charts
  const chartsRef = useRef<{ price?: IChartApi; rsi?: IChartApi; macd?: IChartApi }>({});
  const syncing = useRef(false);

  const makeSync = useCallback(
    (origin: "price" | "rsi" | "macd") => (range: LogicalRange | null) => {
      if (!range || syncing.current) return;
      syncing.current = true;
      const targets: Array<keyof typeof chartsRef.current> = ["price", "rsi", "macd"].filter(
        (k) => k !== origin,
      ) as Array<"price" | "rsi" | "macd">;
      targets.forEach((k) => {
        const c = chartsRef.current[k];
        if (c) c.timeScale().setVisibleLogicalRange(range);
      });
      syncing.current = false;
    },
    [],
  );

  return (
    <div className="grid h-screen w-full overflow-hidden" style={{ gridTemplateColumns: "var(--sidebar-w) 1fr" }}>
      <Sidebar
        current={symbol}
        onSelect={setSymbol}
        signalsToday={{ buys: stats.buys, sells: stats.sells }}
        lastSignalTime={stats.lastTime}
        isLive={!sigError}
      />

      <main
        className="grid h-screen overflow-hidden bg-background"
        style={{ gridTemplateRows: "var(--topbar-h) 1fr var(--signals-h)" }}
      >
        <Topbar
          ticker={symbol}
          name={name}
          price={price}
          change={change}
          tf={tfState.tf}
          onTfChange={(tf, limit) => setTfState({ tf, limit })}
        />

        {/* Charts area */}
        <div className="grid overflow-hidden" style={{ gridTemplateRows: "1fr 200px" }}>
          {/* Price */}
          <div className="relative overflow-hidden">
            <div className="absolute top-2 left-3 z-10 font-mono text-[10px] font-semibold tracking-[0.1em] uppercase text-dim pointer-events-none">
              Precio &amp; Señales
              {barsLoading && <span className="ml-2 text-dim-2">cargando…</span>}
              {barsError && <span className="ml-2 text-bear">{barsError.slice(0, 60)}</span>}
            </div>
            <PriceChart
              bars={bars}
              signals={signals}
              onChartReady={(c) => (chartsRef.current.price = c)}
              onVisibleRangeChange={makeSync("price")}
            />
          </div>

          {/* RSI + MACD */}
          <div className="grid grid-cols-2 border-t border-border">
            <div className="relative overflow-hidden">
              <div className="absolute top-2 left-3 z-10 font-mono text-[10px] font-semibold tracking-[0.1em] uppercase text-dim pointer-events-none">
                RSI <span className="text-dim-2 font-normal">(14)</span>
              </div>
              <RsiChart
                signals={signals}
                onChartReady={(c) => (chartsRef.current.rsi = c)}
                onVisibleRangeChange={makeSync("rsi")}
              />
            </div>
            <div className="relative overflow-hidden border-l border-border">
              <div className="absolute top-2 left-3 z-10 font-mono text-[10px] font-semibold tracking-[0.1em] uppercase text-dim pointer-events-none">
                MACD
              </div>
              <MacdChart
                signals={signals}
                onChartReady={(c) => (chartsRef.current.macd = c)}
                onVisibleRangeChange={makeSync("macd")}
              />
            </div>
          </div>
        </div>

        <SignalsTable signals={signals} bars={bars} loading={sigLoading} error={sigError} />
      </main>
    </div>
  );
};

export default Index;
