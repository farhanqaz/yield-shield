"use client";

import dynamic from "next/dynamic";

const Dashboard = dynamic(
  () => import("@/components/dashboard").then((mod) => mod.Dashboard),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-[var(--muted)]">
        Loading Yield Shield...
      </div>
    ),
  },
);

export function ClientHome() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <Dashboard />
    </main>
  );
}
