import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Building, User, Users } from "lucide-react";

// Simple search result interface
interface SearchResult {
  type: 'property' | 'landlord' | 'tenant';
  title: string;
  subtitle?: string;
  propertyAddress: string;
}

export function GlobalSearch({
  open,
  setOpen
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
}) {
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [propertiesData, setPropertiesData] = useState<any[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);

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

  // Load properties data when dialog opens
  useEffect(() => {
    if (open && !dataLoaded) {
      setIsLoading(true);
      console.log("Fetching properties for search...");
      
      fetch('/api/properties')
        .then(res => res.json())
        .then(data => {
          console.log("Properties loaded:", data.length);
          setPropertiesData(data);
          setDataLoaded(true);
          setIsLoading(false);
        })
        .catch(err => {
          console.error("Error loading properties:", err);
          setIsLoading(false);
        });
    }
  }, [open, dataLoaded]);

  // Search when query changes
  useEffect(() => {
    if (!propertiesData.length || !searchQuery.trim()) {
      setResults([]);
      return;
    }

    console.log(`Searching for: "${searchQuery}" in ${propertiesData.length} properties`);
    
    // Filter properties based on search query
    const query = searchQuery.toLowerCase().trim();
    const filteredResults: SearchResult[] = [];

    // Search through properties
    propertiesData.forEach(property => {
      const propertyAddress = property.propertyAddress || '';
      
      // Check property address
      if (propertyAddress.toLowerCase().includes(query)) {
        filteredResults.push({
          type: 'property',
          title: propertyAddress,
          subtitle: property.serviceType,
          propertyAddress
        });
      }
      
      // Check landlord names
      if (property.landlordOwners && Array.isArray(property.landlordOwners)) {
        property.landlordOwners.forEach((owner: any) => {
          if (owner.name && owner.name.toLowerCase().includes(query)) {
            filteredResults.push({
              type: 'landlord',
              title: owner.name,
              subtitle: `Owner of ${propertyAddress}`,
              propertyAddress
            });
          }
        });
      }
      
      // Check tenant name
      if (property.tenant && property.tenant.name && 
          property.tenant.name.toLowerCase().includes(query)) {
        filteredResults.push({
          type: 'tenant',
          title: property.tenant.name,
          subtitle: `Tenant at ${propertyAddress}`,
          propertyAddress
        });
      }
    });
    
    console.log(`Found ${filteredResults.length} results`);
    setResults(filteredResults);
  }, [searchQuery, propertiesData]);

  // Handle result selection
  const handleSelectResult = (result: SearchResult) => {
    navigate(`/properties?address=${encodeURIComponent(result.propertyAddress)}`);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Search Properties, Landlords & Tenants</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <Input
            placeholder="Type to search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
            autoFocus
          />
          
          {isLoading && (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          )}
          
          {!isLoading && results.length === 0 && searchQuery.trim() !== "" && (
            <div className="text-center py-4 text-muted-foreground">
              No results found
            </div>
          )}
          
          {!isLoading && results.length > 0 && (
            <div className="space-y-4">
              {/* Properties */}
              {results.filter(r => r.type === 'property').length > 0 && (
                <div>
                  <h3 className="text-sm font-medium mb-2">Properties</h3>
                  <div className="space-y-2">
                    {results
                      .filter(r => r.type === 'property')
                      .map((result, index) => (
                        <Button
                          key={`property-${index}`}
                          variant="outline"
                          className="w-full justify-start text-left h-auto py-2"
                          onClick={() => handleSelectResult(result)}
                        >
                          <Building className="h-4 w-4 mr-2 flex-shrink-0" />
                          <div>
                            <div>{result.title}</div>
                            {result.subtitle && (
                              <div className="text-xs text-muted-foreground">
                                {result.subtitle}
                              </div>
                            )}
                          </div>
                        </Button>
                      ))}
                  </div>
                </div>
              )}
              
              {/* Landlords */}
              {results.filter(r => r.type === 'landlord').length > 0 && (
                <div>
                  <h3 className="text-sm font-medium mb-2">Landlords</h3>
                  <div className="space-y-2">
                    {results
                      .filter(r => r.type === 'landlord')
                      .map((result, index) => (
                        <Button
                          key={`landlord-${index}`}
                          variant="outline"
                          className="w-full justify-start text-left h-auto py-2"
                          onClick={() => handleSelectResult(result)}
                        >
                          <User className="h-4 w-4 mr-2 flex-shrink-0" />
                          <div>
                            <div>{result.title}</div>
                            {result.subtitle && (
                              <div className="text-xs text-muted-foreground">
                                {result.subtitle}
                              </div>
                            )}
                          </div>
                        </Button>
                      ))}
                  </div>
                </div>
              )}
              
              {/* Tenants */}
              {results.filter(r => r.type === 'tenant').length > 0 && (
                <div>
                  <h3 className="text-sm font-medium mb-2">Tenants</h3>
                  <div className="space-y-2">
                    {results
                      .filter(r => r.type === 'tenant')
                      .map((result, index) => (
                        <Button
                          key={`tenant-${index}`}
                          variant="outline"
                          className="w-full justify-start text-left h-auto py-2"
                          onClick={() => handleSelectResult(result)}
                        >
                          <Users className="h-4 w-4 mr-2 flex-shrink-0" />
                          <div>
                            <div>{result.title}</div>
                            {result.subtitle && (
                              <div className="text-xs text-muted-foreground">
                                {result.subtitle}
                              </div>
                            )}
                          </div>
                        </Button>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}