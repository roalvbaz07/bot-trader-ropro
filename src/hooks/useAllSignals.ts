import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface Stats {
  buys: number;
  sells: number;
  lastTime: string;
}

export function useAllSignalsStats() {
  const [stats, setStats] = useState<Stats>({ buys: 0, sells: 0, lastTime: "—" });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "signals"),
      (snap) => {
        const today = new Date();
        const todayKey = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, "0")}${String(today.getDate()).padStart(2, "0")}`;
        let buys = 0;
        let sells = 0;
        let lastTs = "";
        snap.forEach((d) => {
          const raw = d.data() as Record<string, unknown>;
          const ts = String(raw.timestamp ?? "");
          const sig = String(raw["señal"] ?? "");
          if (ts.startsWith(todayKey)) {
            if (sig === "COMPRAR") buys++;
            else if (sig === "VENDER") sells++;
          }
          if (sig !== "ESPERAR" && ts > lastTs) {
            lastTs = ts;
          }
        });
        let lastTime = "—";
        if (lastTs) {
          const h = lastTs.split("_")[1] ?? "";
          lastTime = h.length === 4 ? `${h.substring(0, 2)}:${h.substring(2, 4)}` : "—";
        }
        setStats({ buys, sells, lastTime });
      },
      (err) => {
        console.error("Firebase global signals error:", err);
        setError(err.message);
      },
    );
    return () => unsub();
  }, []);

  return { stats, error };
}
