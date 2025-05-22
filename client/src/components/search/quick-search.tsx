import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Building, User, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

export function QuickSearch({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>([]);

  // Load properties when dialog opens
  useEffect(() => {
    if (open && properties.length === 0) {
      setIsLoading(true);
      fetch("/api/properties")
        .then((res) => res.json())
        .then((data) => {
          console.log("Properties loaded:", data.length);
          setProperties(Array.isArray(data) ? data : []);
          setIsLoading(false);
        })
        .catch((err) => {
          console.error("Error loading properties:", err);
          setIsLoading(false);
        });
    }
  }, [open, properties.length]);

  // Search based on term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setResults([]);
      return;
    }

    const term = searchTerm.toLowerCase().trim();
    const matches: any[] = [];

    // Search through properties
    properties.forEach((property) => {
      const address = property.propertyAddress || "";
      
      // Check property address
      if (address.toLowerCase().includes(term)) {
        matches.push({
          type: "property",
          name: address,
          details: property.serviceType || "",
          address,
        });
      }

      // Check landlord names
      if (property.landlordOwners && Array.isArray(property.landlordOwners)) {
        property.landlordOwners.forEach((owner: any) => {
          if (owner.name && owner.name.toLowerCase().includes(term)) {
            matches.push({
              type: "landlord",
              name: owner.name,
              details: `Owner of ${address}`,
              address,
            });
          }
        });
      }

      // Check tenant name
      if (
        property.tenant &&
        property.tenant.name &&
        property.tenant.name.toLowerCase().includes(term)
      ) {
        matches.push({
          type: "tenant",
          name: property.tenant.name,
          details: `Tenant at ${address}`,
          address,
        });
      }
    });

    console.log(`Found ${matches.length} results for "${term}"`);
    setResults(matches);
  }, [searchTerm, properties]);

  // Handle keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(!open);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, setOpen]);

  // Handle selecting a result
  function handleSelect(result: any) {
    window.location.href = `/properties?address=${encodeURIComponent(result.address)}`;
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Search Properties, Landlords & Tenants</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            placeholder="Type to search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
            autoFocus
          />

          {isLoading ? (
            <div className="py-4 text-center">Loading...</div>
          ) : (
            <>
              {searchTerm && results.length === 0 ? (
                <div className="py-4 text-center text-muted-foreground">
                  No results found
                </div>
              ) : (
                <div className="max-h-[300px] overflow-y-auto space-y-2">
                  {/* Properties */}
                  {results
                    .filter(r => r.type === "property")
                    .map((result, i) => (
                      <Button
                        key={`prop-${i}`}
                        variant="outline"
                        className="w-full justify-start h-auto py-2"
                        onClick={() => handleSelect(result)}
                      >
                        <Building className="mr-2 h-4 w-4" />
                        <div className="text-left">
                          <div>{result.name}</div>
                          <div className="text-xs text-muted-foreground">{result.details}</div>
                        </div>
                      </Button>
                    ))}
                    
                  {/* Landlords */}
                  {results
                    .filter(r => r.type === "landlord")
                    .map((result, i) => (
                      <Button
                        key={`land-${i}`}
                        variant="outline"
                        className="w-full justify-start h-auto py-2"
                        onClick={() => handleSelect(result)}
                      >
                        <User className="mr-2 h-4 w-4" />
                        <div className="text-left">
                          <div>{result.name}</div>
                          <div className="text-xs text-muted-foreground">{result.details}</div>
                        </div>
                      </Button>
                    ))}
                    
                  {/* Tenants */}
                  {results
                    .filter(r => r.type === "tenant")
                    .map((result, i) => (
                      <Button
                        key={`ten-${i}`}
                        variant="outline"
                        className="w-full justify-start h-auto py-2"
                        onClick={() => handleSelect(result)}
                      >
                        <Users className="mr-2 h-4 w-4" />
                        <div className="text-left">
                          <div>{result.name}</div>
                          <div className="text-xs text-muted-foreground">{result.details}</div>
                        </div>
                      </Button>
                    ))}
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}