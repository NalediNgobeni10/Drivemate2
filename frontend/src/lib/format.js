// Currency formatter — South African Rand
export function formatZAR(amount, opts = {}) {
  const { compact = false } = opts;
  const n = Number(amount || 0);
  if (compact) {
    if (n >= 1_000_000) return `R${(n / 1_000_000).toFixed(1)}m`;
    if (n >= 1_000) return `R${(n / 1_000).toFixed(1)}k`;
  }
  return `R${n.toLocaleString("en-ZA", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}
