import type { FinishLine, Point } from "../types";

type FinishLineOverlayProps = {
  finishLine: FinishLine | null;
  pendingPoint?: Point | null;
};

export function FinishLineOverlay({ finishLine, pendingPoint }: FinishLineOverlayProps) {
  return (
    <svg className="overlaySvg" viewBox="0 0 1 1" preserveAspectRatio="none">
      {finishLine && (
        <>
          <line
            x1={finishLine.a.x}
            y1={finishLine.a.y}
            x2={finishLine.b.x}
            y2={finishLine.b.y}
            className="finishLineStroke"
          />
          <circle cx={finishLine.a.x} cy={finishLine.a.y} r="0.015" className="finishPoint" />
          <circle cx={finishLine.b.x} cy={finishLine.b.y} r="0.015" className="finishPoint" />
        </>
      )}
      {pendingPoint && <circle cx={pendingPoint.x} cy={pendingPoint.y} r="0.018" className="pendingPoint" />}
    </svg>
  );
}
