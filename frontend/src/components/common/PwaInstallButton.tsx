import React, { useState, useEffect } from 'react';
import { Monitor, Download, CheckCircle } from 'lucide-react';

export const PwaInstallButton: React.FC<{ className?: string }> = ({ className = '' }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);

  useEffect(() => {
    // Check if already running in standalone mode (desktop app)
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsInstalled(true);
    }

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      // Fallback instruction toast/modal for Chrome/Edge desktop installation
      alert(
        "To install as a Desktop App on Windows/Mac:\n\n1. Click the 'Install App' icon in your browser address bar (top right).\nOR\n2. Open browser menu (⋮) -> Save and Share -> 'Install IntelligentLaundry as App'."
      );
    }
  };

  if (isInstalled) {
    return (
      <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-bold ${className}`}>
        <CheckCircle className="w-4 h-4 text-emerald-600" />
        <span>Desktop App Installed</span>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={handleInstallClick}
      className={`px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-black shadow-xs flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer ${className}`}
      title="Install IntelligentLaundry as a native Desktop App on Windows / Mac"
    >
      <Monitor className="w-4 h-4 text-brand-200" />
      <span>Install Desktop App</span>
      <Download className="w-3.5 h-3.5 opacity-80" />
    </button>
  );
};
