import { useEffect, useRef } from "react";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { ExternalLink, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Fix for default marker icons in React Leaflet
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

// Initialize default icon once
const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface MapProps {
  latitude?: number;
  longitude?: number;
  address?: string;
  className?: string;
  height?: string;
}

export function LocationMap({ 
  latitude, 
  longitude, 
  address,
  className,
  height = "250px" 
}: MapProps) {
  const mapRef = useRef<L.Map>(null);

  // If GPS coordinates are not provided but address is, we could add geocoding here
  // For now, we'll just show a default location if coordinates are missing
  const hasCoordinates = latitude !== undefined && longitude !== undefined;
  const position: [number, number] = hasCoordinates 
    ? [latitude!, longitude!] 
    : [40.7128, -74.0060]; // Default to NYC

  // Open in Google Maps (or other map apps)
  const handleOpenInMaps = () => {
    if (hasCoordinates) {
      // Create a Google Maps URL that works on both desktop and mobile
      const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
      window.open(googleMapsUrl, "_blank");
    } else if (address) {
      // If only address is available, use that
      const encodedAddress = encodeURIComponent(address);
      const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
      window.open(googleMapsUrl, "_blank");
    }
  };

  // Center map on coordinates when they change
  useEffect(() => {
    if (hasCoordinates && mapRef.current) {
      mapRef.current.setView([latitude!, longitude!], 13);
    }
  }, [latitude, longitude, hasCoordinates]);

  return (
    <div className="space-y-2">
      <MapContainer
        center={position}
        zoom={13}
        scrollWheelZoom={false}
        style={{ height, width: "100%" }}
        className={cn("rounded-md z-0", className)}
        ref={mapRef as any}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {hasCoordinates && (
          <Marker position={position}>
            <Popup>
              {address || `Location: ${latitude}, ${longitude}`}
            </Popup>
          </Marker>
        )}
      </MapContainer>
      
      <div className="flex gap-2">
        <Button 
          onClick={handleOpenInMaps} 
          variant="outline" 
          size="sm"
          className="flex-1"
          disabled={!hasCoordinates && !address}
        >
          <Navigation className="mr-2 h-4 w-4" />
          Open in Google Maps
        </Button>
        
        {hasCoordinates && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: "Shared Location",
                  text: address || `Location at ${latitude}, ${longitude}`,
                  url: `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`
                });
              }
            }}
            className="flex-1"
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            Share Location
          </Button>
        )}
      </div>
      
      {!hasCoordinates && !address && (
        <div className="text-center text-sm text-muted-foreground py-2">
          No location information available
        </div>
      )}
    </div>
  );
}