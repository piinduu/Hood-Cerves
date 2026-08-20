import type { PersonWithTotal } from "@/lib/types";

export function PointsBoard({
  entries,
}: {
  entries: { person: PersonWithTotal; rank: number }[];
}) {
  if (entries.length === 0) return null;

  return (
    <div className="points-board">
      {entries.map(({ person, rank }) => (
        <div key={person.id} className="points-row">
          <span className="points-rank">#{rank}</span>
          <span className="points-name">{person.name}</span>
          <span className="points-month">{person.monthPoints.toFixed(2)} pts</span>
          <span className="points-total" title="Puntuación total histórica">
            Total {person.totalPoints.toFixed(2)} pts
          </span>
        </div>
      ))}
    </div>
  );
}
