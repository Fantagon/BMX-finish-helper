import { useState } from "react";
import type { FinishLine, Point } from "../types";
import { clampPoint } from "../geometry/finishLine";
import { FinishLineOverlay } from "./FinishLineOverlay";

type FinishLineCalibrationProps = {
  finishLine: FinishLine | null;
  onSave: (line: FinishLine) => void;
  onReset: () => void;
};

export function FinishLineCalibration({ finishLine, onSave, onReset }: FinishLineCalibrationProps) {
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [pointA, setPointA] = useState<Point | null>(null);

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (!isCalibrating) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const point = clampPoint({
      x: (event.clientX - rect.left) / rect.width,
      y: (event.clientY - rect.top) / rect.height,
    });

    if (!pointA) {
      setPointA(point);
      return;
    }

    onSave({ a: pointA, b: point });
    setPointA(null);
    setIsCalibrating(false);
  }

  function startCalibration() {
    setPointA(null);
    setIsCalibrating(true);
  }

  return (
    <div className="calibrationLayer" onPointerDown={handlePointerDown}>
      <FinishLineOverlay finishLine={finishLine} pendingPoint={pointA} />

      {isCalibrating && (
        <div className="calibrationHint">
          {!pointA ? "Tik punt A op de finishlijn" : "Tik punt B op de finishlijn"}
        </div>
      )}

      <div className="topControls">
        <button onClick={startCalibration} className="primaryButton" type="button">
          Finishlijn instellen
        </button>
        <button onClick={onReset} className="secondaryButton" type="button">
          Opnieuw instellen
        </button>
      </div>
    </div>
  );
}
