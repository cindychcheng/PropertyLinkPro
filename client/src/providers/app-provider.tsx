import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type AppContextType = {
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  activeBirthdayCount: number;
  setActiveBirthdayCount: (count: number) => void;
  activeRateIncreaseCount: number;
  setActiveRateIncreaseCount: (count: number) => void;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  const [activeBirthdayCount, setActiveBirthdayCount] = useState(4);
  const [activeRateIncreaseCount, setActiveRateIncreaseCount] = useState(12);

  return (
    <AppContext.Provider
      value={{
        isLoading,
        setIsLoading,
        activeBirthdayCount,
        setActiveBirthdayCount,
        activeRateIncreaseCount,
        setActiveRateIncreaseCount,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    // Return default values instead of throwing an error
    return {
      isLoading: false,
      setIsLoading: () => {},
      activeBirthdayCount: 0,
      setActiveBirthdayCount: () => {},
      activeRateIncreaseCount: 0,
      setActiveRateIncreaseCount: () => {},
    };
  }
  return context;
}
