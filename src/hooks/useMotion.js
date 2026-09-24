import { useEffect } from "react";

const SPOTLIGHT = ".market-card, .pulse-kpi, .stat-card, .tool-card, .arb-card, .smart-card, .smart-money, .order-book, .market-chart-card";

/**
 * Site-wide motion helpers:
 * - cursor spotlight: cards track the pointer through --mx / --my
 * - scroll reveal: [data-reveal] elements fade up when they enter the viewport
 */
export function useMotion(pathname) {
  useEffect(() => {
    if (window.matchMedia?.("(pointer: coarse)").matches) return undefined;
    let frame = 0;
    function onMove(event) {
      const card = event.target.closest?.(SPOTLIGHT);
      if (!card) return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const rect = card.getBoundingClientRect();
        card.style.setProperty("--mx", `${event.clientX - rect.left}px`);
        card.style.setProperty("--my", `${event.clientY - rect.top}px`);
      });
    }
    document.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      document.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    if (!("IntersectionObserver" in window)) return undefined;
    // Content is only hidden before reveal once the observer is running.
    document.documentElement.classList.add("motion-ready");
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-revealed");
            observer.unobserve(entry.target);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    const scan = () => document.querySelectorAll("[data-reveal]:not(.is-revealed)").forEach((el) => observer.observe(el));
    scan();
    // Pages render sections asynchronously as data arrives.
    let pending = 0;
    const mutations = new MutationObserver(() => {
      if (!pending) pending = requestAnimationFrame(() => { pending = 0; scan(); });
    });
    mutations.observe(document.body, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
      mutations.disconnect();
      cancelAnimationFrame(pending);
    };
  }, [pathname]);

  useEffect(() => {
    if (!window.location.hash) window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname]);
}
