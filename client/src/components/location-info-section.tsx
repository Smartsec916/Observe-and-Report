import { useState } from "react";
import { MapPin, Navigation } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { IncidentLocation } from "@/lib/types";
import { stateOptions } from "@/lib/types";
import { LocationMap } from "@/components/ui/map";
import { Button } from "@/components/ui/button";

interface LocationInfoSectionProps {
  location: IncidentLocation;
  onChange: (location: IncidentLocation) => void;
  title?: string;
}

export function LocationInfoSection({ 
  location, 
  onChange,
  title = "Incident Location"
}: LocationInfoSectionProps) {
  const [gpsCoordinatesManual, setGpsCoordinatesManual] = useState(false);
  
  // This function is used for any field updates that aren't address components
  const handleChange = (field: keyof IncidentLocation, value: string | number | null) => {
    console.log(`LocationInfoSection handleChange: field=${field}, value=${value}, type=${typeof value}`);
    
    // Handle string fields - never set null values for strings
    if (typeof value !== 'number' && 
        (field === 'streetNumber' || field === 'streetName' || field === 'city' || 
         field === 'state' || field === 'zipCode' || field === 'notes' || 
         field === 'formattedAddress')) {
      // Set to empty string if null/undefined
      const safeValue = (value === null || value === undefined) ? '' : String(value);
      console.log(`Converting to safe string value: ${safeValue}`);
      
      // Create a new object to avoid mutation issues
      const updatedLocation = {
        ...location,
        [field]: safeValue
      };
      onChange(updatedLocation);
      return;
    }
    
    // Handle number fields normally
    console.log(`Updating ${field} with value: ${value}`);
    const updatedLocation = {
      ...location,
      [field]: value
    };
    onChange(updatedLocation);
  };

  const openInGoogleMaps = () => {
    if (location.latitude && location.longitude) {
      const url = `https://www.google.com/maps/search/?api=1&query=${location.latitude},${location.longitude}`;
      window.open(url, '_blank');
    } else if (location.formattedAddress && location.formattedAddress.trim() !== '') {
      const encodedAddress = encodeURIComponent(location.formattedAddress);
      const url = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
      window.open(url, '_blank');
    }
  };

  // Build formatted address from components
  const updateFormattedAddress = () => {
    // Log what we're working with
    console.log("Current location data:", JSON.stringify(location));
    
    const streetNumber = location.streetNumber || '';
    const streetName = location.streetName || '';
    const city = location.city || '';
    const state = location.state || '';
    const zipCode = location.zipCode || '';
    
    let formattedAddress = '';
    
    if (streetNumber.trim() && streetName.trim()) {
      formattedAddress += `${streetNumber} ${streetName}`;
    }
    
    if (city.trim()) {
      if (formattedAddress) formattedAddress += ', ';
      formattedAddress += city;
    }
    
    if (state.trim()) {
      if (city.trim()) {
        formattedAddress += ', ';
      } else if (formattedAddress) {
        formattedAddress += ', ';
      }
      formattedAddress += state;
    }
    
    if (zipCode.trim()) {
      if (formattedAddress) formattedAddress += ' ';
      formattedAddress += zipCode;
    }
    
    console.log(`Generated formattedAddress: ${formattedAddress}`);
    
    // Only update if the formatted address has changed
    if (formattedAddress !== location.formattedAddress) {
      const updatedLocation = {
        ...location,
        formattedAddress: formattedAddress
      };
      onChange(updatedLocation);
    }
  };

  // Special handler for address fields to update the formatted address directly
  const handleAddressChange = (field: keyof IncidentLocation, value: string) => {
    console.log(`LocationInfoSection handleAddressChange: field=${field}, value="${value}", type=${typeof value}`);
    
    // Using a more direct approach to avoid complexity
    const safeValue = value === null ? '' : value;
    
    // Immediately create a new object with all updated values
    const streetNumber = field === 'streetNumber' ? safeValue : location.streetNumber || '';
    const streetName = field === 'streetName' ? safeValue : location.streetName || '';
    const city = field === 'city' ? safeValue : location.city || '';
    const state = field === 'state' ? safeValue : location.state || '';
    const zipCode = field === 'zipCode' ? safeValue : location.zipCode || '';
    
    // Generate the formatted address directly
    let formattedAddress = '';
    
    if (streetNumber.trim() && streetName.trim()) {
      formattedAddress += `${streetNumber} ${streetName}`;
    }
    
    if (city.trim()) {
      if (formattedAddress) formattedAddress += ', ';
      formattedAddress += city;
    }
    
    if (state.trim()) {
      if (city.trim()) {
        formattedAddress += ', ';
      } else if (formattedAddress) {
        formattedAddress += ', ';
      }
      formattedAddress += state;
    }
    
    if (zipCode.trim()) {
      if (formattedAddress) formattedAddress += ' ';
      formattedAddress += zipCode;
    }
    
    console.log(`Generated new formattedAddress: ${formattedAddress}`);
    
    // Create complete updated location with all fields including the new formatted address
    const updatedLocation = {
      ...location,
      streetNumber,
      streetName,
      city,
      state,
      zipCode,
      formattedAddress,
      [field]: safeValue  // Ensure the specific field is updated
    };
    
    // Apply the update with the complete object
    onChange(updatedLocation);
  };

  return (
    <div className="space-y-4 bg-card rounded-lg p-4">
      <div className="flex items-center gap-2 mb-2">
        <MapPin className="h-5 w-5" />
        <h3 className="text-lg font-semibold">{title}</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-4">
          {/* Street Address */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label htmlFor="streetNumber">Number</Label>
              <Input
                id="streetNumber"
                placeholder="123"
                value={location.streetNumber || ''}
                onChange={(e) => {
                  console.log(`Street number raw input: "${e.target.value}"`);
                  // Direct update without timeout
                  handleAddressChange('streetNumber', e.target.value);
                }}
                className="w-full"
              />
            </div>
            <div className="col-span-2">
              <Label htmlFor="streetName">Street</Label>
              <Input
                id="streetName"
                placeholder="Main St"
                value={location.streetName || ''}
                onChange={(e) => {
                  console.log(`Street name raw input: "${e.target.value}"`);
                  // Direct update without timeout
                  handleAddressChange('streetName', e.target.value);
                }}
                className="w-full"
              />
            </div>
          </div>

          {/* City, State, Zip */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                placeholder="City"
                value={location.city || ''}
                onChange={(e) => {
                  console.log(`City raw input: "${e.target.value}"`);
                  // Direct update without timeout
                  handleAddressChange('city', e.target.value);
                }}
                className="w-full"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="state">State</Label>
                <Select
                  value={location.state || ''}
                  onValueChange={(value) => {
                    const newValue = value === "placeholder" ? "" : value;
                    handleAddressChange('state', newValue);
                  }}
                >
                  <SelectTrigger id="state">
                    <SelectValue placeholder="State" />
                  </SelectTrigger>
                  <SelectContent>
                    {stateOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="zipCode">Zip</Label>
                <Input
                  id="zipCode"
                  placeholder="12345"
                  value={location.zipCode || ''}
                  onChange={(e) => {
                    console.log(`Zip code raw input: "${e.target.value}"`);
                    // Direct update without timeout
                    handleAddressChange('zipCode', e.target.value);
                  }}
                />
              </div>
            </div>
          </div>

          {/* GPS Coordinates Toggle */}
          <div className="flex items-center space-x-2 mt-4">
            <Label htmlFor="gpsToggle" className="cursor-pointer">
              <input
                id="gpsToggle"
                type="checkbox"
                className="sr-only"
                checked={gpsCoordinatesManual}
                onChange={() => setGpsCoordinatesManual(!gpsCoordinatesManual)}
              />
              <div className={`flex items-center ${gpsCoordinatesManual ? 'text-primary' : 'text-muted-foreground'}`}>
                <Navigation className="mr-1 h-4 w-4" />
                <span>Add GPS coordinates manually</span>
              </div>
            </Label>
          </div>

          {/* GPS Coordinates (conditionally displayed) */}
          {gpsCoordinatesManual && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="latitude">Latitude</Label>
                <Input
                  id="latitude"
                  type="number"
                  step="0.0000001"
                  placeholder="37.7749"
                  value={location.latitude || ''}
                  onChange={(e) => {
                    const inputValue = e.target.value;
                    console.log(`Latitude input changed to: "${inputValue}"`);
                    
                    // Only convert to number if there's actually a value
                    if (inputValue && inputValue.trim() !== '') {
                      const numValue = parseFloat(inputValue);
                      if (!isNaN(numValue)) {
                        handleChange('latitude', numValue);
                      }
                    } else {
                      // Set to null/undefined if empty
                      handleChange('latitude', null);
                    }
                  }}
                />
              </div>
              <div>
                <Label htmlFor="longitude">Longitude</Label>
                <Input
                  id="longitude"
                  type="number"
                  step="0.0000001"
                  placeholder="-122.4194"
                  value={location.longitude || ''}
                  onChange={(e) => {
                    const inputValue = e.target.value;
                    console.log(`Longitude input changed to: "${inputValue}"`);
                    
                    // Only convert to number if there's actually a value
                    if (inputValue && inputValue.trim() !== '') {
                      const numValue = parseFloat(inputValue);
                      if (!isNaN(numValue)) {
                        handleChange('longitude', numValue);
                      }
                    } else {
                      // Set to null/undefined if empty
                      handleChange('longitude', null);
                    }
                  }}
                />
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <Label htmlFor="locationNotes">Notes</Label>
            <Input
              id="locationNotes"
              placeholder="Additional location details"
              value={location.notes || ''}
              onChange={(e) => {
                console.log(`Notes raw input: "${e.target.value}"`);
                // Direct update without timeout
                handleChange('notes', e.target.value);
              }}
            />
          </div>
        </div>

        {/* Map Section */}
        <div className="space-y-2">
          <div className="rounded-md overflow-hidden border border-border h-[200px]">
            <LocationMap
              latitude={location.latitude || undefined}
              longitude={location.longitude || undefined}
              address={(location.formattedAddress && location.formattedAddress.trim() !== '') ? location.formattedAddress : undefined}
              height="200px"
            />
          </div>
          
          {((location.latitude && location.longitude) || 
             (location.formattedAddress && location.formattedAddress.trim() !== '')) ? (
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full"
              onClick={openInGoogleMaps}
            >
              <MapPin className="mr-2 h-4 w-4" />
              Open in Google Maps
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}