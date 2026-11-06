"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import Script from "next/script";
import { usePathname } from "next/navigation";
import {
  CONSENT_KEY,
  GA_ENABLED,
  GA_MEASUREMENT_ID,
  REOPEN_EVENT,
  isPrivatePath,
  reportedLocation,
} from "@/lib/analytics";

type GtagWindow = Window & {
  dataLayer?: unknown[];
  gtag?: (...args: unknown[]) => void;
  [key: `ga-disable-${string}`]: boolean | undefined;
};
const gw = () => window as unknown as GtagWindow;

// "pending" is only ever the server render, before the browser's saved answer can be read.
type Choice = "granted" | "denied" | "unset" | "pending";
const CHOICE_CHANGED = "beeline:analytics-choice-changed";

function readChoice(): Choice {
  try {
    const value = window.localStorage.getItem(CONSENT_KEY);
    return value === "granted" || value === "denied" ? value : "unset";
  } catch {
    return "unset";
  }
}

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(CHOICE_CHANGED, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHOICE_CHANGED, onChange);
  };
}

function saveChoice(choice: "granted" | "denied") {
  try {
    window.localStorage.setItem(CONSENT_KEY, choice);
  } catch {
    // Private browsing can block storage; the choice then lasts until the page is closed.
  }
  window.dispatchEvent(new Event(CHOICE_CHANGED));
}

// Counts visits with Google Analytics, only for visitors who press Accept. Nothing loads before that, and pages with
// private booking or password links are never reported. Renders nothing at all until a measurement ID is configured.
export function Analytics() {
  const pathname = usePathname();
  const choice = useSyncExternalStore<Choice>(subscribe, readChoice, () => "pending");
  const [reopened, setReopened] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    if (!GA_ENABLED) return;
    const reopen = () => setReopened(true);
    window.addEventListener(REOPEN_EVENT, reopen);
    return () => window.removeEventListener(REOPEN_EVENT, reopen);
  }, []);

  const allowed = GA_ENABLED && choice === "granted";
  const privatePage = isPrivatePath(pathname);

  // Google's own off switch: nothing is collected unless the visitor accepted and the page is not private,
  // even from Google's automatic page-change events.
  useEffect(() => {
    if (!GA_ENABLED) return;
    gw()[`ga-disable-${GA_MEASUREMENT_ID}`] = !allowed || privatePage;
  }, [allowed, privatePage]);

  // Set the tag up the first time analytics is allowed on a page that is not private, then report each page.
  useEffect(() => {
    if (!allowed || privatePage) return;
    const w = gw();
    if (!started.current) {
      started.current = true;
      w.dataLayer = w.dataLayer || [];
      w.gtag = function gtag() {
        // gtag.js only understands the `arguments` object, not an array.
        // eslint-disable-next-line prefer-rest-params
        w.dataLayer!.push(arguments);
      };
      w.gtag("js", new Date());
      w.gtag("config", GA_MEASUREMENT_ID, {
        send_page_view: false, // sent below with the private parts of the address removed
        allow_google_signals: false,
        allow_ad_personalization_signals: false,
      });
    }
    w.gtag?.("event", "page_view", {
      page_location: reportedLocation(window.location.origin, pathname, window.location.search),
      page_path: pathname,
      page_title: document.title,
    });
  }, [allowed, privatePage, pathname]);

  function decide(next: "granted" | "denied") {
    saveChoice(next);
    setReopened(false);
  }

  if (!GA_ENABLED) return null;
  const bannerOpen = choice === "unset" || (reopened && choice !== "pending");

  return (
    <>
      {allowed && !privatePage && (
        <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`} strategy="afterInteractive" />
      )}
      {bannerOpen && (
        <div
          role="dialog"
          aria-label="Analytics choice"
          className="fixed inset-x-0 bottom-0 z-50 border-t border-card-border bg-background p-4 shadow-lg"
        >
          <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm">
              Can we count visits with Google Analytics to see which pages are useful? It only records which pages are
              viewed, never your name, email or booking details.{" "}
              <Link href="/privacy" className="underline">
                Privacy policy
              </Link>
            </p>
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                onClick={() => decide("denied")}
                className="rounded-md border border-card-border px-4 py-2 text-sm font-semibold hover:border-accent"
              >
                No thanks
              </button>
              <button
                type="button"
                onClick={() => decide("granted")}
                className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-fg transition hover:bg-accent-hover"
              >
                Accept
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
