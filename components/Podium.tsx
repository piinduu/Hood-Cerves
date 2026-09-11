export type PodiumEntry = { rank: 1 | 2 | 3; names: string[]; liters: number };

function Slot({
  entry,
  medal,
  unit,
  decimals,
}: {
  entry?: PodiumEntry;
  medal: string;
  unit: string;
  decimals: number;
}) {
  if (!entry) return null;
  return (
    <div className={`podium-slot podium-${entry.rank}`}>
      <span className="podium-medal">{medal}</span>
      <span className="podium-names">{entry.names.join(", ")}</span>
      <span className="podium-liters">
        {entry.liters.toFixed(decimals)}
        {unit}
      </span>
    </div>
  );
}

export function Podium({
  entries,
  unit = "L",
  decimals = 2,
}: {
  entries: PodiumEntry[];
  unit?: string;
  decimals?: number;
}) {
  const first = entries.find((e) => e.rank === 1);
  const second = entries.find((e) => e.rank === 2);
  const third = entries.find((e) => e.rank === 3);

  if (!first && !second && !third) return null;

  return (
    <div className="podium">
      <Slot entry={second} medal="🥈" unit={unit} decimals={decimals} />
      <Slot entry={first} medal="🥇" unit={unit} decimals={decimals} />
      <Slot entry={third} medal="🥉" unit={unit} decimals={decimals} />
    </div>
  );
}
