"use client";

export type HistoryPoint = { day: number; liters: number };
export type HistorySeries = { current: HistoryPoint[]; previous: HistoryPoint[] };

const AXIS_MAX_DAY = 31;

export function HistoryChart({ data }: { data: HistorySeries | null }) {
  if (data === null) {
    return <p className="chart-empty">Cargando…</p>;
  }

  const currentTotal = data.current.reduce((sum, d) => sum + d.liters, 0);
  const previousTotal = data.previous.reduce((sum, d) => sum + d.liters, 0);

  if (currentTotal === 0 && previousTotal === 0) {
    return <p className="chart-empty">Sin datos todavía</p>;
  }

  const width = 280;
  const height = 130;
  const marginLeft = 30;
  const marginRight = 8;
  const marginTop = 14;
  const marginBottom = 18;
  const plotWidth = width - marginLeft - marginRight;
  const plotHeight = height - marginTop - marginBottom;

  const maxLiters = Math.max(
    ...data.current.map((d) => d.liters),
    ...data.previous.map((d) => d.liters),
    0.01
  );
  const midLiters = maxLiters / 2;

  const xFor = (day: number) =>
    marginLeft + ((day - 1) / (AXIS_MAX_DAY - 1)) * plotWidth;
  const yFor = (liters: number) =>
    marginTop + plotHeight - (liters / maxLiters) * plotHeight;

  const toPoints = (series: HistoryPoint[]) =>
    series.map((d) => `${xFor(d.day).toFixed(1)},${yFor(d.liters).toFixed(1)}`).join(" ");

  const currentPoints = toPoints(data.current);
  const previousPoints = toPoints(data.previous);
  const showPrevious = previousTotal > 0;

  const peakCurrent = data.current.reduce(
    (best, d) => (!best || d.liters > best.liters ? d : best),
    null as HistoryPoint | null
  );

  return (
    <div className="chart-container">
      {showPrevious && (
        <div className="chart-legend">
          <span className="chart-legend-item">
            <span className="chart-swatch chart-swatch-current" />
            Este mes
          </span>
          <span className="chart-legend-item">
            <span className="chart-swatch chart-swatch-previous" />
            Mes anterior
          </span>
        </div>
      )}
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="100%">
        {[0, midLiters, maxLiters].map((v, i) => (
          <g key={i}>
            <line
              x1={marginLeft}
              y1={yFor(v)}
              x2={width - marginRight}
              y2={yFor(v)}
              stroke="#2a2c2e"
              strokeWidth="1"
            />
            <text x={marginLeft - 5} y={yFor(v) + 3} fontSize="8" fill="#888" textAnchor="end">
              {v.toFixed(1)}
            </text>
          </g>
        ))}

        <text x={xFor(1)} y={height - 3} fontSize="8" fill="#888" textAnchor="start">
          día 1
        </text>
        <text x={xFor(AXIS_MAX_DAY)} y={height - 3} fontSize="8" fill="#888" textAnchor="end">
          día 31
        </text>

        {showPrevious && (
          <polyline
            points={previousPoints}
            fill="none"
            stroke="#ef5b25"
            strokeWidth="2"
            strokeDasharray="4 3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        <polyline
          points={currentPoints}
          fill="none"
          stroke="#f2b705"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {peakCurrent && peakCurrent.liters > 0 && (
          <>
            <circle cx={xFor(peakCurrent.day)} cy={yFor(peakCurrent.liters)} r="3.5" fill="#f2b705" />
            {(() => {
              const peakX = xFor(peakCurrent.day);
              const peakY = yFor(peakCurrent.liters);
              const labelText = `${peakCurrent.liters.toFixed(2)}L (día ${peakCurrent.day})`;
              const nearLeftEdge = peakX < marginLeft + 55;
              const anchor = nearLeftEdge ? "start" : "end";
              const labelX = nearLeftEdge
                ? Math.max(peakX, marginLeft)
                : Math.min(peakX, width - marginRight - 4);
              const labelY = Math.max(peakY - 14, marginTop + 9);
              const approxWidth = labelText.length * 5.5;
              const rectX = anchor === "start" ? labelX - 4 : labelX - approxWidth - 4;

              return (
                <>
                  <rect
                    x={rectX}
                    y={labelY - 11}
                    width={approxWidth + 8}
                    height={15}
                    rx={4}
                    fill="#0f1011"
                    opacity="0.85"
                  />
                  <text
                    x={labelX}
                    y={labelY}
                    fontSize="11"
                    fontWeight="700"
                    fill="#f2b705"
                    textAnchor={anchor}
                  >
                    {labelText}
                  </text>
                </>
              );
            })()}
          </>
        )}
      </svg>
    </div>
  );
}
