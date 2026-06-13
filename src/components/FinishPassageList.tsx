import type { FinishEvent } from "../types";

type FinishPassageListProps = {
  events: FinishEvent[];
  now: number;
};

export function FinishPassageList({ events, now }: FinishPassageListProps) {
  return (
    <section className="finishListCard">
      <h2>Recente finishpassages</h2>
      {events.length === 0 ? (
        <p className="muted">Nog geen finishpassages.</p>
      ) : (
        <ol className="finishList">
          {events.map((event, index) => {
            const ageSeconds = Math.max(0, Math.round((now - event.crossedAt) / 1000));
            return (
              <li key={event.id}>
                <span className="rank">{index + 1}.</span>
                <span className="number">
                  {event.number ? `#${event.number}${event.numberSource === "ocr" ? "?" : ""}` : "Onbekend"}
                  {event.numberSource === "ocr" && <small className="ocrBadge">OCR</small>}
                </span>
                <span className="confidence">
                  {typeof event.confidence === "number" ? `${Math.round(event.confidence * 100)}%` : "?"}
                </span>
                <span className="age">{ageSeconds}s</span>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
