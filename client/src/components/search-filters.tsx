import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronDown, ChevronUp, Search } from "lucide-react";
import { 
  SearchParams, heightOptions, buildOptions, hairColorOptions, 
  eyeColorOptions, skinToneOptions, vehicleColorOptions, vehicleYearOptions 
} from "@/lib/types";
import { LicensePlateInput } from "./license-plate-input";

interface SearchFiltersProps {
  searchParams: SearchParams;
  onSearchParamsChange: (params: SearchParams) => void;
  onSubmit: () => void;
}

type FilterCategory = "person" | "vehicle" | "date" | "location";

export function SearchFilters({ searchParams, onSearchParamsChange, onSubmit }: SearchFiltersProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [activeCategories, setActiveCategories] = useState<FilterCategory[]>([]);

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSearchParamsChange({ ...searchParams, query: e.target.value });
  };

  const handlePersonChange = (field: string, value: string) => {
    // Don't save placeholder values to the search params
    const newValue = value === "placeholder" ? "" : value;
    onSearchParamsChange({ 
      ...searchParams, 
      person: { ...(searchParams.person || {}), [field]: newValue } 
    });
  };

  const handleVehicleChange = (field: string, value: any) => {
    // Don't save placeholder values to the search params
    const newValue = value === "placeholder" ? "" : value;
    onSearchParamsChange({ 
      ...searchParams, 
      vehicle: { ...(searchParams.vehicle || {}), [field]: newValue } 
    });
  };

  const handleLicensePlateChange = (plate: (string | undefined)[]) => {
    // Convert undefined to null for wildcard search and handle placeholder value
    const searchPlate = plate.map(char => {
      if (char === "" || char === undefined) return null;
      if (char === "placeholder") return null;
      return char;
    });
    onSearchParamsChange({ ...searchParams, licensePlate: searchPlate as (string | null)[] });
  };

  const toggleCategory = (category: FilterCategory) => {
    // Allow multiple categories to be active at once
    if (activeCategories.includes(category)) {
      setActiveCategories(activeCategories.filter(c => c !== category));
    } else {
      setActiveCategories([...activeCategories, category]);
    }
  };

  return (
    <div className="bg-[#1E1E1E] rounded-lg p-4 shadow-md border border-[#3A3A3A]">
      <h2 className="text-md font-medium mb-3">Search Observations</h2>
      
      <div className="space-y-4">
        {/* Search Input */}
        <div className="relative">
          <Input
            type="text"
            placeholder="Search by name, license plate, address..."
            value={searchParams.query || ""}
            onChange={handleQueryChange}
            className="w-full rounded-lg bg-[#3A3A3A] border-0 py-3 pl-10 pr-3 text-white focus:ring-1 focus:ring-[#0F52BA] focus:outline-none"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-[#8A8A8A]" />
          </div>
        </div>
        
        {/* Search Filters */}
        <div>
          <button
            type="button"
            className="w-full flex justify-between items-center mb-2"
            onClick={() => setShowFilters(!showFilters)}
          >
            <span className="text-sm font-medium">Advanced Filters</span>
            {showFilters ? (
              <ChevronUp className="h-5 w-5 text-[#0F52BA]" />
            ) : (
              <ChevronDown className="h-5 w-5 text-[#0F52BA]" />
            )}
          </button>
          
          {showFilters && (
            <div className="space-y-3">
              {/* Filter Categories */}
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={activeCategories.includes("person") ? "default" : "secondary"}
                  className={`text-xs py-2 px-3 rounded-md ${
                    activeCategories.includes("person") 
                      ? "bg-[#0F52BA] text-white" 
                      : "bg-[#3A3A3A] hover:bg-[#5A5A5A] text-[#8A8A8A]"
                  }`}
                  onClick={() => toggleCategory("person")}
                >
                  Person Details
                </Button>
                <Button
                  type="button"
                  variant={activeCategories.includes("vehicle") ? "default" : "secondary"}
                  className={`text-xs py-2 px-3 rounded-md ${
                    activeCategories.includes("vehicle") 
                      ? "bg-[#0F52BA] text-white" 
                      : "bg-[#3A3A3A] hover:bg-[#5A5A5A] text-[#8A8A8A]"
                  }`}
                  onClick={() => toggleCategory("vehicle")}
                >
                  Vehicle Details
                </Button>
                <Button
                  type="button"
                  variant={activeCategories.includes("date") ? "default" : "secondary"}
                  className={`text-xs py-2 px-3 rounded-md ${
                    activeCategories.includes("date") 
                      ? "bg-[#0F52BA] text-white" 
                      : "bg-[#3A3A3A] hover:bg-[#5A5A5A] text-[#8A8A8A]"
                  }`}
                  onClick={() => toggleCategory("date")}
                >
                  Date Range
                </Button>
                <Button
                  type="button"
                  variant={activeCategories.includes("location") ? "default" : "secondary"}
                  className={`text-xs py-2 px-3 rounded-md ${
                    activeCategories.includes("location") 
                      ? "bg-[#0F52BA] text-white" 
                      : "bg-[#3A3A3A] hover:bg-[#5A5A5A] text-[#8A8A8A]"
                  }`}
                  onClick={() => toggleCategory("location")}
                >
                  Locations
                </Button>
              </div>
              
              {/* Person Filters */}
              {activeCategory === "person" && (
                <div className="space-y-3 border-t border-[#3A3A3A] pt-3">
                  <h3 className="text-xs font-medium text-[#8A8A8A]">Person Filters</h3>
                  
                  {/* Height Range (Min/Max) */}
                  <div className="mb-2">
                    <Label className="block text-xs text-[#8A8A8A] mb-1">Height Range</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Select
                          value={(searchParams.person?.heightMin) || ""}
                          onValueChange={(value) => handlePersonChange("heightMin", value)}
                        >
                          <SelectTrigger
                            className="w-full rounded bg-[#3A3A3A] border-0 py-2 px-2 text-xs text-white focus:ring-1 focus:ring-[#0F52BA] focus:outline-none"
                          >
                            <SelectValue placeholder="Min height" />
                          </SelectTrigger>
                          <SelectContent className="bg-[#1E1E1E] border border-[#3A3A3A]">
                            {heightOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value} className="text-white">
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Select
                          value={(searchParams.person?.heightMax) || ""}
                          onValueChange={(value) => handlePersonChange("heightMax", value)}
                        >
                          <SelectTrigger
                            className="w-full rounded bg-[#3A3A3A] border-0 py-2 px-2 text-xs text-white focus:ring-1 focus:ring-[#0F52BA] focus:outline-none"
                          >
                            <SelectValue placeholder="Max height" />
                          </SelectTrigger>
                          <SelectContent className="bg-[#1E1E1E] border border-[#3A3A3A]">
                            {heightOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value} className="text-white">
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  
                  {/* Build Options (Primary/Secondary) */}
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <div>
                      <Label className="block text-xs text-[#8A8A8A] mb-1">Primary Build</Label>
                      <Select
                        value={(searchParams.person?.buildPrimary) || ""}
                        onValueChange={(value) => handlePersonChange("buildPrimary", value)}
                      >
                        <SelectTrigger
                          className="w-full rounded bg-[#3A3A3A] border-0 py-2 px-2 text-xs text-white focus:ring-1 focus:ring-[#0F52BA] focus:outline-none"
                        >
                          <SelectValue placeholder="Any build" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1E1E1E] border border-[#3A3A3A]">
                          {buildOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value} className="text-white">
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="block text-xs text-[#8A8A8A] mb-1">Secondary Build</Label>
                      <Select
                        value={(searchParams.person?.buildSecondary) || ""}
                        onValueChange={(value) => handlePersonChange("buildSecondary", value)}
                      >
                        <SelectTrigger
                          className="w-full rounded bg-[#3A3A3A] border-0 py-2 px-2 text-xs text-white focus:ring-1 focus:ring-[#0F52BA] focus:outline-none"
                        >
                          <SelectValue placeholder="Any build" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1E1E1E] border border-[#3A3A3A]">
                          {buildOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value} className="text-white">
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <Label className="block text-xs text-[#8A8A8A] mb-1">Hair Color</Label>
                      <Select
                        value={(searchParams.person?.hairColor) || ""}
                        onValueChange={(value) => handlePersonChange("hairColor", value)}
                      >
                        <SelectTrigger
                          className="w-full rounded bg-[#3A3A3A] border-0 py-2 px-2 text-xs text-white focus:ring-1 focus:ring-[#0F52BA] focus:outline-none"
                        >
                          <SelectValue placeholder="Any" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1E1E1E] border border-[#3A3A3A]">
                          {hairColorOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value} className="text-white">
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="block text-xs text-[#8A8A8A] mb-1">Eye Color</Label>
                      <Select
                        value={(searchParams.person?.eyeColor) || ""}
                        onValueChange={(value) => handlePersonChange("eyeColor", value)}
                      >
                        <SelectTrigger
                          className="w-full rounded bg-[#3A3A3A] border-0 py-2 px-2 text-xs text-white focus:ring-1 focus:ring-[#0F52BA] focus:outline-none"
                        >
                          <SelectValue placeholder="Any" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1E1E1E] border border-[#3A3A3A]">
                          {eyeColorOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value} className="text-white">
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="block text-xs text-[#8A8A8A] mb-1">Skin Tone</Label>
                      <Select
                        value={(searchParams.person?.skinTone) || ""}
                        onValueChange={(value) => handlePersonChange("skinTone", value)}
                      >
                        <SelectTrigger
                          className="w-full rounded bg-[#3A3A3A] border-0 py-2 px-2 text-xs text-white focus:ring-1 focus:ring-[#0F52BA] focus:outline-none"
                        >
                          <SelectValue placeholder="Any" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1E1E1E] border border-[#3A3A3A]">
                          {skinToneOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value} className="text-white">
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Vehicle Filters */}
              {activeCategory === "vehicle" && (
                <div className="space-y-3 border-t border-[#3A3A3A] pt-3">
                  <h3 className="text-xs font-medium text-[#8A8A8A]">Vehicle Filters</h3>
                  
                  {/* Vehicle Year Range (Min/Max) */}
                  <div className="mb-2">
                    <Label className="block text-xs text-[#8A8A8A] mb-1">Vehicle Year Range</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Select
                          value={(searchParams.vehicle?.yearMin) || ""}
                          onValueChange={(value) => handleVehicleChange("yearMin", value)}
                        >
                          <SelectTrigger
                            className="w-full rounded bg-[#3A3A3A] border-0 py-2 px-2 text-xs text-white focus:ring-1 focus:ring-[#0F52BA] focus:outline-none"
                          >
                            <SelectValue placeholder="Minimum year" />
                          </SelectTrigger>
                          <SelectContent className="bg-[#1E1E1E] border border-[#3A3A3A] max-h-[200px]">
                            <SelectItem value="pre1950" className="text-white">Pre 1950</SelectItem>
                            {vehicleYearOptions.slice(3, -1).map((option) => (
                              <SelectItem key={option.value} value={option.value} className="text-white">
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Select
                          value={(searchParams.vehicle?.yearMax) || ""}
                          onValueChange={(value) => handleVehicleChange("yearMax", value)}
                        >
                          <SelectTrigger
                            className="w-full rounded bg-[#3A3A3A] border-0 py-2 px-2 text-xs text-white focus:ring-1 focus:ring-[#0F52BA] focus:outline-none"
                          >
                            <SelectValue placeholder="Maximum year" />
                          </SelectTrigger>
                          <SelectContent className="bg-[#1E1E1E] border border-[#3A3A3A] max-h-[200px]">
                            {vehicleYearOptions.slice(3, -1).map((option) => (
                              <SelectItem key={option.value} value={option.value} className="text-white">
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  
                  {/* Vehicle Color */}
                  <div>
                    <Label className="block text-xs text-[#8A8A8A] mb-1">Color</Label>
                    <Select
                      value={(searchParams.vehicle?.color) || ""}
                      onValueChange={(value) => handleVehicleChange("color", value)}
                    >
                      <SelectTrigger
                        className="w-full rounded bg-[#3A3A3A] border-0 py-2 px-2 text-xs text-white focus:ring-1 focus:ring-[#0F52BA] focus:outline-none"
                      >
                        <SelectValue placeholder="Any color" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1E1E1E] border border-[#3A3A3A]">
                        {vehicleColorOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value} className="text-white">
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <h3 className="text-xs font-medium text-[#8A8A8A] mb-2">License Plate Search</h3>
                    <LicensePlateInput 
                      licensePlate={searchParams.licensePlate as (string | undefined)[] || []}
                      onChange={handleLicensePlateChange}
                      compact={true}
                    />
                  </div>
                </div>
              )}
              
              {/* Date Range Filters */}
              {activeCategory === "date" && (
                <div className="space-y-3 border-t border-[#3A3A3A] pt-3">
                  <h3 className="text-xs font-medium text-[#8A8A8A]">Date Range</h3>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="block text-xs text-[#8A8A8A] mb-1">From</Label>
                      <Input
                        type="date"
                        value={searchParams.dateFrom || ""}
                        onChange={(e) => onSearchParamsChange({ ...searchParams, dateFrom: e.target.value })}
                        className="w-full rounded bg-[#3A3A3A] border-0 py-2 px-2 text-xs text-white focus:ring-1 focus:ring-[#0F52BA] focus:outline-none"
                      />
                    </div>
                    <div>
                      <Label className="block text-xs text-[#8A8A8A] mb-1">To</Label>
                      <Input
                        type="date"
                        value={searchParams.dateTo || ""}
                        onChange={(e) => onSearchParamsChange({ ...searchParams, dateTo: e.target.value })}
                        className="w-full rounded bg-[#3A3A3A] border-0 py-2 px-2 text-xs text-white focus:ring-1 focus:ring-[#0F52BA] focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}
              
              {/* Location Filters */}
              {activeCategory === "location" && (
                <div className="space-y-3 border-t border-[#3A3A3A] pt-3">
                  <h3 className="text-xs font-medium text-[#8A8A8A]">Location Search</h3>
                  
                  <div>
                    <Label className="block text-xs text-[#8A8A8A] mb-1">Address</Label>
                    <Input
                      type="text"
                      placeholder="Enter address to search"
                      value={(searchParams.person?.address) || ""}
                      onChange={(e) => handlePersonChange("address", e.target.value)}
                      className="w-full rounded bg-[#3A3A3A] border-0 py-2 px-3 text-xs text-white focus:ring-1 focus:ring-[#0F52BA] focus:outline-none"
                    />
                  </div>
                  
                  <div>
                    <Label className="block text-xs text-[#8A8A8A] mb-1">Work Address</Label>
                    <Input
                      type="text"
                      placeholder="Enter work address to search"
                      value={(searchParams.person?.workAddress) || ""}
                      onChange={(e) => handlePersonChange("workAddress", e.target.value)}
                      className="w-full rounded bg-[#3A3A3A] border-0 py-2 px-3 text-xs text-white focus:ring-1 focus:ring-[#0F52BA] focus:outline-none"
                    />
                  </div>
                </div>
              )}
              
              <div className="pt-2">
                <Button 
                  type="button" 
                  onClick={onSubmit}
                  className="w-full py-2 bg-[#0F52BA] hover:bg-[#0A3A8C] text-white rounded-md"
                >
                  Search
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
