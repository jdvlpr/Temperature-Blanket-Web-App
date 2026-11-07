/** Mix colors by weights (hex in, rgb() out) */
export const mixMany = (parts: [string, number][]): string => {
  let r = 0;
  let g = 0;
  let b = 0;
  let w = 0;
  for (const [hex, k] of parts) {
    if (k <= 0) continue;
    const p = parseInt(hex.slice(1), 16);
    r += ((p >> 16) & 255) * k;
    g += ((p >> 8) & 255) * k;
    b += (p & 255) * k;
    w += k;
  }
  if (w === 0) return parts[0][0];
  return `rgb(${Math.round(r / w)},${Math.round(g / w)},${Math.round(b / w)})`;
};

export const mix = (a: string, b: string, t: number) =>
  mixMany([
    [a, 1 - t],
    [b, t],
  ]);

/** A tiny deterministic random in 0..1 */
export const rand = (i: number, salt = 0) => {
  const x = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;
  return x - Math.floor(x);
};
