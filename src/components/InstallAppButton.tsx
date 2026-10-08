"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const subscribeNothing = () => () => {};

// Beeline is an installable web app: no app store needed. Android and desktop Chrome offer a
// one-tap install; iPhone and iPad install through Safari's Share menu, so we show those steps.
export function InstallAppButton({
  className = "",
  onDark = false,
}: {
  className?: string;
  onDark?: boolean;
}) {
  const [installEvent, setInstallEvent] = useState<InstallEvent | null>(null);
  const [justInstalled, setJustInstalled] = useState(false);
  const [showSteps, setShowSteps] = useState(false);

  // Read browser facts without an effect (and without a server/client mismatch).
  const alreadyInstalled = useSyncExternalStore(
    subscribeNothing,
    () =>
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true,
    () => false
  );
  const isIos = useSyncExternalStore(
    subscribeNothing,
    () => /iphone|ipad|ipod/i.test(navigator.userAgent),
    () => false
  );

  useEffect(() => {
    function onPrompt(e: Event) {
      e.preventDefault();
      setInstallEvent(e as InstallEvent);
    }
    function onInstalled() {
      setJustInstalled(true);
      setInstallEvent(null);
    }
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (alreadyInstalled || justInstalled) return null;

  async function handleClick() {
    if (installEvent) {
      await installEvent.prompt();
      await installEvent.userChoice;
      setInstallEvent(null);
    } else {
      setShowSteps((v) => !v);
    }
  }

  return (
    <div className={className}>
      <button
        onClick={handleClick}
        className={`rounded-md border border-accent px-4 py-2 text-sm font-semibold hover:bg-accent hover:text-accent-fg ${
          onDark ? "text-accent" : "text-accent-deep"
        }`}
      >
        Get the Beeline app
      </button>
      {showSteps && (
        <p className="mt-2 max-w-xs text-xs">
          {isIos
            ? "On iPhone or iPad: tap the Share button in Safari, then choose Add to Home Screen."
            : "In your browser menu, choose Install app or Add to Home screen."}
        </p>
      )}
    </div>
  );
}
