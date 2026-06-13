import { useEffect, useRef } from "react";
import type { FinishEvent } from "../types";

type FinishPassageListProps = {
  events: FinishEvent[];
  now: number;
};

export function FinishPassageList({ events, now }: FinishPassageListProps) {
  const carouselRef = useRef<HTMLOListElement | null>(null);
  const newestEventId = events.length > 0 ? events[events.length - 1].id : undefined;

  useEffect(() => {
    const carousel = carouselRef.current;
    if (!carousel || !newestEventId) return;

    const animationFrame = requestAnimationFrame(() => {
      carousel.scrollTo({
        left: carousel.scrollWidth,
        behavior: "smooth",
      });
    });

    return () => cancelAnimationFrame(animationFrame);
  }, [newestEventId]);

  return (
    <section className="finishListCard snapshotCarouselCard">
      <div className="listHeader">
        <div>
          <h2>Terugkijkbeelden</h2>
          <p className="muted compactMuted">Laatste 8 finishpassages · swipe horizontaal</p>
        </div>
      </div>
      {events.length === 0 ? (
        <p className="muted">Nog geen finishpassages.</p>
      ) : (
        <ol ref={carouselRef} className="snapshotCarousel" aria-label="Terugkijkbeelden van finishpassages">
          {events.map((event, index) => {
            const ageSeconds = Math.max(0, Math.round((now - event.crossedAt) / 1000));
            return (
              <li key={event.id} className="snapshotCarouselItem">
                <div className="snapshotTopLine">
                  <span className="rank">{index + 1}.</span>
                  <span className="number">{event.number ? `#${event.number}` : "Onbekend"}</span>
                  {event.numberSource === "virtual" && <small className="ocrBadge">Test</small>}
                  <span className="metaLine">{ageSeconds}s</span>
                </div>
                {event.snapshotDataUrl ? (
                  <img className="carouselSnapshotImage" src={event.snapshotDataUrl} alt={`Finishpassage ${index + 1}`} />
                ) : (
                  <span className="carouselSnapshotImage snapshotPlaceholder">Geen beeld</span>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
