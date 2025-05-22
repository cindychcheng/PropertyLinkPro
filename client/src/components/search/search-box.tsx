import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Building, User, Users } from "lucide-react";

type SearchResult = {
  id: string;
  type: "property" | "tenant" | "landlord";
  title: string;
  subtitle?: string;
  propertyAddress: string;
};

export function SearchBox({
  open,
  setOpen
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Handle keyboard shortcuts
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

  // Search function
  useEffect(() => {
    if (!query) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    
    const searchQuery = query.toLowerCase();
    
    // Fetch properties for search
    fetch('/api/properties')
      .then(res => res.json())
      .then(properties => {
        const searchResults: SearchResult[] = [];
        
        // Search property addresses
        properties.forEach((property: any) => {
          const propertyAddress = property.propertyAddress || '';
          
          // Match property address
          if (propertyAddress.toLowerCase().includes(searchQuery)) {
            searchResults.push({
              id: `property-${propertyAddress}`,
              type: "property",
              title: propertyAddress,
              subtitle: property.serviceType || '',
              propertyAddress
            });
          }
          
          // Match landlord owners' names
          if (property.landlordOwners && property.landlordOwners.length) {
            property.landlordOwners.forEach((owner: any, index: number) => {
              if (owner.name && owner.name.toLowerCase().includes(searchQuery)) {
                searchResults.push({
                  id: `landlord-${propertyAddress}-${index}`,
                  type: "landlord",
                  title: owner.name,
                  subtitle: `Owner of ${propertyAddress}`,
                  propertyAddress
                });
              }
            });
          }
          
          // Match tenant name
          if (property.tenant && property.tenant.name && 
              property.tenant.name.toLowerCase().includes(searchQuery)) {
            searchResults.push({
              id: `tenant-${property.tenant.id}`,
              type: "tenant",
              title: property.tenant.name,
              subtitle: `Tenant at ${propertyAddress}`,
              propertyAddress
            });
          }
        });
        
        setResults(searchResults);
        setIsLoading(false);
      })
      .catch(err => {
        console.error('Search error:', err);
        setIsLoading(false);
      });
  }, [query]);

  // Handle selection
  const handleSelect = (result: SearchResult) => {
    window.location.href = `/properties?address=${encodeURIComponent(result.propertyAddress)}`;
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[600px] p-0">
        <DialogHeader className="px-4 pt-4">
          <DialogTitle>Search Properties, Landlords & Tenants</DialogTitle>
        </DialogHeader>
        <Command className="rounded-t-none border-t">
          <CommandInput
            placeholder="Type to search..."
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            <CommandEmpty>{isLoading ? "Searching..." : "No results found"}</CommandEmpty>
            
            {results.length > 0 && (
              <>
                {results.filter(r => r.type === "property").length > 0 && (
                  <CommandGroup heading="Properties">
                    {results
                      .filter(r => r.type === "property")
                      .map(result => (
                        <CommandItem
                          key={result.id}
                          onSelect={() => handleSelect(result)}
                          className="cursor-pointer"
                        >
                          <Building className="mr-2 h-4 w-4" />
                          <div className="flex flex-col">
                            <span>{result.title}</span>
                            {result.subtitle && (
                              <span className="text-xs text-muted-foreground">
                                {result.subtitle}
                              </span>
                            )}
                          </div>
                        </CommandItem>
                      ))}
                  </CommandGroup>
                )}
                
                {results.filter(r => r.type === "landlord").length > 0 && (
                  <CommandGroup heading="Landlords">
                    {results
                      .filter(r => r.type === "landlord")
                      .map(result => (
                        <CommandItem
                          key={result.id}
                          onSelect={() => handleSelect(result)}
                          className="cursor-pointer"
                        >
                          <User className="mr-2 h-4 w-4" />
                          <div className="flex flex-col">
                            <span>{result.title}</span>
                            {result.subtitle && (
                              <span className="text-xs text-muted-foreground">
                                {result.subtitle}
                              </span>
                            )}
                          </div>
                        </CommandItem>
                      ))}
                  </CommandGroup>
                )}
                
                {results.filter(r => r.type === "tenant").length > 0 && (
                  <CommandGroup heading="Tenants">
                    {results
                      .filter(r => r.type === "tenant")
                      .map(result => (
                        <CommandItem
                          key={result.id}
                          onSelect={() => handleSelect(result)}
                          className="cursor-pointer"
                        >
                          <Users className="mr-2 h-4 w-4" />
                          <div className="flex flex-col">
                            <span>{result.title}</span>
                            {result.subtitle && (
                              <span className="text-xs text-muted-foreground">
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
        </Command>
      </DialogContent>
    </Dialog>
  );
}