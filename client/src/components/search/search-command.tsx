import { useState, useEffect } from "react";
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
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);

  // Add effect to handle searching when the input changes
  useEffect(() => {
    if (!debouncedValue) {
      setSearchResults([]);
      return;
    }

    const searchData = async () => {
      try {
        // Fetch data directly when needed for search
        const [propertiesRes, tenantsRes] = await Promise.all([
          fetch('/api/properties'),
          fetch('/api/tenants')
        ]);

        if (!propertiesRes.ok || !tenantsRes.ok) {
          console.error("Failed to fetch search data");
          return;
        }

        const properties = await propertiesRes.json();
        const tenants = await tenantsRes.json();
        
        const searchLower = debouncedValue.toLowerCase();
        const results: SearchResult[] = [];
        
        // Search in properties
        if (Array.isArray(properties)) {
          properties.forEach((property: any) => {
            // Search in property address
            if (property.propertyAddress && 
                property.propertyAddress.toLowerCase().includes(searchLower)) {
              results.push({
                id: `property-${property.propertyAddress}`,
                type: "property",
                title: property.propertyAddress,
                subtitle: property.serviceType || "Property",
                propertyAddress: property.propertyAddress
              });
            }
            
            // Search in landlord owners within property data
            if (property.landlordOwners && Array.isArray(property.landlordOwners)) {
              property.landlordOwners.forEach((owner: any, index: number) => {
                if (owner.name && owner.name.toLowerCase().includes(searchLower)) {
                  results.push({
                    id: `landlord-owner-${property.propertyAddress}-${index}`,
                    type: "landlord",
                    title: owner.name,
                    subtitle: `Owner of ${property.propertyAddress}`,
                    propertyAddress: property.propertyAddress
                  });
                }
              });
            }
            
            // Search in tenant info within property data
            if (property.tenant && property.tenant.name && 
                property.tenant.name.toLowerCase().includes(searchLower)) {
              results.push({
                id: `tenant-property-${property.tenant.id || 'unknown'}`,
                type: "tenant",
                title: property.tenant.name,
                subtitle: `Tenant at ${property.propertyAddress}`,
                propertyAddress: property.propertyAddress
              });
            }
          });
        }

        // Search in all tenants
        if (Array.isArray(tenants)) {
          tenants.forEach((tenant: any) => {
            if (tenant.name && tenant.name.toLowerCase().includes(searchLower)) {
              // Check if this tenant result already exists
              const id = `tenant-${tenant.id}`;
              if (!results.some(r => r.id === id)) {
                results.push({
                  id,
                  type: "tenant",
                  title: tenant.name,
                  subtitle: `Tenant at ${tenant.propertyAddress}`,
                  propertyAddress: tenant.propertyAddress
                });
              }
            }
          });
        }

        console.log("Search results:", results);
        setSearchResults(results);
      } catch (error) {
        console.error("Error during search:", error);
        setSearchResults([]);
      }
    };

    searchData();
  }, [debouncedValue]);

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

  const handleSelect = (result: SearchResult) => {
    setOpen(false);
    setInputValue(""); // Clear the input
    
    if (result.propertyAddress) {
      // Navigate to the property page with the address as a parameter
      window.location.href = `/properties?address=${encodeURIComponent(result.propertyAddress)}`;
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