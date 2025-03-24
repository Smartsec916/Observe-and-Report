import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronDown, ChevronUp, Search } from "lucide-react";
import { 
  SearchParams, heightOptions, buildOptions, hairColorOptions, 
  eyeColorOptions, skinToneOptions, vehicleColorOptions, vehicleYearOptions,
  PersonInfo, VehicleInfo
} from "@/lib/types";
import { LicensePlateInput } from "./license-plate-input";

interface SearchFiltersProps {
  searchParams: SearchParams;
  onSearchParamsChange: (params: SearchParams) => void;
  onSubmit: () => void;
}

type FilterCategory = "person" | "vehicle" | "date";

export function SearchFilters({ searchParams, onSearchParamsChange, onSubmit }: SearchFiltersProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [activeCategories, setActiveCategories] = useState<FilterCategory[]>([]);

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSearchParamsChange({ ...searchParams, query: e.target.value });
  };

  const handlePersonChange = (field: keyof PersonInfo, value: string) => {
    // Don't save placeholder values to the search params
    // Create a completely new object to avoid React not detecting the change
    const newPerson = { ...(searchParams.person || {}) } as Partial<PersonInfo>;
    
    if (value === "placeholder") {
      // If placeholder is selected, delete the property from the object
      delete newPerson[field];
    } else {
      // Otherwise set the value
      newPerson[field] = value;
    }
    
    onSearchParamsChange({ 
      ...searchParams, 
      person: newPerson 
    });
  };

  const handleVehicleChange = (field: keyof VehicleInfo, value: any) => {
    // Don't save placeholder values to the search params
    // Create a completely new object to avoid React not detecting the change
    const newVehicle = { ...(searchParams.vehicle || {}) } as Partial<VehicleInfo>;
    
    if (value === "placeholder") {
      // If placeholder is selected, delete the property from the object
      delete newVehicle[field];
    } else {
      // Otherwise set the value
      newVehicle[field] = value;
    }
    
    onSearchParamsChange({ 
      ...searchParams, 
      vehicle: newVehicle 
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
        {/* Search Input with Button */}
        <div className="flex gap-2">
          <div className="relative flex-1">
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
          <Button 
            type="button" 
            onClick={onSubmit}
            className="bg-[#0F52BA] hover:bg-[#0A3A8C] text-white rounded-md px-4"
          >
            Search
          </Button>
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

              </div>
              
              {/* Person Filters */}
              {activeCategories.includes("person") && (
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
                  
                  {/* Age Range (Min/Max) */}
                  <div className="mb-2">
                    <Label className="block text-xs text-[#8A8A8A] mb-1">Age Range</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Input
                          type="number"
                          placeholder="Min age"
                          min="0"
                          max="120"
                          value={searchParams.person?.ageRangeMin || ""}
                          onChange={(e) => {
                            const value = e.target.value ? parseInt(e.target.value, 10) : undefined;
                            handlePersonChange("ageRangeMin", value as any);
                          }}
                          className="w-full rounded bg-[#3A3A3A] border-0 py-2 px-2 text-xs text-white focus:ring-1 focus:ring-[#0F52BA] focus:outline-none"
                        />
                      </div>
                      <div>
                        <Input
                          type="number"
                          placeholder="Max age"
                          min="0"
                          max="120"
                          value={searchParams.person?.ageRangeMax || ""}
                          onChange={(e) => {
                            const value = e.target.value ? parseInt(e.target.value, 10) : undefined;
                            handlePersonChange("ageRangeMax", value as any);
                          }}
                          className="w-full rounded bg-[#3A3A3A] border-0 py-2 px-2 text-xs text-white focus:ring-1 focus:ring-[#0F52BA] focus:outline-none"
                        />
                      </div>
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
              {activeCategories.includes("vehicle") && (
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
                            {/* Show placeholder and unknown options */}
                            <SelectItem key={vehicleYearOptions[0].value} value={vehicleYearOptions[0].value} className="text-white">
                              {vehicleYearOptions[0].label}
                            </SelectItem>
                            <SelectItem key={vehicleYearOptions[1].value} value={vehicleYearOptions[1].value} className="text-white">
                              {vehicleYearOptions[1].label}
                            </SelectItem>
                            
                            {/* Show separator */}
                            <div className="h-px my-1 bg-[#3A3A3A]"></div>
                            
                            {/* Show all year options in descending order (newest first) */}
                            {vehicleYearOptions.slice(2, -2).map((option) => (
                              <SelectItem key={option.value} value={option.value} className="text-white">
                                {option.label}
                              </SelectItem>
                            ))}
                            
                            {/* Show pre-1950 option */}
                            <SelectItem key="pre1950" value="pre1950" className="text-white">
                              Pre 1950
                            </SelectItem>
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
                            {/* Show placeholder and unknown options */}
                            <SelectItem key={vehicleYearOptions[0].value} value={vehicleYearOptions[0].value} className="text-white">
                              {vehicleYearOptions[0].label}
                            </SelectItem>
                            <SelectItem key={vehicleYearOptions[1].value} value={vehicleYearOptions[1].value} className="text-white">
                              {vehicleYearOptions[1].label}
                            </SelectItem>
                            
                            {/* Show separator */}
                            <div className="h-px my-1 bg-[#3A3A3A]"></div>
                            
                            {/* Show all year options in descending order (newest first) */}
                            {vehicleYearOptions.slice(2, -2).map((option) => (
                              <SelectItem key={option.value} value={option.value} className="text-white">
                                {option.label}
                              </SelectItem>
                            ))}
                            
                            {/* Show pre-1950 option */}
                            <SelectItem key="pre1950" value="pre1950" className="text-white">
                              Pre 1950
                            </SelectItem>
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
              {activeCategories.includes("date") && (
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
