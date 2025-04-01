import exif from "exif";
import type { ExifData } from "exif";
import fs from "fs";
import fetch from "node-fetch";

/**
 * Extract metadata from an image file, including GPS and location data
 * @param filePath Path to the image file
 * @returns Promise resolving to metadata object
 */
export const extractBasicMetadata = (filePath: string): Promise<Record<string, any>> => {
  return new Promise(async (resolve) => {
    try {
      new exif.ExifImage({ image: filePath }, async (error: Error | null, exifData: ExifData) => {
        if (error) {
          console.log('EXIF extraction error:', error.message);
          resolve({}); // Return empty object if EXIF data can't be read
          return;
        }
        
        // Extract relevant metadata
        const metadata: Record<string, any> = {};
        
        // Date and time
        if (exifData.exif?.DateTimeOriginal) {
          metadata.dateTaken = exifData.exif.DateTimeOriginal;
        }
        
        // Device info
        if (exifData.image) {
          const deviceInfo = [];
          if (exifData.image.Make) deviceInfo.push(exifData.image.Make);
          if (exifData.image.Model) deviceInfo.push(exifData.image.Model);
          if (deviceInfo.length > 0) {
            metadata.deviceInfo = deviceInfo.join(' ');
          }
        }
        
        // Software info (could indicate editing)
        if (exifData.image?.Software) {
          metadata.editHistory = `Processed with ${exifData.image.Software}`;
        }
        
        // Extract GPS data if available
        let validLatitude = false;
        let validLongitude = false;
        
        if (exifData.gps) {
          console.log('GPS data found in image');
          
          // Process latitude
          if (exifData.gps.GPSLatitude && exifData.gps.GPSLatitudeRef) {
            try {
              console.log('Found Latitude:', exifData.gps.GPSLatitude, exifData.gps.GPSLatitudeRef);
              const latDegrees = exifData.gps.GPSLatitude[0] + 
                exifData.gps.GPSLatitude[1]/60 + 
                exifData.gps.GPSLatitude[2]/3600;
                
              if (!isNaN(latDegrees)) {
                metadata.latitude = exifData.gps.GPSLatitudeRef === 'N' ? latDegrees : -latDegrees;
                validLatitude = true;
                console.log('Parsed latitude:', metadata.latitude);
              }
            } catch (e) {
              console.log('Error parsing latitude:', e);
            }
          } else {
            console.log('No latitude data found in EXIF');
          }
          
          // Process longitude
          if (exifData.gps.GPSLongitude && exifData.gps.GPSLongitudeRef) {
            try {
              console.log('Found Longitude:', exifData.gps.GPSLongitude, exifData.gps.GPSLongitudeRef);
              const longDegrees = exifData.gps.GPSLongitude[0] + 
                exifData.gps.GPSLongitude[1]/60 + 
                exifData.gps.GPSLongitude[2]/3600;
                
              if (!isNaN(longDegrees)) {
                metadata.longitude = exifData.gps.GPSLongitudeRef === 'E' ? longDegrees : -longDegrees;
                validLongitude = true;
                console.log('Parsed longitude:', metadata.longitude);
              }
            } catch (e) {
              console.log('Error parsing longitude:', e);
            }
          } else {
            console.log('No longitude data found in EXIF');
          }
          
          if (validLatitude && validLongitude && metadata.latitude && metadata.longitude) {
            metadata.gpsCoordinates = `${metadata.latitude.toFixed(6)}, ${metadata.longitude.toFixed(6)}`;
            
            // Create a location object with GPS coordinates for easier reference
            metadata.location = {
              latitude: metadata.latitude,
              longitude: metadata.longitude
            };
            
            // Try to get reverse geocoding using OpenStreetMap Nominatim API (no API key required)
            try {
              console.log(`Fetching address for coordinates: ${metadata.latitude}, ${metadata.longitude}`);
              
              // Use OpenStreetMap Nominatim API for reverse geocoding
              const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${metadata.latitude}&lon=${metadata.longitude}&zoom=18&addressdetails=1`,
                { 
                  headers: { 
                    'User-Agent': 'ObserveAndReport/1.0',
                    'Accept-Language': 'en-US,en'
                  }
                }
              );
              
              if (response.ok) {
                const addressData = await response.json() as any;
                console.log('Reverse geocode data received:', JSON.stringify(addressData, null, 2));
                
                if (addressData.address) {
                  // Extract address components
                  const address = addressData.address;
                  
                  // Create formatted address components based on available data
                  metadata.location.formattedAddress = addressData.display_name || '';
                  
                  // Street number and name
                  if (address.house_number) metadata.location.streetNumber = address.house_number;
                  if (address.road || address.street) metadata.location.streetName = address.road || address.street || address.pedestrian || '';
                  
                  // City (with fallbacks)
                  if (address.city) metadata.location.city = address.city;
                  else if (address.town) metadata.location.city = address.town;
                  else if (address.village) metadata.location.city = address.village;
                  else if (address.suburb) metadata.location.city = address.suburb;
                  else if (address.county) metadata.location.city = address.county;
                  
                  // State and zip
                  if (address.state) metadata.location.state = address.state;
                  else if (address.state_district) metadata.location.state = address.state_district;
                  
                  if (address.postcode) metadata.location.zipCode = address.postcode;
                  
                  console.log('Extracted address info:', JSON.stringify(metadata.location, null, 2));
                } else {
                  console.log('Address data not found in response');
                }
              } else {
                console.log(`Geocoding API error: ${response.status} ${response.statusText}`);
              }
            } catch (e) {
              console.log('Error getting address from coordinates:', e);
              // Geocoding failed, but we still have the GPS coordinates
            }
          }
          
          // Add additional GPS data if available
          if (exifData.gps.GPSAltitude) {
            try {
              const altitude = exifData.gps.GPSAltitude;
              if (!isNaN(altitude)) {
                metadata.altitude = altitude;
              }
            } catch (e) {
              console.log('Error parsing altitude:', e);
            }
          }
          
          // Direction/bearing
          if (exifData.gps.GPSImgDirection) {
            metadata.direction = `${exifData.gps.GPSImgDirection}° ${exifData.gps.GPSImgDirectionRef || ''}`;
          }
          
          // Speed
          if (exifData.gps.GPSSpeed) {
            metadata.speed = `${exifData.gps.GPSSpeed} ${exifData.gps.GPSSpeedRef || 'km/h'}`;
          }
        }
        
        console.log('Extracted metadata:', JSON.stringify(metadata, null, 2));
        resolve(metadata);
      });
    } catch (err) {
      console.error('Failed to extract EXIF data:', err);
      resolve({});
    }
  });
};