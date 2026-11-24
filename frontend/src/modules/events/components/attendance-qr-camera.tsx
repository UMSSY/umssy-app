'use client';

import { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import { Camera, Flashlight, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { AttendanceQrCameraProps } from '../types/attendance-qr-camera-props.types';

export function AttendanceQrCamera({ paused, onDetected }: AttendanceQrCameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectedRef = useRef(onDetected);
  const lockedRef = useRef(paused);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState('');
  const [torchSupported, setTorchSupported] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => { detectedRef.current = onDetected; }, [onDetected]);
  useEffect(() => { lockedRef.current = paused; }, [paused]);

  useEffect(() => {
    let cancelled = false;
    let frame = 0;
    let lastRead = 0;
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d', { willReadFrequently: true });

    function stopStream() {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      if (videoRef.current) videoRef.current.srcObject = null;
    }

    function readFrame(timestamp: number) {
      if (cancelled) return;
      const video = videoRef.current;
      if (!lockedRef.current && context && video && video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && timestamp - lastRead >= 150) {
        lastRead = timestamp;
        const scale = Math.min(1, 640 / video.videoWidth);
        canvas.width = Math.round(video.videoWidth * scale);
        canvas.height = Math.round(video.videoHeight * scale);
        if (canvas.width && canvas.height) {
          context.drawImage(video, 0, 0, canvas.width, canvas.height);
          const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
          const result = jsQR(pixels.data, pixels.width, pixels.height, { inversionAttempts: 'dontInvert' });
          if (result) {
            lockedRef.current = detectedRef.current(result.data);
          }
        }
      }
      frame = requestAnimationFrame(readFrame);
    }

    async function start() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError('Este navegador no permite usar la cámara. Puedes ingresar la referencia manualmente.');
        setStatus('error');
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: { ideal: facingMode } } });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        const track = stream.getVideoTracks()[0];
        const capabilities = track?.getCapabilities?.() as (MediaTrackCapabilities & { torch?: boolean }) | undefined;
        setTorchSupported(Boolean(capabilities?.torch));
        setTorchOn(false);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        if (!cancelled) {
          setStatus('ready');
          frame = requestAnimationFrame(readFrame);
        }
      } catch {
        if (!cancelled) {
          stopStream();
          setError('No se pudo abrir la cámara. Revisa los permisos o ingresa la referencia manualmente.');
          setStatus('error');
        }
      }
    }

    void start();
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      stopStream();
    };
  }, [facingMode, attempt]);

  async function toggleTorch() {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    try {
      await track.applyConstraints({ advanced: [{ torch: !torchOn } as MediaTrackConstraintSet] });
      setTorchOn(!torchOn);
    } catch {
      setTorchSupported(false);
    }
  }

  return (
    <div className="relative overflow-hidden rounded-lg bg-black text-white">
      <video ref={videoRef} playsInline muted autoPlay aria-label="Vista de la cámara para escanear pases" className="aspect-[3/4] w-full object-cover sm:aspect-video" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="aspect-square w-[70%] max-w-72 rounded-2xl border-4 border-accent ring-[999px] ring-ink/40" />
      </div>
      <div className="absolute inset-x-0 bottom-0 space-y-3 bg-gradient-to-t from-black/80 to-transparent p-4 text-center">
        <p className="text-sm">{status === 'ready' ? paused ? 'Lectura pausada' : 'Coloca el código QR dentro del marco' : status === 'loading' ? 'Abriendo cámara...' : error}</p>
        <div className="flex justify-center gap-3">
          {torchSupported && <Button type="button" variant="secondary" size="icon" aria-label={torchOn ? 'Apagar linterna' : 'Encender linterna'} onClick={() => { void toggleTorch(); }}><Flashlight aria-hidden="true" /></Button>}
          <Button type="button" variant="secondary" size="icon" aria-label="Cambiar cámara" onClick={() => { setStatus('loading'); setFacingMode((mode) => mode === 'environment' ? 'user' : 'environment'); }}><Camera aria-hidden="true" /></Button>
          {status === 'error' && <Button type="button" variant="secondary" onClick={() => { setStatus('loading'); setAttempt((value) => value + 1); }}><RefreshCw aria-hidden="true" />Reintentar</Button>}
        </div>
      </div>
    </div>
  );
}
