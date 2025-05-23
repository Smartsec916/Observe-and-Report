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

  const selectWidth = compact ? "w-11" : "w-14";
  const paddingY = compact ? "py-1" : "py-2";
  const textSize = compact ? "text-xs" : "text-sm";

  return (
    <div className={className}>
      <Label className={`block ${compact ? 'text-xs' : 'text-sm'} font-medium mb-1`}>
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
              className={`${selectWidth} rounded bg-card border-0 ${paddingY} text-center text-card-foreground focus:ring-1 focus:ring-primary focus:outline-none ${textSize}`}
            >
              <SelectValue placeholder="?" />
            </SelectTrigger>
            <SelectContent className="bg-popover border border-border max-h-[200px]">
              {licensePlateOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
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
