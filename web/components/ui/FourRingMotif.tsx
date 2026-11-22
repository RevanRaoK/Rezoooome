import { useId } from "react";

export function FourRingMotif() {
  const uid = useId().replace(/:/g, "");
  const inkGrad = `${uid}-ring-ink`;
  const orangeGrad = `${uid}-ring-orange`;

  return (
    <div aria-hidden="true" className="flex gap-1.5">
      {[0, 1, 2, 3].map((idx) => (
        <svg
          key={idx}
          aria-hidden="true"
          width="36"
          height="36"
          viewBox="0 0 40 40"
          className="block flex-none overflow-visible drop-shadow-[0_2px_2px_rgba(80,50,30,0.28)]"
        >
          <defs>
            {idx < 3 ? (
              <linearGradient id={`${inkGrad}-${idx}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#3A3835" />
                <stop offset="1" stopColor="#1C1B19" />
              </linearGradient>
            ) : (
              <linearGradient id={orangeGrad} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#FF8A47" />
                <stop offset="1" stopColor="#F26B1D" />
              </linearGradient>
            )}
          </defs>
          <circle
            cx="20"
            cy="20"
            r="17"
            fill="none"
            stroke={`url(#${idx < 3 ? `${inkGrad}-${idx}` : orangeGrad})`}
            strokeWidth="6"
          />
          <circle
            cx="20"
            cy="20"
            r="17"
            fill="none"
            stroke="rgba(255,255,255,0.35)"
            strokeWidth="1"
            strokeDasharray="20 200"
            transform="rotate(-150 20 20)"
          />
        </svg>
      ))}
    </div>
  );
}
