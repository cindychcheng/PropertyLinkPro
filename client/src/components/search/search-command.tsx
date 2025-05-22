import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Building, User, Users } from "lucide-react";

// Custom hook for debouncing values
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

type SearchResult = {
  id: string;
  type: "property" | "tenant" | "landlord";
  title: string;
  subtitle?: string;
  propertyAddress?: string;
};

export function SearchCommand({
  open,
  setOpen
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
}) {
  const [inputValue, setInputValue] = useState("");
  const debouncedValue = useDebounce(inputValue, 300);

  const { data: properties = [] } = useQuery({
    queryKey: ["/api/properties"],
    staleTime: 60000,
  });

  const { data: landlords = [] } = useQuery({
    queryKey: ["/api/landlords"],
    staleTime: 60000,
  });

  const { data: tenants = [] } = useQuery({
    queryKey: ["/api/tenants"],
    staleTime: 60000,
  });

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || e.key === "/") {
        e.preventDefault();
        setOpen(!open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, setOpen]);

  // Create search results based on the input
  const getSearchResults = () => {
    if (!debouncedValue) return [];

    const searchLower = debouncedValue.toLowerCase();
    const results: SearchResult[] = [];

    // Search in properties
    if (Array.isArray(properties)) {
      properties.forEach((property: any) => {
        if (property.propertyAddress && property.propertyAddress.toLowerCase().includes(searchLower)) {
          results.push({
            id: `property-${property.propertyAddress}`,
            type: "property",
            title: property.propertyAddress,
            subtitle: property.serviceType,
            propertyAddress: property.propertyAddress
          });
        }
      });
    }

    // Search in landlords (including owners)
    if (Array.isArray(landlords)) {
      landlords.forEach((landlord: any) => {
        // Search in the primary property address/info
        if (landlord.propertyAddress && landlord.propertyAddress.toLowerCase().includes(searchLower)) {
          results.push({
            id: `landlord-${landlord.propertyAddress}`,
            type: "landlord",
            title: landlord.propertyAddress,
            subtitle: "Property (landlord)",
            propertyAddress: landlord.propertyAddress
          });
        }

        // Search in landlord owners
        if (landlord.landlordOwners && Array.isArray(landlord.landlordOwners)) {
          landlord.landlordOwners.forEach((owner: any, index: number) => {
            if (owner.name && owner.name.toLowerCase().includes(searchLower)) {
              results.push({
                id: `landlord-owner-${landlord.propertyAddress}-${index}`,
                type: "landlord",
                title: owner.name,
                subtitle: `Owner of ${landlord.propertyAddress}`,
                propertyAddress: landlord.propertyAddress
              });
            }
          });
        }
      });
    }

    // Search in tenants
    if (Array.isArray(tenants)) {
      tenants.forEach((tenant: any) => {
        if (
          (tenant.name && tenant.name.toLowerCase().includes(searchLower)) ||
          (tenant.email && tenant.email.toLowerCase().includes(searchLower))
        ) {
          results.push({
            id: `tenant-${tenant.id}`,
            type: "tenant",
            title: tenant.name || "Unknown tenant",
            subtitle: `Tenant at ${tenant.propertyAddress}`,
            propertyAddress: tenant.propertyAddress
          });
        }
      });
    }

    return results;
  };

  const searchResults = getSearchResults();

  const handleSelect = (result: SearchResult) => {
    setOpen(false);
    setInputValue(""); // Clear the input
    
    if (result.propertyAddress) {
      // Use window.location approach instead of wouter's navigate
      const url = `/properties?address=${encodeURIComponent(result.propertyAddress)}`;
      window.location.href = url;
    }
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder="Search properties, tenants, landlords..."
        value={inputValue}
        onValueChange={setInputValue}
      />
      <CommandList>
        <CommandEmpty>No results found</CommandEmpty>
        
        {searchResults.length > 0 && (
          <>
            {searchResults.filter(result => result.type === "property").length > 0 && (
              <CommandGroup heading="Properties">
                {searchResults
                  .filter(result => result.type === "property")
                  .map(result => (
                    <CommandItem
                      key={result.id}
                      onSelect={() => handleSelect(result)}
                    >
                      <Building className="mr-2 h-4 w-4" />
                      <div className="flex flex-col">
                        <span>{result.title}</span>
                        {result.subtitle && (
                          <span className="text-xs text-neutral-medium">{result.subtitle}</span>
                        )}
                      </div>
                    </CommandItem>
                  ))}
              </CommandGroup>
            )}
            
            {searchResults.filter(result => result.type === "landlord").length > 0 && (
              <CommandGroup heading="Landlords">
                {searchResults
                  .filter(result => result.type === "landlord")
                  .map(result => (
                    <CommandItem
                      key={result.id}
                      onSelect={() => handleSelect(result)}
                    >
                      <User className="mr-2 h-4 w-4" />
                      <div className="flex flex-col">
                        <span>{result.title}</span>
                        {result.subtitle && (
                          <span className="text-xs text-neutral-medium">{result.subtitle}</span>
                        )}
                      </div>
                    </CommandItem>
                  ))}
              </CommandGroup>
            )}
            
            {searchResults.filter(result => result.type === "tenant").length > 0 && (
              <CommandGroup heading="Tenants">
                {searchResults
                  .filter(result => result.type === "tenant")
                  .map(result => (
                    <CommandItem
                      key={result.id}
                      onSelect={() => handleSelect(result)}
                    >
                      <Users className="mr-2 h-4 w-4" />
                      <div className="flex flex-col">
                        <span>{result.title}</span>
                        {result.subtitle && (
                          <span className="text-xs text-neutral-medium">{result.subtitle}</span>
                        )}
                      </div>
                    </CommandItem>
                  ))}
              </CommandGroup>
            )}
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}