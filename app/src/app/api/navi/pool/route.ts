import {
  fetchNaviSuiPool,
  naviSupplyApyPercent,
  naviUtilizationBps,
} from "@/lib/navi-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const pool = await fetchNaviSuiPool();
    return Response.json({
      apyPercent: naviSupplyApyPercent(pool),
      utilizationBps: naviUtilizationBps(pool),
      priceUsd: Number(pool.oracle?.price ?? 0),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "pool fetch failed";
    return Response.json({ error: message }, { status: 503 });
  }
}
