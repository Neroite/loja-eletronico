// Unique-ID generation. Random suffixes alone can collide (the sale/product/client
// generators all used Math.random with small ranges), which corrupts React keys and
// makes lookups by id mutate/refund the wrong record. makeId re-rolls until the value
// is not already taken by the existing list.
export function makeId(prefix: string, existing: Iterable<string>, digits = 5): string {
  const taken = new Set(existing);
  const min = 10 ** (digits - 1);
  const span = 9 * min; // keeps the result exactly `digits` long
  for (let attempt = 0; attempt < 50; attempt++) {
    const candidate = `${prefix}${Math.floor(min + Math.random() * span)}`;
    if (!taken.has(candidate)) return candidate;
  }
  // Exhausted random space (extremely unlikely) — fall back to a timestamp-based id.
  return `${prefix}${Date.now()}`;
}
