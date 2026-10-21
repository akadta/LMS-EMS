// WCAG relative luminance + contrast ratio — the same math browsers/design
// tools use to compute AA/AAA pass-fail.

function hexToRgb(hex) {
  const clean = hex.replace("#", "");
  const bigint = parseInt(
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean,
    16,
  );
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255,
  };
}

function relativeLuminance({ r, g, b }) {
  const srgb = [r, g, b].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
}

export function contrastRatio(hexA, hexB) {
  const lumA = relativeLuminance(hexToRgb(hexA));
  const lumB = relativeLuminance(hexToRgb(hexB));
  const lighter = Math.max(lumA, lumB);
  const darker = Math.min(lumA, lumB);
  return (lighter + 0.05) / (darker + 0.05);
}

// WCAG AA requires 4.5:1 for normal text, 3:1 for large text/UI components.
export function meetsAA(hexA, hexB, isLargeText = false) {
  const ratio = contrastRatio(hexA, hexB);
  return ratio >= (isLargeText ? 3 : 4.5);
}

export function contrastLabel(hexA, hexB) {
  const ratio = contrastRatio(hexA, hexB);
  if (ratio >= 7) return { level: "AAA", ratio, ok: true };
  if (ratio >= 4.5) return { level: "AA", ratio, ok: true };
  if (ratio >= 3) return { level: "AA Large only", ratio, ok: false };
  return { level: "Fail", ratio, ok: false };
}
