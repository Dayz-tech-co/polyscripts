// Opens the global command palette from anywhere (header button, hero, etc).
export const PALETTE_EVENT = "polyscripts:palette";

export function openPalette() {
  window.dispatchEvent(new Event(PALETTE_EVENT));
}
