"use client";

import dynamic from "next/dynamic";

const SaveFlow = dynamic(
  () => import("@/components/save-flow").then((m) => m.SaveFlow),
  {
    ssr: false,
    loading: () => (
      <div className="app-bg flex min-h-screen items-center justify-center">
        <div className="skeleton h-8 w-48" />
      </div>
    ),
  },
);

export default function SavePage() {
  return <SaveFlow />;
}
