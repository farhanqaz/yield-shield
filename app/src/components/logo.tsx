export function Logo({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <rect width="32" height="32" rx="8" fill="url(#shield-grad)" />
      <path
        d="M16 6L24 10V16C24 21 20.5 24.5 16 26C11.5 24.5 8 21 8 16V10L16 6Z"
        stroke="white"
        strokeWidth="1.5"
        strokeLinejoin="round"
        fill="rgba(255,255,255,0.12)"
      />
      <path
        d="M13 16L15 18L19 14"
        stroke="#34d399"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <defs>
        <linearGradient id="shield-grad" x1="0" y1="0" x2="32" y2="32">
          <stop stopColor="#0f172a" />
          <stop offset="1" stopColor="#1e3a5f" />
        </linearGradient>
      </defs>
    </svg>
  );
}
