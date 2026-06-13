import type { FinishLine, FinishEvent, Point, RiderDetection, RiderTrack } from "../types";
import { getRiderReferencePoint, hasCrossedFinishLine } from "../geometry/finishLine";

const TRACK_MAX_AGE_MS = 1200;
const MAX_MATCH_DISTANCE = 0.28;
const FINISH_TOUCH_DISTANCE = 0.13;

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
      const newTrack: RiderTrack = {
        id: detection.id,
        number: detection.number,
        confidence: detection.confidence,
        previousPoint: undefined,
        currentPoint,
        bbox: detection.bbox,
        firstSeenAt: detection.timestamp,
        lastSeenAt: detection.timestamp,
        hasFinished: false,
      };

      if (finishLine && detectionTouchesFinishZone(detection, currentPoint, finishLine)) {
        newTrack.hasFinished = true;
        finishEvents.push(createFinishEvent(newTrack, now));
      }

      nextTracks.push(newTrack);
      continue;
    }

    existing.previousPoint = existing.currentPoint;
    existing.currentPoint = currentPoint;
    existing.bbox = detection.bbox;
    existing.lastSeenAt = detection.timestamp;
    existing.number = detection.number ?? existing.number;
    existing.confidence = detection.confidence ?? existing.confidence;

    const crossedLine = Boolean(
      finishLine &&
        existing.previousPoint &&
        hasCrossedFinishLine(existing.previousPoint, existing.currentPoint, finishLine)
    );

    const touchesFinishZone = Boolean(
      finishLine && detectionTouchesFinishZone(detection, existing.currentPoint, finishLine)
    );

    // Baanmodus v5.1:
    // Een perfecte geometrische lijnkruising is in echt camerabeeld vaak te streng.
    // Daarom telt de app nu ook duidelijke beweging in de finishzone als passage.
    // Duplicaten worden verderop door mergeFinishEvents binnen 3 seconden onderdrukt.
    if (finishLine && !existing.hasFinished && (crossedLine || touchesFinishZone)) {
      existing.hasFinished = true;
      finishEvents.push(createFinishEvent(existing, now));
    }
  }

  return { tracks: nextTracks, finishEvents };
}

function createFinishEvent(track: RiderTrack, now: number): FinishEvent {
  return {
    id: crypto.randomUUID(),
    trackId: track.id,
    number: track.number,
    confidence: track.confidence,
    crossedAt: now,
    crossingPoint: track.currentPoint,
  };
}

function detectionTouchesFinishZone(detection: RiderDetection, point: Point, line: FinishLine): boolean {
  const box = detection.bbox;
  const candidates: Point[] = [
    point,
    { x: box.x + box.width / 2, y: box.y + box.height / 2 },
    { x: box.x, y: box.y },
    { x: box.x + box.width, y: box.y },
    { x: box.x, y: box.y + box.height },
    { x: box.x + box.width, y: box.y + box.height },
  ];

  return candidates.some((candidate) => distanceToLine(candidate, line) <= FINISH_TOUCH_DISTANCE);
}

function distanceToLine(point: Point, line: FinishLine): number {
  const dx = line.b.x - line.a.x;
  const dy = line.b.y - line.a.y;
  const length = Math.hypot(dx, dy) || 1;
  return Math.abs((point.x - line.a.x) * dy - (point.y - line.a.y) * dx) / length;
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
