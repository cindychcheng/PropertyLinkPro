import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Building, User, Users } from "lucide-react";

interface SearchResult {
  id: string;
  type: 'property' | 'landlord' | 'tenant';
  title: string;
  subtitle: string;
  address: string;
}

interface SearchDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

export function SearchDialog({ open, setOpen }: SearchDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [properties, setProperties] = useState<any[]>([]);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  // Load properties data when dialog opens
  useEffect(() => {
    if (open && properties.length === 0) {
      setLoading(true);
      fetch("/api/properties")
        .then(res => res.json())
        .then(data => {
          console.log("Properties loaded:", data.length);
          setProperties(data);
          setLoading(false);
        })
        .catch(err => {
          console.error("Error loading properties:", err);
          setLoading(false);
        });
    }
  }, [open, properties.length]);

  // Handle search input changes
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    
    const lowercaseQuery = query.toLowerCase().trim();
    const results: SearchResult[] = [];
    
    // Search through properties
    properties.forEach(property => {
      const address = property.propertyAddress || '';
      
      // Match property address
      if (address.toLowerCase().includes(lowercaseQuery)) {
        results.push({
          id: `prop-${address}`,
          type: 'property',
          title: address,
          subtitle: property.serviceType || '',
          address: address
        });
      }
      
      // Match landlord owners
      if (property.landlordOwners && Array.isArray(property.landlordOwners)) {
        property.landlordOwners.forEach((owner: any, index: number) => {
          const ownerName = owner.name || '';
          if (ownerName.toLowerCase().includes(lowercaseQuery)) {
            results.push({
              id: `landlord-${address}-${index}`,
              type: 'landlord',
              title: ownerName,
              subtitle: `Owner of ${address}`,
              address: address
            });
          }
        });
      }
      
      // Match tenant name
      if (property.tenant && property.tenant.name) {
        const tenantName = property.tenant.name;
        if (tenantName.toLowerCase().includes(lowercaseQuery)) {
          results.push({
            id: `tenant-${property.tenant.id || 0}`,
            type: 'tenant',
            title: tenantName,
            subtitle: `Tenant at ${address}`,
            address: address
          });
        }
      }
    });
    
    console.log(`Found ${results.length} results for "${lowercaseQuery}"`);
    setSearchResults(results);
  };

  // Handle selecting a search result
  const handleSelectResult = (result: SearchResult) => {
    window.location.href = `/properties?address=${encodeURIComponent(result.address)}`;
    setOpen(false);
  };

  // Handle keyboard shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(true);
      }
    };
    
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [setOpen]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Search</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <Input 
            placeholder="Search properties, landlords, or tenants..." 
            value={searchQuery}
            onChange={handleSearchChange}
            autoFocus
          />
          
          {loading ? (
            <div className="text-center py-4">Loading...</div>
          ) : (
            <>
              {searchQuery && searchResults.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">No results found</div>
              ) : (
                <div className="max-h-[300px] overflow-y-auto space-y-2">
                  {/* Group by type */}
                  {/* Properties */}
                  {searchResults.filter(r => r.type === 'property').length > 0 && (
                    <div>
                      <h3 className="font-medium mb-2">Properties</h3>
                      <div className="space-y-1">
                        {searchResults
                          .filter(r => r.type === 'property')
                          .map(result => (
                            <Button
                              key={result.id}
                              variant="outline"
                              className="w-full justify-start text-left h-auto py-2"
                              onClick={() => handleSelectResult(result)}
                            >
                              <Building className="h-4 w-4 mr-2 flex-shrink-0" />
                              <div>
                                <div>{result.title}</div>
                                {result.subtitle && (
                                  <div className="text-xs text-muted-foreground">{result.subtitle}</div>
                                )}
                              </div>
                            </Button>
                          ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Landlords */}
                  {searchResults.filter(r => r.type === 'landlord').length > 0 && (
                    <div>
                      <h3 className="font-medium mb-2">Landlords</h3>
                      <div className="space-y-1">
                        {searchResults
                          .filter(r => r.type === 'landlord')
                          .map(result => (
                            <Button
                              key={result.id}
                              variant="outline"
                              className="w-full justify-start text-left h-auto py-2"
                              onClick={() => handleSelectResult(result)}
                            >
                              <User className="h-4 w-4 mr-2 flex-shrink-0" />
                              <div>
                                <div>{result.title}</div>
                                {result.subtitle && (
                                  <div className="text-xs text-muted-foreground">{result.subtitle}</div>
                                )}
                              </div>
                            </Button>
                          ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Tenants */}
                  {searchResults.filter(r => r.type === 'tenant').length > 0 && (
                    <div>
                      <h3 className="font-medium mb-2">Tenants</h3>
                      <div className="space-y-1">
                        {searchResults
                          .filter(r => r.type === 'tenant')
                          .map(result => (
                            <Button
                              key={result.id}
                              variant="outline"
                              className="w-full justify-start text-left h-auto py-2"
                              onClick={() => handleSelectResult(result)}
                            >
                              <Users className="h-4 w-4 mr-2 flex-shrink-0" />
                              <div>
                                <div>{result.title}</div>
                                {result.subtitle && (
                                  <div className="text-xs text-muted-foreground">{result.subtitle}</div>
                                )}
                              </div>
                            </Button>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}