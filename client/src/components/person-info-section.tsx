import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronDown, ChevronUp } from "lucide-react";
import { 
  PersonInfo, 
  heightOptions, 
  buildOptions, 
  hairColorOptions, 
  eyeColorOptions, 
  skinToneOptions,
  stateOptions 
} from "@/lib/types";

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
  
  // Function to update the legacy address field from structured components
  const updateFormattedAddress = (newPerson: PersonInfo) => {
    const { streetNumber, streetName, city, state, zipCode } = newPerson;
    let formattedAddress = '';
    
    if (streetNumber && streetName) {
      formattedAddress += `${streetNumber} ${streetName}`;
    }
    
    if (city) {
      if (formattedAddress) formattedAddress += ', ';
      formattedAddress += city;
    }
    
    if (state) {
      if (city) {
        formattedAddress += ', ';
      } else if (formattedAddress) {
        formattedAddress += ', ';
      }
      formattedAddress += state;
    }
    
    if (zipCode) {
      if (formattedAddress) formattedAddress += ' ';
      formattedAddress += zipCode;
    }
    
    // Update the legacy address field for backward compatibility
    if (formattedAddress) {
      newPerson.address = formattedAddress;
    }
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
          {/* Name Fields */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label htmlFor="personFirstName" className="block text-xs font-medium mb-1">
                First Name
              </Label>
              <Input
                type="text"
                id="personFirstName"
                placeholder="First name"
                value={person.firstName || ""}
                onChange={(e) => {
                  const newPerson = { ...person } as PersonInfo;
                  newPerson.firstName = e.target.value;
                  
                  // Update legacy name field for backward compatibility
                  const lastName = person.lastName || "";
                  const middleName = person.middleName ? ` ${person.middleName} ` : " ";
                  newPerson.name = e.target.value + (e.target.value && lastName ? middleName : "") + lastName;
                  
                  onChange(newPerson);
                }}
                className="w-full rounded border-input bg-background text-foreground py-2 px-3 focus:ring-1 focus:ring-primary focus:outline-none"
              />
            </div>
            <div>
              <Label htmlFor="personMiddleName" className="block text-xs font-medium mb-1">
                Middle Name
              </Label>
              <Input
                type="text"
                id="personMiddleName"
                placeholder="Middle name"
                value={person.middleName || ""}
                onChange={(e) => {
                  const newPerson = { ...person } as PersonInfo;
                  newPerson.middleName = e.target.value;
                  
                  // Update legacy name field for backward compatibility
                  const firstName = person.firstName || "";
                  const lastName = person.lastName || "";
                  if (firstName || lastName) {
                    newPerson.name = firstName + (e.target.value ? ` ${e.target.value} ` : " ") + lastName;
                  }
                  
                  onChange(newPerson);
                }}
                className="w-full rounded border-input bg-background text-foreground py-2 px-3 focus:ring-1 focus:ring-primary focus:outline-none"
              />
            </div>
            <div>
              <Label htmlFor="personLastName" className="block text-xs font-medium mb-1">
                Last Name
              </Label>
              <Input
                type="text"
                id="personLastName"
                placeholder="Last name"
                value={person.lastName || ""}
                onChange={(e) => {
                  const newPerson = { ...person } as PersonInfo;
                  newPerson.lastName = e.target.value;
                  
                  // Update legacy name field for backward compatibility
                  const firstName = person.firstName || "";
                  const middleName = person.middleName ? ` ${person.middleName} ` : " ";
                  newPerson.name = firstName + (firstName && e.target.value ? middleName : "") + e.target.value;
                  
                  onChange(newPerson);
                }}
                className="w-full rounded border-input bg-background text-foreground py-2 px-3 focus:ring-1 focus:ring-primary focus:outline-none"
              />
            </div>
          </div>
          
          {/* Age Range and Date of Birth */}
          <div className="space-y-3">
            <div>
              <Label className="block text-xs font-medium mb-1">
                Age Range
              </Label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="ageRangeMin" className="block text-xs font-medium mb-1">
                    Minimum Age
                  </Label>
                  <Input
                    type="number"
                    id="ageRangeMin"
                    placeholder="Min age"
                    min={0}
                    max={120}
                    value={person.ageRangeMin === undefined ? "" : person.ageRangeMin}
                    onChange={(e) => {
                      const value = e.target.value ? parseInt(e.target.value) : undefined;
                      handleChange("ageRangeMin", value);
                    }}
                    className="w-full rounded border-input bg-background text-foreground py-2 px-3 focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                </div>
                <div>
                  <Label htmlFor="ageRangeMax" className="block text-xs font-medium mb-1">
                    Maximum Age
                  </Label>
                  <Input
                    type="number"
                    id="ageRangeMax"
                    placeholder="Max age"
                    min={0}
                    max={120}
                    value={person.ageRangeMax === undefined ? "" : person.ageRangeMax}
                    onChange={(e) => {
                      const value = e.target.value ? parseInt(e.target.value) : undefined;
                      handleChange("ageRangeMax", value);
                    }}
                    className="w-full rounded border-input bg-background text-foreground py-2 px-3 focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                </div>
              </div>
            </div>
            
            <div>
              <Label className="block text-xs font-medium mb-1">
                Date of Birth (if known)
              </Label>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label htmlFor="dobMonth" className="block text-xs font-medium mb-1">
                    Month
                  </Label>
                  <Input
                    type="number"
                    id="dobMonth"
                    placeholder="MM"
                    min={1}
                    max={12}
                    value={person.dobMonth === undefined ? "" : person.dobMonth}
                    onChange={(e) => {
                      const value = e.target.value ? parseInt(e.target.value) : undefined;
                      handleChange("dobMonth", value);
                    }}
                    className="w-full rounded border-input bg-background text-foreground py-2 px-3 focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                </div>
                <div>
                  <Label htmlFor="dobDay" className="block text-xs font-medium mb-1">
                    Day
                  </Label>
                  <Input
                    type="number"
                    id="dobDay"
                    placeholder="DD"
                    min={1}
                    max={31}
                    value={person.dobDay === undefined ? "" : person.dobDay}
                    onChange={(e) => {
                      const value = e.target.value ? parseInt(e.target.value) : undefined;
                      handleChange("dobDay", value);
                    }}
                    className="w-full rounded border-input bg-background text-foreground py-2 px-3 focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                </div>
                <div>
                  <Label htmlFor="dobYear" className="block text-xs font-medium mb-1">
                    Year
                  </Label>
                  <Input
                    type="number"
                    id="dobYear"
                    placeholder="YYYY"
                    min={1900}
                    max={new Date().getFullYear()}
                    value={person.dobYear === undefined ? "" : person.dobYear}
                    onChange={(e) => {
                      const value = e.target.value ? parseInt(e.target.value) : undefined;
                      handleChange("dobYear", value);
                    }}
                    className="w-full rounded border-input bg-background text-foreground py-2 px-3 focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                </div>
              </div>
            </div>
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
                    className="w-full rounded border-input bg-background text-foreground py-2 px-3 focus:ring-1 focus:ring-primary focus:outline-none"
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
                    className="w-full rounded border-input bg-background text-foreground py-2 px-3 focus:ring-1 focus:ring-primary focus:outline-none"
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
                    className="w-full rounded border-input bg-background text-foreground py-2 px-3 focus:ring-1 focus:ring-primary focus:outline-none"
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
                  className="w-full rounded border-input bg-background text-foreground py-2 px-3 focus:ring-1 focus:ring-primary focus:outline-none"
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
                  className="w-full rounded border-input bg-background text-foreground py-2 px-3 focus:ring-1 focus:ring-primary focus:outline-none"
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
                  className="w-full rounded border-input bg-background text-foreground py-2 px-3 focus:ring-1 focus:ring-primary focus:outline-none"
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
              className="w-full rounded border-input bg-background text-foreground py-2 px-3 focus:ring-1 focus:ring-primary focus:outline-none"
            />
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <div>
              <Label className="block text-xs font-medium mb-1">Address (Legacy Format)</Label>
              <div className="flex gap-2">
                <Input
                  type="text"
                  id="address"
                  placeholder="Enter address"
                  value={person.address || ""}
                  onChange={(e) => handleChange("address", e.target.value)}
                  className="w-full rounded border-input bg-background text-foreground py-2 px-3 focus:ring-1 focus:ring-primary focus:outline-none"
                />
                
                {person.address && (
                  <button
                    type="button"
                    className="px-3 py-1 text-xs bg-primary text-primary-foreground rounded-md hover:bg-primary/90 font-medium flex items-center"
                    onClick={(e) => {
                      // Show loading state
                      const button = e.currentTarget;
                      const originalContent = button.innerHTML;
                      button.innerHTML = `<svg class="animate-spin h-3 w-3 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg> Opening...`;
                      
                      // Open Google Maps with the address
                      if (person.address) {
                        const encodedAddress = encodeURIComponent(person.address);
                        const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
                        window.open(googleMapsUrl, "_blank");
                        
                        // Restore original content after a short delay
                        setTimeout(() => {
                          button.innerHTML = originalContent;
                        }, 1000);
                      }
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                      <polygon points="3 11 22 2 13 21 11 13 3 11"></polygon>
                    </svg>
                    Map
                  </button>
                )}
              </div>
            </div>
            
            {/* Structured Address */}
            <div>
              <Label className="block text-xs font-medium mb-3">Structured Address</Label>
              
              {/* Street Number and Name */}
              <div className="grid grid-cols-3 gap-2 mb-2">
                <div>
                  <Label htmlFor="streetNumber" className="block text-xs font-medium mb-1">
                    Number
                  </Label>
                  <Input
                    type="text"
                    id="streetNumber"
                    placeholder="123"
                    value={person.streetNumber || ""}
                    onChange={(e) => {
                      const newPerson = { ...person } as PersonInfo;
                      newPerson.streetNumber = e.target.value;
                      
                      // Also update the legacy address for compatibility
                      updateFormattedAddress(newPerson);
                      
                      onChange(newPerson);
                    }}
                    className="w-full rounded border-input bg-background text-foreground py-2 px-3 focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="streetName" className="block text-xs font-medium mb-1">
                    Street
                  </Label>
                  <Input
                    type="text"
                    id="streetName"
                    placeholder="Main St"
                    value={person.streetName || ""}
                    onChange={(e) => {
                      const newPerson = { ...person } as PersonInfo;
                      newPerson.streetName = e.target.value;
                      
                      // Also update the legacy address for compatibility
                      updateFormattedAddress(newPerson);
                      
                      onChange(newPerson);
                    }}
                    className="w-full rounded border-input bg-background text-foreground py-2 px-3 focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                </div>
              </div>
              
              {/* City, State, Zip */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="city" className="block text-xs font-medium mb-1">
                    City
                  </Label>
                  <Input
                    type="text"
                    id="city"
                    placeholder="City"
                    value={person.city || ""}
                    onChange={(e) => {
                      const newPerson = { ...person } as PersonInfo;
                      newPerson.city = e.target.value;
                      
                      // Also update the legacy address for compatibility
                      updateFormattedAddress(newPerson);
                      
                      onChange(newPerson);
                    }}
                    className="w-full rounded border-input bg-background text-foreground py-2 px-3 focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="state" className="block text-xs font-medium mb-1">
                      State
                    </Label>
                    <Select
                      value={person.state || ""}
                      onValueChange={(value) => {
                        const newPerson = { ...person } as PersonInfo;
                        newPerson.state = value;
                        
                        // Also update the legacy address for compatibility
                        updateFormattedAddress(newPerson);
                        
                        onChange(newPerson);
                      }}
                    >
                      <SelectTrigger
                        id="state"
                        className="w-full rounded border-input bg-background text-foreground py-2 px-3 focus:ring-1 focus:ring-primary focus:outline-none"
                      >
                        <SelectValue placeholder="State" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border border-border">
                        {stateOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="zipCode" className="block text-xs font-medium mb-1">
                      Zip
                    </Label>
                    <Input
                      type="text"
                      id="zipCode"
                      placeholder="12345"
                      value={person.zipCode || ""}
                      onChange={(e) => {
                        const newPerson = { ...person } as PersonInfo;
                        newPerson.zipCode = e.target.value;
                        
                        // Also update the legacy address for compatibility
                        updateFormattedAddress(newPerson);
                        
                        onChange(newPerson);
                      }}
                      className="w-full rounded border-input bg-background text-foreground py-2 px-3 focus:ring-1 focus:ring-primary focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
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
                className="w-full rounded border-input bg-background text-foreground py-2 px-3 focus:ring-1 focus:ring-primary focus:outline-none"
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
                className="w-full rounded border-input bg-background text-foreground py-2 px-3 focus:ring-1 focus:ring-primary focus:outline-none"
              />
            </div>
          </div>

          {/* Work Information */}
          <div className="space-y-4">
            {/* Occupation */}
            <div>
              <Label htmlFor="occupation" className="block text-xs font-medium mb-1">
                Occupation
              </Label>
              <Input
                type="text"
                id="occupation"
                placeholder="Enter occupation"
                value={person.occupation || ""}
                onChange={(e) => handleChange("occupation", e.target.value)}
                className="w-full rounded border-input bg-background text-foreground py-2 px-3 focus:ring-1 focus:ring-primary focus:outline-none"
              />
            </div>
            
            {/* Work Address */}
            <div>
              <Label htmlFor="workAddress" className="block text-xs font-medium mb-1">
                Work Address
              </Label>
              <div className="flex gap-2">
                <Input
                  type="text"
                  id="workAddress"
                  placeholder="Enter work address"
                  value={person.workAddress || ""}
                  onChange={(e) => handleChange("workAddress", e.target.value)}
                  className="w-full rounded border-input bg-background text-foreground py-2 px-3 focus:ring-1 focus:ring-primary focus:outline-none"
                />
                
                {person.workAddress && (
                  <button
                    type="button"
                    className="px-3 py-1 text-xs bg-primary text-primary-foreground rounded-md hover:bg-primary/90 font-medium flex items-center"
                    onClick={(e) => {
                      // Show loading state
                      const button = e.currentTarget;
                      const originalContent = button.innerHTML;
                      button.innerHTML = `<svg class="animate-spin h-3 w-3 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg> Opening...`;
                      
                      // Open Google Maps with the work address
                      if (person.workAddress) {
                        const encodedAddress = encodeURIComponent(person.workAddress);
                        const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
                        window.open(googleMapsUrl, "_blank");
                        
                        // Restore original content after a short delay
                        setTimeout(() => {
                          button.innerHTML = originalContent;
                        }, 1000);
                      }
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                      <polygon points="3 11 22 2 13 21 11 13 3 11"></polygon>
                    </svg>
                    Map
                  </button>
                )}
              </div>
            </div>
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
              className="w-full rounded border-input bg-background text-foreground py-2 px-3 focus:ring-1 focus:ring-primary focus:outline-none"
            />
          </div>
        </div>
      )}
    </div>
  );
}