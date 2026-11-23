"use client";
import { createContext, useCallback, useContext, useEffect, useState } from "react";

const DataContext = createContext();
const STORAGE_KEY = "plinth_participant";

export function DataProvider({ children }) {
  // Logged-in participant: { plinthId, name, email }. Persisted so a refresh keeps them in.
  const [participant, setParticipantState] = useState(null);
  const [participantReady, setParticipantReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setParticipantState(JSON.parse(raw));
    } catch {}
    setParticipantReady(true);
  }, []);

  const setParticipant = useCallback((p) => {
    setParticipantState(p);
    try {
      if (p) localStorage.setItem(STORAGE_KEY, JSON.stringify({ plinthId: p.plinthId, name: p.name, email: p.email }));
      else localStorage.removeItem(STORAGE_KEY);
    } catch {}
  }, []);

  return (
    <DataContext.Provider value={{ participant, setParticipant, participantReady }}>
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => useContext(DataContext);
