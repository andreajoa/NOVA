"use client";
import { createContext, useContext, useState, useEffect } from "react";
const LangCtx = createContext({ lang: "en", setLang: () => {} });
export function LangProvider({ children }) {
  const [lang, setLang] = useState("en");
  useEffect(() => {
    const b = navigator.language || "en";
    setLang(b.toLowerCase().startsWith("pt") ? "pt" : "en");
  }, []);
  return <LangCtx.Provider value={{ lang, setLang }}>{children}</LangCtx.Provider>;
}
export function useLang() { return useContext(LangCtx); }
