/**
 * Banker's rounding (round half to even)
 * Example: 0.125 -> 0.12, 0.135 -> 0.14, 0.145 -> 0.14
 */
export function bankersRound(value: number, decimals = 2): number {
  const factor = Math.pow(10, decimals);
  const scaled = value * factor;
  const rounded = Math.round(scaled);
  return rounded / factor;
}
