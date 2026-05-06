"use client";

import { useEffect, useRef, useState } from "react";
import { Camera as CameraIcon, RotateCcw, Check } from "lucide-react";

interface CameraProps {
  onCapture: (base64: string) => void;
  onCancel: () => void;
}

export const Camera = ({ onCapture, onCancel }: CameraProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      alert("Gagal mengakses kamera. Pastikan izin kamera sudah diberikan.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
  };

  const capture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const base64 = canvas.toDataURL("image/jpeg", 0.7);
        setCapturedImage(base64);
        stopCamera();
      }
    }
  };

  const retake = () => {
    setCapturedImage(null);
    startCamera();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-4">
      <div className="relative w-full max-w-md aspect-[3/4] bg-slate-900 rounded-3xl overflow-hidden shadow-2xl">
        {!capturedImage ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <img
            src={capturedImage}
            alt="Captured"
            className="w-full h-full object-cover"
          />
        )}
        
        <canvas ref={canvasRef} className="hidden" />
      </div>

      <div className="mt-8 flex items-center gap-6">
        {!capturedImage ? (
          <>
            <button
              onClick={onCancel}
              className="px-6 py-2 text-white font-bold opacity-50 hover:opacity-100"
            >
              Batal
            </button>
            <button
              onClick={capture}
              className="w-20 h-20 bg-white rounded-full border-8 border-slate-800 flex items-center justify-center shadow-lg active:scale-90 transition-all"
            >
              <div className="w-14 h-14 bg-indigo-600 rounded-full flex items-center justify-center">
                <CameraIcon className="text-white" />
              </div>
            </button>
            <div className="w-12" /> {/* spacer */}
          </>
        ) : (
          <>
            <button
              onClick={retake}
              className="w-16 h-16 bg-slate-800 text-white rounded-full flex items-center justify-center hover:bg-slate-700 transition-all"
            >
              <RotateCcw size={24} />
            </button>
            <button
              onClick={() => onCapture(capturedImage)}
              className="w-20 h-20 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-emerald-600 transition-all"
            >
              <Check size={32} />
            </button>
          </>
        )}
      </div>
      
      <p className="mt-6 text-slate-400 text-sm font-medium">
        {!capturedImage ? "Posisikan wajah di tengah layar" : "Sudah oke fotonya?"}
      </p>
    </div>
  );
};
