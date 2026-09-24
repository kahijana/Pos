import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Camera, X, Flashlight, RefreshCw, AlertCircle, CheckCircle2, Search } from 'lucide-react';
import { playScanSuccessSound } from '../utils/audio';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (barcode: string) => void;
  title?: string;
  subtitle?: string;
}

export default function BarcodeScannerModal({
  isOpen,
  onClose,
  onScanSuccess,
  title = 'Pindai Barcode Barang',
  subtitle = 'Arahkan kamera ke barcode pada produk',
}: BarcodeScannerModalProps) {
  const [scannerError, setScannerError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const [torchOn, setTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const [cameras, setCameras] = useState<Array<{ id: string; label: string }>>([]);
  const [currentCameraIndex, setCurrentCameraIndex] = useState<number>(0);
  const [isInitializing, setIsInitializing] = useState(true);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerId = 'barcode-scanner-viewport';

  useEffect(() => {
    if (!isOpen) {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {}).finally(() => {
          scannerRef.current?.clear();
          scannerRef.current = null;
        });
      }
      setLastScanned(null);
      setScannerError(null);
      return;
    }

    let isMounted = true;
    setIsInitializing(true);
    setScannerError(null);

    const startScanner = async () => {
      try {
        const devices = await Html5Qrcode.getCameras();
        if (!isMounted) return;

        if (!devices || devices.length === 0) {
          setScannerError('Tidak ada kamera terdeteksi di perangkat ini.');
          setIsInitializing(false);
          return;
        }

        setCameras(devices);

        // Pick back camera if available
        let selectedId = devices[0].id;
        const backCamIndex = devices.findIndex((d) =>
          d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('rear') || d.label.toLowerCase().includes('environment')
        );
        if (backCamIndex !== -1) {
          selectedId = devices[backCamIndex].id;
          setCurrentCameraIndex(backCamIndex);
        }

        const html5QrCode = new Html5Qrcode(containerId, {
          formatsToSupport: [
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.QR_CODE,
          ],
          verbose: false,
        });

        scannerRef.current = html5QrCode;

        await html5QrCode.start(
          selectedId,
          {
            fps: 15,
            qrbox: { width: 280, height: 180 },
            aspectRatio: 1.333,
          },
          (decodedText) => {
            if (!isMounted) return;
            playScanSuccessSound();
            setLastScanned(decodedText);
            onScanSuccess(decodedText);
          },
          () => {
            // Ignore scan attempt misses
          }
        );

        // Check torch capability
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const track = (html5QrCode as any).getRunningTrackCameraCapabilities?.();
          if (track && track.torchFeature().isSupported()) {
            setHasTorch(true);
          }
        } catch {
          setHasTorch(false);
        }

        if (isMounted) {
          setIsInitializing(false);
        }
      } catch (err: unknown) {
        if (!isMounted) return;
        setIsInitializing(false);
        const errString = err instanceof Error ? err.message : String(err);
        if (errString.includes('Permission') || errString.includes('NotAllowedError')) {
          setScannerError('Izin akses kamera ditolak. Berikan izin kamera pada browser untuk memindai barcode.');
        } else {
          setScannerError('Gagal mengakses kamera: ' + errString);
        }
      }
    };

    const timer = setTimeout(() => {
      startScanner();
    }, 150);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {}).finally(() => {
          scannerRef.current?.clear();
          scannerRef.current = null;
        });
      }
    };
  }, [isOpen, onScanSuccess]);

  const switchCamera = async () => {
    if (cameras.length <= 1 || !scannerRef.current) return;
    const nextIndex = (currentCameraIndex + 1) % cameras.length;
    setCurrentCameraIndex(nextIndex);

    try {
      await scannerRef.current.stop();
      await scannerRef.current.start(
        cameras[nextIndex].id,
        {
          fps: 15,
          qrbox: { width: 280, height: 180 },
          aspectRatio: 1.333,
        },
        (decodedText) => {
          playScanSuccessSound();
          setLastScanned(decodedText);
          onScanSuccess(decodedText);
        },
        () => {}
      );
    } catch {
      // ignore
    }
  };

  const toggleTorch = async () => {
    if (!scannerRef.current) return;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const capabilities = (scannerRef.current as any).getRunningTrackCameraCapabilities?.();
      if (capabilities && capabilities.torchFeature().isSupported()) {
        const newState = !torchOn;
        await capabilities.torchFeature().apply(newState);
        setTorchOn(newState);
      }
    } catch {
      // ignore
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    playScanSuccessSound();
    onScanSuccess(manualCode.trim());
    setManualCode('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950/95 backdrop-blur-md">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 text-white shrink-0">
        <div>
          <h2 className="text-base font-semibold tracking-tight">{title}</h2>
          <p className="text-xs text-slate-400">{subtitle}</p>
        </div>
        <button
          onClick={onClose}
          className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
          aria-label="Tutup kamera"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Viewport */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 relative overflow-hidden">
        {/* Scanner container */}
        <div className="w-full max-w-sm aspect-[4/3] relative rounded-2xl overflow-hidden bg-black border border-slate-800 shadow-2xl flex items-center justify-center">
          <div id={containerId} className="w-full h-full" />

          {/* Aim Reticle Overlay */}
          {!scannerError && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="w-[80%] h-[60%] border-2 border-emerald-400/80 rounded-xl relative shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                {/* Corner markers */}
                <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-emerald-400 rounded-tl -mt-1 -ml-1" />
                <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-emerald-400 rounded-tr -mt-1 -mr-1" />
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-emerald-400 rounded-bl -mb-1 -ml-1" />
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-emerald-400 rounded-br -mb-1 -mr-1" />

                {/* Animated scan line */}
                <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-emerald-500/0 via-emerald-400 to-emerald-500/0 animate-pulse shadow-[0_0_8px_#34d399]" />
              </div>
            </div>
          )}

          {/* Loading state */}
          {isInitializing && !scannerError && (
            <div className="absolute inset-0 bg-slate-900/90 flex flex-col items-center justify-center gap-3 text-slate-300">
              <Camera className="w-8 h-8 animate-pulse text-emerald-400" />
              <span className="text-xs">Mengaktifkan kamera...</span>
            </div>
          )}

          {/* Scanner error fallback */}
          {scannerError && (
            <div className="absolute inset-0 bg-slate-900/95 flex flex-col items-center justify-center p-6 text-center">
              <AlertCircle className="w-10 h-10 text-amber-400 mb-2" />
              <p className="text-xs text-slate-300 mb-4">{scannerError}</p>
              <p className="text-[11px] text-slate-400">Gunakan kolom input manual di bawah untuk memasukkan barcode.</p>
            </div>
          )}
        </div>

        {/* Camera action buttons */}
        <div className="flex items-center gap-3 mt-4">
          {hasTorch && (
            <button
              onClick={toggleTorch}
              className={`min-h-[44px] px-4 rounded-xl flex items-center gap-2 text-xs font-medium transition-colors ${
                torchOn ? 'bg-amber-500 text-slate-950 font-semibold' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Flashlight className="w-4 h-4" />
              <span>{torchOn ? 'Senter Aktif' : 'Nyalakan Senter'}</span>
            </button>
          )}

          {cameras.length > 1 && (
            <button
              onClick={switchCamera}
              className="min-h-[44px] px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-2 text-xs font-medium transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Ganti Kamera</span>
            </button>
          )}
        </div>

        {/* Last scanned preview indicator */}
        {lastScanned && (
          <div className="mt-3 px-3 py-1.5 rounded-lg bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 animate-bounce">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Barcode terdeteksi: <strong className="font-mono">{lastScanned}</strong></span>
          </div>
        )}
      </div>

      {/* Manual Input Footer */}
      <div className="px-4 py-3 bg-slate-900 border-t border-slate-800 shrink-0">
        <form onSubmit={handleManualSubmit} className="flex gap-2 max-w-md mx-auto">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="Ketik barcode / kode manual..."
              className="w-full h-11 pl-9 pr-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <button
            type="submit"
            className="min-h-[44px] px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white font-medium text-xs tracking-tight transition-all"
          >
            Input
          </button>
        </form>
      </div>
    </div>
  );
}
