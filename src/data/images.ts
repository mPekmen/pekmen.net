/**
 * Project captures ship as a 1200×675 WebP plus smaller variants generated
 * with `sharp`. Keeping the list here means every `<img>` advertises the same
 * candidates and browsers can pick the smallest file that fits the slot.
 */
const responsiveWidths = [480, 800, 960] as const;

export function imageSrcSet(src: string): string | undefined {
  if (!["/projects/barber.webp", "/projects/boyaci.webp", "/projects/pekmen-net.webp"].includes(src)) return undefined;
  const base = src.replace(/\.webp$/, "");
  const variants = responsiveWidths.map(
    (width) => `${base}-${width}.webp ${width}w`
  );

  return [...variants, `${src} 1200w`].join(", ");
}
