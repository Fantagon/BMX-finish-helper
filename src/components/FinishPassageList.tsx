import type { FinishEvent } from "../types";

type FinishPassageListProps = {
  events: FinishEvent[];
  now: number;
};

export function FinishPassageList({ events, now }: FinishPassageListProps) {
  return (
    <section className="finishListCard snapshotListCard largeSnapshotListCard">
      <div className="listHeader">
        <div>
          <h2>Terugkijkbeelden</h2>
          <p className="muted compactMuted">Laatste 8 finishpassages</p>
        </div>
      </div>
      {events.length === 0 ? (
        <p className="muted">Nog geen finishpassages.</p>
      ) : (
        <ol className="finishList snapshotList largeSnapshotList">
          {events.map((event, index) => {
            const ageSeconds = Math.max(0, Math.round((now - event.crossedAt) / 1000));
            return (
              <li key={event.id} className="snapshotItem largeSnapshotItem">
                <div className="snapshotTopLine">
                  <span className="rank">{index + 1}.</span>
                  <span className="number">{event.number ? `#${event.number}` : "Onbekend"}</span>
                  {event.numberSource === "virtual" && <small className="ocrBadge">Test</small>}
                  <span className="metaLine">{ageSeconds}s geleden</span>
                </div>
                {event.snapshotDataUrl ? (
                  <img className="snapshotThumb largeSnapshotImage" src={event.snapshotDataUrl} alt={`Finishpassage ${index + 1}`} />
                ) : (
                  <span className="snapshotThumb largeSnapshotImage snapshotPlaceholder">Geen beeld</span>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
