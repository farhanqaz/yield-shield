"use client";

import dynamic from "next/dynamic";

const SaveFlow = dynamic(
  () => import("@/components/save-flow").then((m) => m.SaveFlow),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-[var(--muted)]">
        Loading…
      </div>
    ),
  },
);

export default function SavePage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <SaveFlow />
    </main>
  );
}
