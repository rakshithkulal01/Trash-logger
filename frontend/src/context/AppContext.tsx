import React, { createContext, useContext, useState, ReactNode } from 'react';
import { TrashEntry } from '../types';

interface AppContextType {
  entries: TrashEntry[];
  setEntries: (entries: TrashEntry[]) => void;
  addEntry: (entry: TrashEntry) => void;
  refreshEntries: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
};

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [entries, setEntries] = useState<TrashEntry[]>([]);

  const addEntry = (entry: TrashEntry) => {
    setEntries(prev => [...prev, entry]);
  };

  const refreshEntries = () => {
    // Trigger a refresh by updating entries
    setEntries(prev => [...prev]);
  };

  return (
    <AppContext.Provider value={{ entries, setEntries, addEntry, refreshEntries }}>
      {children}
    </AppContext.Provider>
  );
};
