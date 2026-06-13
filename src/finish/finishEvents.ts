import type { FinishEvent } from "../types";

export const FINISH_EVENT_VISIBLE_MS = 15_000;
export const FINISH_EVENT_DEDUPLICATE_MS = 3_000;
export const MAX_VISIBLE_FINISH_EVENTS = 8;

export function mergeFinishEvents(
  previousEvents: FinishEvent[],
  newEvents: FinishEvent[],
  now: number
): FinishEvent[] {
  const stillVisible = previousEvents.filter(
    (event) => now - event.crossedAt <= FINISH_EVENT_VISIBLE_MS
  );

  for (const event of newEvents) {
    if (!isDuplicateFinishEvent(event, stillVisible)) {
      stillVisible.push(event);
    }
  }

  return stillVisible.slice(-MAX_VISIBLE_FINISH_EVENTS);
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
