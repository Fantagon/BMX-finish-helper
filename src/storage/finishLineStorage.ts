import type { FinishLine } from "../types";

const FINISH_LINE_STORAGE_KEY = "bmxFinishHelper.finishLine";

export function saveFinishLine(line: FinishLine): void {
  localStorage.setItem(FINISH_LINE_STORAGE_KEY, JSON.stringify(line));
}

export function loadFinishLine(): FinishLine | null {
  const raw = localStorage.getItem(FINISH_LINE_STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as FinishLine;
    if (!isValidFinishLine(parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearFinishLine(): void {
  localStorage.removeItem(FINISH_LINE_STORAGE_KEY);
}

function isValidFinishLine(value: FinishLine): boolean {
  return Boolean(
    value &&
      value.a &&
      value.b &&
      typeof value.a.x === "number" &&
      typeof value.a.y === "number" &&
      typeof value.b.x === "number" &&
      typeof value.b.y === "number"
  );
}
