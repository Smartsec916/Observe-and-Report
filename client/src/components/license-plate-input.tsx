import React from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { licensePlateOptions } from "@/lib/types";

interface LicensePlateInputProps {
  licensePlate: (string | undefined)[];
  onChange: (plate: (string | undefined)[]) => void;
  className?: string;
  compact?: boolean;
}

export function LicensePlateInput({ 
  licensePlate, 
  onChange, 
  className,
  compact = false 
}: LicensePlateInputProps) {
  // Ensure license plate has 7 slots
  const plate = [...(licensePlate || []), "", "", "", "", "", "", ""].slice(0, 7);

  const handleChange = (index: number, value: string) => {
    const newPlate = [...plate];
    // Convert placeholder to empty string
    newPlate[index] = value === "placeholder" ? "" : value;
    onChange(newPlate);
  };

  const selectWidth = compact ? "w-8" : "w-10";
  const paddingY = compact ? "py-1" : "py-2";
  const textSize = compact ? "text-xs" : "text-sm";

  return (
    <div className={className}>
      <Label className={`block ${compact ? 'text-xs' : 'text-sm'} font-medium text-[#8A8A8A] mb-1`}>
        License Plate
      </Label>
      <div className="flex space-x-1 items-center justify-center">
        {Array.from({ length: 7 }).map((_, index) => (
          <Select
            key={index}
            value={plate[index] || ""}
            onValueChange={(value) => handleChange(index, value)}
          >
            <SelectTrigger
              className={`${selectWidth} rounded bg-[#3A3A3A] border-0 ${paddingY} text-center text-white focus:ring-1 focus:ring-[#0F52BA] focus:outline-none ${textSize}`}
            >
              <SelectValue placeholder="?" />
            </SelectTrigger>
            <SelectContent className="bg-[#1E1E1E] border border-[#3A3A3A] max-h-[200px]">
              {licensePlateOptions.map((option) => (
                <SelectItem key={option.value} value={option.value} className="text-white">
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ))}
      </div>
    </div>
  );
}
