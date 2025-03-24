import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronDown, ChevronUp } from "lucide-react";
import { PersonInfo, heightOptions, buildOptions, hairColorOptions, eyeColorOptions, skinToneOptions } from "@/lib/types";

interface PersonInfoSectionProps {
  person: PersonInfo;
  onChange: (person: PersonInfo) => void;
}

export function PersonInfoSection({ person, onChange }: PersonInfoSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const handleChange = (field: keyof PersonInfo, value: any) => {
    const newPerson = { ...person } as PersonInfo;
    newPerson[field] = value;
    onChange(newPerson);
  };

  return (
    <div className="bg-card rounded-lg p-4 shadow-md border border-border">
      <button
        type="button"
        className="w-full flex justify-between items-center mb-2"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h2 className="text-md font-medium">Person Information</h2>
        {isExpanded ? (
          <ChevronUp className="h-5 w-5 text-primary" />
        ) : (
          <ChevronDown className="h-5 w-5 text-primary" />
        )}
      </button>

      {isExpanded && (
        <div className="space-y-4">
          {/* Name */}
          <div>
            <Label htmlFor="personName" className="block text-xs font-medium mb-1">
              Name
            </Label>
            <Input
              type="text"
              id="personName"
              placeholder="Enter name"
              value={person.name || ""}
              onChange={(e) => handleChange("name", e.target.value)}
              className="w-full rounded border-input bg-background text-foreground py-2 px-3 focus:ring-1 focus:ring-primary focus:outline-none"
            />
          </div>

          {/* Height Range */}
          <div>
            <Label className="block text-xs font-medium mb-1">
              Height Range
            </Label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="personHeightMin" className="block text-xs font-medium mb-1">
                  Minimum
                </Label>
                <Select
                  value={person.heightMin || ""}
                  onValueChange={(value) => {
                    const newValue = value === "placeholder" ? "" : value;
                    // Create a completely new object and update both fields at once
                    const newPerson = { ...person } as PersonInfo;
                    newPerson.heightMin = newValue;
                    
                    // Also update the legacy height field for backward compatibility
                    if (person.heightMax) {
                      const range = `${newValue}-${person.heightMax}`;
                      newPerson.height = range;
                    }
                    
                    // Send the entire updated object at once
                    onChange(newPerson);
                  }}
                >
                  <SelectTrigger
                    id="personHeightMin"
                    className="w-full rounded border-input bg-background text-foreground py-2 px-3 focus:ring-1 focus:ring-primary focus:outline-none"
                  >
                    <SelectValue placeholder="Min height" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border border-border">
                    {heightOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="personHeightMax" className="block text-xs font-medium mb-1">
                  Maximum
                </Label>
                <Select
                  value={person.heightMax || ""}
                  onValueChange={(value) => {
                    const newValue = value === "placeholder" ? "" : value;
                    // Create a completely new object and update both fields at once
                    const newPerson = { ...person } as PersonInfo;
                    newPerson.heightMax = newValue;
                    
                    // Also update the legacy height field for backward compatibility
                    if (person.heightMin) {
                      const range = `${person.heightMin}-${newValue}`;
                      newPerson.height = range;
                    }
                    
                    // Send the entire updated object at once
                    onChange(newPerson);
                  }}
                >
                  <SelectTrigger
                    id="personHeightMax"
                    className="w-full rounded border-input bg-background text-foreground py-2 px-3 focus:ring-1 focus:ring-[#0F52BA] focus:outline-none"
                  >
                    <SelectValue placeholder="Max height" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border border-border">
                    {heightOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Build Options */}
          <div>
            <Label className="block text-xs font-medium mb-1">
              Build
            </Label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="personBuildPrimary" className="block text-xs font-medium mb-1">
                  Primary
                </Label>
                <Select
                  value={person.buildPrimary || ""}
                  onValueChange={(value) => {
                    const newValue = value === "placeholder" ? "" : value;
                    // Create a completely new object and update both fields at once
                    const newPerson = { ...person } as PersonInfo;
                    newPerson.buildPrimary = newValue;
                    
                    // Also update the legacy build field for backward compatibility
                    if (person.buildSecondary) {
                      const combined = `${newValue}-${person.buildSecondary}`;
                      newPerson.build = combined;
                    } else {
                      newPerson.build = newValue;
                    }
                    
                    // Send the entire updated object at once
                    onChange(newPerson);
                  }}
                >
                  <SelectTrigger
                    id="personBuildPrimary"
                    className="w-full rounded border-input bg-background text-foreground py-2 px-3 focus:ring-1 focus:ring-[#0F52BA] focus:outline-none"
                  >
                    <SelectValue placeholder="Primary build" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border border-border">
                    {buildOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="personBuildSecondary" className="block text-xs font-medium mb-1">
                  Secondary (optional)
                </Label>
                <Select
                  value={person.buildSecondary || ""}
                  onValueChange={(value) => {
                    const newValue = value === "placeholder" ? "" : value;
                    // Create a completely new object and update both fields at once
                    const newPerson = { ...person } as PersonInfo;
                    newPerson.buildSecondary = newValue;
                    
                    // Also update the legacy build field for backward compatibility
                    if (person.buildPrimary) {
                      const combined = `${person.buildPrimary}-${newValue}`;
                      newPerson.build = combined;
                    }
                    
                    // Send the entire updated object at once
                    onChange(newPerson);
                  }}
                >
                  <SelectTrigger
                    id="personBuildSecondary"
                    className="w-full rounded border-input bg-background text-foreground py-2 px-3 focus:ring-1 focus:ring-[#0F52BA] focus:outline-none"
                  >
                    <SelectValue placeholder="Secondary build" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border border-border">
                    {buildOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label htmlFor="hairColor" className="block text-xs font-medium mb-1">
                Hair Color
              </Label>
              <Select
                value={person.hairColor || ""}
                onValueChange={(value) => handleChange("hairColor", value)}
              >
                <SelectTrigger
                  id="hairColor"
                  className="w-full rounded border-input bg-background text-foreground py-2 px-3 focus:ring-1 focus:ring-[#0F52BA] focus:outline-none"
                >
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent className="bg-popover border border-border">
                  {hairColorOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="eyeColor" className="block text-xs font-medium mb-1">
                Eye Color
              </Label>
              <Select
                value={person.eyeColor || ""}
                onValueChange={(value) => handleChange("eyeColor", value)}
              >
                <SelectTrigger
                  id="eyeColor"
                  className="w-full rounded border-input bg-background text-foreground py-2 px-3 focus:ring-1 focus:ring-[#0F52BA] focus:outline-none"
                >
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent className="bg-popover border border-border">
                  {eyeColorOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="skinTone" className="block text-xs font-medium mb-1">
                Skin Tone
              </Label>
              <Select
                value={person.skinTone || ""}
                onValueChange={(value) => handleChange("skinTone", value)}
              >
                <SelectTrigger
                  id="skinTone"
                  className="w-full rounded border-input bg-background text-foreground py-2 px-3 focus:ring-1 focus:ring-[#0F52BA] focus:outline-none"
                >
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent className="bg-popover border border-border">
                  {skinToneOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tattoos */}
          <div>
            <Label htmlFor="tattoos" className="block text-xs font-medium mb-1">
              Tattoos
            </Label>
            <Textarea
              id="tattoos"
              placeholder="Describe any visible tattoos"
              value={person.tattoos || ""}
              onChange={(e) => handleChange("tattoos", e.target.value)}
              rows={2}
              className="w-full rounded border-input bg-background text-foreground py-2 px-3 focus:ring-1 focus:ring-[#0F52BA] focus:outline-none"
            />
          </div>

          {/* Contact Information */}
          <div>
            <Label htmlFor="address" className="block text-xs font-medium mb-1">
              Address
            </Label>
            <Input
              type="text"
              id="address"
              placeholder="Enter address"
              value={person.address || ""}
              onChange={(e) => handleChange("address", e.target.value)}
              className="w-full rounded border-input bg-background text-foreground py-2 px-3 focus:ring-1 focus:ring-[#0F52BA] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="phoneNumber" className="block text-xs font-medium mb-1">
                Phone Number
              </Label>
              <Input
                type="tel"
                id="phoneNumber"
                placeholder="Enter phone"
                value={person.phoneNumber || ""}
                onChange={(e) => handleChange("phoneNumber", e.target.value)}
                className="w-full rounded border-input bg-background text-foreground py-2 px-3 focus:ring-1 focus:ring-[#0F52BA] focus:outline-none"
              />
            </div>
            <div>
              <Label htmlFor="email" className="block text-xs font-medium mb-1">
                Email
              </Label>
              <Input
                type="email"
                id="email"
                placeholder="Enter email"
                value={person.email || ""}
                onChange={(e) => handleChange("email", e.target.value)}
                className="w-full rounded border-input bg-background text-foreground py-2 px-3 focus:ring-1 focus:ring-[#0F52BA] focus:outline-none"
              />
            </div>
          </div>

          {/* Work Information */}
          <div>
            <Label htmlFor="workAddress" className="block text-xs font-medium mb-1">
              Work Address
            </Label>
            <Input
              type="text"
              id="workAddress"
              placeholder="Enter work address"
              value={person.workAddress || ""}
              onChange={(e) => handleChange("workAddress", e.target.value)}
              className="w-full rounded border-input bg-background text-foreground py-2 px-3 focus:ring-1 focus:ring-[#0F52BA] focus:outline-none"
            />
          </div>

          <div>
            <Label htmlFor="workPhone" className="block text-xs font-medium mb-1">
              Work Phone
            </Label>
            <Input
              type="tel"
              id="workPhone"
              placeholder="Enter work phone"
              value={person.workPhone || ""}
              onChange={(e) => handleChange("workPhone", e.target.value)}
              className="w-full rounded border-input bg-background text-foreground py-2 px-3 focus:ring-1 focus:ring-[#0F52BA] focus:outline-none"
            />
          </div>
        </div>
      )}
    </div>
  );
}