import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ChevronDown, ChevronUp, Plus, X } from "lucide-react";
import { VehicleInfo, vehicleYearOptions, vehicleColorOptions } from "@/lib/types";
import { LicensePlateInput } from "./license-plate-input";

interface VehicleInfoSectionProps {
  vehicle: VehicleInfo;
  onChange: (vehicle: VehicleInfo) => void;
}

export function VehicleInfoSection({ vehicle, onChange }: VehicleInfoSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const handleChange = (field: keyof VehicleInfo, value: any) => {
    // Don't save placeholder values to the actual data
    const newValue = value === "placeholder" ? "" : value;
    // Create a completely new object to avoid React not detecting the change
    const newVehicle = { ...vehicle } as VehicleInfo;
    newVehicle[field] = newValue;
    onChange(newVehicle);
  };

  const handleAddLocation = () => {
    const currentLocations = vehicle.additionalLocations || [];
    handleChange("additionalLocations", [...currentLocations, ""]);
  };

  const handleLocationChange = (index: number, value: string) => {
    const newLocations = [...(vehicle.additionalLocations || [])];
    newLocations[index] = value;
    handleChange("additionalLocations", newLocations);
  };

  const handleRemoveLocation = (index: number) => {
    const newLocations = [...(vehicle.additionalLocations || [])];
    newLocations.splice(index, 1);
    handleChange("additionalLocations", newLocations);
  };

  return (
    <div className="bg-[#1E1E1E] rounded-lg p-4 shadow-md border border-[#3A3A3A]">
      <button
        type="button"
        className="w-full flex justify-between items-center mb-2"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h2 className="text-md font-medium">Vehicle Information</h2>
        {isExpanded ? (
          <ChevronUp className="h-5 w-5 text-[#0F52BA]" />
        ) : (
          <ChevronDown className="h-5 w-5 text-[#0F52BA]" />
        )}
      </button>

      {isExpanded && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="vehicleMake" className="block text-xs font-medium text-[#8A8A8A] mb-1">
                Make
              </Label>
              <Input
                type="text"
                id="vehicleMake"
                placeholder="e.g. Toyota"
                value={vehicle.make || ""}
                onChange={(e) => handleChange("make", e.target.value)}
                className="w-full rounded bg-[#3A3A3A] border-0 py-2 px-3 text-white focus:ring-1 focus:ring-[#0F52BA] focus:outline-none"
              />
            </div>
            <div>
              <Label htmlFor="vehicleModel" className="block text-xs font-medium text-[#8A8A8A] mb-1">
                Model
              </Label>
              <Input
                type="text"
                id="vehicleModel"
                placeholder="e.g. Camry"
                value={vehicle.model || ""}
                onChange={(e) => handleChange("model", e.target.value)}
                className="w-full rounded bg-[#3A3A3A] border-0 py-2 px-3 text-white focus:ring-1 focus:ring-[#0F52BA] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <Label className="block text-xs font-medium text-[#8A8A8A] mb-1">
              Year Range
            </Label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="vehicleYearMin" className="block text-xs font-medium text-[#8A8A8A] mb-1">
                  Minimum Year
                </Label>
                <Select
                  value={vehicle.yearMin || ""}
                  onValueChange={(value) => {
                    const newValue = value === "placeholder" ? "" : value;
                    // Create a completely new object and update both fields at once
                    const newVehicle = { ...vehicle } as VehicleInfo;
                    newVehicle.yearMin = newValue;
                    
                    // Update legacy year field for backward compatibility
                    if (vehicle.yearMax) {
                      const range = `${newValue}-${vehicle.yearMax}`;
                      newVehicle.year = range;
                    }
                    
                    // Send the entire updated object at once
                    onChange(newVehicle);
                  }}
                >
                  <SelectTrigger
                    id="vehicleYearMin"
                    className="w-full rounded bg-[#3A3A3A] border-0 py-2 px-3 text-white focus:ring-1 focus:ring-[#0F52BA] focus:outline-none"
                  >
                    <SelectValue placeholder="Min year" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1E1E1E] border border-[#3A3A3A] max-h-[200px] overflow-y-auto">
                    {/* Show placeholder and unknown options */}
                    {vehicleYearOptions.slice(0, 2).map((option) => (
                      <SelectItem key={option.value} value={option.value} className="text-white">
                        {option.label}
                      </SelectItem>
                    ))}
                    
                    {/* Show pre-1950 option */}
                    <SelectItem key="pre1950" value="pre1950" className="text-white">
                      Pre 1950
                    </SelectItem>
                    
                    {/* Show separator */}
                    <Separator className="my-1 bg-[#3A3A3A]" />
                    
                    {/* Show all year options */}
                    {vehicleYearOptions.slice(3, -1).map((option) => (
                      <SelectItem key={option.value} value={option.value} className="text-white">
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="vehicleYearMax" className="block text-xs font-medium text-[#8A8A8A] mb-1">
                  Maximum Year
                </Label>
                <Select
                  value={vehicle.yearMax || ""}
                  onValueChange={(value) => {
                    const newValue = value === "placeholder" ? "" : value;
                    // Create a completely new object and update both fields at once
                    const newVehicle = { ...vehicle } as VehicleInfo;
                    newVehicle.yearMax = newValue;
                    
                    // Update legacy year field for backward compatibility
                    if (vehicle.yearMin) {
                      const range = `${vehicle.yearMin}-${newValue}`;
                      newVehicle.year = range;
                    }
                    
                    // Send the entire updated object at once
                    onChange(newVehicle);
                  }}
                >
                  <SelectTrigger
                    id="vehicleYearMax"
                    className="w-full rounded bg-[#3A3A3A] border-0 py-2 px-3 text-white focus:ring-1 focus:ring-[#0F52BA] focus:outline-none"
                  >
                    <SelectValue placeholder="Max year" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1E1E1E] border border-[#3A3A3A] max-h-[200px] overflow-y-auto">
                    {/* Show placeholder and unknown options */}
                    {vehicleYearOptions.slice(0, 2).map((option) => (
                      <SelectItem key={option.value} value={option.value} className="text-white">
                        {option.label}
                      </SelectItem>
                    ))}
                    
                    {/* Show separator */}
                    <Separator className="my-1 bg-[#3A3A3A]" />
                    
                    {/* Show all year options */}
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
            
          <div>
            <div>
              <Label htmlFor="vehicleColor" className="block text-xs font-medium text-[#8A8A8A] mb-1">
                Color
              </Label>
              <Select
                value={vehicle.color || ""}
                onValueChange={(value) => handleChange("color", value)}
              >
                <SelectTrigger
                  id="vehicleColor"
                  className="w-full rounded bg-[#3A3A3A] border-0 py-2 px-3 text-white focus:ring-1 focus:ring-[#0F52BA] focus:outline-none"
                >
                  <SelectValue placeholder="Select color" />
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
          </div>

          {/* License Plate */}
          <LicensePlateInput 
            licensePlate={vehicle.licensePlate || []}
            onChange={(plate) => handleChange("licensePlate", plate)}
          />

          {/* Additional Locations */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <Label className="block text-xs font-medium text-[#8A8A8A]">
                Additional Locations
              </Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-xs text-[#0F52BA] hover:text-[#2979FF] h-6 px-2"
                onClick={handleAddLocation}
              >
                <Plus className="h-3 w-3 mr-1" /> Add Location
              </Button>
            </div>

            <div className="space-y-2">
              {(vehicle.additionalLocations || []).map((location, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Input
                    type="text"
                    placeholder="Enter location"
                    value={location}
                    onChange={(e) => handleLocationChange(index, e.target.value)}
                    className="flex-1 rounded bg-[#3A3A3A] border-0 py-2 px-3 text-white focus:ring-1 focus:ring-[#0F52BA] focus:outline-none"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-[#8A8A8A] hover:text-[#0F52BA] h-8 w-8"
                    onClick={() => handleRemoveLocation(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {(vehicle.additionalLocations || []).length === 0 && (
                <div className="flex items-center space-x-2">
                  <Input
                    type="text"
                    placeholder="Enter location"
                    value=""
                    onChange={(e) => handleLocationChange(0, e.target.value)}
                    className="flex-1 rounded bg-[#3A3A3A] border-0 py-2 px-3 text-white focus:ring-1 focus:ring-[#0F52BA] focus:outline-none"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="vehicleNotes" className="block text-xs font-medium text-[#8A8A8A] mb-1">
              Notes
            </Label>
            <Textarea
              id="vehicleNotes"
              placeholder="Additional details about the vehicle"
              value={vehicle.notes || ""}
              onChange={(e) => handleChange("notes", e.target.value)}
              rows={3}
              className="w-full rounded bg-[#3A3A3A] border-0 py-2 px-3 text-white focus:ring-1 focus:ring-[#0F52BA] focus:outline-none"
            />
          </div>
        </div>
      )}
    </div>
  );
}
