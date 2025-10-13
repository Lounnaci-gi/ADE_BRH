import React from 'react';
import { WifiOff } from 'lucide-react';

function ApiStatusBanner({ online, onRetry }) {
  if (online) return null;
  return (
    <div className="sticky top-0 z-[60] w-full bg-red-600 text-white">
      <div className="mx-auto max-w-7xl px-4 py-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <WifiOff className="h-4 w-4" />
          <span className="text-sm font-medium">API indisponible. Vérifiez le serveur backend.</span>
        </div>
        <button
          onClick={onRetry}
          className="text-sm font-semibold underline underline-offset-4 hover:opacity-90"
        >
          Réessayer
        </button>
      </div>
    </div>
  );
}

export default ApiStatusBanner;
