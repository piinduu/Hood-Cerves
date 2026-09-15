export function TotalCounter({
  totalLiters,
  label = "Total del grupo",
  unit = "L",
  decimals = 2,
}: {
  totalLiters: number;
  label?: string;
  unit?: string;
  decimals?: number;
}) {
  return (
    <div className="total-banner">
      <span className="label">{label}</span>
      <span className="value">
        {totalLiters.toFixed(decimals)} {unit}
      </span>
    </div>
  );
}
