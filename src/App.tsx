import { useEffect, useMemo, useRef, useState } from "react";
import { CameraPreview } from "./components/CameraPreview";
import { FinishLineCalibration } from "./components/FinishLineCalibration";
import { FinishPassageList } from "./components/FinishPassageList";
import { TestModeOverlay } from "./components/TestModeOverlay";
import { mergeFinishEvents } from "./finish/finishEvents";
import { useFinishLine } from "./hooks/useFinishLine";
import { advanceSimulatedRiders, createSimulatedRider, simulatedRidersToDetections } from "./testMode/simulatedRiders";
import { updateRiderTracks } from "./tracking/riderTracking";
import type { FinishEvent, RiderTrack, SimulatedRider } from "./types";

export function App() {
  const { finishLine, setFinishLine, resetFinishLine } = useFinishLine();
  const [testMode, setTestMode] = useState(true);
  const [tracks, setTracks] = useState<RiderTrack[]>([]);
  const [finishEvents, setFinishEvents] = useState<FinishEvent[]>([]);
  const [simulatedRiders, setSimulatedRiders] = useState<SimulatedRider[]>([]);
  const [now, setNow] = useState(() => Date.now());
  const riderIndexRef = useRef(0);

  function addSimulatedRider() {
    setSimulatedRiders((current) => [...current, createSimulatedRider(riderIndexRef.current++)]);
  }

  function addRandomFinishEvent() {
    const timestamp = Date.now();
    const event: FinishEvent = {
      id: crypto.randomUUID(),
      trackId: crypto.randomUUID(),
      number: String([84, 17, 203, 9, 51][Math.floor(Math.random() * 5)]),
      confidence: 0.8 + Math.random() * 0.18,
      crossedAt: timestamp,
      crossingPoint: { x: 0.5, y: 0.5 },
    };

    setFinishEvents((current) => mergeFinishEvents(current, [event], timestamp));
  }

  useEffect(() => {
    let animationFrame = 0;

    function tick() {
      const timestamp = Date.now();
      setNow(timestamp);

      setFinishEvents((current) => mergeFinishEvents(current, [], timestamp));

      if (testMode) {
        setSimulatedRiders((currentRiders) => {
          const nextRiders = advanceSimulatedRiders(currentRiders);
          const detections = simulatedRidersToDetections(nextRiders, timestamp);

          setTracks((currentTracks) => {
            const result = updateRiderTracks(currentTracks, detections, finishLine, timestamp);
            if (result.finishEvents.length > 0) {
              setFinishEvents((currentEvents) =>
                mergeFinishEvents(currentEvents, result.finishEvents, timestamp)
              );
            }
            return result.tracks;
          });

          return nextRiders;
        });
      }

      animationFrame = requestAnimationFrame(tick);
    }

    animationFrame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animationFrame);
  }, [finishLine, testMode]);

  const recentCrossings = useMemo(
    () => finishEvents.filter((event) => now - event.crossedAt < 1000),
    [finishEvents, now]
  );

  return (
    <main className="appShell">
      <header className="appHeader">
        <div>
          <p className="eyebrow">Jury-hulpmiddel</p>
          <h1>BMX Finish Helper</h1>
        </div>
        <label className="toggle">
          <input
            type="checkbox"
            checked={testMode}
            onChange={(event) => setTestMode(event.target.checked)}
          />
          Testmodus
        </label>
      </header>

      <section className="cameraCard">
        <CameraPreview>
          <FinishLineCalibration
            finishLine={finishLine}
            onSave={setFinishLine}
            onReset={() => {
              resetFinishLine();
              setTracks([]);
              setFinishEvents([]);
            }}
          />
          {testMode && <TestModeOverlay tracks={tracks} recentCrossings={recentCrossings} now={now} />}
        </CameraPreview>

        {!finishLine && <div className="warningBanner">Stel eerst de finishlijn in</div>}
      </section>

      <section className="controlsCard">
        <button className="primaryButton wide" onClick={addSimulatedRider} type="button">
          Simuleer rider over finishlijn
        </button>
        <button className="secondaryButton wide" onClick={addRandomFinishEvent} type="button">
          Willekeurig finish-event
        </button>
      </section>

      <FinishPassageList events={finishEvents} now={now} />

      <section className="noteCard">
        <h2>Belangrijk</h2>
        <p>
          Deze app gebruikt in versie 1 een 2D-lijn in het camerabeeld. Bij een schuine camera kan
          perspectiefvertekening optreden. De app helpt de jury met een vermoedelijke volgorde, maar
          jurycontrole blijft leidend.
        </p>
      </section>
    </main>
  );
}
