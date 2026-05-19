import React, { useRef, useState, useCallback, useEffect } from "react";
import { Camera, SwitchCamera, X } from "lucide-react";

interface CameraCaptureProps {
  onCapture: (file: File) => void;
  onCancel: () => void;
}

export function CameraCapture({ onCapture, onCancel }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
  const [error, setError] = useState<string | null>(null);

  const startCamera = useCallback(async () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    setError(null);
    try {
      let newStream;
      try {
        newStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode },
        });
      } catch (err: any) {
        // Fallback for devices that don't support specific facingMode
        if (err.name === "OverconstrainedError" || err.name === "NotFoundError") {
          newStream = await navigator.mediaDevices.getUserMedia({ video: true });
        } else {
          throw err;
        }
      }
      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
    } catch (err: any) {
      console.error("Error accessing camera:", err);
      if (err.name === "NotAllowedError") {
        setError("Camera access denied. Please allow camera permissions in your browser settings.");
      } else if (err.name === "NotFoundError") {
        setError("No camera found on this device.");
      } else {
        setError("Failed to access camera. Please try opening this link in Safari or Chrome, not inside another app.");
      }
    }
  }, [facingMode]);

  useEffect(() => {
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facingMode]);

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext("2d");
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], `photo_${Date.now()}.jpg`, { type: "image/jpeg" });
            onCapture(file);
          }
        }, "image/jpeg", 0.9);
      }
    }
  };

  const toggleCamera = () => {
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
  };

  return (
    <div className="flex flex-col items-center justify-center w-full h-full bg-background relative overflow-hidden rounded-xl border border-border">
      {error ? (
        <div className="p-6 text-center text-sm text-red-500 font-medium">
          <p>{error}</p>
          <button onClick={onCancel} className="mt-4 px-4 py-2 bg-muted text-foreground rounded-full hover:bg-border transition-colors">
            Go Back
          </button>
        </div>
      ) : (
        <>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-64 md:h-80 object-cover bg-black"
          />
          <canvas ref={canvasRef} className="hidden" />
          
          <div className="absolute bottom-4 left-0 right-0 flex justify-center items-center gap-6 z-10 px-4">
            <button
              onClick={onCancel}
              className="p-3 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/30 transition-colors"
              title="Cancel"
            >
              <X className="w-6 h-6" />
            </button>
            <button
              onClick={handleCapture}
              className="p-4 bg-primary text-primary-foreground rounded-full hover:bg-[#8AA496] shadow-lg transition-transform active:scale-95"
              title="Take Photo"
            >
              <Camera className="w-8 h-8" />
            </button>
            <button
              onClick={toggleCamera}
              className="p-3 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/30 transition-colors"
              title="Switch Camera"
            >
              <SwitchCamera className="w-6 h-6" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
