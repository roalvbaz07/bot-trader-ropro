import { ASSETS, type AssetCategory } from "@/lib/assets";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";

interface SidebarProps {
  current: string;
  onSelect: (symbol: string) => void;
  signalsToday: { buys: number; sells: number };
  lastSignalTime: string;
  isLive: boolean;
}

const CATEGORY_ORDER: AssetCategory[] = [
  "Tecnología",
  "Salud",
  "Finanzas",
  "ETFs",
  "Energía",
  "Consumo",
];

export function Sidebar({ current, onSelect, signalsToday, lastSignalTime, isLive }: SidebarProps) {
  const grouped = CATEGORY_ORDER.map((cat) => ({
    label: cat,
    list: ASSETS.filter((a) => a.category === cat),
  })).filter((g) => g.list.length > 0);

  const renderGroup = (label: string, list: typeof ASSETS) => (
    <>
      <div className="font-mono text-[9px] font-semibold tracking-[0.16em] uppercase text-dim-2 px-4 pt-3.5 pb-1.5">
        {label}
      </div>
      <div className="px-2">
        {list.map((a) => {
          const active = a.symbol === current;
          return (
            <button
              key={a.symbol}
              onClick={() => onSelect(a.symbol)}
              className={cn(
                "group flex items-center gap-2 w-full rounded-md border px-2.5 py-2 mb-0.5 transition-all text-left",
                active
                  ? "bg-bull-soft border-bull-soft"
                  : "border-transparent hover:bg-surface-2 hover:border-border",
              )}
            >
              <span
                className={cn(
                  "font-mono font-semibold text-[12px] tracking-wide min-w-[40px]",
                  active ? "text-primary" : "text-dim group-hover:text-foreground",
                )}
              >
                {a.symbol}
              </span>
              <span
                className={cn(
                  "text-[11px] flex-1 truncate",
                  active ? "text-foreground" : "text-dim",
                )}
              >
                {a.name.replace(/ Corp\.| Inc\.| ETF|\.com|Co\./, "")}
              </span>
              <ChevronRight
                className={cn(
                  "h-3 w-3 transition-opacity",
                  active || "opacity-0 group-hover:opacity-100",
                  active ? "text-primary" : "text-dim-2 group-hover:text-primary",
                )}
              />
            </button>
          );
        })}
      </div>
    </>
  );

  return (
    <aside
      className="bg-surface border-r border-border flex flex-col overflow-hidden"
      style={{ width: "var(--sidebar-w)" }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-3.5 border-b border-border">
        <svg width="20" height="20" viewBox="0 0 22 22" fill="none">
          <polygon
            points="11,2 20,7 20,15 11,20 2,15 2,7"
            stroke="hsl(var(--primary))"
            strokeWidth="1.5"
            fill="none"
          />
          <polygon points="11,6 16,9 16,13 11,16 6,13 6,9" fill="hsl(var(--primary))" opacity="0.3" />
          <circle cx="11" cy="11" r="2" fill="hsl(var(--primary))" />
        </svg>
        <h1 className="font-mono text-[13px] font-semibold tracking-wider text-foreground uppercase">
          TraderBot
        </h1>
      </div>

      {/* Asset list */}
      <nav className="flex-1 overflow-y-auto pb-2">
        {grouped.map((g) => (
          <div key={g.label}>{renderGroup(g.label, g.list)}</div>
        ))}
      </nav>

      {/* Stats */}
      <div className="border-t border-border px-3.5 py-3 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] tracking-wide uppercase text-dim-2">
            Estado bot
          </span>
          <span
            className={cn(
              "font-mono text-[11px] flex items-center gap-1.5",
              isLive ? "text-primary" : "text-dim",
            )}
          >
            <span
              className={cn(
                "w-1.5 h-1.5 rounded-full",
                isLive ? "bg-primary pulse-dot" : "bg-muted-foreground",
              )}
            />
            {isLive ? "LIVE" : "OFF"}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] tracking-wide uppercase text-dim-2">
            Señales hoy
          </span>
          <span className="font-mono text-[11px] text-foreground">
            <span className="text-bull">{signalsToday.buys}C</span>
            <span className="text-dim-2"> / </span>
            <span className="text-bear">{signalsToday.sells}V</span>
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] tracking-wide uppercase text-dim-2">
            Última
          </span>
          <span className="font-mono text-[11px] text-foreground">{lastSignalTime}</span>
        </div>
      </div>
    </aside>
  );
}
