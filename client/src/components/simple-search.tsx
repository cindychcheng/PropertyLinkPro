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

type SearchResult = {
  type: "property" | "landlord" | "tenant";
  name: string;
  details: string;
  address: string;
};

export function SimpleSearch({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [properties, setProperties] = useState<any[]>([]);

  // Load properties data when the dialog opens
  useEffect(() => {
    if (open && properties.length === 0) {
      setIsLoading(true);
      fetch("/api/properties")
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setProperties(data);
          }
          setIsLoading(false);
        })
        .catch((err) => {
          console.error("Failed to load properties:", err);
          setIsLoading(false);
        });
    }
  }, [open, properties.length]);

  // Filter properties based on search term
  useEffect(() => {
    if (!searchTerm.trim() || !properties.length) {
      setResults([]);
      return;
    }

    const term = searchTerm.toLowerCase().trim();
    const searchResults: SearchResult[] = [];

    properties.forEach((property) => {
      // Match property address
      if (property.propertyAddress && 
          property.propertyAddress.toLowerCase().includes(term)) {
        searchResults.push({
          type: "property",
          name: property.propertyAddress,
          details: property.serviceType || "",
          address: property.propertyAddress,
        });
      }

      // Match landlord names
      if (property.landlordOwners && Array.isArray(property.landlordOwners)) {
        property.landlordOwners.forEach((owner: any) => {
          if (owner.name && owner.name.toLowerCase().includes(term)) {
            searchResults.push({
              type: "landlord",
              name: owner.name,
              details: `Owner of ${property.propertyAddress}`,
              address: property.propertyAddress,
            });
          }
        });
      }

      // Match tenant name
      if (
        property.tenant &&
        property.tenant.name &&
        property.tenant.name.toLowerCase().includes(term)
      ) {
        searchResults.push({
          type: "tenant",
          name: property.tenant.name,
          details: `Tenant at ${property.propertyAddress}`,
          address: property.propertyAddress,
        });
      }
    });

    setResults(searchResults);
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
  function handleSelect(result: SearchResult) {
    window.location.href = `/properties?address=${encodeURIComponent(result.address)}`;
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Search</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            placeholder="Search for properties, landlords, or tenants..."
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
                  {results.map((result, i) => (
                    <Button
                      key={i}
                      variant="outline"
                      className="w-full justify-start h-auto py-2"
                      onClick={() => handleSelect(result)}
                    >
                      {result.type === "property" && <Building className="mr-2 h-4 w-4" />}
                      {result.type === "landlord" && <User className="mr-2 h-4 w-4" />}
                      {result.type === "tenant" && <Users className="mr-2 h-4 w-4" />}
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