"use client";

const TOP_Y = 7;
const BOTTOM_Y = 95;

function Silhouette(props: React.SVGProps<SVGGElement>) {
  return (
    <g {...props}>
      <circle cx="19" cy="82" r="13" />
      <circle cx="41" cy="82" r="13" />
      <rect x="19" y="22" width="22" height="62" />
      <ellipse cx="30" cy="22" rx="14" ry="15" />
    </g>
  );
}

export function PeneGlass({ ratio }: { ratio: number }) {
  const clamped = Math.max(0, Math.min(1, ratio));
  const fillHeight = (BOTTOM_Y - TOP_Y) * clamped;
  const fillY = BOTTOM_Y - fillHeight;

  return (
    <svg viewBox="0 0 60 100" width="100%" height="100%" aria-hidden="true">
      <defs>
        <clipPath id="pene-clip">
          <circle cx="19" cy="82" r="13" />
          <circle cx="41" cy="82" r="13" />
          <rect x="19" y="22" width="22" height="62" />
          <ellipse cx="30" cy="22" rx="14" ry="15" />
        </clipPath>
      </defs>

      <Silhouette fill="#3a3c3e" stroke="#3a3c3e" strokeWidth="4" />
      <Silhouette fill="#0f1011" />

      <g clipPath="url(#pene-clip)">
        <rect x="0" y={fillY} width="60" height={fillHeight} fill="#f7f5ee" />
        {clamped > 0 && (
          <rect x="0" y={fillY} width="60" height={3} fill="#ffffff" opacity="0.9" />
        )}
        <path
          d="M17 29 Q30 35 43 29"
          fill="none"
          stroke="#3a3c3e"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path d="M30 9 V14" stroke="#3a3c3e" strokeWidth="2" strokeLinecap="round" />
        <path d="M30 86 V95" stroke="#3a3c3e" strokeWidth="1.5" strokeLinecap="round" />
      </g>
    </svg>
  );
}
