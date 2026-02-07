import { useState, useRef, useCallback, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Camera, RotateCcw, Check, X } from 'lucide-react';

interface CameraCaptureProps {
  open: boolean;
  onClose: () => void;
  onCapture: (blob: Blob) => void;
  title?: string;
}

export function CameraCapture({ open, onClose, onCapture, title = 'Tire sua foto' }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [captured, setCaptured] = useState<string | null>(null);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const startCamera = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      setCaptured(null);
      setCapturedBlob(null);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err: any) {
      console.error('Camera error:', err);
      setError('Não foi possível acessar a câmera. Verifique as permissões do navegador.');
    } finally {
      setLoading(false);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (open) {
      startCamera();
    } else {
      stopCamera();
      setCaptured(null);
      setCapturedBlob(null);
    }
    return () => stopCamera();
  }, [open, startCamera, stopCamera]);

  const takePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Espelhar horizontalmente para câmera frontal
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    setCaptured(dataUrl);

    canvas.toBlob((blob) => {
      if (blob) setCapturedBlob(blob);
    }, 'image/jpeg', 0.8);

    stopCamera();
  }, [stopCamera]);

  const retake = useCallback(() => {
    setCaptured(null);
    setCapturedBlob(null);
    startCamera();
  }, [startCamera]);

  const confirm = useCallback(() => {
    if (capturedBlob) {
      onCapture(capturedBlob);
      onClose();
    }
  }, [capturedBlob, onCapture, onClose]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md w-[95vw] p-4">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Camera className="h-5 w-5" />
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {error ? (
            <div className="text-center py-8">
              <Camera className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
              <p className="text-sm text-destructive">{error}</p>
              <Button variant="outline" size="sm" onClick={startCamera} className="mt-3">
                Tentar novamente
              </Button>
            </div>
          ) : captured ? (
            <div className="relative">
              <img src={captured} alt="Foto capturada" className="w-full rounded-lg" />
              <div className="flex gap-2 mt-3">
                <Button variant="outline" onClick={retake} className="flex-1">
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Tirar outra
                </Button>
                <Button onClick={confirm} className="flex-1">
                  <Check className="h-4 w-4 mr-1" />
                  Confirmar
                </Button>
              </div>
            </div>
          ) : (
            <div className="relative">
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-muted rounded-lg z-10">
                  <p className="text-sm text-muted-foreground animate-pulse">Abrindo câmera...</p>
                </div>
              )}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full rounded-lg bg-black"
                style={{ transform: 'scaleX(-1)' }}
              />
              <Button
                onClick={takePhoto}
                size="lg"
                className="w-full mt-3"
                disabled={loading}
              >
                <Camera className="h-5 w-5 mr-2" />
                Capturar Foto
              </Button>
            </div>
          )}
        </div>

        <canvas ref={canvasRef} className="hidden" />
      </DialogContent>
    </Dialog>
  );
}
