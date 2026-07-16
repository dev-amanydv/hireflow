export function gradientFor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  const lightness = 0.38 + (Math.abs(hash) % 10) / 100;
  return `linear-gradient(135deg, oklch(${(lightness + 0.08).toFixed(2)} 0.015 275), oklch(${lightness.toFixed(2)} 0.015 275))`;
}

export function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}
