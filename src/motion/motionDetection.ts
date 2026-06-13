import type { RiderDetection } from "../types";

const SAMPLE_WIDTH = 96;
const MIN_CHANGED_PIXELS = 70;
const MIN_CHANGED_RATIO = 0.003;
const PIXEL_DIFF_THRESHOLD = 34;
const BBOX_PADDING = 0.035;
const MIN_BOX_SIZE = 0.04;

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
  manualNumber?: string
): RiderDetection[] {
  if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA || video.videoWidth === 0 || video.videoHeight === 0) {
    return [];
  }

  const width = SAMPLE_WIDTH;
  const height = Math.max(54, Math.round((SAMPLE_WIDTH * video.videoHeight) / video.videoWidth));

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

  if (!previous) {
    return [];
  }

  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;
  let changedPixels = 0;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = y * width + x;
      const diff = Math.abs(gray[index] - previous[index]);

      if (diff > PIXEL_DIFF_THRESHOLD) {
        changedPixels += 1;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  const changedRatio = changedPixels / (width * height);

  if (changedPixels < MIN_CHANGED_PIXELS || changedRatio < MIN_CHANGED_RATIO) {
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
      number: manualNumber || undefined,
      confidence: manualNumber ? 0.9 : undefined,
      bbox: normalizedBox,
      timestamp,
    },
  ];
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
