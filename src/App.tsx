import { useEffect, useMemo, useRef, useState } from "react";
import { CameraPreview } from "./components/CameraPreview";
import { FinishLineCalibration } from "./components/FinishLineCalibration";
import { FinishPassageList } from "./components/FinishPassageList";
import { LiveDebugOverlay } from "./components/LiveDebugOverlay";
import { mergeFinishEvents } from "./finish/finishEvents";
import { useFinishLine } from "./hooks/useFinishLine";
import { createMotionDetectionState, detectMotionFromVideo, resetMotionDetectionState } from "./motion/motionDetection";
import { recognizeNumberFromVideo } from "./ocr/numberOcr";
import { updateRiderTracks } from "./tracking/riderTracking";
import type { BoundingBox, FinishEvent, Point, RiderTrack } from "./types";

const LIVE_DETECTION_INTERVAL_MS = 120;
const VIRTUAL_TEST_NUMBERS = [9, 17, 84, 116, 203, 232, 323, 501, 777];

type Sensitivity = "laag" | "normaal" | "hoog";
type DetectionZone = "smal" | "normaal" | "breed";

export function App() {
  const { finishLine, setFinishLine, resetFinishLine } = useFinishLine();
  const [liveDetection, setLiveDetection] = useState(true);
  const [tracks, setTracks] = useState<RiderTrack[]>([]);
  const [finishEvents, setFinishEvents] = useState<FinishEvent[]>([]);
  const [sensitivity, setSensitivity] = useState<Sensitivity>("normaal");
  const [detectionZone, setDetectionZone] = useState<DetectionZone>("normaal");
  const [showDebug, setShowDebug] = useState(true);
  const [ocrEnabled, setOcrEnabled] = useState(false);
  const [ocrStatus, setOcrStatus] = useState("OCR uit");
  const [ocrRawText, setOcrRawText] = useState("");
  const [isManualScanRunning, setIsManualScanRunning] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const motionStateRef = useRef(createMotionDetectionState());
  const lastLiveDetectionAtRef = useRef(0);
  const ocrProcessedEventIdsRef = useRef(new Set<string>());

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
          sensitivity,
          detectionZone,
        });

        setTracks((currentTracks) => {
          const result = updateRiderTracks(currentTracks, detections, finishLine, timestamp);
          if (result.finishEvents.length > 0) {
            setFinishEvents((currentEvents) => mergeFinishEvents(currentEvents, result.finishEvents, timestamp));
            if (ocrEnabled) {
              void enrichFinishEventsWithOcr(result.finishEvents, result.tracks);
            }
          }
          return result.tracks;
        });
      }

      animationFrame = requestAnimationFrame(tick);
    }

    animationFrame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animationFrame);
  }, [finishLine, liveDetection, sensitivity, detectionZone, ocrEnabled]);

  const recentCrossings = useMemo(
    () => finishEvents.filter((event) => now - event.crossedAt < 1000),
    [finishEvents, now]
  );

  function clearRace() {
    setTracks([]);
    setFinishEvents([]);
    setOcrRawText("");
    ocrProcessedEventIdsRef.current.clear();
    resetMotionDetectionState(motionStateRef.current);
  }

  async function enrichFinishEventsWithOcr(events: FinishEvent[], currentTracks: RiderTrack[]) {
    if (!ocrEnabled || !videoRef.current) return;

    for (const event of events) {
      if (ocrProcessedEventIdsRef.current.has(event.id)) continue;
      ocrProcessedEventIdsRef.current.add(event.id);

      const track = currentTracks.find((candidate) => candidate.id === event.trackId);

      try {
        setOcrStatus("OCR leest nummer...");
        const result = await recognizeNumberFromVideo(videoRef.current, track?.bbox, { includeFullFrame: false });
        showOcrResult(result, "finishpassage");

        if (!result.number) continue;

        setFinishEvents((currentEvents) =>
          currentEvents.map((currentEvent) =>
            currentEvent.id === event.id
              ? {
                  ...currentEvent,
                  number: result.number,
                  confidence: result.confidence,
                  numberSource: "ocr",
                }
              : currentEvent
          )
        );
      } catch {
        setOcrStatus("OCR niet beschikbaar");
      }
    }
  }

  async function scanCurrentFrame() {
    if (!videoRef.current || isManualScanRunning) return;

    try {
      setIsManualScanRunning(true);
      setOcrEnabled(true);
      setOcrStatus("OCR scant huidig beeld...");
      setOcrRawText("");

      const result = await recognizeNumberFromVideo(videoRef.current, undefined, { includeFullFrame: true });
      showOcrResult(result, "handmatige scan");

      if (result.number) {
        const timestamp = Date.now();
        const crossingPoint = finishLine
          ? clampPoint({ x: (finishLine.a.x + finishLine.b.x) / 2, y: (finishLine.a.y + finishLine.b.y) / 2 })
          : { x: 0.5, y: 0.55 };

        const scanEvent: FinishEvent = {
          id: crypto.randomUUID(),
          trackId: `ocr-scan-${timestamp}`,
          number: result.number,
          confidence: result.confidence,
          numberSource: "ocr",
          crossedAt: timestamp,
          crossingPoint,
        };

        setFinishEvents((current) => mergeFinishEvents(current, [scanEvent], timestamp));
      }
    } catch {
      setOcrStatus("OCR niet beschikbaar");
    } finally {
      setIsManualScanRunning(false);
    }
  }

  function showOcrResult(result: { number?: string; rawText: string; candidates: string[]; attempts: number }, source: string) {
    const candidatesText = result.candidates.length > 0 ? result.candidates.join(", ") : "geen";
    setOcrRawText(result.rawText || "Geen OCR-tekst teruggekregen.");

    if (result.number) {
      setOcrStatus(`OCR ${source}: mogelijk #${result.number} | kandidaten: ${candidatesText}`);
    } else {
      setOcrStatus(`OCR ${source}: geen nummer gevonden | kandidaten: ${candidatesText}`);
    }
  }

  function runVirtualTestPassage() {
    const timestamp = Date.now();
    const number = String(VIRTUAL_TEST_NUMBERS[Math.floor(Math.random() * VIRTUAL_TEST_NUMBERS.length)]);
    const trackId = `virtual-test-${timestamp}`;
    const crossingPoint = finishLine
      ? clampPoint({
          x: (finishLine.a.x + finishLine.b.x) / 2,
          y: (finishLine.a.y + finishLine.b.y) / 2,
        })
      : { x: 0.5, y: 0.55 };

    const travelVector = finishLine ? getPerpendicularTravelVector(finishLine) : { x: 0, y: 1 };
    const previousPoint = clampPoint({
      x: crossingPoint.x - travelVector.x * 0.14,
      y: crossingPoint.y - travelVector.y * 0.14,
    });
    const currentPoint = clampPoint({
      x: crossingPoint.x + travelVector.x * 0.14,
      y: crossingPoint.y + travelVector.y * 0.14,
    });
    const bbox = makeVirtualBbox(currentPoint);

    const virtualTrack: RiderTrack = {
      id: trackId,
      number,
      confidence: 0.99,
      previousPoint,
      currentPoint,
      bbox,
      firstSeenAt: timestamp,
      lastSeenAt: timestamp,
      hasFinished: true,
    };

    const virtualEvent: FinishEvent = {
      id: crypto.randomUUID(),
      trackId,
      number,
      confidence: 0.99,
      numberSource: "virtual",
      crossedAt: timestamp,
      crossingPoint,
    };

    setShowDebug(true);
    setTracks((current) => [...current.filter((track) => !track.id.startsWith("virtual-test-")), virtualTrack]);
    setFinishEvents((current) => mergeFinishEvents(current, [virtualEvent], timestamp));
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
        <label className={`liveDetectionToggle compactToggle ${liveDetection ? "active" : ""}`}>
          <input
            type="checkbox"
            checked={liveDetection}
            onChange={(event) => setLiveDetection(event.target.checked)}
          />
          <span>
            <strong>Live detectie</strong>
            <small>Detecteert beweging over de finishlijn. OCR kan daarna experimenteel een nummer proberen te lezen.</small>
          </span>
        </label>

        <label className={`liveDetectionToggle compactToggle ${ocrEnabled ? "active" : ""}`}>
          <input
            type="checkbox"
            checked={ocrEnabled}
            onChange={(event) => {
              setOcrEnabled(event.target.checked);
              setOcrStatus(event.target.checked ? "OCR klaar" : "OCR uit");
              if (!event.target.checked) setOcrRawText("");
            }}
          />
          <span>
            <strong>OCR proberen</strong>
            <small>Experimenteel. Bij twijfel blijft de passage Onbekend of krijgt het nummer een vraagteken.</small>
          </span>
        </label>

        <button className="primaryButton scanButton" onClick={scanCurrentFrame} type="button" disabled={isManualScanRunning}>
          {isManualScanRunning ? "Scant beeld..." : "Scan huidig beeld"}
        </button>

        <div className="ocrStatus">{ocrStatus}</div>
        {ocrRawText && (
          <details className="ocrDetails">
            <summary>OCR debugtekst</summary>
            <p>{ocrRawText}</p>
          </details>
        )}

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

        <div className="buttonRow stackedOnSmall">
          <button className="secondaryButton testButton" onClick={runVirtualTestPassage} type="button">
            Virtuele testpassage
          </button>
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

function getPerpendicularTravelVector(line: { a: Point; b: Point }): Point {
  const dx = line.b.x - line.a.x;
  const dy = line.b.y - line.a.y;
  const length = Math.hypot(dx, dy) || 1;
  return {
    x: -dy / length,
    y: dx / length,
  };
}

function makeVirtualBbox(point: Point): BoundingBox {
  return {
    x: clamp(point.x - 0.055, 0, 1),
    y: clamp(point.y - 0.075, 0, 1),
    width: 0.11,
    height: 0.15,
  };
}

function clampPoint(point: Point): Point {
  return {
    x: clamp(point.x, 0, 1),
    y: clamp(point.y, 0, 1),
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
