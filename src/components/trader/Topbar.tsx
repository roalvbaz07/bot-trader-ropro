import { TIMEFRAMES, type Timeframe } from "@/lib/assets";
import { cn } from "@/lib/utils";
import { ShieldCheck } from "lucide-react";

interface TopbarProps {
  ticker: string;
  name: string;
  price: number | null;
  change: number | null;
  tf: Timeframe;
  onTfChange: (tf: Timeframe, limit: number) => void;
}

export function Topbar({ ticker, name, price, change, tf, onTfChange }: TopbarProps) {
  return (
    <header
      className="flex items-center justify-between px-5 bg-surface border-b border-border gap-4"
      style={{ height: "var(--topbar-h)" }}
    >
      <div className="flex items-baseline gap-3">
        <h1 className="font-mono font-semibold text-lg text-foreground tracking-wide">{ticker}</h1>
        <span className="text-[11px] text-dim hidden sm:inline">{name}</span>
        <span className="font-mono text-[15px] font-medium text-foreground">
          {price != null ? `$${price.toFixed(2)}` : "—"}
        </span>
        {change != null && (
          <span
            className={cn(
              "font-mono text-xs px-1.5 py-0.5 rounded",
              change >= 0 ? "bg-bull-soft text-bull" : "bg-bear-soft text-bear",
            )}
          >
            {change >= 0 ? "+" : ""}
            {change.toFixed(2)}%
          </span>
        )}
      </div>

      <div className="flex items-center gap-2.5">
        <span className="font-mono text-[10px] tracking-wider uppercase text-dim-2 hidden md:inline">
          Timeframe
        </span>
        <div
          className="flex gap-0.5 bg-surface-2 border border-border rounded-md p-0.5"
          role="tablist"
        >
          {TIMEFRAMES.map((t) => {
            const active = t.tf === tf;
            return (
              <button
                key={t.tf}
                onClick={() => onTfChange(t.tf, t.limit)}
                role="tab"
                aria-selected={active}
                className={cn(
                  "font-mono text-[11px] font-medium px-2.5 py-1 rounded transition-colors tracking-wide",
                  active
                    ? "bg-surface-3 text-primary border border-primary/20"
                    : "text-dim hover:text-foreground hover:bg-surface-3 border border-transparent",
                )}
              >
                {t.label}
              </button>
            );
          })}
        </div>
        <span
          className="font-mono text-[10px] text-primary bg-bull-soft border border-bull-soft rounded px-2 py-0.5 tracking-wide hidden lg:flex items-center gap-1"
          title="Conexión segura vía edge function"
        >
          <ShieldCheck className="h-3 w-3" />
          SECURE
        </span>
      </div>
    </header>
  );
}
