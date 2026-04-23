import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Timeframe } from "@/lib/assets";

export interface Bar {
  t: string; // ISO timestamp from Alpaca
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
}

export function useBars(symbol: string, tf: Timeframe, limit: number) {
  const [bars, setBars] = useState<Bar[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const { data, error: fnErr } = await supabase.functions.invoke("alpaca-bars", {
          body: { symbol, timeframe: tf, limit },
        });
        if (fnErr) throw fnErr;
        if (cancelled) return;
        const list = (data?.bars ?? []) as Bar[];
        setBars(list);
      } catch (e: unknown) {
        if (cancelled) return;
        const msg = e instanceof Error ? e.message : "Error desconocido";
        console.error("alpaca-bars error:", e);
        setError(msg);
        setBars([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [symbol, tf, limit]);

  return { bars, loading, error };
}
