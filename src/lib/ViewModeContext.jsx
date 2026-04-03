import React, { createContext, useContext, useState } from "react";

const ViewModeContext = createContext();

export function ViewModeProvider({ children }) {
  const [viewMode, setViewMode] = useState("admin"); // "admin" | "patient"
  const toggleViewMode = () => setViewMode((m) => (m === "admin" ? "patient" : "admin"));
  return (
    <ViewModeContext.Provider value={{ viewMode, setViewMode, toggleViewMode }}>
      {children}
    </ViewModeContext.Provider>
  );
}

export function useViewMode() {
  return useContext(ViewModeContext);
}