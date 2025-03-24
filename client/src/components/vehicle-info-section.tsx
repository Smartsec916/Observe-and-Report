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
    const newVehicle = { ...vehicle } as VehicleInfo;
    newVehicle[field] = value;
    onChange(newVehicle);
  };

  // Location-related functionality removed

  return (
    <div className="bg-card rounded-lg p-4 shadow-md border border-border">
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
              <Label htmlFor="vehicleMake" className="block text-xs font-medium mb-1">
                Make
              </Label>
              <Input
                type="text"
                id="vehicleMake"
                placeholder="e.g. Toyota"
                value={vehicle.make || ""}
                onChange={(e) => handleChange("make", e.target.value)}
                className="w-full rounded border-input bg-background text-foreground py-2 px-3 focus:ring-1 focus:ring-[#0F52BA] focus:outline-none"
              />
            </div>
            <div>
              <Label htmlFor="vehicleModel" className="block text-xs font-medium mb-1">
                Model
              </Label>
              <Input
                type="text"
                id="vehicleModel"
                placeholder="e.g. Camry"
                value={vehicle.model || ""}
                onChange={(e) => handleChange("model", e.target.value)}
                className="w-full rounded border-input bg-background text-foreground py-2 px-3 focus:ring-1 focus:ring-[#0F52BA] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <Label className="block text-xs font-medium mb-1">
              Year Range
            </Label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="vehicleYearMin" className="block text-xs font-medium mb-1">
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
                    className="w-full rounded border-input bg-background text-foreground py-2 px-3 focus:ring-1 focus:ring-[#0F52BA] focus:outline-none"
                  >
                    <SelectValue placeholder="Min year" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border border-border max-h-[200px] overflow-y-auto">
                    {/* Show placeholder and unknown options */}
                    {vehicleYearOptions.slice(0, 2).map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                    
                    {/* Show pre-1950 option */}
                    <SelectItem key="pre1950" value="pre1950">
                      Pre 1950
                    </SelectItem>
                    
                    {/* Show separator */}
                    <Separator className="my-1" />
                    
                    {/* Show all year options */}
                    {vehicleYearOptions.slice(3, -1).map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="vehicleYearMax" className="block text-xs font-medium mb-1">
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
                    className="w-full rounded border-input bg-background text-foreground py-2 px-3 focus:ring-1 focus:ring-[#0F52BA] focus:outline-none"
                  >
                    <SelectValue placeholder="Max year" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border border-border max-h-[200px] overflow-y-auto">
                    {/* Show placeholder and unknown options */}
                    {vehicleYearOptions.slice(0, 2).map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                    
                    {/* Show separator */}
                    <Separator className="my-1" />
                    
                    {/* Show all year options */}
                    {vehicleYearOptions.slice(3, -1).map((option) => (
                      <SelectItem key={option.value} value={option.value}>
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
              <Label htmlFor="vehicleColor" className="block text-xs font-medium mb-1">
                Color
              </Label>
              <Select
                value={vehicle.color || ""}
                onValueChange={(value) => handleChange("color", value)}
              >
                <SelectTrigger
                  id="vehicleColor"
                  className="w-full rounded border-input bg-background text-foreground py-2 px-3 focus:ring-1 focus:ring-[#0F52BA] focus:outline-none"
                >
                  <SelectValue placeholder="Select color" />
                </SelectTrigger>
                <SelectContent className="bg-popover border border-border">
                  {vehicleColorOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
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

          {/* Additional Locations section removed as requested */}


        </div>
      )}
    </div>
  );
}