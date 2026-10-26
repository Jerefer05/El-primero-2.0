"use client";

import { createContext, useContext, type ReactNode } from "react";
import { DEFAULT_SETTINGS, type ContactSettings } from "@/data/settings";

const SiteSettingsContext = createContext<ContactSettings>(DEFAULT_SETTINGS);

export function SiteSettingsProvider({
  value,
  children,
}: {
  value: ContactSettings;
  children: ReactNode;
}) {
  return (
    <SiteSettingsContext.Provider value={value}>
      {children}
    </SiteSettingsContext.Provider>
  );
}

// WhatsApp, alias y demás datos de contacto que se editan en el almacén
export function useSiteSettings() {
  return useContext(SiteSettingsContext);
}
