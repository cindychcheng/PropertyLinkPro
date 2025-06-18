import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useSearch } from "@/providers/search-provider";
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

export function SimpleSearch({
  open,
  setOpen
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
}) {
  const [inputValue, setInputValue] = useState("");
  const debouncedValue = useDebounce(inputValue, 300);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Search when input changes
  useEffect(() => {
    // Don't search on empty input
    if (!debouncedValue) {
      setSearchResults([]);
      return;
    }
    
    setIsLoading(true);
    
    const searchProperties = async () => {
      try {
        const propertiesResponse = await fetch('/api/properties');
        if (!propertiesResponse.ok) {
          console.error('Failed to fetch properties');
          return [];
        }
        
        const properties = await propertiesResponse.json();
        return properties;
      } catch (error) {
        console.error('Error fetching properties:', error);
        return [];
      }
    };
    
    const searchTenants = async () => {
      try {
        const tenantsResponse = await fetch('/api/tenants');
        if (!tenantsResponse.ok) {
          console.error('Failed to fetch tenants');
          return [];
        }
        
        const tenants = await tenantsResponse.json();
        return tenants;
      } catch (error) {
        console.error('Error fetching tenants:', error);
        return [];
      }
    };
    
    // Run all search queries
    Promise.all([searchProperties(), searchTenants()])
      .then(([properties, tenants]) => {
        const searchLower = debouncedValue.toLowerCase();
        const results: SearchResult[] = [];
        
        // Search in properties
        properties.forEach((property: any) => {
          // Match property address
          if (
            property.propertyAddress &&
            property.propertyAddress.toLowerCase().includes(searchLower)
          ) {
            results.push({
              id: `property-${property.propertyAddress}`,
              type: "property",
              title: property.propertyAddress,
              subtitle: property.serviceType,
              propertyAddress: property.propertyAddress,
            });
          }
          
          // Match landlord owners
          if (property.landlordOwners && Array.isArray(property.landlordOwners)) {
            property.landlordOwners.forEach((owner: any, index: number) => {
              if (owner.name && owner.name.toLowerCase().includes(searchLower)) {
                results.push({
                  id: `landlord-${property.propertyAddress}-${index}`,
                  type: "landlord",
                  title: owner.name,
                  subtitle: `Owner of ${property.propertyAddress}`,
                  propertyAddress: property.propertyAddress,
                });
              }
            });
          }
          
          // Match tenant in property
          if (
            property.tenant &&
            property.tenant.name &&
            property.tenant.name.toLowerCase().includes(searchLower)
          ) {
            results.push({
              id: `tenant-${property.propertyAddress}`,
              type: "tenant",
              title: property.tenant.name,
              subtitle: `Tenant at ${property.propertyAddress}`,
              propertyAddress: property.propertyAddress,
            });
          }
        });
        
        // Direct search for tenants
        tenants.forEach((tenant: any) => {
          if (
            tenant.name &&
            tenant.name.toLowerCase().includes(searchLower) &&
            !results.some(r => r.id === `tenant-${tenant.id}`)
          ) {
            results.push({
              id: `tenant-${tenant.id}`,
              type: "tenant",
              title: tenant.name,
              subtitle: `Tenant at ${tenant.propertyAddress}`,
              propertyAddress: tenant.propertyAddress,
            });
          }
        });
        
        setSearchResults(results);
        setIsLoading(false);
      })
      .catch(error => {
        console.error('Error searching:', error);
        setIsLoading(false);
      });
  }, [debouncedValue]);
  
  // Keyboard shortcut listener
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
  
  const [, setLocation] = useLocation();
  const { openPropertyDialog } = useSearch();
  
  // Handle selection with direct property dialog opening
  const handleSelect = (result: SearchResult) => {
    setOpen(false);
    setInputValue("");  // Clear the search input
    
    if (result.propertyAddress) {
      console.log('Search result selected:', result.propertyAddress);
      
      // Navigate to properties page with URL parameter
      setLocation(`/properties?property=${encodeURIComponent(result.propertyAddress)}`);
    }
  };
  
  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder="Search for properties, landlords, or tenants..."
        value={inputValue}
        onValueChange={setInputValue}
      />
      <CommandList>
        <CommandEmpty>
          {isLoading ? "Searching..." : "No results found"}
        </CommandEmpty>
        
        {searchResults.length > 0 && (
          <>
            {searchResults.filter(r => r.type === "property").length > 0 && (
              <CommandGroup heading="Properties">
                {searchResults
                  .filter(r => r.type === "property")
                  .map(result => (
                    <CommandItem
                      key={result.id}
                      onSelect={() => handleSelect(result)}
                    >
                      <Building className="mr-2 h-4 w-4" />
                      <div className="flex flex-col">
                        <span>{result.title}</span>
                        {result.subtitle && (
                          <span className="text-xs text-neutral-medium">
                            {result.subtitle}
                          </span>
                        )}
                      </div>
                    </CommandItem>
                  ))}
              </CommandGroup>
            )}
            
            {searchResults.filter(r => r.type === "landlord").length > 0 && (
              <CommandGroup heading="Landlords">
                {searchResults
                  .filter(r => r.type === "landlord")
                  .map(result => (
                    <CommandItem
                      key={result.id}
                      onSelect={() => handleSelect(result)}
                    >
                      <User className="mr-2 h-4 w-4" />
                      <div className="flex flex-col">
                        <span>{result.title}</span>
                        {result.subtitle && (
                          <span className="text-xs text-neutral-medium">
                            {result.subtitle}
                          </span>
                        )}
                      </div>
                    </CommandItem>
                  ))}
              </CommandGroup>
            )}
            
            {searchResults.filter(r => r.type === "tenant").length > 0 && (
              <CommandGroup heading="Tenants">
                {searchResults
                  .filter(r => r.type === "tenant")
                  .map(result => (
                    <CommandItem
                      key={result.id}
                      onSelect={() => handleSelect(result)}
                    >
                      <Users className="mr-2 h-4 w-4" />
                      <div className="flex flex-col">
                        <span>{result.title}</span>
                        {result.subtitle && (
                          <span className="text-xs text-neutral-medium">
                            {result.subtitle}
                          </span>
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