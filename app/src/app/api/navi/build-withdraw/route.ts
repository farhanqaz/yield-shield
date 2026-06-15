import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";
import { buildNaviWithdrawTx } from "@/lib/navi-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      amountMist: string;
      sender: string;
    };
    const tx = await buildNaviWithdrawTx(
      BigInt(body.amountMist),
      body.sender,
    );
    const client = new SuiClient({ url: getFullnodeUrl("mainnet") });
    const txBytes = await tx.build({ client });
    return Response.json({
      txBytes: Buffer.from(txBytes).toString("base64"),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "build failed";
    return Response.json({ error: message }, { status: 400 });
  }
}
