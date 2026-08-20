export type PodiumEntry = { rank: 1 | 2 | 3; names: string[]; liters: number };

function Slot({ entry, medal, unit }: { entry?: PodiumEntry; medal: string; unit: string }) {
  if (!entry) return null;
  return (
    <div className={`podium-slot podium-${entry.rank}`}>
      <span className="podium-medal">{medal}</span>
      <span className="podium-names">{entry.names.join(", ")}</span>
      <span className="podium-liters">
        {entry.liters.toFixed(2)}
        {unit}
      </span>
    </div>
  );
}

export function Podium({ entries, unit = "L" }: { entries: PodiumEntry[]; unit?: string }) {
  const first = entries.find((e) => e.rank === 1);
  const second = entries.find((e) => e.rank === 2);
  const third = entries.find((e) => e.rank === 3);

  if (!first && !second && !third) return null;

  return (
    <div className="podium">
      <Slot entry={second} medal="🥈" unit={unit} />
      <Slot entry={first} medal="🥇" unit={unit} />
      <Slot entry={third} medal="🥉" unit={unit} />
    </div>
  );
}
