interface SparklineProps {
  data: number[];
  color?: string;
  width?: number;
  height?: number;
  strokeWidth?: number;
  filled?: boolean;
}

/**
 * Lightweight SVG sparkline — no external deps.
 * Pass an array of numbers; auto-normalizes to the viewBox.
 */
export function Sparkline({
  data,
  color = "#22C55E",
  width = 64,
  height = 28,
  strokeWidth = 1.5,
  filled = true,
}: SparklineProps) {
  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const pad = 2;
  const w = width - pad * 2;
  const h = height - pad * 2;

  const points = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * w;
    const y = pad + h - ((v - min) / range) * h;
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  });

  const polyline = points.join(" ");

  // Close path for fill: go to bottom-right, then bottom-left
  const last = points[points.length - 1];
  const first = points[0];
  const lastX = last.split(",")[0];
  const firstX = first.split(",")[0];
  const bottom = (pad + h + 2).toFixed(2);
  const fillPath = `M ${polyline.replace(/,/g, " ").replace(/ /g, " L ").replace("L", "")} L ${lastX},${bottom} L ${firstX},${bottom} Z`.replace("M ", "M ");

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="overflow-visible"
    >
      {filled && (
        <path
          d={`M ${points.join(" L ")} L ${lastX} ${bottom} L ${firstX} ${bottom} Z`}
          fill={color}
          fillOpacity={0.12}
        />
      )}
      <polyline
        points={polyline}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Final dot */}
      <circle
        cx={last.split(",")[0]}
        cy={last.split(",")[1]}
        r="1.8"
        fill={color}
        opacity={0.9}
      />
    </svg>
  );
}

// ─── Per-ticker mock sparkline data (7 data-points, last = current price) ──
export const TICKER_SPARKLINES: Record<string, number[]> = {
  SPY:  [508.2, 510.1, 509.4, 511.8, 510.5, 511.9, 512.34],
  QQQ:  [435.4, 436.8, 435.2, 438.1, 439.5, 440.0, 440.12],
  IWM:  [207.8, 206.4, 207.2, 205.8, 206.1, 205.4, 205.67],
  DIA:  [387.2, 388.6, 389.1, 390.5, 390.0, 391.2, 390.45],
  BTC:  [63100, 64200, 63800, 65000, 64700, 65200, 65432],
  ETH:  [3380,  3410,  3425,  3440,  3448,  3455,  3456.78],
  SOL:  [149.4, 147.1, 146.5, 145.8, 146.2, 145.5, 145.20],
  SUI:  [1.71,  1.74,  1.76,  1.79,  1.82,  1.84,  1.85],
  MSFT: [418.2, 419.1, 418.8, 420.2, 419.9, 420.5, 420.55],
  NVDA: [878.5, 882.1, 884.6, 888.0, 889.5, 890.0, 890.12],
  AVGO: [1328, 1332, 1335, 1338, 1340, 1341, 1340.50],
};
