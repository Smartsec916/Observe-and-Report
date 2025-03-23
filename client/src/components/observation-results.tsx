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

    if (person.height) details.push(getHeightLabel(person.height));
    if (person.build) details.push(`${person.build} build`);
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
    if (vehicle.year) details.push(vehicle.year);

    const licensePlate = vehicle.licensePlate?.filter(char => char).join("") || "";
    if (licensePlate) {
      details.push(licensePlate);
    }

    return details.length > 0 ? details.join(", ") : "No vehicle information";
  };

  // Convert height value to readable label
  const getHeightLabel = (heightValue: string) => {
    const heightMap: Record<string, string> = {
      "under5ft": "Under 5'0\"",
      "5ft0-5ft3": "5'0\" - 5'3\"",
      "5ft4-5ft7": "5'4\" - 5'7\"",
      "5ft8-5ft11": "5'8\" - 5'11\"",
      "6ft0-6ft3": "6'0\" - 6'3\"",
      "over6ft3": "Over 6'3\""
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
            
            <div className="flex justify-end space-x-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-[#2979FF] hover:text-[#0F52BA] p-0 h-auto"
                onClick={() => onEdit(observation.id)}
              >
                Edit
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-[#2979FF] hover:text-[#0F52BA] p-0 h-auto"
                onClick={() => onViewDetails(observation.id)}
              >
                View Details
              </Button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
