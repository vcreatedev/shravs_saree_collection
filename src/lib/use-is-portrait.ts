"use client";

import { useSyncExternalStore } from "react";

const QUERY = "(orientation: portrait)";

function subscribe(callback: () => void) {
  const mql = window.matchMedia(QUERY);
  mql.addEventListener("change", callback);
  return () => mql.removeEventListener("change", callback);
}

function getSnapshot() {
  return window.matchMedia(QUERY).matches;
}

/** Tracks device orientation, updating live on rotation - used where a
 * component needs to pick between two entirely different implementations
 * (not just different CSS) for portrait vs landscape, since only one of
 * them should ever be mounted/running at a time. */
export function useIsPortrait(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, () => true);
}
