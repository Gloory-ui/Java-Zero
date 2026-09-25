/** Знак Java-Zero: кружка с паром и «;» на боку. Тот же рисунок, что в app/icon.svg. */
export function BrandMark({ size, className }: { size: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      aria-hidden="true"
      className={className}
      style={{ display: "block" }}
    >
      <rect width="64" height="64" rx="14" fill="#e11d48" />
      <rect x="13" y="21" width="28" height="31" rx="9" fill="#fff" />
      <path d="M41 28h3a6.5 6.5 0 0 1 0 13h-3" fill="none" stroke="#fff" strokeWidth="5" />
      <circle cx="27" cy="30.5" r="3.8" fill="#e11d48" />
      <circle cx="27" cy="41.5" r="3.8" fill="#e11d48" />
      <path d="M30.5 42.5q0 5.5-5 7.5" fill="none" stroke="#e11d48" strokeWidth="3" strokeLinecap="round" />
      <path d="M21 15q3-3 0-6M32 15q3-3 0-6" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" />
    </svg>
  );
}
