"use client";

import { useState, useEffect } from "react";
import { Download, X } from "lucide-react";

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
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Only show if not dismissed in this session
      const dismissed = sessionStorage.getItem("pwa-dismissed");
      if (!dismissed) {
        setIsVisible(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handler);

    // Check if app is already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsVisible(false);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === "accepted") {
      console.log("User accepted the install prompt");
    } else {
      console.log("User dismissed the install prompt");
    }

    // We've used the prompt, and can't use it again, so clear it
    setDeferredPrompt(null);
    setIsVisible(false);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
    sessionStorage.setItem("pwa-dismissed", "true");
  };

  if (!isVisible || isDismissed) return null;

  return (
    <div className="flex items-center gap-2 bg-indigo-600 text-white pl-4 pr-2 py-2 rounded-full shadow-2xl shadow-indigo-200 animate-in slide-in-from-right-10 duration-500">
      <button
        onClick={handleInstallClick}
        className="flex items-center gap-2 text-xs font-black uppercase tracking-widest active:scale-95 transition-all"
      >
        <Download size={14} />
        Install App
      </button>
      <div className="w-[1px] h-4 bg-white/20 mx-1" />
      <button 
        onClick={handleDismiss}
        className="p-1 hover:bg-white/10 rounded-full transition-all"
      >
        <X size={14} />
      </button>
    </div>
  );
};
