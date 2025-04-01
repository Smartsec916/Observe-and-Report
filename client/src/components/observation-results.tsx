import React from "react";
import { Observation } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

interface ObservationResultsProps {
  results: Observation[];
  onEdit: (id: number) => void;
  onViewDetails: (id: number) => void;
}

export function ObservationResults({ results, onEdit, onViewDetails }: ObservationResultsProps) {
  // Format the date string from YYYY-MM-DD to MM/DD/YY
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, "M/d/yy");
    } catch (error) {
      return dateString;
    }
  };

  // Get a description of the person
  const getPersonDescription = (observation: Observation) => {
    const { person } = observation;
    const details = [];

    // Handle height display with preference for min/max ranges
    if (person.heightMin && person.heightMax) {
      details.push(`${getHeightLabel(person.heightMin)} to ${getHeightLabel(person.heightMax)}`);
    } else if (person.heightMin) {
      details.push(`Min: ${getHeightLabel(person.heightMin)}`);
    } else if (person.heightMax) {
      details.push(`Max: ${getHeightLabel(person.heightMax)}`);
    } else if (person.height) {
      details.push(getHeightLabel(person.height));
    }
    
    // Handle build display with preference for primary/secondary
    if (person.buildPrimary && person.buildSecondary) {
      details.push(`${person.buildPrimary}-${person.buildSecondary} build`);
    } else if (person.buildPrimary) {
      details.push(`${person.buildPrimary} build`);
    } else if (person.buildSecondary) {
      details.push(`${person.buildSecondary} build`);
    } else if (person.build) {
      details.push(`${person.build} build`);
    }
    
    if (person.hairColor) details.push(`${person.hairColor} hair`);
    if (person.eyeColor) details.push(`${person.eyeColor} eyes`);

    return details.length > 0 ? details.join(", ") : "No description available";
  };

  // Get a description of the vehicle
  const getVehicleDescription = (observation: Observation) => {
    const { vehicle } = observation;
    const details = [];

    if (vehicle.color) details.push(vehicle.color);
    if (vehicle.make) details.push(vehicle.make);
    if (vehicle.model) details.push(vehicle.model);
    
    // Handle year display with preference for min/max ranges
    if (vehicle.yearMin && vehicle.yearMax) {
      details.push(`${vehicle.yearMin} to ${vehicle.yearMax}`);
    } else if (vehicle.yearMin) {
      details.push(`Min Year: ${vehicle.yearMin}`);
    } else if (vehicle.yearMax) {
      details.push(`Max Year: ${vehicle.yearMax}`);
    } else if (vehicle.year) {
      details.push(vehicle.year);
    }

    const licensePlate = vehicle.licensePlate?.filter(char => char).join("") || "";
    if (licensePlate) {
      details.push(licensePlate);
    }

    return details.length > 0 ? details.join(", ") : "No vehicle information";
  };

  // Convert height value to readable label
  const getHeightLabel = (heightValue: string) => {
    const heightMap: Record<string, string> = {
      "unknown": "Unknown Height",
      "variable": "Variable Height",
      "under5ft": "Under 5'0\"",
      "5ft0-5ft1": "5'0\" - 5'1\"",
      "5ft2-5ft3": "5'2\" - 5'3\"",
      "5ft4-5ft5": "5'4\" - 5'5\"",
      "5ft6-5ft7": "5'6\" - 5'7\"",
      "5ft8-5ft9": "5'8\" - 5'9\"",
      "5ft10-5ft11": "5'10\" - 5'11\"",
      "6ft0-6ft1": "6'0\" - 6'1\"",
      "6ft2-6ft3": "6'2\" - 6'3\"",
      "6ft4-6ft5": "6'4\" - 6'5\"",
      "over6ft5": "Over 6'5\""
    };
    
    return heightMap[heightValue] || heightValue;
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h2 className="text-md font-medium">Results</h2>
        <span className="text-xs text-[#8A8A8A]">{results.length} matches found</span>
      </div>
      
      {results.length === 0 ? (
        <div className="bg-[#1E1E1E] rounded-lg p-4 shadow-md border border-[#3A3A3A] text-center">
          <p className="text-sm text-[#8A8A8A]">No observations found</p>
        </div>
      ) : (
        results.map((observation) => (
          <div key={observation.id} className="bg-[#1E1E1E] rounded-lg p-4 shadow-md border border-[#3A3A3A]">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-sm font-medium">
                {observation.person.name || "Unknown Person"}
              </h3>
              <span className="text-xs text-[#8A8A8A]">
                {formatDate(observation.date)}
              </span>
            </div>
            
            {/* Image gallery preview if images exist */}
            {observation.images && observation.images.length > 0 && (
              <div className="mb-3 overflow-x-auto whitespace-nowrap flex gap-2 py-1">
                {observation.images.map((image, index) => (
                  <div 
                    key={index} 
                    className="h-16 w-16 rounded-md bg-black inline-block overflow-hidden flex-shrink-0 border border-[#3A3A3A]"
                  >
                    <img 
                      src={image.url} 
                      alt={image.description || `Image ${index + 1}`} 
                      className="h-full w-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div>
                <p className="text-xs text-[#8A8A8A]">Description</p>
                <p className="text-xs">{getPersonDescription(observation)}</p>
              </div>
              <div>
                <p className="text-xs text-[#8A8A8A]">Vehicle</p>
                <p className="text-xs">{getVehicleDescription(observation)}</p>
              </div>
            </div>
            
            <div className="flex justify-between items-center space-x-2">
              {observation.images && observation.images.length > 0 && (
                <span className="text-xs text-[#8A8A8A]">
                  {observation.images.length} image{observation.images.length !== 1 ? 's' : ''}
                </span>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-[#2979FF] hover:text-[#0F52BA] p-0 h-auto ml-auto"
                onClick={() => onEdit(observation.id)}
              >
                View Details / Edit
              </Button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
