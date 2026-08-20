export function TotalCounter({
  totalLiters,
  label = "Total del grupo",
  unit = "L",
}: {
  totalLiters: number;
  label?: string;
  unit?: string;
}) {
  return (
    <div className="total-banner">
      <span className="label">{label}</span>
      <span className="value">
        {totalLiters.toFixed(2)} {unit}
      </span>
    </div>
  );
}
