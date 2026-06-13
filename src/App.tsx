import { useEffect, useMemo, useRef, useState } from "react";
import { CameraPreview } from "./components/CameraPreview";
import { FinishLineCalibration } from "./components/FinishLineCalibration";
import { FinishPassageList } from "./components/FinishPassageList";
import { LiveDebugOverlay } from "./components/LiveDebugOverlay";
import { mergeFinishEvents } from "./finish/finishEvents";
import { useFinishLine } from "./hooks/useFinishLine";
import { createMotionDetectionState, detectMotionFromVideo, resetMotionDetectionState } from "./motion/motionDetection";
import { updateRiderTracks } from "./tracking/riderTracking";
import type { FinishEvent, RiderTrack } from "./types";

const LIVE_DETECTION_INTERVAL_MS = 120;

type Sensitivity = "laag" | "normaal" | "hoog";
type DetectionZone = "smal" | "normaal" | "breed";

function cleanManualNumber(value: string): string {
  return value.replace(/[^0-9]/g, "").slice(0, 4);
}

export function App() {
  const { finishLine, setFinishLine, resetFinishLine } = useFinishLine();
  const [liveDetection, setLiveDetection] = useState(true);
  const [tracks, setTracks] = useState<RiderTrack[]>([]);
  const [finishEvents, setFinishEvents] = useState<FinishEvent[]>([]);
  const [manualNumber, setManualNumber] = useState("501");
  const [sensitivity, setSensitivity] = useState<Sensitivity>("normaal");
  const [detectionZone, setDetectionZone] = useState<DetectionZone>("normaal");
  const [showDebug, setShowDebug] = useState(true);
  const [now, setNow] = useState(() => Date.now());
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const motionStateRef = useRef(createMotionDetectionState());
  const lastLiveDetectionAtRef = useRef(0);

  useEffect(() => {
    resetMotionDetectionState(motionStateRef.current);
    lastLiveDetectionAtRef.current = 0;
  }, [liveDetection, finishLine, sensitivity, detectionZone]);

  useEffect(() => {
    let animationFrame = 0;

    function tick() {
      const timestamp = Date.now();
      setNow(timestamp);
      setFinishEvents((current) => mergeFinishEvents(current, [], timestamp));

      if (
        liveDetection &&
        finishLine &&
        videoRef.current &&
        timestamp - lastLiveDetectionAtRef.current >= LIVE_DETECTION_INTERVAL_MS
      ) {
        lastLiveDetectionAtRef.current = timestamp;
        const detections = detectMotionFromVideo(videoRef.current, motionStateRef.current, timestamp, {
          finishLine,
          manualNumber: cleanManualNumber(manualNumber),
          sensitivity,
          detectionZone,
        });

        setTracks((currentTracks) => {
          const result = updateRiderTracks(currentTracks, detections, finishLine, timestamp);
          if (result.finishEvents.length > 0) {
            setFinishEvents((currentEvents) => mergeFinishEvents(currentEvents, result.finishEvents, timestamp));
          }
          return result.tracks;
        });
      }

      animationFrame = requestAnimationFrame(tick);
    }

    animationFrame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animationFrame);
  }, [finishLine, liveDetection, manualNumber, sensitivity, detectionZone]);

  const recentCrossings = useMemo(
    () => finishEvents.filter((event) => now - event.crossedAt < 1000),
    [finishEvents, now]
  );

  function clearRace() {
    setTracks([]);
    setFinishEvents([]);
    resetMotionDetectionState(motionStateRef.current);
  }

  return (
    <main className="appShell raceModeShell">
      <header className="appHeader compactHeader">
        <div>
          <p className="eyebrow">Jury-hulpmiddel</p>
          <h1>BMX Finish Helper</h1>
        </div>
        <div className={`statusPill ${liveDetection && finishLine ? "active" : ""}`}>
          {liveDetection && finishLine ? "Live" : "Wacht"}
        </div>
      </header>

      <section className="raceDashboard">
        <section className="cameraCard raceCameraCard">
          <CameraPreview videoRef={videoRef}>
            <FinishLineCalibration
              finishLine={finishLine}
              onSave={(line) => {
                setFinishLine(line);
                clearRace();
              }}
              onReset={() => {
                resetFinishLine();
                clearRace();
              }}
            />
            <LiveDebugOverlay tracks={tracks} recentCrossings={recentCrossings} now={now} showBoxes={showDebug} />
          </CameraPreview>

          {!finishLine && <div className="warningBanner">Stel eerst de finishlijn in</div>}
        </section>

        <FinishPassageList events={finishEvents} now={now} />
      </section>

      <section className="controlsCard compactControls">
        <label className="manualNumberField compactNumberField">
          <span>Rijnummer</span>
          <input
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="bijv. 501"
            value={manualNumber}
            onChange={(event) => setManualNumber(cleanManualNumber(event.target.value))}
          />
        </label>

        <label className={`liveDetectionToggle compactToggle ${liveDetection ? "active" : ""}`}>
          <input
            type="checkbox"
            checked={liveDetection}
            onChange={(event) => setLiveDetection(event.target.checked)}
          />
          <span>
            <strong>Live detectie</strong>
            <small>Gebruikt voorlopig rijnummer #{cleanManualNumber(manualNumber) || "onbekend"}.</small>
          </span>
        </label>

        <div className="settingsGrid">
          <label>
            <span>Gevoeligheid</span>
            <select value={sensitivity} onChange={(event) => setSensitivity(event.target.value as Sensitivity)}>
              <option value="laag">Laag</option>
              <option value="normaal">Normaal</option>
              <option value="hoog">Hoog</option>
            </select>
          </label>
          <label>
            <span>Detectiezone</span>
            <select value={detectionZone} onChange={(event) => setDetectionZone(event.target.value as DetectionZone)}>
              <option value="smal">Smal</option>
              <option value="normaal">Normaal</option>
              <option value="breed">Breed</option>
            </select>
          </label>
        </div>

        <div className="buttonRow">
          <button className="secondaryButton" onClick={clearRace} type="button">
            Lijst wissen
          </button>
          <label className="smallCheck">
            <input type="checkbox" checked={showDebug} onChange={(event) => setShowDebug(event.target.checked)} />
            Debug
          </label>
        </div>

        {!finishLine && liveDetection && (
          <div className="inlineWarning">Live detectie werkt pas nadat je de finishlijn hebt ingesteld.</div>
        )}
      </section>
    </main>
  );
}
