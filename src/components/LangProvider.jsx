"use client";
import { createContext, useContext, useState } from "react";
const LangCtx = createContext({ lang: "en", setLang: () => {} });
function detectLang() {
  if (typeof navigator === "undefined") return "en";
  return (navigator.language || "en").toLowerCase().startsWith("pt") ? "pt" : "en";
}
export function LangProvider({ children }) {
  const [lang, setLang] = useState(detectLang);
  return <LangCtx.Provider value={{ lang, setLang }}>{children}</LangCtx.Provider>;
}
export function useLang() { return useContext(LangCtx); }
