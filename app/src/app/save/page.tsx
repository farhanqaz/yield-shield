import { redirect } from "next/navigation";

type Props = {
  searchParams: Promise<{ amount?: string; vault?: string }>;
};

/** Payment links redirect to home with amount + optional vault split %. */
export default async function SavePage({ searchParams }: Props) {
  const params = await searchParams;
  const amount = params.amount ?? "0.5";
  const vault = params.vault;
  const qs = new URLSearchParams({ amount });
  if (vault) qs.set("vault", vault);
  redirect(`/?${qs.toString()}`);
}
