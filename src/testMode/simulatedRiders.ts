import type { Point, RiderDetection, SimulatedRider } from "../types";

export function createSimulatedRider(index: number, manualNumber?: string): SimulatedRider {
  const id = crypto.randomUUID();
  const laneOffset = (index % 5) * 0.09;

  return {
    id,
    number: manualNumber || String([84, 17, 203, 9, 51, 116][index % 6]),
    confidence: 0.86 + Math.random() * 0.12,
    start: { x: 0.18 + laneOffset, y: 0.12 },
    end: { x: 0.38 + laneOffset, y: 0.94 },
    progress: 0,
    speed: 0.006 + Math.random() * 0.006,
  };
}

export function advanceSimulatedRiders(riders: SimulatedRider[]): SimulatedRider[] {
  return riders
    .map((rider) => ({ ...rider, progress: rider.progress + rider.speed }))
    .filter((rider) => rider.progress < 1.15);
}

export function simulatedRidersToDetections(riders: SimulatedRider[], timestamp: number): RiderDetection[] {
  return riders.map((rider) => {
    const point = interpolate(rider.start, rider.end, rider.progress);
    const width = 0.1;
    const height = 0.14;

    return {
      id: rider.id,
      number: rider.number,
      confidence: rider.confidence,
      bbox: {
        x: point.x - width / 2,
        y: point.y - height,
        width,
        height,
      },
      timestamp,
    };
  });
}

function interpolate(a: Point, b: Point, progress: number): Point {
  return {
    x: a.x + (b.x - a.x) * progress,
    y: a.y + (b.y - a.y) * progress,
  };
}
