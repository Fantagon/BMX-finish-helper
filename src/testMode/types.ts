export type Point = {
  x: number;
  y: number;
};

export type FinishLine = {
  a: Point;
  b: Point;
};

export type BoundingBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type RiderDetection = {
  id: string;
  number?: string;
  confidence?: number;
  bbox: BoundingBox;
  timestamp: number;
};

export type RiderTrack = {
  id: string;
  number?: string;
  confidence?: number;
  previousPoint?: Point;
  currentPoint: Point;
  bbox?: BoundingBox;
  firstSeenAt: number;
  lastSeenAt: number;
  hasFinished: boolean;
};

export type FinishEvent = {
  id: string;
  trackId: string;
  number?: string;
  confidence?: number;
  numberSource?: "ocr" | "virtual" | "manual" | "snapshot";
  crossedAt: number;
  snapshotDataUrl?: string;
  crossingPoint: Point;
};

export type SimulatedRider = {
  id: string;
  number?: string;
  confidence?: number;
  start: Point;
  end: Point;
  progress: number;
  speed: number;
};
