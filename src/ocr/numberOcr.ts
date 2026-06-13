import type { BoundingBox } from "../types";

export type OcrResult = {
  number?: string;
  confidence?: number;
  rawText: string;
  candidates: string[];
  attempts: number;
};

export type OcrOptions = {
  includeFullFrame?: boolean;
};

let workerPromise: Promise<any> | null = null;

export async function recognizeNumberFromVideo(
  video: HTMLVideoElement,
  bbox?: BoundingBox,
  options: OcrOptions = {}
): Promise<OcrResult> {
  if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA || video.videoWidth === 0 || video.videoHeight === 0) {
    return { rawText: "", candidates: [], attempts: 0 };
  }

  const crops = makeOcrCrops(video, bbox, options);
  const worker = await getWorker();

  const allCandidates: string[] = [];
  const rawTexts: string[] = [];
  let bestNumber: string | undefined;
  let bestConfidence = 0;
  let bestScore = 0;

  for (const crop of crops) {
    const response = await worker.recognize(crop.canvas);
    const text = String(response?.data?.text ?? "");
    const confidencePercent = Number(response?.data?.confidence ?? 0);
    const candidates = extractLikelyBmxNumbers(text);

    rawTexts.push(`${crop.name}: ${compactText(text) || "-"}`);
    allCandidates.push(...candidates);

    for (const candidate of candidates) {
      const score = scoreNumber(candidate) + Math.max(0, confidencePercent / 100);
      if (score > bestScore) {
        bestScore = score;
        bestNumber = candidate;
        bestConfidence = confidencePercent;
      }
    }

    // Stop early for a plausible 2- or 3-digit BMX number.
    if (bestNumber && bestNumber.length >= 2 && bestConfidence >= 35) {
      break;
    }
  }

  const uniqueCandidates = Array.from(new Set(allCandidates)).sort((a, b) => scoreNumber(b) - scoreNumber(a));

  return {
    number: bestNumber,
    confidence: bestNumber ? Math.max(0.15, Math.min(0.92, bestConfidence / 100 || 0.45)) : undefined,
    rawText: rawTexts.join(" | "),
    candidates: uniqueCandidates,
    attempts: crops.length,
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
          tessedit_pageseg_mode: "6",
          classify_bln_numeric_mode: "1",
        });
      }

      return worker;
    })();
  }

  return workerPromise;
}

type CropCandidate = {
  name: string;
  box: BoundingBox;
  mode: "threshold" | "inverted" | "contrast" | "raw";
};

function makeOcrCrops(
  video: HTMLVideoElement,
  bbox?: BoundingBox,
  options: OcrOptions = {}
): Array<{ name: string; canvas: HTMLCanvasElement }> {
  const cropCandidates: CropCandidate[] = [];

  if (options.includeFullFrame) {
    cropCandidates.push(
      { name: "volledig-contrast", box: { x: 0, y: 0, width: 1, height: 1 }, mode: "contrast" },
      { name: "volledig-zwartwit", box: { x: 0, y: 0, width: 1, height: 1 }, mode: "threshold" },
      { name: "volledig-invert", box: { x: 0, y: 0, width: 1, height: 1 }, mode: "inverted" }
    );
  }

  if (bbox) {
    cropCandidates.push(
      { name: "beweging-groot", box: expandBox(bbox, 0.5), mode: "threshold" },
      { name: "beweging-invert", box: expandBox(bbox, 0.5), mode: "inverted" },
      { name: "beweging-extra", box: expandBox(bbox, 0.68), mode: "contrast" }
    );
  }

  cropCandidates.push(
    { name: "midden-contrast", box: { x: 0.10, y: 0.12, width: 0.80, height: 0.68 }, mode: "contrast" },
    { name: "midden-zwartwit", box: { x: 0.10, y: 0.12, width: 0.80, height: 0.68 }, mode: "threshold" },
    { name: "midden-invert", box: { x: 0.10, y: 0.12, width: 0.80, height: 0.68 }, mode: "inverted" },
    { name: "onder-midden", box: { x: 0.16, y: 0.30, width: 0.68, height: 0.54 }, mode: "threshold" },
    { name: "linker-midden", box: { x: 0.00, y: 0.18, width: 0.70, height: 0.66 }, mode: "contrast" },
    { name: "rechter-midden", box: { x: 0.30, y: 0.18, width: 0.70, height: 0.66 }, mode: "contrast" }
  );

  return cropCandidates.map((candidate) => ({
    name: candidate.name,
    canvas: makePreprocessedCrop(video, candidate.box, candidate.mode),
  }));
}

function makePreprocessedCrop(
  video: HTMLVideoElement,
  crop: BoundingBox,
  mode: CropCandidate["mode"]
): HTMLCanvasElement {
  const videoWidth = video.videoWidth;
  const videoHeight = video.videoHeight;

  const safeCrop = normalizeBox(crop);
  const sx = Math.round(safeCrop.x * videoWidth);
  const sy = Math.round(safeCrop.y * videoHeight);
  const sw = Math.max(1, Math.round(safeCrop.width * videoWidth));
  const sh = Math.max(1, Math.round(safeCrop.height * videoHeight));

  const outputWidth = 1280;
  const outputHeight = Math.max(360, Math.round((outputWidth * sh) / sw));
  const canvas = document.createElement("canvas");
  canvas.width = outputWidth;
  canvas.height = outputHeight;

  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return canvas;

  context.imageSmoothingEnabled = true;
  context.drawImage(video, sx, sy, sw, sh, 0, 0, outputWidth, outputHeight);

  if (mode === "raw") return canvas;

  const image = context.getImageData(0, 0, outputWidth, outputHeight);
  const histogram = new Array<number>(256).fill(0);

  for (let index = 0; index < image.data.length; index += 4) {
    const gray = Math.round(image.data[index] * 0.299 + image.data[index + 1] * 0.587 + image.data[index + 2] * 0.114);
    histogram[gray] += 1;
  }

  const threshold = findOtsuThreshold(histogram);

  for (let index = 0; index < image.data.length; index += 4) {
    const gray = image.data[index] * 0.299 + image.data[index + 1] * 0.587 + image.data[index + 2] * 0.114;
    const contrasted = clamp((gray - 128) * 2.35 + 128, 0, 255);
    let value = contrasted;

    if (mode === "threshold" || mode === "inverted") {
      value = contrasted > threshold ? 255 : 0;
    }

    if (mode === "inverted") {
      value = 255 - value;
    }

    image.data[index] = value;
    image.data[index + 1] = value;
    image.data[index + 2] = value;
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
    width: Math.max(0.08, right - x),
    height: Math.max(0.08, bottom - y),
  };
}

function normalizeBox(box: BoundingBox): BoundingBox {
  const x = clamp(box.x, 0, 0.98);
  const y = clamp(box.y, 0, 0.98);
  const right = clamp(box.x + box.width, x + 0.02, 1);
  const bottom = clamp(box.y + box.height, y + 0.02, 1);

  return {
    x,
    y,
    width: right - x,
    height: bottom - y,
  };
}

function extractLikelyBmxNumbers(text: string): string[] {
  const groups = text.match(/\d{1,4}/g) ?? [];
  const cleaned = groups
    .map((value) => value.replace(/^0+(?=\d)/, ""))
    .filter((value) => value.length >= 1 && value.length <= 4)
    .filter((value) => !/^0+$/.test(value));

  return Array.from(new Set(cleaned)).sort((a, b) => scoreNumber(b) - scoreNumber(a));
}

function scoreNumber(value: string): number {
  if (value.length === 3) return 8;
  if (value.length === 2) return 6;
  if (value.length === 1) return 3;
  return 1;
}

function findOtsuThreshold(histogram: number[]): number {
  const total = histogram.reduce((sum, count) => sum + count, 0);
  let sum = 0;
  for (let i = 0; i < 256; i += 1) sum += i * histogram[i];

  let sumBackground = 0;
  let weightBackground = 0;
  let maxVariance = 0;
  let threshold = 145;

  for (let i = 0; i < 256; i += 1) {
    weightBackground += histogram[i];
    if (weightBackground === 0) continue;

    const weightForeground = total - weightBackground;
    if (weightForeground === 0) break;

    sumBackground += i * histogram[i];
    const meanBackground = sumBackground / weightBackground;
    const meanForeground = (sum - sumBackground) / weightForeground;
    const betweenVariance = weightBackground * weightForeground * (meanBackground - meanForeground) ** 2;

    if (betweenVariance > maxVariance) {
      maxVariance = betweenVariance;
      threshold = i;
    }
  }

  return threshold;
}

function compactText(text: string): string {
  return text.replace(/\s+/g, " ").trim().slice(0, 120);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
