// Edge function: proxy seguro a Alpaca Markets para obtener velas (bars).
// Las claves APCA_API_KEY_ID / APCA_API_SECRET_KEY se guardan como secrets.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ALLOWED_TF = new Set(["1Min", "5Min", "15Min", "1Hour", "1Day"]);
const ALLOWED_SYMBOL = /^[A-Z.\-]{1,8}$/;

interface ReqBody {
  symbol?: string;
  timeframe?: string;
  limit?: number;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const KEY = Deno.env.get("APCA_API_KEY_ID");
    const SECRET = Deno.env.get("APCA_API_SECRET_KEY");
    if (!KEY || !SECRET) {
      return new Response(
        JSON.stringify({ error: "Alpaca credentials not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    let body: ReqBody = {};
    if (req.method === "POST") {
      try {
        body = await req.json();
      } catch {
        body = {};
      }
    }
    const url = new URL(req.url);
    const symbol = (body.symbol ?? url.searchParams.get("symbol") ?? "").toUpperCase();
    const timeframe = body.timeframe ?? url.searchParams.get("timeframe") ?? "1Min";
    const limitRaw = body.limit ?? Number(url.searchParams.get("limit") ?? 200);
    const limit = Math.max(1, Math.min(1000, Number(limitRaw) || 200));

    if (!ALLOWED_SYMBOL.test(symbol)) {
      return new Response(JSON.stringify({ error: "Invalid symbol" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!ALLOWED_TF.has(timeframe)) {
      return new Response(JSON.stringify({ error: "Invalid timeframe" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Calcular rango de fechas según timeframe (Alpaca free/IEX requiere start)
    // El feed IEX gratuito tiene un retraso de ~15 min, así que usamos `end` = ahora - 16min
    const tfDays: Record<string, number> = {
      "1Min": 5,
      "5Min": 15,
      "15Min": 30,
      "1Hour": 90,
      "1Day": 365 * 2,
    };
    const daysBack = tfDays[timeframe] ?? 30;
    const end = new Date(Date.now() - 16 * 60 * 1000).toISOString();
    const start = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString();

    const target = `https://data.alpaca.markets/v2/stocks/${encodeURIComponent(symbol)}/bars?timeframe=${encodeURIComponent(timeframe)}&limit=${limit}&feed=iex&start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}&adjustment=raw&sort=asc`;

    const upstream = await fetch(target, {
      headers: {
        "APCA-API-KEY-ID": KEY,
        "APCA-API-SECRET-KEY": SECRET,
      },
    });

    if (!upstream.ok) {
      const text = await upstream.text();
      console.error("Alpaca upstream error", upstream.status, text);
      return new Response(
        JSON.stringify({ error: `Alpaca ${upstream.status}`, details: text.slice(0, 400) }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const data = await upstream.json();
    return new Response(JSON.stringify({ bars: data.bars ?? [], symbol, timeframe }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("alpaca-bars error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
