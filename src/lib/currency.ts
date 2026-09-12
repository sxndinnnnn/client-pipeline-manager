export function formatLKR(value: number): string {
  return `LKR ${value.toLocaleString()}`;
}

export function formatUSD(value: number): string {
  return `$${value.toLocaleString()}`;
}
