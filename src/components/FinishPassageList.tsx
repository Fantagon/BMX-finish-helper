import type { FinishEvent } from "../types";

type FinishPassageListProps = {
  events: FinishEvent[];
  now: number;
};

export function FinishPassageList({ events, now }: FinishPassageListProps) {
  return (
    <section className="finishListCard snapshotListCard">
      <div className="listHeader">
        <div>
          <h2>Terugkijkbeelden</h2>
          <p className="muted compactMuted">Laatste 8 finishpassages</p>
        </div>
      </div>
      {events.length === 0 ? (
        <p className="muted">Nog geen finishpassages.</p>
      ) : (
        <ol className="finishList snapshotList">
          {events.map((event, index) => {
            const ageSeconds = Math.max(0, Math.round((now - event.crossedAt) / 1000));
            return (
              <li key={event.id} className="snapshotItem">
                <span className="rank">{index + 1}.</span>
                {event.snapshotDataUrl ? (
                  <img className="snapshotThumb" src={event.snapshotDataUrl} alt={`Finishpassage ${index + 1}`} />
                ) : (
                  <span className="snapshotThumb snapshotPlaceholder">Geen beeld</span>
                )}
                <span className="snapshotMeta">
                  <span className="number">
                    {event.number ? `#${event.number}${event.numberSource === "ocr" ? "?" : ""}` : "Onbekend"}
                    {event.numberSource === "ocr" && <small className="ocrBadge">OCR</small>}
                    {event.numberSource === "virtual" && <small className="ocrBadge">Test</small>}
                  </span>
                  <span className="metaLine">
                    {typeof event.confidence === "number" ? `${Math.round(event.confidence * 100)}%` : "?"} · {ageSeconds}s geleden
                  </span>
                </span>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
