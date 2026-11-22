type ScoreGaugePuckProps = {
  score?: number;
  size?: number;
  fontSizeClass?: string;
};

export function ScoreGaugePuck({
  score = 78,
  size = 76,
  fontSizeClass = "text-[24px]",
}: ScoreGaugePuckProps) {
  const clamped = Math.max(0, Math.min(100, score));
  const arcMain = (clamped / 100) * 314.2;
  const arcHighlight = (clamped / 100) * 329.9;

  return (
    <div
      className="gauge-puck relative flex-none"
      style={{ width: `${size}px`, height: `${size}px` }}
    >
      <svg aria-hidden="true" width={size} height={size} viewBox="0 0 120 120" className="block">
        <circle cx="60" cy="60" r="50" fill="none" stroke="#E6E2DC" strokeWidth="10" />
        <circle cx="60" cy="60" r="46" fill="none" stroke="rgba(80,60,45,0.08)" strokeWidth="1.5" />
        <circle
          cx="60"
          cy="60"
          r="50"
          fill="none"
          stroke="#F26B1D"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${arcMain.toFixed(1)} 314.2`}
          transform="rotate(-90 60 60)"
          style={{ filter: "drop-shadow(0 1px 1.5px rgba(150,60,10,0.45))" }}
        />
        <circle
          cx="60"
          cy="60"
          r="52.5"
          fill="none"
          stroke="rgba(255,255,255,0.55)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeDasharray={`${arcHighlight.toFixed(1)} 329.9`}
          transform="rotate(-90 60 60)"
        />
      </svg>
      <div
        className={`tabular-nums absolute inset-0 flex items-center justify-center font-extrabold tracking-[-0.03em] text-[var(--ink)] ${fontSizeClass}`}
      >
        {clamped}
      </div>
    </div>
  );
}
