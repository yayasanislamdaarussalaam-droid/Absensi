"use client";

import { useEffect, useRef, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";

interface ScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onScanFailure?: (error: any) => void;
}

export const Scanner = ({ onScanSuccess, onScanFailure }: ScannerProps) => {
  const [scannerReady, setScannerReady] = useState(false);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    if (!scannerRef.current) {
      scannerRef.current = new Html5QrcodeScanner(
        "reader",
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        false
      );

      scannerRef.current.render(
        (decodedText) => {
          onScanSuccess(decodedText);
          // Optional: clear scanner after success to prevent multiple scans
          // scannerRef.current?.clear();
        },
        (error) => {
          if (onScanFailure) onScanFailure(error);
        }
      );
      setScannerReady(true);
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch((error) => {
          console.error("Failed to clear scanner", error);
        });
        scannerRef.current = null;
      }
    };
  }, [onScanSuccess, onScanFailure]);

  return (
    <div className="w-full max-w-md mx-auto overflow-hidden rounded-xl bg-white shadow-lg">
      <div id="reader" className="w-full"></div>
      {!scannerReady && (
        <div className="p-8 text-center text-gray-500">
          Memulai kamera...
        </div>
      )}
    </div>
  );
};
