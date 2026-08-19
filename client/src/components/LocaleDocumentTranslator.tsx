import React, { useEffect, useRef } from "react";
import { Languages } from "lucide-react";
import { useLocation } from "wouter";
import { useMarketplaceLanguage } from "@/hooks/useMarketplaceLanguage";
import { isAhcInterfaceTranslation, translateAhcInterfaceText } from "@/lib/uiFrench";

const ignoredTags = new Set(["SCRIPT", "STYLE", "TEXTAREA", "CODE", "PRE"]);
const translatedText = new WeakMap<Text, string>();

function shouldSkip(node: Text) {
  const parent = node.parentElement;
  return !parent || ignoredTags.has(parent.tagName) || parent.closest("[data-ahc-no-translate]") !== null;
}

function applyLocale(language: "en" | "fr") {
  document.documentElement.lang = language;
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode() as Text | null;
  while (node) {
    if (!shouldSkip(node)) {
      const original = translatedText.get(node) ?? node.nodeValue ?? "";
      if (!translatedText.has(node) && isAhcInterfaceTranslation(original)) translatedText.set(node, original);
      const source = translatedText.get(node);
      if (source) {
        const nextValue = translateAhcInterfaceText(source, language);
        if (node.nodeValue !== nextValue) node.nodeValue = nextValue;
      }
    }
    node = walker.nextNode() as Text | null;
  }

  document.querySelectorAll<HTMLElement>("[placeholder], [title], [aria-label]").forEach(element => {
    if (element.closest("[data-ahc-no-translate]")) return;
    for (const attribute of ["placeholder", "title", "aria-label"] as const) {
      const value = element.getAttribute(attribute);
      if (!value) continue;
      const originalAttribute = `data-ahc-original-${attribute}`;
      const original = element.getAttribute(originalAttribute) ?? value;
      if (!element.hasAttribute(originalAttribute) && isAhcInterfaceTranslation(original)) element.setAttribute(originalAttribute, original);
      const source = element.getAttribute(originalAttribute);
      if (source) {
        const nextValue = translateAhcInterfaceText(source, language);
        if (element.getAttribute(attribute) !== nextValue) element.setAttribute(attribute, nextValue);
      }
    }
  });
}

/** Applies the selected locale to AHC-owned static interface copy rendered by legacy screens. */
export function LocaleDocumentTranslator() {
  const { language, setLanguage } = useMarketplaceLanguage();
  const [location] = useLocation();
  const scheduled = useRef<number | null>(null);
  const isPublicMarketplace = location === "/" || location.startsWith("/listings/");

  useEffect(() => {
    const schedule = () => {
      if (scheduled.current) window.cancelAnimationFrame(scheduled.current);
      scheduled.current = window.requestAnimationFrame(() => applyLocale(language));
    };
    schedule();
    const observer = new MutationObserver(schedule);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    return () => {
      observer.disconnect();
      if (scheduled.current) window.cancelAnimationFrame(scheduled.current);
    };
  }, [language]);

  if (isPublicMarketplace) return null;

  return <label className="fixed left-3 top-3 z-[80] inline-flex items-center gap-2 rounded-full border border-white/30 bg-[#132c34]/95 px-3 py-1.5 text-xs font-bold text-white shadow-lg backdrop-blur" aria-label="Language selector">
    <Languages size={15} aria-hidden="true" />
    <span className="sr-only">Language</span>
    <select value={language} onChange={event => setLanguage(event.target.value === "fr" ? "fr" : "en")} className="cursor-pointer bg-transparent font-bold text-white outline-none" aria-label="Select language">
      <option value="en" className="text-[#17333b]">EN</option>
      <option value="fr" className="text-[#17333b]">FR</option>
    </select>
  </label>;
}
