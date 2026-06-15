import { fetchNaviSuiSupplyMist } from "@/lib/navi-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const address = new URL(req.url).searchParams.get("address");
  if (!address) {
    return Response.json({ error: "address required" }, { status: 400 });
  }

  try {
    const supplyMist = await fetchNaviSuiSupplyMist(address);
    return Response.json({ supplyMist: supplyMist.toString() });
  } catch (e) {
    const message = e instanceof Error ? e.message : "supply fetch failed";
    return Response.json({ error: message }, { status: 503 });
  }
}
