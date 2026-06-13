import type { FinishEvent } from "../types";

// In de snapshotversie bewaren we de laatste 8 finishpassages op het scherm,
// zodat de jury ze direct kan terugkijken. Ze verdwijnen dus niet automatisch
// na 15 seconden; nieuwe passages schuiven de oudste uit de lijst.
export const FINISH_EVENT_DEDUPLICATE_MS = 3_000;
export const MAX_VISIBLE_FINISH_EVENTS = 8;

export function mergeFinishEvents(
  previousEvents: FinishEvent[],
  newEvents: FinishEvent[],
  _now: number
): FinishEvent[] {
  const merged = [...previousEvents];

  for (const event of newEvents) {
    if (!isDuplicateFinishEvent(event, merged)) {
      merged.push(event);
    }
  }

  return merged.slice(-MAX_VISIBLE_FINISH_EVENTS);
}

function isDuplicateFinishEvent(candidate: FinishEvent, existing: FinishEvent[]): boolean {
  return existing.some((event) => {
    const closeInTime = Math.abs(candidate.crossedAt - event.crossedAt) < FINISH_EVENT_DEDUPLICATE_MS;
    if (!closeInTime) return false;

    const sameTrack = candidate.trackId === event.trackId;
    const sameNumber = candidate.number && event.number && candidate.number === event.number;
    const closePoint =
      Math.hypot(
        candidate.crossingPoint.x - event.crossingPoint.x,
        candidate.crossingPoint.y - event.crossingPoint.y
      ) < 0.04;

    return Boolean(sameTrack || sameNumber || closePoint);
  });
}
