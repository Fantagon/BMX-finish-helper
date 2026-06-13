import type { BoundingBox } from "../types";

export type OcrResult = {
  number?: string;
  confidence?: number;
  rawText: string;
};

let workerPromise: Promise<any> | null = null;

export async function recognizeNumberFromVideo(
  video: HTMLVideoElement,
  bbox?: BoundingBox
): Promise<OcrResult> {
  if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA || video.videoWidth === 0 || video.videoHeight === 0) {
    return { rawText: "" };
  }

  const image = makeOcrCrop(video, bbox);
  const worker = await getWorker();
  const response = await worker.recognize(image);
  const text = String(response?.data?.text ?? "");
  const confidencePercent = Number(response?.data?.confidence ?? 0);
  const number = extractLikelyBmxNumber(text);

  return {
    number,
    confidence: number ? Math.max(0.01, Math.min(0.99, confidencePercent / 100)) : undefined,
    rawText: text,
  };
}

async function getWorker(): Promise<any> {
  if (!workerPromise) {
    workerPromise = (async () => {
      const mod = await import("tesseract.js");
      const createWorker = (mod as any).createWorker;
      const worker = await createWorker("eng");

      if (typeof worker.setParameters === "function") {
        await worker.setParameters({
          tessedit_char_whitelist: "0123456789",
          tessedit_pageseg_mode: "7",
        });
      }

      return worker;
    })();
  }

  return workerPromise;
}

function makeOcrCrop(video: HTMLVideoElement, bbox?: BoundingBox): HTMLCanvasElement {
  const videoWidth = video.videoWidth;
  const videoHeight = video.videoHeight;

  // OCR is experimental: we crop around the detected motion blob. In later versions
  // this should become a true number-plate crop based on bike/rider detection.
  const crop = bbox
    ? expandBox(bbox, 0.22)
    : { x: 0.25, y: 0.25, width: 0.5, height: 0.5 };

  const sx = Math.round(crop.x * videoWidth);
  const sy = Math.round(crop.y * videoHeight);
  const sw = Math.max(1, Math.round(crop.width * videoWidth));
  const sh = Math.max(1, Math.round(crop.height * videoHeight));

  const outputWidth = 520;
  const outputHeight = Math.max(180, Math.round((outputWidth * sh) / sw));
  const canvas = document.createElement("canvas");
  canvas.width = outputWidth;
  canvas.height = outputHeight;

  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return canvas;

  context.imageSmoothingEnabled = true;
  context.drawImage(video, sx, sy, sw, sh, 0, 0, outputWidth, outputHeight);

  // Simple contrast boost and grayscale conversion to give OCR a better chance.
  const image = context.getImageData(0, 0, outputWidth, outputHeight);
  for (let index = 0; index < image.data.length; index += 4) {
    const gray = image.data[index] * 0.299 + image.data[index + 1] * 0.587 + image.data[index + 2] * 0.114;
    const boosted = gray > 145 ? 255 : gray < 95 ? 0 : gray * 1.35;
    image.data[index] = boosted;
    image.data[index + 1] = boosted;
    image.data[index + 2] = boosted;
  }
  context.putImageData(image, 0, 0);

  return canvas;
}

function expandBox(box: BoundingBox, padding: number): BoundingBox {
  const x = clamp(box.x - padding, 0, 1);
  const y = clamp(box.y - padding, 0, 1);
  const right = clamp(box.x + box.width + padding, 0, 1);
  const bottom = clamp(box.y + box.height + padding, 0, 1);

  return {
    x,
    y,
    width: Math.max(0.04, right - x),
    height: Math.max(0.04, bottom - y),
  };
}

function extractLikelyBmxNumber(text: string): string | undefined {
  const groups = text.match(/\d{1,4}/g) ?? [];
  const cleaned = groups
    .map((value) => value.replace(/^0+(?=\d)/, ""))
    .filter((value) => value.length >= 1 && value.length <= 4);

  if (cleaned.length === 0) return undefined;

  // Prefer 2- or 3-digit race numbers over single digits when OCR returns multiple fragments.
  return cleaned.sort((a, b) => scoreNumber(b) - scoreNumber(a))[0];
}

function scoreNumber(value: string): number {
  if (value.length === 3) return 4;
  if (value.length === 2) return 3;
  if (value.length === 1) return 2;
  return 1;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
