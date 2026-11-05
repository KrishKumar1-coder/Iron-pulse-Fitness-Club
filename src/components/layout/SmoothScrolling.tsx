"use client";

import { useEffect, useState } from "react";
import { ReactLenis, useLenis } from "lenis/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";

function LenisScrollTriggerBridge() {
  const lenis = useLenis();

  useEffect(() => {
    if (!lenis || typeof window === "undefined") return;

    (window as unknown as { __lenis?: unknown }).__lenis = lenis;
    gsap.registerPlugin(ScrollTrigger);

    const updateScrollTrigger = () => {
      ScrollTrigger.update();
    };

    lenis.on("scroll", updateScrollTrigger);

    return () => {
      lenis.off("scroll", updateScrollTrigger);
      (window as unknown as { __lenis?: unknown }).__lenis = undefined;
    };
  }, [lenis]);

  return null;
}

function LenisScrollLockController() {
  const lenis = useLenis();

  useEffect(() => {
    if (!lenis) return;

    const checkLock = () => {
      const isLocked =
        document.body.classList.contains("modal-open") ||
        document.body.classList.contains("loader-active");

      if (isLocked) {
        lenis.stop();
      } else {
        lenis.start();
      }
    };

    checkLock();

    const observer = new MutationObserver(checkLock);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => {
      observer.disconnect();
      lenis?.start();
    };
  }, [lenis]);

  return null;
}

export function SmoothScrolling({ children }: { children: React.ReactNode }) {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && typeof window.matchMedia === "function") {
      try {
        const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
        setPrefersReducedMotion(Boolean(mediaQuery.matches));

        const handleChange = (e: MediaQueryListEvent) => {
          setPrefersReducedMotion(Boolean(e.matches));
        };

        if (typeof mediaQuery.addEventListener === "function") {
          mediaQuery.addEventListener("change", handleChange);
          return () => mediaQuery.removeEventListener("change", handleChange);
        } else if (typeof mediaQuery.addListener === "function") {
          mediaQuery.addListener(handleChange);
          return () => mediaQuery.removeListener(handleChange);
        }
      } catch {
        // Fallback for browsers without matchMedia support
      }
    }
  }, []);

  return (
    <ReactLenis
      root
      options={{
        lerp: prefersReducedMotion ? 1 : 0.08,
        duration: prefersReducedMotion ? 0 : 1.2,
        smoothWheel: !prefersReducedMotion,
        wheelMultiplier: 0.9,
        // Allow mobile & touch devices to use native 120Hz kinetic momentum scrolling to prevent lag on budget phones
        syncTouch: false,
        touchMultiplier: 1.0,
        infinite: false,
        prevent: (node) => {
          if (!node || typeof document === "undefined") return false;
          if (node instanceof HTMLElement) {
            return Boolean(node.closest("[data-lenis-prevent]"));
          }
          return false;
        },
      }}
    >
      <LenisScrollLockController />
      <LenisScrollTriggerBridge />
      {children}
    </ReactLenis>
  );
}
