import { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="fixed top-14 left-4 right-4 max-w-sm mx-auto z-50 flex items-center justify-center gap-2 rounded-xl bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white shadow-lg shadow-amber-600/30 animate-pulse">
      <WifiOff className="w-3.5 h-3.5 shrink-0" />
      <span>Mode Offline — Aplikasi & inventaris tetap dapat digunakan</span>
    </div>
  );
}
