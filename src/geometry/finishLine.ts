import type { FinishLine, Point, RiderDetection } from "../types";

export const RIDER_CROSSING_POINT = "bottomCenter" as const;

export function getRiderReferencePoint(detection: RiderDetection): Point {
  const { bbox } = detection;

  // Version 1 uses bottomCenter as a simple approximation.
  // This is not true front-wheel detection. Later this should be improved with
  // front-wheel detection, bike pose estimation, or a calibrated perspective transform.
  return {
    x: bbox.x + bbox.width / 2,
    y: bbox.y + bbox.height,
  };
}

export function signedDistanceToLine(point: Point, line: FinishLine): number {
  const { a, b } = line;
  const dx = b.x - a.x;
  const dy = b.y - a.y;

  return (point.x - a.x) * dy - (point.y - a.y) * dx;
}

export function hasCrossedFinishLine(
  previousPoint: Point,
  currentPoint: Point,
  line: FinishLine
): boolean {
  const previousDistance = signedDistanceToLine(previousPoint, line);
  const currentDistance = signedDistanceToLine(currentPoint, line);

  const epsilon = 0.0005;
  if (Math.abs(previousDistance) < epsilon || Math.abs(currentDistance) < epsilon) {
    return false;
  }

  return Math.sign(previousDistance) !== Math.sign(currentDistance);
}

export function clampPoint(point: Point): Point {
  return {
    x: Math.max(0, Math.min(1, point.x)),
    y: Math.max(0, Math.min(1, point.y)),
  };
}
