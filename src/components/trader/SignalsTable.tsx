import { useMemo } from "react";
import type { SignalDoc } from "@/hooks/useSignals";
import type { Bar } from "@/hooks/useBars";
import { cn } from "@/lib/utils";
import { Circle } from "lucide-react";

interface SignalsTableProps {
  signals: SignalDoc[];
  bars: Bar[];
  loading: boolean;
  error: string | null;
}

export function SignalsTable({ signals, bars, loading, error }: SignalsTableProps) {
  const rows = useMemo(() => {
    return [...signals].sort((a, b) => b.dateMs - a.dateMs);
  }, [signals]);

  return (
    <section
      className="border-t border-border bg-surface flex flex-col overflow-hidden"
      style={{ height: "var(--signals-h)" }}
    >
      <header className="flex items-center gap-3 px-5 py-2.5 border-b border-border flex-shrink-0">
        <span className="font-mono text-[10px] font-semibold tracking-[0.12em] uppercase text-dim">
          Historial de señales
        </span>
        <span className="flex items-center gap-1.5 text-[10px] font-mono tracking-wide rounded-full px-2 py-0.5"
          style={{
            color: "#ff6d00",
            background: "rgba(255,109,0,0.08)",
            border: "1px solid rgba(255,109,0,0.18)",
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#ff6d00" }} />
          Firebase Realtime
        </span>
        {loading && <span className="font-mono text-[10px] text-dim-2">cargando…</span>}
      </header>

      <div className="overflow-auto flex-1">
        <table className="w-full min-w-[640px] font-mono text-[11px] border-collapse">
          <thead className="sticky top-0 bg-surface z-[1]">
            <tr>
              {["Fecha", "Hora", "Señal", "Precio", "B. Sup", "B. Media", "B. Inf", "Tendencia"].map((h) => (
                <th
                  key={h}
                  className="text-left text-dim-2 text-[9px] font-semibold tracking-[0.12em] uppercase px-3.5 py-1.5 border-b border-border"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {error && (
              <tr>
                <td colSpan={8} className="text-center py-5 text-bear text-[10px] tracking-wide">
                  Error Firebase: {error}
                </td>
              </tr>
            )}
            {!error && rows.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center py-5 text-dim-2 text-[10px] tracking-wide">
                  {loading ? "Conectando a Firebase…" : "Sin señales para este activo"}
                </td>
              </tr>
            )}
            {rows.map((d) => {
              const t = d.timestamp;
              const fecha = t.length >= 8 ? `${t.substring(6, 8)}/${t.substring(4, 6)}/${t.substring(0, 4)}` : "—";
              const hora = t.split("_")[1] ?? "—";
              const formattedHora = hora.length === 4 ? `${hora.substring(0, 2)}:${hora.substring(2, 4)}` : hora;

              const señal = d.señal ?? "ESPERAR";
              const señalColor =
                señal === "COMPRAR" ? "text-bull" : señal === "VENDER" ? "text-bear" : "text-dim-2";
              const señalText =
                señal === "COMPRAR" ? "▲ COMPRAR" : señal === "VENDER" ? "▼ VENDER" : "— ESPERAR";

              const bar = bars.find((b) => Math.abs(new Date(b.t).getTime() - d.dateMs) < 60_000);
              const precio = bar ? `$${bar.c.toFixed(2)}` : "—";

              const bSup = parseFloat(String(d.banda_superior));
              const bMed = parseFloat(String(d.banda_media));
              const bInf = parseFloat(String(d.banda_inferior));
              const fmt = (n: number) => (isNaN(n) ? "—" : `$${n.toFixed(2)}`);

              const tendencia =
                señal === "COMPRAR" ? (
                  <span className="text-bull flex items-center gap-1.5">
                    <Circle className="h-2 w-2 fill-current" /> Alcista
                  </span>
                ) : señal === "VENDER" ? (
                  <span className="text-bear flex items-center gap-1.5">
                    <Circle className="h-2 w-2 fill-current" /> Bajista
                  </span>
                ) : (
                  <span className="text-dim flex items-center gap-1.5">
                    <Circle className="h-2 w-2 fill-current" /> Neutral
                  </span>
                );

              return (
                <tr key={d.id} className="hover:bg-surface-2 transition-colors">
                  <td className="px-3.5 py-1.5 text-dim border-b border-border whitespace-nowrap">{fecha}</td>
                  <td className="px-3.5 py-1.5 text-dim border-b border-border whitespace-nowrap">{formattedHora}</td>
                  <td className={cn("px-3.5 py-1.5 border-b border-border whitespace-nowrap font-semibold", señalColor)}>
                    {señalText}
                  </td>
                  <td className="px-3.5 py-1.5 text-foreground border-b border-border whitespace-nowrap">{precio}</td>
                  <td className="px-3.5 py-1.5 text-bear border-b border-border whitespace-nowrap">{fmt(bSup)}</td>
                  <td className="px-3.5 py-1.5 border-b border-border whitespace-nowrap" style={{ color: "#48b8ff" }}>{fmt(bMed)}</td>
                  <td className="px-3.5 py-1.5 text-bull border-b border-border whitespace-nowrap">{fmt(bInf)}</td>
                  <td className="px-3.5 py-1.5 border-b border-border whitespace-nowrap">{tendencia}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
