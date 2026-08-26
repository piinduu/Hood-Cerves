export const QUICK_SIZES = [
  { label: "Botellín", liters: 0.2 },
  { label: "Tercio", liters: 0.33 },
  { label: "Pinta", liters: 0.5 },
  { label: "Copa Mayri", liters: 0.4 },
  { label: "Litrona", liters: 1 },
];

export const CUBATA_QUICK_SIZES = [
  { label: "Cubata", liters: 0.5 },
  { label: "Chupitos", liters: 0.02 },
  { label: "Tubo", liters: 0.3 },
];

export const SIDRA_QUICK_SIZES = [{ label: "Sidra", liters: 0.1 }];

export const VINO_QUICK_SIZES = [{ label: "Copa de vino", liters: 0.15 }];

export function resolveLabel(
  liters: number,
  providedLabel?: string | null,
  sizes: { label: string; liters: number }[] = QUICK_SIZES
): string {
  if (providedLabel) return providedLabel;
  const match = sizes.find((size) => Math.abs(size.liters - liters) < 0.005);
  return match ? match.label : `${liters}L`;
}
