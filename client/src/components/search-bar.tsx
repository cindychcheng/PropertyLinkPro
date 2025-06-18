import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Search, Building2, UserCheck, Users } from "lucide-react";
import { useLocation } from "wouter";

type SearchResult = {
  type: "property" | "landlord" | "tenant";
  id: string;
  name: string;
  details: string;
  address: string;
};

export function SearchBar() {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [, setLocation] = useLocation();

  const { data: properties = [] } = useQuery({
    queryKey: ["/api/properties"],
    select: (data: any[]) => data || [],
  });

  // Create search results from properties data
  const searchResults: SearchResult[] = [];

  if (searchTerm.length >= 2) {
    console.log('=== SEARCH RESULTS GENERATION ===');
    console.log('Search term:', searchTerm);
    console.log('Properties data:', properties);
    properties.forEach((property: any) => {
      const searchLower = searchTerm.toLowerCase();
      
      // Add property if address matches
      if (property.propertyAddress?.toLowerCase().includes(searchLower)) {
        const propertyResult = {
          type: "property",
          id: property.propertyAddress,
          name: property.propertyAddress,
          details: `Key: ${property.keyNumber}`,
          address: property.propertyAddress,
        };
        console.log('Adding property result:', propertyResult);
        searchResults.push(propertyResult);
      }

      // Add landlord owners if name matches
      if (property.landlordOwners) {
        property.landlordOwners.forEach((owner: any) => {
          if (owner.name?.toLowerCase().includes(searchLower)) {
            searchResults.push({
              type: "landlord",
              id: `${property.propertyAddress}-${owner.name}`,
              name: owner.name,
              details: owner.contactNumber || "No contact",
              address: property.propertyAddress,
            });
          }
        });
      }

      // Add all active tenants if name matches (includes co-tenants)
      if (property.activeTenants) {
        property.activeTenants.forEach((tenant: any) => {
          if (tenant.name?.toLowerCase().includes(searchLower)) {
            searchResults.push({
              type: "tenant",
              id: `${property.propertyAddress}-${tenant.name}`,
              name: tenant.name,
              details: tenant.contactNumber || tenant.email || "No contact",
              address: property.propertyAddress,
            });
          }
        });
      }

      // Add all tenants from tenant history if name matches (for past tenants)
      if (property.tenantHistory) {
        property.tenantHistory.forEach((tenant: any) => {
          if (tenant.name?.toLowerCase().includes(searchLower)) {
            // Check if this tenant is not already added from activeTenants
            const alreadyAdded = searchResults.some(result => 
              result.type === "tenant" && 
              result.name === tenant.name && 
              result.address === property.propertyAddress
            );
            
            if (!alreadyAdded) {
              searchResults.push({
                type: "tenant",
                id: `${property.propertyAddress}-${tenant.name}`,
                name: tenant.name,
                details: tenant.contactNumber || tenant.email || "No contact",
                address: property.propertyAddress,
              });
            }
          }
        });
      }
    });
  }

  const handleSelect = (result: SearchResult) => {
    console.log('=== SEARCH RESULT CLICKED ===');
    console.log('Selected result:', result);
    console.log('Result type:', result.type);
    console.log('Property address:', result.address);
    
    setOpen(false);
    setSearchTerm("");
    
    const targetUrl = `/properties?address=${encodeURIComponent(result.address)}`;
    console.log('Navigating to:', targetUrl);
    
    // For all result types, navigate to the property card since landlords and tenants are associated with properties
    setLocation(targetUrl);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "property":
        return <Building2 className="h-4 w-4" />;
      case "landlord":
        return <UserCheck className="h-4 w-4" />;
      case "tenant":
        return <Users className="h-4 w-4" />;
      default:
        return <Search className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "property":
        return "Property";
      case "landlord":
        return "Landlord";
      case "tenant":
        return "Tenant";
      default:
        return "";
    }
  };

  // Keyboard shortcut to open search
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return (
    <>
      <Button
        variant="outline"
        className="relative w-full justify-start text-sm text-muted-foreground sm:pr-12 md:w-40 lg:w-64"
        onClick={() => setOpen(true)}
      >
        <Search className="mr-2 h-4 w-4" />
        Search...
        <kbd className="pointer-events-none absolute right-1.5 top-1.5 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="overflow-hidden p-0 shadow-lg">
          <DialogHeader className="px-4 pb-0 pt-4">
            <DialogTitle>Search Properties, Landlords & Tenants</DialogTitle>
          </DialogHeader>
          <Command className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5">
            <CommandInput
              placeholder="Type to search..."
              value={searchTerm}
              onValueChange={setSearchTerm}
            />
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
              {searchResults.length > 0 && (
                <CommandGroup>
                  {searchResults.slice(0, 10).map((result) => (
                    <CommandItem
                      key={result.id}
                      value={result.id}
                      onSelect={() => handleSelect(result)}
                      className="flex items-center gap-3"
                    >
                      {getIcon(result.type)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{result.name}</span>
                          <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                            {getTypeLabel(result.type)}
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {result.details} • {result.address}
                        </div>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </DialogContent>
      </Dialog>
    </>
  );
}