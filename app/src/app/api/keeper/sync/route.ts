import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";
import { decodeSuiPrivateKey } from "@mysten/sui/cryptography";
import { CONFIG } from "@/lib/config";
import { fetchSuiUsdPrice, volatilityBpsFromPrices } from "@/lib/pyth";
import { buildSyncPythMetricsTx } from "@/lib/transactions";
import { fetchNaviSuiPool, naviUtilizationBps } from "@/lib/navi-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Rolling reference price for volatility (in-memory per serverless instance). */
let refPriceUsd: number | null = null;

function loadKeeperKeypair(): Ed25519Keypair | null {
  const raw = process.env.KEEPER_PRIVATE_KEY?.trim();
  if (!raw) return null;
  try {
    if (raw.startsWith("suiprivkey")) {
      const { secretKey } = decodeSuiPrivateKey(raw);
      return Ed25519Keypair.fromSecretKey(secretKey);
    }
    const bytes = Uint8Array.from(
      Buffer.from(raw.replace(/^0x/, ""), "hex"),
    );
    return Ed25519Keypair.fromSecretKey(bytes);
  } catch {
    return null;
  }
}

function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  const auth = req.headers.get("authorization");
  if (auth === `Bearer ${secret}`) return true;
  // Local dev: browser poll via useShieldKeeper (no secret in client bundle)
  if (process.env.NODE_ENV === "development") return true;
  return false;
}

async function syncShieldScore(): Promise<{
  digest: string;
  volatilityBps: number;
  utilizationBps: number;
  priceUsd: number;
}> {
  if (!CONFIG.adminCapId || !CONFIG.vaultId || !CONFIG.packageId) {
    throw new Error("Vault contract IDs not configured");
  }

  const kp = loadKeeperKeypair();
  if (!kp) throw new Error("KEEPER_PRIVATE_KEY not set");

  const network = CONFIG.network === "mainnet" ? "mainnet" : "testnet";
  const client = new SuiClient({ url: getFullnodeUrl(network) });

  const { priceUsd } = await fetchSuiUsdPrice();
  if (refPriceUsd == null) {
    const fromEnv = process.env.KEEPER_PYTH_REF_USD;
    refPriceUsd = fromEnv ? parseFloat(fromEnv) : priceUsd;
  }

  const volatilityBps = volatilityBpsFromPrices(priceUsd, refPriceUsd);
  refPriceUsd = priceUsd;

  let utilizationBps = 2000;
  let healthBufferBps = 8000;

  if (CONFIG.network === "mainnet" && CONFIG.enableNavi) {
    try {
      const pool = await fetchNaviSuiPool();
      utilizationBps = naviUtilizationBps(pool);
      const apy = Number(pool.supplyIncentiveApyInfo?.apy ?? 0);
      healthBufferBps = Math.min(10_000, Math.floor(5000 + apy * 500));
    } catch {
      /* fallback defaults */
    }
  }

  const tx = buildSyncPythMetricsTx(volatilityBps, utilizationBps, healthBufferBps);
  const sender = kp.getPublicKey().toSuiAddress();
  tx.setSender(sender);

  const result = await client.signAndExecuteTransaction({
    signer: kp,
    transaction: tx,
    options: { showEffects: true },
  });

  if (result.effects?.status?.status !== "success") {
    throw new Error(result.effects?.status?.error ?? "Keeper tx failed");
  }

  return {
    digest: result.digest,
    volatilityBps,
    utilizationBps,
    priceUsd,
  };
}

export async function POST(req: Request) {
  if (!authorized(req)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const body = await syncShieldScore();
    return Response.json({ ok: true, ...body });
  } catch (e) {
    const message = e instanceof Error ? e.message : "sync failed";
    return Response.json({ ok: false, error: message }, { status: 503 });
  }
}

export async function GET(req: Request) {
  return POST(req);
}
