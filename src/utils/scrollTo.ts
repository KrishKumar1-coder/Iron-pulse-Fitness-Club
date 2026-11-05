/**
 * Universal Smooth Scroll Helper
 * Compatible with Lenis smooth scrolling, mobile touch momentum, and standard browser fallback.
 */
export function scrollToTarget(target: string | number | HTMLElement, offset: number = -80) {
  if (typeof window === "undefined") return;

  try {
    const lenis = (window as unknown as { __lenis?: { scrollTo: (t: string | number | HTMLElement, opts?: { offset?: number; duration?: number }) => void } }).__lenis;

    if (lenis && typeof lenis.scrollTo === "function") {
      if (typeof target === "number") {
        lenis.scrollTo(target, { duration: 1.1 });
        return;
      }
      const selector = typeof target === "string" 
        ? (target.startsWith("#") ? target : `#${target}`)
        : target;
      lenis.scrollTo(selector, { offset, duration: 1.1 });
      return;
    }
  } catch {
    // Lenis failed, fallback to native window.scrollTo
  }

  // Robust native fallback
  try {
    if (typeof target === "number") {
      window.scrollTo({ top: target, behavior: "smooth" });
      return;
    }

    const id = typeof target === "string" ? target.replace(/^#/, "") : "";
    const el = id 
      ? (document.getElementById(id) || document.querySelector(`#${id}`))
      : (target instanceof HTMLElement ? target : null);

    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY + offset;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  } catch {
    // Native fallback failed silently
  }
}
