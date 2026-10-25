/**
 * Tracks whether anything is covering the app (the opening animation, the Face ID lock), so a
 * keyboard never rises on top of them. Opening Clover from the Today widget waits for this before
 * focusing the text box. Starts blocked by the opening animation, which plays on every launch.
 */

const blockers = new Set<string>(['opening']);
let waiting: (() => void)[] = [];

export function setInputBlocked(reason: string, blocked: boolean) {
  if (blocked) blockers.add(reason);
  else blockers.delete(reason);
  if (blockers.size === 0) {
    const ready = waiting;
    waiting = [];
    ready.forEach((resolve) => resolve());
  }
}

/** Resolves once nothing covers the app and the layout has settled for a couple of frames. */
export function whenReadyForInput(): Promise<void> {
  const settled = () => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
  if (blockers.size === 0) return settled();
  return new Promise<void>((resolve) => waiting.push(resolve)).then(settled);
}
