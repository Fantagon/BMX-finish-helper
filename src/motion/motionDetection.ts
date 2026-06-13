import type { FinishLine, RiderDetection } from "../types";

const SAMPLE_WIDTH = 112;
const BBOX_PADDING = 0.03;
const MIN_BOX_SIZE = 0.035;

type Sensitivity = "laag" | "normaal" | "hoog";
type DetectionZone = "smal" | "normaal" | "breed";

const SENSITIVITY_SETTINGS: Record<Sensitivity, { minChangedPixels: number; minChangedRatio: number; pixelDiffThreshold: number }> = {
  laag: { minChangedPixels: 150, minChangedRatio: 0.007, pixelDiffThreshold: 46 },
  normaal: { minChangedPixels: 95, minChangedRatio: 0.0045, pixelDiffThreshold: 36 },
  hoog: { minChangedPixels: 50, minChangedRatio: 0.0025, pixelDiffThreshold: 28 },
};

const ZONE_RADIUS: Record<DetectionZone, number> = {
  smal: 0.08,
  normaal: 0.14,
  breed: 0.22,
};

export type MotionDetectionOptions = {
  finishLine: FinishLine | null;
  sensitivity: Sensitivity;
  detectionZone: DetectionZone;
};

export type MotionDetectionState = {
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  previousGray?: Uint8ClampedArray;
};

export function createMotionDetectionState(): MotionDetectionState {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d", { willReadFrequently: true });

  if (!context) {
    throw new Error("Canvas context is niet beschikbaar voor bewegingsdetectie.");
  }

  return { canvas, context };
}

export function resetMotionDetectionState(state: MotionDetectionState): void {
  state.previousGray = undefined;
}

export function detectMotionFromVideo(
  video: HTMLVideoElement,
  state: MotionDetectionState,
  timestamp: number,
  options: MotionDetectionOptions
): RiderDetection[] {
  if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA || video.videoWidth === 0 || video.videoHeight === 0) {
    return [];
  }

  const width = SAMPLE_WIDTH;
  const height = Math.max(63, Math.round((SAMPLE_WIDTH * video.videoHeight) / video.videoWidth));

  if (state.canvas.width !== width || state.canvas.height !== height) {
    state.canvas.width = width;
    state.canvas.height = height;
    state.previousGray = undefined;
  }

  state.context.drawImage(video, 0, 0, width, height);
  const frame = state.context.getImageData(0, 0, width, height);
  const gray = new Uint8ClampedArray(width * height);

  for (let pixelIndex = 0, dataIndex = 0; pixelIndex < gray.length; pixelIndex += 1, dataIndex += 4) {
    gray[pixelIndex] = Math.round(
      frame.data[dataIndex] * 0.299 + frame.data[dataIndex + 1] * 0.587 + frame.data[dataIndex + 2] * 0.114
    );
  }

  const previous = state.previousGray;
  state.previousGray = gray;

  if (!previous || !options.finishLine) {
    return [];
  }

  const settings = SENSITIVITY_SETTINGS[options.sensitivity];
  const zoneRadius = ZONE_RADIUS[options.detectionZone];

  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;
  let changedPixels = 0;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const nx = (x + 0.5) / width;
      const ny = (y + 0.5) / height;

      // Alleen beweging vlak rond de ingestelde finishlijn telt mee.
      // Dit maakt de app op de baan rustiger: publiek, bomen of beweging ver weg tellen minder snel mee.
      if (distanceToLine({ x: nx, y: ny }, options.finishLine) > zoneRadius) {
        continue;
      }

      const index = y * width + x;
      const diff = Math.abs(gray[index] - previous[index]);

      if (diff > settings.pixelDiffThreshold) {
        changedPixels += 1;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  const changedRatio = changedPixels / (width * height);

  if (changedPixels < settings.minChangedPixels || changedRatio < settings.minChangedRatio) {
    return [];
  }

  const normalizedBox = {
    x: clamp(minX / width - BBOX_PADDING, 0, 1),
    y: clamp(minY / height - BBOX_PADDING, 0, 1),
    width: clamp((maxX - minX + 1) / width + BBOX_PADDING * 2, 0, 1),
    height: clamp((maxY - minY + 1) / height + BBOX_PADDING * 2, 0, 1),
  };

  if (normalizedBox.width < MIN_BOX_SIZE || normalizedBox.height < MIN_BOX_SIZE) {
    return [];
  }

  return [
    {
      id: "live-motion-main",
      number: undefined,
      confidence: undefined,
      bbox: normalizedBox,
      timestamp,
    },
  ];
}

function distanceToLine(point: { x: number; y: number }, line: FinishLine): number {
  const dx = line.b.x - line.a.x;
  const dy = line.b.y - line.a.y;
  const length = Math.hypot(dx, dy) || 1;
  return Math.abs((point.x - line.a.x) * dy - (point.y - line.a.y) * dx) / length;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
