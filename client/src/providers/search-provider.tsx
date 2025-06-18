import { createContext, useContext, useState, ReactNode } from 'react';

interface SearchContextType {
  openPropertyDialog: (address: string) => void;
  selectedPropertyAddress: string | null;
  clearSelection: () => void;
}

const SearchContext = createContext<SearchContextType | null>(null);

export function SearchProvider({ children }: { children: ReactNode }) {
  const [selectedPropertyAddress, setSelectedPropertyAddress] = useState<string | null>(null);

  const openPropertyDialog = (address: string) => {
    setSelectedPropertyAddress(address);
  };

  const clearSelection = () => {
    setSelectedPropertyAddress(null);
  };

  return (
    <SearchContext.Provider value={{
      openPropertyDialog,
      selectedPropertyAddress,
      clearSelection
    }}>
      {children}
    </SearchContext.Provider>
  );
}

export function useSearch() {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
}