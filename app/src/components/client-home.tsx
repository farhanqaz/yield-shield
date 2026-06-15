"use client";

import dynamic from "next/dynamic";

const Dashboard = dynamic(
  () => import("@/components/dashboard").then((mod) => mod.Dashboard),
  {
    ssr: false,
    loading: () => (
      <div className="app-bg flex min-h-screen items-center justify-center">
        <div className="skeleton h-8 w-48" />
      </div>
    ),
  },
);

export function ClientHome() {
  return <Dashboard />;
}
