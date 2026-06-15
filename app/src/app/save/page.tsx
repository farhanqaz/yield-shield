import { redirect } from "next/navigation";

type Props = {
  searchParams: Promise<{ amount?: string }>;
};

/** Payment links land here, then redirect to home with ?amount= */
export default async function SavePage({ searchParams }: Props) {
  const params = await searchParams;
  const amount = params.amount ?? "0.5";
  redirect(`/?amount=${encodeURIComponent(amount)}`);
}
