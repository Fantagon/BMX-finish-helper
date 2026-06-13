import type { FinishEvent, RiderTrack } from "../types";

type LiveDebugOverlayProps = {
  tracks: RiderTrack[];
  recentCrossings: FinishEvent[];
  now: number;
  showBoxes: boolean;
};

export function LiveDebugOverlay({ tracks, recentCrossings, now, showBoxes }: LiveDebugOverlayProps) {
  if (!showBoxes && recentCrossings.length === 0) return null;

  return (
    <svg className="overlaySvg debugOverlay" viewBox="0 0 1 1" preserveAspectRatio="none">
      {showBoxes &&
        tracks.map((track) => (
          <g key={track.id}>
            {track.previousPoint && (
              <line
                x1={track.previousPoint.x}
                y1={track.previousPoint.y}
                x2={track.currentPoint.x}
                y2={track.currentPoint.y}
                className="trackLine"
              />
            )}
            {track.bbox && (
              <rect
                x={track.bbox.x}
                y={track.bbox.y}
                width={track.bbox.width}
                height={track.bbox.height}
                className="bboxRect"
              />
            )}
            <circle cx={track.currentPoint.x} cy={track.currentPoint.y} r="0.012" className="riderDot" />
          </g>
        ))}

      {recentCrossings
        .filter((event) => now - event.crossedAt < 900)
        .map((event) => (
          <circle
            key={event.id}
            cx={event.crossingPoint.x}
            cy={event.crossingPoint.y}
            r="0.04"
            className="crossingPulse"
          />
        ))}
    </svg>
  );
}
