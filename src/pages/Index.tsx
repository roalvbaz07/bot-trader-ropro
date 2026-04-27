import { useCallback, useMemo, useRef, useState } from "react";
import type { IChartApi, LogicalRange } from "lightweight-charts";
import { Menu, X } from "lucide-react";
import { Sidebar } from "@/components/trader/Sidebar";
import { Topbar } from "@/components/trader/Topbar";
import { PriceChart } from "@/components/trader/PriceChart";
import { RsiChart } from "@/components/trader/RsiChart";
import { MacdChart } from "@/components/trader/MacdChart";
import { SignalsTable } from "@/components/trader/SignalsTable";
import { ASSETS, TIMEFRAMES, type Timeframe } from "@/lib/assets";
import { useBars } from "@/hooks/useBars";
import { useSignals } from "@/hooks/useSignals";
import { useAllSignalsStats } from "@/hooks/useAllSignals";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

const Index = () => {
  const [symbol, setSymbol] = useState<string>("NVDA");
  const [tfState, setTfState] = useState<{ tf: Timeframe; limit: number }>({
    tf: TIMEFRAMES[0].tf,
    limit: TIMEFRAMES[0].limit,
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useIsMobile();

  const { bars, loading: barsLoading, error: barsError } = useBars(symbol, tfState.tf, tfState.limit);
  const { signals, loading: sigLoading, error: sigError } = useSignals(symbol);
  const { stats: globalStats, error: globalErr } = useAllSignalsStats();

  // Topbar derived
  const { price, change, name } = useMemo(() => {
    const def = ASSETS.find((a) => a.symbol === symbol);
    if (!bars.length) return { price: null as number | null, change: null as number | null, name: def?.name ?? symbol };
    const last = bars[bars.length - 1].c;
    const first = bars[0].c;
    const chg = ((last - first) / first) * 100;
    return { price: last, change: chg, name: def?.name ?? symbol };
  }, [bars, symbol]);

  // Inverse sync between RSI and MACD only (price chart is independent)
  const chartsRef = useRef<{ rsi?: IChartApi; macd?: IChartApi }>({});
  const syncing = useRef(false);

  const makeInverseSync = useCallback(
    (origin: "rsi" | "macd") => (range: LogicalRange | null) => {
      if (!range || syncing.current) return;
      const target = origin === "rsi" ? chartsRef.current.macd : chartsRef.current.rsi;
      if (!target) return;
      syncing.current = true;
      // Inverse: flip the range around its center
      const center = (range.from + range.to) / 2;
      const inverted = {
        from: center - (range.to - center),
        to: center + (center - range.from),
      };
      target.timeScale().setVisibleLogicalRange(inverted);
      // release in next tick to avoid feedback
      requestAnimationFrame(() => {
        syncing.current = false;
      });
    },
    [],
  );

  const handleSelect = (s: string) => {
    setSymbol(s);
    if (isMobile) setSidebarOpen(false);
  };

  return (
    <div
      className="relative grid h-screen w-full overflow-hidden md:grid-cols-[var(--sidebar-w)_1fr]"
      style={{ gridTemplateColumns: isMobile ? "1fr" : undefined }}
    >
      {/* Sidebar — drawer on mobile, fixed on desktop */}
      {isMobile ? (
        <>
          {sidebarOpen && (
            <div
              className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm"
              onClick={() => setSidebarOpen(false)}
            />
          )}
          <div
            className={cn(
              "fixed inset-y-0 left-0 z-50 transition-transform duration-200",
              sidebarOpen ? "translate-x-0" : "-translate-x-full",
            )}
          >
            <Sidebar
              current={symbol}
              onSelect={handleSelect}
              signalsToday={{ buys: globalStats.buys, sells: globalStats.sells }}
              lastSignalTime={globalStats.lastTime}
              isLive={!globalErr}
            />
          </div>
        </>
      ) : (
        <Sidebar
          current={symbol}
          onSelect={handleSelect}
          signalsToday={{ buys: globalStats.buys, sells: globalStats.sells }}
          lastSignalTime={globalStats.lastTime}
          isLive={!globalErr}
        />
      )}

      <main
        className="grid h-screen overflow-hidden bg-background"
        style={{
          gridTemplateRows: "var(--topbar-h) 1fr var(--signals-h)",
        }}
      >
        <div className="flex items-stretch">
          {isMobile && (
            <button
              onClick={() => setSidebarOpen((v) => !v)}
              className="px-3 bg-surface border-b border-r border-border text-foreground"
              aria-label="Menu"
            >
              {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          )}
          <div className="flex-1 min-w-0">
            <Topbar
              ticker={symbol}
              name={name}
              price={price}
              change={change}
              tf={tfState.tf}
              onTfChange={(tf, limit) => setTfState({ tf, limit })}
            />
          </div>
        </div>

        {/* Charts area */}
        <div
          className="grid overflow-hidden"
          style={{ gridTemplateRows: isMobile ? "1fr 160px" : "1fr 200px" }}
        >
          {/* Price (independent zoom) */}
          <div className="relative overflow-hidden">
            <div className="absolute top-2 left-3 z-10 font-mono text-[10px] font-semibold tracking-[0.1em] uppercase text-dim pointer-events-none">
              Precio &amp; Señales
              {barsLoading && <span className="ml-2 text-dim-2">cargando…</span>}
              {barsError && <span className="ml-2 text-bear">{barsError.slice(0, 60)}</span>}
            </div>
            <PriceChart bars={bars} signals={signals} />
          </div>

          {/* RSI + MACD — stack on mobile, side-by-side on desktop */}
          <div className="grid grid-cols-1 sm:grid-cols-2 border-t border-border">
            <div className="relative overflow-hidden">
              <div className="absolute top-2 left-3 z-10 font-mono text-[10px] font-semibold tracking-[0.1em] uppercase text-dim pointer-events-none">
                RSI <span className="text-dim-2 font-normal">(14)</span>
              </div>
              <RsiChart
                signals={signals}
                onChartReady={(c) => (chartsRef.current.rsi = c)}
                onVisibleRangeChange={makeInverseSync("rsi")}
              />
            </div>
            <div className="relative overflow-hidden border-t sm:border-t-0 sm:border-l border-border">
              <div className="absolute top-2 left-3 z-10 font-mono text-[10px] font-semibold tracking-[0.1em] uppercase text-dim pointer-events-none">
                MACD
              </div>
              <MacdChart
                signals={signals}
                onChartReady={(c) => (chartsRef.current.macd = c)}
                onVisibleRangeChange={makeInverseSync("macd")}
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
