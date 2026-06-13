import type { FinishLine, FinishEvent, Point, RiderDetection, RiderTrack } from "../types";
import { getRiderReferencePoint, hasCrossedFinishLine } from "../geometry/finishLine";

const TRACK_MAX_AGE_MS = 1500;
const MAX_MATCH_DISTANCE = 0.18;

export function updateRiderTracks(
  previousTracks: RiderTrack[],
  detections: RiderDetection[],
  finishLine: FinishLine | null,
  now: number
): { tracks: RiderTrack[]; finishEvents: FinishEvent[] } {
  const nextTracks = [...previousTracks].filter((track) => now - track.lastSeenAt < TRACK_MAX_AGE_MS);
  const finishEvents: FinishEvent[] = [];

  for (const detection of detections) {
    const currentPoint = getRiderReferencePoint(detection);
    const existing = findBestTrack(nextTracks, detection, currentPoint);

    if (!existing) {
      nextTracks.push({
        id: detection.id,
        number: detection.number,
        confidence: detection.confidence,
        previousPoint: undefined,
        currentPoint,
        bbox: detection.bbox,
        firstSeenAt: detection.timestamp,
        lastSeenAt: detection.timestamp,
        hasFinished: false,
      });
      continue;
    }

    existing.previousPoint = existing.currentPoint;
    existing.currentPoint = currentPoint;
    existing.bbox = detection.bbox;
    existing.lastSeenAt = detection.timestamp;
    existing.number = detection.number ?? existing.number;
    existing.confidence = detection.confidence ?? existing.confidence;

    if (
      finishLine &&
      !existing.hasFinished &&
      existing.previousPoint &&
      hasCrossedFinishLine(existing.previousPoint, existing.currentPoint, finishLine)
    ) {
      existing.hasFinished = true;
      finishEvents.push({
        id: crypto.randomUUID(),
        trackId: existing.id,
        number: existing.number,
        confidence: existing.confidence,
        crossedAt: now,
        crossingPoint: existing.currentPoint,
      });
    }
  }

  return { tracks: nextTracks, finishEvents };
}

function findBestTrack(
  tracks: RiderTrack[],
  detection: RiderDetection,
  point: Point
): RiderTrack | undefined {
  let best: RiderTrack | undefined;
  let bestScore = Number.POSITIVE_INFINITY;

  for (const track of tracks) {
    const sameNumber = detection.number && track.number && detection.number === track.number;
    const distance = distanceBetween(track.currentPoint, point);
    const score = distance - (sameNumber ? 0.08 : 0);

    // Simple v1 tracking: prefer same number if known, otherwise nearest point.
    // Later this should be replaced by robust multi-object tracking.
    if (score < bestScore && (distance < MAX_MATCH_DISTANCE || sameNumber)) {
      best = track;
      bestScore = score;
    }
  }

  return best;
}

function distanceBetween(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}
