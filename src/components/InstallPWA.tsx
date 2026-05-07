"use client";

import { useState, useEffect } from "react";
import { Download, X, Share, PlusSquare, MoreVertical, Smartphone } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export const InstallPWA = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showManual, setShowManual] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Detect iOS
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(ios);

    // Detect if already installed
    setIsStandalone(window.matchMedia("(display-mode: standalone)").matches);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstallClick = async () => {
    console.log("Install button clicked, prompt status:", !!deferredPrompt);
    
    if (deferredPrompt) {
      // Ini adalah cara paling 'langsung' yang dibolehin browser
      deferredPrompt.prompt();
      
      const { outcome } = await deferredPrompt.userChoice;
      console.log("Install outcome:", outcome);
      
      if (outcome === "accepted") {
        setDeferredPrompt(null);
      }
    } else {
      // Kalau deferredPrompt belum siap, berarti browser belum kasih ijin instal otomatis
      console.warn("Browser hasn't triggered install prompt yet.");
      setShowManual(true);
    }
  };

  if (isStandalone || isDismissed) return null;

  return (
    <>
      {/* Floating Install Button */}
      <div className="flex items-center gap-2 bg-indigo-600 text-white pl-4 pr-2 py-2.5 rounded-full shadow-2xl shadow-indigo-300 animate-bounce-slow">
        <button
          onClick={handleInstallClick}
          className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all"
        >
          <Download size={14} />
          Download & Install
        </button>
        <div className="w-[1px] h-4 bg-white/20 mx-1" />
        <button 
          onClick={() => setIsDismissed(true)}
          className="p-1 hover:bg-white/10 rounded-full transition-all"
        >
          <X size={14} />
        </button>
      </div>

      {/* Manual Install Instruction Modal */}
      {showManual && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl animate-in slide-in-from-bottom duration-500">
            <div className="flex justify-between items-start mb-6">
              <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600">
                <Smartphone size={24} />
              </div>
              <button onClick={() => setShowManual(false)} className="p-2 bg-slate-100 rounded-full text-slate-400">
                <X size={20} />
              </button>
            </div>

            <h3 className="text-xl font-black text-slate-900 mb-2">Cara Download / Pasang</h3>
            <p className="text-sm text-slate-500 mb-8 leading-relaxed">
              Biar gampang absen, pasang aplikasi ini di layar utama HP lu:
            </p>

            <div className="space-y-6">
              {isIOS ? (
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center shrink-0 font-bold text-xs text-indigo-600">1</div>
                    <p className="text-sm font-bold text-slate-700">Klik ikon <Share className="inline-block mx-1 text-indigo-600" size={18} /> (Share) di Safari</p>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center shrink-0 font-bold text-xs text-indigo-600">2</div>
                    <p className="text-sm font-bold text-slate-700">Pilih menu <span className="text-indigo-600 underline">Add to Home Screen</span></p>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center shrink-0 font-bold text-xs text-indigo-600">3</div>
                    <p className="text-sm font-bold text-slate-700">Klik <span className="font-black">Add</span> di pojok kanan atas</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center shrink-0 font-bold text-xs text-indigo-600">1</div>
                    <p className="text-sm font-bold text-slate-700">Klik titik tiga <MoreVertical className="inline-block mx-1 text-indigo-600" size={18} /> di pojok browser</p>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center shrink-0 font-bold text-xs text-indigo-600">2</div>
                    <p className="text-sm font-bold text-slate-700">Cari menu <span className="text-indigo-600 underline">Install App</span> atau <span className="text-indigo-600 underline">Add to Home Screen</span></p>
                  </div>
                </div>
              )}
            </div>

            <button 
              onClick={() => setShowManual(false)}
              className="w-full mt-10 bg-indigo-600 py-4 rounded-2xl text-white font-black text-sm shadow-xl shadow-indigo-100 active:scale-95 transition-all"
            >
              Oke, Mengerti!
            </button>
          </div>
        </div>
      )}
    </>
  );
};
