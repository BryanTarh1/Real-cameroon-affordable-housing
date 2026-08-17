import { useCallback, useEffect, useRef, useState } from "react";
import type { PublicLanguage } from "@/lib/marketplaceLocale";

export const AHC_LANGUAGE_STORAGE_KEY = "ahc-language";

function readStoredLanguage(): PublicLanguage {
  if (typeof window === "undefined") return "en";
  return window.localStorage.getItem(AHC_LANGUAGE_STORAGE_KEY) === "fr" ? "fr" : "en";
}

/** Keeps the public site and protected workspaces on the visitor's selected language. */
export function useMarketplaceLanguage() {
  const [language, setLanguageState] = useState<PublicLanguage>(readStoredLanguage);
  const [isLanguageTransitioning, setIsLanguageTransitioning] = useState(false);
  const transitionTimer = useRef<number | null>(null);

  const setLanguage = useCallback((next: PublicLanguage) => {
    if (next === language) return;
    if (transitionTimer.current) window.clearTimeout(transitionTimer.current);
    setIsLanguageTransitioning(true);
    setLanguageState(next);
    window.localStorage.setItem(AHC_LANGUAGE_STORAGE_KEY, next);
    transitionTimer.current = window.setTimeout(() => setIsLanguageTransitioning(false), 180);
  }, [language]);

  const toggleLanguage = useCallback(() => {
    setLanguage(language === "en" ? "fr" : "en");
  }, [language, setLanguage]);

  useEffect(() => {
    const syncStoredLanguage = (event: StorageEvent) => {
      if (event.key === AHC_LANGUAGE_STORAGE_KEY) setLanguageState(event.newValue === "fr" ? "fr" : "en");
    };
    window.addEventListener("storage", syncStoredLanguage);
    return () => window.removeEventListener("storage", syncStoredLanguage);
  }, []);

  useEffect(() => () => {
    if (transitionTimer.current) window.clearTimeout(transitionTimer.current);
  }, []);

  return { language, setLanguage, toggleLanguage, isLanguageTransitioning };
}
