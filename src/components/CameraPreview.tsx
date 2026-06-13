import { useEffect, useRef, useState } from "react";

type CameraPreviewProps = {
  children?: React.ReactNode;
};

export function CameraPreview({ children }: CameraPreviewProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let cancelled = false;

    async function startCamera() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });

        if (!cancelled && videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch {
        setError(
          "Camera niet beschikbaar. Open de app via HTTPS en geef camera-toestemming."
        );
      }
    }

    startCamera();

    return () => {
      cancelled = true;
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  return (
    <div className="cameraShell">
      <video ref={videoRef} className="cameraVideo" playsInline muted autoPlay />
      {children}
      {error && <div className="cameraError">{error}</div>}
    </div>
  );
}
