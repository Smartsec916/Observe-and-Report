import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { SearchFilters } from "@/components/search-filters";
import { ObservationResults } from "@/components/observation-results";
import { SearchParams, Observation } from "@/lib/types";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function SearchPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // State for search parameters
  const [searchParams, setSearchParams] = useState<SearchParams>({});
  
  // State to track if a search has been performed
  const [hasSearched, setHasSearched] = useState(false);

  // Search mutation
  const searchMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("/api/observations/search", {
        method: "POST",
        body: JSON.stringify(searchParams),
      }) as Observation[];
    },
    onError: (error) => {
      toast({
        title: "Search failed",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  // Handle search form submission
  const handleSearch = () => {
    setHasSearched(true);
    searchMutation.mutate();
  };

  // Handle editing an observation
  const handleEdit = (id: number) => {
    // Navigate to edit page
    setLocation(`/input/${id}`);
  };

  // Handle viewing details of an observation (now just redirects to edit page)
  const handleViewDetails = (id: number) => {
    // Navigate to input/edit page (same as edit function)
    handleEdit(id);
  };

  // Get search results
  const results = searchMutation.data || [];
  const isLoading = searchMutation.isPending;

  return (
    <div className="px-4 py-3 h-full">
      <div className="space-y-6 pb-4">
        {/* Search Filters */}
        <SearchFilters
          searchParams={searchParams}
          onSearchParamsChange={setSearchParams}
          onSubmit={handleSearch}
        />
        
        {/* Search Results */}
        {isLoading ? (
          <div className="text-center py-4">
            <p className="text-[#8A8A8A]">Searching...</p>
          </div>
        ) : hasSearched ? (
          <ObservationResults
            results={results}
            onEdit={handleEdit}
            onViewDetails={handleViewDetails}
          />
        ) : (
          <div className="text-center py-4">
            <p className="text-[#8A8A8A]">Enter search criteria and click Search</p>
          </div>
        )}
      </div>
    </div>
  );
}
