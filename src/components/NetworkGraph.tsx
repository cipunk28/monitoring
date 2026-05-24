import { Activity, ArrowDown, ArrowUp } from "lucide-react";

interface NetworkGraphProps {
  history: Array<{ time: string; tx: number; rx: number }>;
  currentTx: number;
  currentRx: number;
}

export default function NetworkGraph({ history = [], currentTx = 0, currentRx = 0 }: NetworkGraphProps) {
  // Determine safe coordinate bounds
  const maxVal = Math.max(...history.map(d => Math.max(d.tx, d.rx, 50)), 150);
  const width = 1000;
  const height = 260;
  const paddingLeft = 40;
  const paddingRight = 10;
  const paddingTop = 20;
  const paddingBottom = 30;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // Convert points to SVG coords
  const pointsTx = history.map((d, index) => {
    if (history.length === 1) return { x: paddingLeft, y: height - paddingBottom };
    const x = paddingLeft + (index / (history.length - 1)) * chartWidth;
    const y = height - paddingBottom - (d.tx / maxVal) * chartHeight;
    return { x, y };
  });

  const pointsRx = history.map((d, index) => {
    if (history.length === 1) return { x: paddingLeft, y: height - paddingBottom };
    const x = paddingLeft + (index / (history.length - 1)) * chartWidth;
    const y = height - paddingBottom - (d.rx / maxVal) * chartHeight;
    return { x, y };
  });

  const generatePath = (points: Array<{ x: number; y: number }>) => {
    if (points.length === 0) return "";
    return `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(" ");
  };

  const generateAreaPath = (points: Array<{ x: number; y: number }>) => {
    if (points.length === 0) return "";
    const startX = points[0].x;
    const endX = points[points.length - 1].x;
    const baselineY = height - paddingBottom;
    return `${generatePath(points)} L ${endX} ${baselineY} L ${startX} ${baselineY} Z`;
  };

  // Helper lines (horizontal grid)
  const gridLines = [0, 0.25, 0.5, 0.75, 1];

  return (
    <div className="glass-panel p-5 rounded-xl border border-slate-800 shadow-lg glow-cyan relative overflow-hidden">
      {/* Background cyber grid style */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-15 pointer-events-none"></div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 relative z-10">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-cyan-950/70 border border-cyan-800/50 rounded-lg text-cyan-400">
            <Activity className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-100 tracking-wide uppercase">
              Grafik Bandwidth Utama (Surabaya Core NOC)
            </h2>
            <p className="text-xs text-slate-400">
              Live updates via WebSockets (Polling 4s interval)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping"></span>
            <div className="flex items-center text-cyan-400 text-sm font-semibold select-none">
              <ArrowUp className="w-4 h-4 mr-1 stroke-[2.5]" />
              <span className="font-mono text-base">{currentTx.toFixed(1)}</span>
              <span className="text-xs opacity-80 ml-0.5">Mbps</span>
            </div>
            <span className="text-xs text-slate-400 font-medium">Tx (Upload)</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
            <div className="flex items-center text-emerald-400 text-sm font-semibold select-none">
              <ArrowDown className="w-4 h-4 mr-1 stroke-[2.5]" />
              <span className="font-mono text-base">{currentRx.toFixed(1)}</span>
              <span className="text-xs opacity-80 ml-0.5">Mbps</span>
            </div>
            <span className="text-xs text-slate-400 font-medium font-sans">Rx (Download)</span>
          </div>
        </div>
      </div>

      {/* SVG Canvas Chart */}
      <div className="relative w-full overflow-x-auto select-none">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto min-w-[750px] overflow-visible"
        >
          <defs>
            <linearGradient id="txGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="rxGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#34d399" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#34d399" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines & Labels */}
          {gridLines.map((ratio, index) => {
            const y = height - paddingBottom - ratio * chartHeight;
            const val = Math.round(ratio * maxVal);
            return (
              <g key={index} className="opacity-40">
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={width - paddingRight}
                  y2={y}
                  stroke="#334155"
                  strokeWidth="0.8"
                  strokeDasharray="4 4"
                />
                <text
                  x={paddingLeft - 8}
                  y={y + 4}
                  fill="#94a3b8"
                  fontSize="10"
                  fontFamily="monospace"
                  textAnchor="end"
                >
                  {val}
                </text>
              </g>
            );
          })}

          {/* Area beneath Tx */}
          {history.length > 0 && (
            <path
              d={generateAreaPath(pointsTx)}
              fill="url(#txGradient)"
              className="transition-all duration-1000 ease-out"
            />
          )}

          {/* Area beneath Rx */}
          {history.length > 0 && (
            <path
              d={generateAreaPath(pointsRx)}
              fill="url(#rxGradient)"
              className="transition-all duration-1000 ease-out"
            />
          )}

          {/* Lines */}
          {history.length > 0 && (
            <path
              d={generatePath(pointsTx)}
              fill="none"
              stroke="#22d3ee"
              strokeWidth="2.5"
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />
          )}

          {history.length > 0 && (
            <path
              d={generatePath(pointsRx)}
              fill="none"
              stroke="#34d399"
              strokeWidth="2.5"
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />
          )}

          {/* Time ticks for bottom axis */}
          {history.map((d, index) => {
            if (index % 3 !== 0) return null; // reduce label clutter
            const x = paddingLeft + (index / (history.length - 1)) * chartWidth;
            return (
              <text
                key={index}
                x={x}
                y={height - 8}
                fill="#64748b"
                fontSize="9"
                fontFamily="monospace"
                textAnchor="middle"
              >
                {d.time}
              </text>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
