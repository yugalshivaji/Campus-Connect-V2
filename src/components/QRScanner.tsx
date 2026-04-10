import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Html5Qrcode } from 'html5-qrcode';
import { motion } from 'motion/react';
import { X, Camera, RefreshCw, AlertCircle } from 'lucide-react';

interface QRScannerProps {
  onScan: (decodedText: string) => void;
  onClose: () => void;
  title?: string;
}

export default function QRScanner({ onScan, onClose, title = "Scan QR Code" }: QRScannerProps) {
  const [error, setError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const qrRef = useRef<Html5Qrcode | null>(null);
  const containerId = "qr-reader-container";

  useEffect(() => {
    const html5QrCode = new Html5Qrcode(containerId);
    qrRef.current = html5QrCode;

    const startScanner = async () => {
      try {
        setIsScanning(true);
        await html5QrCode.start(
          { facingMode: "environment" },
          {
            fps: 15,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0
          },
          (decodedText) => {
            onScan(decodedText);
            stopScanner();
          },
          (errorMessage) => {
            // Silent error for scanning
          }
        );
      } catch (err: any) {
        console.error("Failed to start scanner:", err);
        setError("Camera access denied or not found. Please ensure permissions are granted.");
        setIsScanning(false);
      }
    };

    const stopScanner = async () => {
      if (qrRef.current && qrRef.current.isScanning) {
        try {
          await qrRef.current.stop();
          setIsScanning(false);
        } catch (err) {
          console.error("Failed to stop scanner:", err);
        }
      }
    };

    startScanner();

    return () => {
      stopScanner();
    };
  }, [onScan]);

  const scannerContent = (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 md:p-8"
    >
      <div className="bg-background w-full max-w-md rounded-[2.5rem] overflow-hidden relative border border-white/10 shadow-2xl">
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <h3 className="text-xl font-black tracking-tight">{title}</h3>
          <button 
            onClick={onClose}
            className="w-10 h-10 glass rounded-full flex items-center justify-center text-secondary hover:text-foreground transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          <div className="relative aspect-square overflow-hidden rounded-3xl border-2 border-primary/20 bg-black/40">
            <div id={containerId} className="w-full h-full"></div>
            
            {error && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-black/60">
                <AlertCircle size={48} className="text-red-500 mb-4" />
                <p className="text-sm font-bold text-white mb-6">{error}</p>
                <button 
                  onClick={() => window.location.reload()}
                  className="px-6 py-3 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest"
                >
                  Retry Permissions
                </button>
              </div>
            )}

            {!error && isScanning && (
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[250px] h-[250px] border-2 border-primary rounded-2xl shadow-[0_0_0_100vmax_rgba(0,0,0,0.5)]">
                  <div className="absolute inset-0 animate-pulse bg-primary/10"></div>
                </div>
              </div>
            )}
          </div>
          
          <div className="mt-6 flex items-center gap-4 p-4 glass rounded-2xl border border-white/5">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
              <Camera size={20} />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-secondary mb-1">Scanner Active</p>
              <p className="text-sm font-medium">Position the QR code within the frame to scan automatically.</p>
            </div>
          </div>
        </div>

        <div className="p-6 bg-secondary/5 flex justify-center">
          <button 
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-secondary hover:text-primary transition-colors"
          >
            <RefreshCw size={14} />
            Reset Camera
          </button>
        </div>
      </div>
    </motion.div>
  );

  return createPortal(scannerContent, document.body);
}
