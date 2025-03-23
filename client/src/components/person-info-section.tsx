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

  const handleChange = (field: keyof PersonInfo, value: string) => {
    // Don't save placeholder values to the actual data
    const newValue = value === "placeholder" ? "" : value;
    onChange({ ...person, [field]: newValue });
  };

  return (
    <div className="bg-[#1E1E1E] rounded-lg p-4 shadow-md border border-[#3A3A3A]">
      <button
        type="button"
        className="w-full flex justify-between items-center mb-2"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h2 className="text-md font-medium">Person Information</h2>
        {isExpanded ? (
          <ChevronUp className="h-5 w-5 text-[#0F52BA]" />
        ) : (
          <ChevronDown className="h-5 w-5 text-[#0F52BA]" />
        )}
      </button>

      {isExpanded && (
        <div className="space-y-4">
          {/* Name */}
          <div>
            <Label htmlFor="personName" className="block text-xs font-medium text-[#8A8A8A] mb-1">
              Name
            </Label>
            <Input
              type="text"
              id="personName"
              placeholder="Enter name"
              value={person.name || ""}
              onChange={(e) => handleChange("name", e.target.value)}
              className="w-full rounded bg-[#3A3A3A] border-0 py-2 px-3 text-white focus:ring-1 focus:ring-[#0F52BA] focus:outline-none"
            />
          </div>

          {/* Physical attributes */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="personHeight" className="block text-xs font-medium text-[#8A8A8A] mb-1">
                Height
              </Label>
              <Select
                value={person.height || ""}
                onValueChange={(value) => handleChange("height", value)}
              >
                <SelectTrigger
                  id="personHeight"
                  className="w-full rounded bg-[#3A3A3A] border-0 py-2 px-3 text-white focus:ring-1 focus:ring-[#0F52BA] focus:outline-none"
                >
                  <SelectValue placeholder="Select height" />
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
              <Label htmlFor="personBuild" className="block text-xs font-medium text-[#8A8A8A] mb-1">
                Build
              </Label>
              <Select
                value={person.build || ""}
                onValueChange={(value) => handleChange("build", value)}
              >
                <SelectTrigger
                  id="personBuild"
                  className="w-full rounded bg-[#3A3A3A] border-0 py-2 px-3 text-white focus:ring-1 focus:ring-[#0F52BA] focus:outline-none"
                >
                  <SelectValue placeholder="Select build" />
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

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label htmlFor="hairColor" className="block text-xs font-medium text-[#8A8A8A] mb-1">
                Hair Color
              </Label>
              <Select
                value={person.hairColor || ""}
                onValueChange={(value) => handleChange("hairColor", value)}
              >
                <SelectTrigger
                  id="hairColor"
                  className="w-full rounded bg-[#3A3A3A] border-0 py-2 px-3 text-white focus:ring-1 focus:ring-[#0F52BA] focus:outline-none"
                >
                  <SelectValue placeholder="Select" />
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
              <Label htmlFor="eyeColor" className="block text-xs font-medium text-[#8A8A8A] mb-1">
                Eye Color
              </Label>
              <Select
                value={person.eyeColor || ""}
                onValueChange={(value) => handleChange("eyeColor", value)}
              >
                <SelectTrigger
                  id="eyeColor"
                  className="w-full rounded bg-[#3A3A3A] border-0 py-2 px-3 text-white focus:ring-1 focus:ring-[#0F52BA] focus:outline-none"
                >
                  <SelectValue placeholder="Select" />
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
              <Label htmlFor="skinTone" className="block text-xs font-medium text-[#8A8A8A] mb-1">
                Skin Tone
              </Label>
              <Select
                value={person.skinTone || ""}
                onValueChange={(value) => handleChange("skinTone", value)}
              >
                <SelectTrigger
                  id="skinTone"
                  className="w-full rounded bg-[#3A3A3A] border-0 py-2 px-3 text-white focus:ring-1 focus:ring-[#0F52BA] focus:outline-none"
                >
                  <SelectValue placeholder="Select" />
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

          {/* Tattoos */}
          <div>
            <Label htmlFor="tattoos" className="block text-xs font-medium text-[#8A8A8A] mb-1">
              Tattoos
            </Label>
            <Textarea
              id="tattoos"
              placeholder="Describe any visible tattoos"
              value={person.tattoos || ""}
              onChange={(e) => handleChange("tattoos", e.target.value)}
              rows={2}
              className="w-full rounded bg-[#3A3A3A] border-0 py-2 px-3 text-white focus:ring-1 focus:ring-[#0F52BA] focus:outline-none"
            />
          </div>

          {/* Contact Information */}
          <div>
            <Label htmlFor="address" className="block text-xs font-medium text-[#8A8A8A] mb-1">
              Address
            </Label>
            <Input
              type="text"
              id="address"
              placeholder="Enter address"
              value={person.address || ""}
              onChange={(e) => handleChange("address", e.target.value)}
              className="w-full rounded bg-[#3A3A3A] border-0 py-2 px-3 text-white focus:ring-1 focus:ring-[#0F52BA] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="phoneNumber" className="block text-xs font-medium text-[#8A8A8A] mb-1">
                Phone Number
              </Label>
              <Input
                type="tel"
                id="phoneNumber"
                placeholder="Enter phone"
                value={person.phoneNumber || ""}
                onChange={(e) => handleChange("phoneNumber", e.target.value)}
                className="w-full rounded bg-[#3A3A3A] border-0 py-2 px-3 text-white focus:ring-1 focus:ring-[#0F52BA] focus:outline-none"
              />
            </div>
            <div>
              <Label htmlFor="email" className="block text-xs font-medium text-[#8A8A8A] mb-1">
                Email
              </Label>
              <Input
                type="email"
                id="email"
                placeholder="Enter email"
                value={person.email || ""}
                onChange={(e) => handleChange("email", e.target.value)}
                className="w-full rounded bg-[#3A3A3A] border-0 py-2 px-3 text-white focus:ring-1 focus:ring-[#0F52BA] focus:outline-none"
              />
            </div>
          </div>

          {/* Work Information */}
          <div>
            <Label htmlFor="workAddress" className="block text-xs font-medium text-[#8A8A8A] mb-1">
              Work Address
            </Label>
            <Input
              type="text"
              id="workAddress"
              placeholder="Enter work address"
              value={person.workAddress || ""}
              onChange={(e) => handleChange("workAddress", e.target.value)}
              className="w-full rounded bg-[#3A3A3A] border-0 py-2 px-3 text-white focus:ring-1 focus:ring-[#0F52BA] focus:outline-none"
            />
          </div>

          <div>
            <Label htmlFor="workPhone" className="block text-xs font-medium text-[#8A8A8A] mb-1">
              Work Phone
            </Label>
            <Input
              type="tel"
              id="workPhone"
              placeholder="Enter work phone"
              value={person.workPhone || ""}
              onChange={(e) => handleChange("workPhone", e.target.value)}
              className="w-full rounded bg-[#3A3A3A] border-0 py-2 px-3 text-white focus:ring-1 focus:ring-[#0F52BA] focus:outline-none"
            />
          </div>
        </div>
      )}
    </div>
  );
}
