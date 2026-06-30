import type { CSSProperties } from "react";

export type ActivityRingsProps = {
  mobility?: number;
  strength?: number;
  conditioning?: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
};

const clamp = (value: number) => Math.max(0, Math.min(1, value));

export function ActivityRings({
  mobility = 0.72,
  strength = 0.58,
  conditioning = 0.46,
  size = 200,
  strokeWidth = 12,
  className = "",
}: ActivityRingsProps) {
  const rings = [
    { key: "mobility", value: mobility, color: "#00D1FF" },
    { key: "strength", value: strength, color: "#CCFF00" },
    { key: "conditioning", value: conditioning, color: "#8B5CF6" },
  ];

  const center = size / 2;
  const gap = 8;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={`transform-gpu ${className}`}
      style={{
        filter: "drop-shadow(0 0 20px rgba(0, 211, 255, 0.18)) drop-shadow(0 0 18px rgba(204, 255, 0, 0.14))" as CSSProperties["filter"],
      }}
    >
      <defs>
        <filter id="ringGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3.5" result="blur" />
          <feColorMatrix
            in="blur"
            type="matrix"
            values="1 0 0 0 0
                    0 1 0 0 0
                    0 0 1 0 0
                    0 0 0 10 -3"
          />
        </filter>
      </defs>
      {rings.map((ring, index) => {
        const radius = center - strokeWidth / 2 - index * (strokeWidth + gap);
        const circumference = 2 * Math.PI * radius;
        const progress = clamp(ring.value);
        const dashOffset = circumference * (1 - progress);

        return (
          <g key={ring.key}>
            <circle
              cx={center}
              cy={center}
              r={radius}
              stroke="rgba(255,255,255,0.06)"
              strokeWidth={strokeWidth}
              fill="none"
            />
            <circle
              cx={center}
              cy={center}
              r={radius}
              stroke={ring.color}
              strokeWidth={strokeWidth}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              transform={`rotate(-90 ${center} ${center})`}
              filter="url(#ringGlow)"
              style={{ filter: `drop-shadow(0 0 8px ${ring.color})` }}
            />
          </g>
        );
      })}
    </svg>
  );
}
