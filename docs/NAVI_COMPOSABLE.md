# NAVI Composable PTB (mainnet)

NAVI lending is **mainnet-only**. Yield Shield vault runs on testnet for hackathon demo; this doc shows the composable earn pattern for mainnet deploy (full prize payout path).

## Pattern

One PTB atomically:

1. Split incoming SUI
2. `depositCoinPTB` → NAVI lending pool (~70%)
3. `vault::deposit` → Yield Shield vault (~30% guard buffer)

```typescript
import { depositCoinPTB } from "@naviprotocol/lending";
import { Transaction } from "@mysten/sui/transactions";

export async function buildComposableEarnTx(
  totalMist: bigint,
  sender: string,
  packageId: string,
  vaultId: string,
  coinType = "0x2::sui::SUI",
) {
  const naviAmount = (totalMist * 7000n) / 10000n;
  const vaultAmount = totalMist - naviAmount;

  const tx = new Transaction();
  const [coin] = tx.splitCoins(tx.gas, [totalMist]);
  const [naviCoin, vaultCoin] = tx.splitCoins(coin, [naviAmount, vaultAmount]);

  await depositCoinPTB(tx, coinType, naviCoin, {
    amount: Number(naviAmount),
    env: "prod",
  });

  const [receipt] = tx.moveCall({
    target: `${packageId}::vault::deposit`,
    typeArguments: [coinType],
    arguments: [tx.object(vaultId), vaultCoin],
  });
  tx.transferObjects([receipt], sender);

  return tx;
}
```

SDK: [@naviprotocol/lending](https://sdk.naviprotocol.io/lending/pool)
