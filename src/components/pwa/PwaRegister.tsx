"use client";

import { useEffect, useState } from "react";
import { Download, X, Share, Smartphone, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export function PwaRegister() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSTip, setShowIOSTip] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // 1. Register Service Worker
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((registration) => {
            console.log("PWA: Service Worker registrado con éxito:", registration.scope);
          })
          .catch((error) => {
            console.warn("PWA: Error registrando Service Worker:", error);
          });
      });
    }

    // 2. Check if already installed / standalone
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as unknown as { standalone?: boolean }).standalone === true;

    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // Check if dismissed in this session
    const isDismissed = sessionStorage.getItem("pwa_install_dismissed");
    if (isDismissed) return;

    // 3. Detect iOS Safari
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    if (isIosDevice && !isStandalone) {
      // Delay showing iOS hint slightly
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 3000);
      return () => clearTimeout(timer);
    }

    // 4. Android / Chromium beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    window.addEventListener("appinstalled", () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      if (isIOS) {
        setShowIOSTip(true);
      }
      return;
    }

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setIsInstalled(true);
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setShowIOSTip(false);
    sessionStorage.setItem("pwa_install_dismissed", "true");
  };

  if (isInstalled || !showPrompt) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 left-3 right-3 sm:left-auto sm:right-6 sm:w-96 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="bg-zinc-900 text-white p-3.5 sm:p-4 rounded-xl shadow-2xl border border-zinc-800 flex flex-col gap-2.5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-9 w-9 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0 p-1.5 overflow-hidden">
              <img
                src="/icons/icon-192x192.png"
                alt="Logo Taller"
                className="w-full h-full object-contain"
                onError={(e) => {
                  e.currentTarget.src = "/logotaller.webp";
                }}
              />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs sm:text-sm font-semibold text-white truncate">
                Instalar App en el Celular
              </h4>
              <p className="text-[11px] text-zinc-400 leading-tight">
                Acceso rápido sin navegador y pantalla completa.
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-zinc-400 hover:text-white p-1 rounded-md transition-colors shrink-0"
            title="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {showIOSTip ? (
          <div className="bg-zinc-800/90 rounded-lg p-2.5 text-[11px] text-zinc-300 space-y-1.5 border border-zinc-700/60">
            <p className="font-medium text-white flex items-center gap-1.5">
              <Share className="h-3.5 w-3.5 text-blue-400 shrink-0" />
              Pasos para instalar en iPhone:
            </p>
            <ol className="list-decimal list-inside space-y-1 text-zinc-300">
              <li>Toca el botón <strong>Compartir</strong> <Share className="inline h-3 w-3 text-blue-400" /> en Safari.</li>
              <li>Desliza hacia abajo y elige <strong>"Agregar a pantalla de inicio"</strong>.</li>
              <li>Toca <strong>"Agregar"</strong> arriba a la derecha.</li>
            </ol>
          </div>
        ) : (
          <div className="flex items-center gap-2 pt-1">
            <Button
              size="sm"
              onClick={handleInstallClick}
              className="flex-1 bg-white hover:bg-zinc-100 text-zinc-900 font-semibold h-8 text-xs shadow-xs"
            >
              {isIOS ? (
                <>
                  <Smartphone className="h-3.5 w-3.5 mr-1.5 text-zinc-700" />
                  Ver cómo instalar
                </>
              ) : (
                <>
                  <Download className="h-3.5 w-3.5 mr-1.5 text-zinc-900" />
                  Instalar TallerSoft
                </>
              )}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDismiss}
              className="text-zinc-400 hover:text-white hover:bg-zinc-800 h-8 text-xs px-2.5"
            >
              Ahora no
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
