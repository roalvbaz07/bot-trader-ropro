import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { parseFirestoreTs } from "@/lib/assets";

export type SignalType = "COMPRAR" | "VENDER" | "ESPERAR";

export interface SignalDoc {
  id: string;
  activo: string;
  señal: SignalType;
  rsi?: number | string;
  macd?: number | string;
  timestamp: string; // "YYYYMMDD_HHMM"
  dateIso: string;   // derived
  dateMs: number;    // derived
}

export function useSignals(symbol: string) {
  const [signals, setSignals] = useState<SignalDoc[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setSignals([]);

    const q = query(collection(db, "señales"), where("activo", "==", symbol));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const docs: SignalDoc[] = [];
        snap.forEach((d) => {
          const raw = d.data() as Record<string, unknown>;
          const ts = String(raw.timestamp ?? "");
          const dateIso = parseFirestoreTs(ts);
          docs.push({
            id: d.id,
            activo: String(raw.activo ?? symbol),
            señal: (raw["señal"] as SignalType) ?? "ESPERAR",
            rsi: raw.rsi as number | string | undefined,
            macd: raw.macd as number | string | undefined,
            timestamp: ts,
            dateIso,
            dateMs: new Date(dateIso).getTime(),
          });
        });
        docs.sort((a, b) => a.dateMs - b.dateMs);
        setSignals(docs);
        setLoading(false);
      },
      (err) => {
        console.error("Firebase error:", err);
        setError(err.message);
        setLoading(false);
      },
    );

    return () => unsub();
  }, [symbol]);

  return { signals, error, loading };
}
