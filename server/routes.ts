import express, { type Express, type Request, type Response, type NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage as dataStorage } from "./storage";
import { z } from "zod";
import { observationInputSchema, imageSchema, ImageInfo, imageMetadataSchema, InsertObservation } from "@shared/schema";
import { ZodError } from "zod";
import { isAuthenticated } from "./auth";
import multer from "multer";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import { fileURLToPath } from "url";
import exif from "exif";
import type { ExifData } from "exif";
import fetch from "node-fetch";

// Get the directory name equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer storage
const multerStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadsDir = path.join(__dirname, '../public/uploads');
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const fileExt = path.extname(file.originalname);
    const fileName = `${uuidv4()}${fileExt}`;
    cb(null, fileName);
  }
});

// Configure multer upload with improved error handling
const upload = multer({
  storage: multerStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    fieldSize: 10 * 1024 * 1024, // 10MB field size limit
    fields: 10,
    files: 1,
    parts: 20
  },
  fileFilter: function (req, file, cb) {
    console.log('Received file in multer:', file.originalname, file.mimetype);
    
    // Accept only images
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up static serving for uploads folder
  app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

  // Helper function to process GPS data from EXIF
  const processGpsData = (exifData: ExifData, metadata: Record<string, any>) => {
    if (!exifData.gps) return;
    
    let validLatitude = false;
    let validLongitude = false;
    
    if (exifData.gps.GPSLatitude && exifData.gps.GPSLatitudeRef) {
      try {
        const latDegrees = exifData.gps.GPSLatitude[0] + 
          exifData.gps.GPSLatitude[1]/60 + 
          exifData.gps.GPSLatitude[2]/3600;
          
        if (!isNaN(latDegrees)) {
          metadata.latitude = exifData.gps.GPSLatitudeRef === 'N' ? latDegrees : -latDegrees;
          validLatitude = true;
        }
      } catch (e) {
        console.log('Error parsing latitude:', e);
      }
    }
    
    if (exifData.gps.GPSLongitude && exifData.gps.GPSLongitudeRef) {
      try {
        const longDegrees = exifData.gps.GPSLongitude[0] + 
          exifData.gps.GPSLongitude[1]/60 + 
          exifData.gps.GPSLongitude[2]/3600;
          
        if (!isNaN(longDegrees)) {
          metadata.longitude = exifData.gps.GPSLongitudeRef === 'E' ? longDegrees : -longDegrees;
          validLongitude = true;
        }
      } catch (e) {
        console.log('Error parsing longitude:', e);
      }
    }
    
    if (validLatitude && validLongitude) {
      metadata.gpsCoordinates = `${metadata.latitude.toFixed(6)}, ${metadata.longitude.toFixed(6)}`;
      
      // Add coordinates to location if available
      if (metadata.location) {
        metadata.location.latitude = metadata.latitude;
        metadata.location.longitude = metadata.longitude;
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
  };

  // Function to extract EXIF data from an image
  const extractImageMetadata = (filePath: string): Promise<Record<string, any>> => {
    return new Promise((resolve) => {
      try {
        // Check for Samsung-specific location data in the binary data
        try {
          // Read file as binary to extract any embedded data
          const buffer = fs.readFileSync(filePath);
          const fileContent = buffer.toString('utf8', 0, Math.min(buffer.length, 50000)); // Check first 50k bytes
          
          // Look for Samsung location address format in file content
          const locationRegex = /(\d+\s+[A-Za-z]+\s+[A-Za-z]+,\s+[A-Za-z]+,\s+[A-Z]{2}\s+\d+,\s+USA)/;
          const locationMatch = fileContent.match(locationRegex);
          
          if (locationMatch && locationMatch[1]) {
            const addressStr = locationMatch[1];
            console.log('Found Samsung location data in image:', addressStr);
            
            // Initialize location object
            const metadata: Record<string, any> = {
              location: {
                formattedAddress: addressStr
              }
            };
            
            // Try to extract address components
            const streetMatch = addressStr.match(/^(\d+)\s+([^,]+)/);
            if (streetMatch) {
              metadata.location.streetNumber = streetMatch[1];
              metadata.location.streetName = streetMatch[2];
            }
            
            // Try to extract city, state, zip
            const cityStateMatch = addressStr.match(/,\s+([^,]+),\s+([A-Z]{2})\s+(\d+)/);
            if (cityStateMatch) {
              metadata.location.city = cityStateMatch[1];
              metadata.location.state = cityStateMatch[2];
              metadata.location.zipCode = cityStateMatch[3];
            }
            
            // Continue with standard EXIF extraction but with the location data already populated
            new exif.ExifImage({ image: filePath }, async (error: Error | null, exifData: ExifData) => {
              if (error) {
                console.log('EXIF extraction error:', error.message);
                resolve(metadata); // Return location data even if EXIF data can't be read
                return;
              }
              
              // Add date and time
              if (exifData.exif?.DateTimeOriginal) {
                metadata.dateTaken = exifData.exif.DateTimeOriginal;
              }
              
              // Device info
              if (exifData.image?.Make && exifData.image?.Model) {
                metadata.deviceInfo = `${exifData.image.Make} ${exifData.image.Model}`;
              }
              
              // Add GPS coordinates if available (to work with the Map feature)
              processGpsData(exifData, metadata);
              
              console.log('Combined Samsung location + EXIF metadata:', JSON.stringify(metadata, null, 2));
              resolve(metadata);
            });
            
            return; // Skip the standard flow since we're handling it in the nested callback
          }
        } catch (e) {
          console.log('Error extracting Samsung location data:', e);
          // Continue with standard EXIF extraction
        }
        
        // Standard EXIF extraction (if no Samsung location data was found)
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
          if (exifData.image?.Make && exifData.image?.Model) {
            metadata.deviceInfo = `${exifData.image.Make} ${exifData.image.Model}`;
          }
          
          // Extract maker note if available (contains technical camera data)
          try {
            // Check for MakerNote (contains manufacturer-specific technical data)
            if (exifData.exif?.MakerNote) {
              const makerNote = exifData.exif.MakerNote.toString();
              metadata.makerNote = makerNote.trim();
            }
          } catch (e) {
            console.log('Error extracting exif data:', e);
          }
          
          // GPS data
          console.log('Checking GPS data in EXIF:', exifData.gps ? 'GPS data present' : 'No GPS data found');
          if (exifData.gps) {
            // Log the GPS data to see what's available
            console.log('GPS data available:', JSON.stringify(exifData.gps, null, 2));
            
            let validLatitude = false;
            let validLongitude = false;
            
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
                    
                    // Initialize location if not already present
                    if (!metadata.location) {
                      metadata.location = {
                        latitude: metadata.latitude,
                        longitude: metadata.longitude
                      };
                    }
                    
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
            
            // Altitude
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
          
          // Device info
          if (exifData.image) {
            const deviceInfo = [];
            if (exifData.image.Make) deviceInfo.push(exifData.image.Make);
            if (exifData.image.Model) deviceInfo.push(exifData.image.Model);
            if (deviceInfo.length > 0) {
              metadata.deviceInfo = deviceInfo.join(' ');
            }
          }
          
          // Modification/Software info (could indicate editing)
          if (exifData.image?.Software) {
            metadata.editHistory = `Processed with ${exifData.image.Software}`;
          }
          
          console.log('Extracted metadata:', metadata);
          resolve(metadata);
        });
      } catch (err) {
        console.error('Failed to extract EXIF data:', err);
        resolve({});
      }
    });
  };

  // Route to upload an image and attach it to an observation
  app.post("/api/observations/:id/images", isAuthenticated, (req, res) => {
    console.log('Image upload request received - headers:', JSON.stringify(req.headers, null, 2));
    
    // Use single upload with error handling
    upload.single('image')(req, res, async (err) => {
      // Handle multer errors
      if (err) {
        console.error('Multer error:', err.message);
        return res.status(400).json({ message: `Upload error: ${err.message}` });
      }
      
      try {
        console.log('Processing image upload request for observation');
        
        if (!req.file) {
          return res.status(400).json({ message: "No image file uploaded" });
        }
        
        console.log('Received file:', req.file.originalname, 'Size:', req.file.size);
        
        const id = parseInt(req.params.id);
        console.log('Looking for observation with ID:', id);
        
        const observation = await dataStorage.getObservation(id);
        if (!observation) {
          // Remove uploaded file if observation not found
          fs.unlinkSync(req.file.path);
          return res.status(404).json({ message: "Observation not found" });
        }
        
        // Extract metadata from the image
        const metadata = await extractImageMetadata(req.file.path);
        
        // Create image data with metadata
        const imageData = {
          url: `/uploads/${req.file.filename}`,
          name: req.file.originalname,
          description: req.body.description || '',
          dateAdded: new Date().toISOString().split('T')[0],
          metadata: metadata
        };
        
        // Validate the image data
        const validatedImage = imageSchema.parse(imageData);
        console.log('Image data validated:', validatedImage.url);
        
        // Get current images or initialize an empty array
        const currentImages: ImageInfo[] = observation.images || [];
        
        // Simply add the image to the observation
        const updates: Partial<InsertObservation> = {
          images: [...currentImages, validatedImage]
        };
        
        // Add the new image to the observation
        const updatedObservation = await dataStorage.updateObservation(id, updates);
        
        console.log('Image added to observation successfully');
        
        res.status(201).json({ 
          message: "Image uploaded successfully", 
          image: validatedImage,
          observation: updatedObservation
        });
      } catch (error) {
        console.error("Image upload error:", error);
        
        // Remove uploaded file in case of error
        if (req.file) {
          try {
            fs.unlinkSync(req.file.path);
          } catch (e) {
            console.error('Failed to delete uploaded file:', e);
          }
        }
        
        if (error instanceof ZodError) {
          return res.status(400).json({ 
            message: "Invalid image data", 
            errors: error.errors 
          });
        }
        
        const errorMessage = error instanceof Error ? error.message : "Unexpected error";
        res.status(500).json({ message: `Failed to upload image: ${errorMessage}` });
      }
    });
  });
  
  // Mobile-friendly image upload endpoint (alternative)
  app.post("/api/observations/:id/mobile-upload", isAuthenticated, async (req, res) => {
    try {
      console.log('Mobile upload request received');
      
      // Handle the request without multer to see if that resolves the issue
      const id = parseInt(req.params.id);
      const observation = await dataStorage.getObservation(id);
      
      if (!observation) {
        return res.status(404).json({ message: "Observation not found" });
      }
      
      if (!req.headers['content-type']?.includes('multipart/form-data')) {
        return res.status(400).json({ 
          message: "Invalid content type. Must use multipart/form-data",
          receivedType: req.headers['content-type'] 
        });
      }
      
      // Create a temporary file path
      const fileName = `${uuidv4()}.jpg`;
      const uploadsDir = path.join(__dirname, '../public/uploads');
      
      // Create directory if it doesn't exist
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      
      const filePath = path.join(uploadsDir, fileName);
      
      // Manual handling of the request to save the file
      let fileData = Buffer.alloc(0);
      let isProcessingFile = false;
      
      req.on('data', (chunk) => {
        console.log(`Received chunk of size: ${chunk.length}`);
        if (!isProcessingFile) {
          const str = chunk.toString();
          if (str.includes('Content-Type: image/')) {
            isProcessingFile = true;
            
            // Extract the portion of the chunk that contains file data
            const contentTypeIndex = str.indexOf('Content-Type: image/');
            if (contentTypeIndex !== -1) {
              const lineBreakAfterContentType = str.indexOf('\r\n\r\n', contentTypeIndex);
              if (lineBreakAfterContentType !== -1) {
                const fileDataStart = lineBreakAfterContentType + 4;
                const fileDataPart = chunk.slice(fileDataStart);
                fileData = Buffer.concat([fileData, fileDataPart]);
              }
            }
          }
        } else {
          fileData = Buffer.concat([fileData, chunk]);
        }
      });
      
      req.on('end', async () => {
        if (fileData.length === 0) {
          return res.status(400).json({ message: "No file data received" });
        }
        
        try {
          // Find the boundary of the multipart data
          const boundaryStr = '--' + req.headers['content-type']?.split('boundary=')[1];
          const boundaryBuf = Buffer.from(`\r\n${boundaryStr}--\r\n`);
          const boundaryIndex = fileData.indexOf(boundaryBuf);
          
          if (boundaryIndex !== -1) {
            // Trim the data to exclude the final boundary
            fileData = fileData.slice(0, boundaryIndex);
          }
          
          // Write the file to disk
          fs.writeFileSync(filePath, fileData);
          console.log('Successfully wrote file to:', filePath);
          
          // Extract metadata from the image
          const metadata = await extractImageMetadata(filePath);
          
          // Create image data with metadata
          const imageData = {
            url: `/uploads/${fileName}`,
            name: 'Mobile Upload',
            description: '',
            dateAdded: new Date().toISOString().split('T')[0],
            metadata: metadata
          };
          
          // Validate the image data
          const validatedImage = imageSchema.parse(imageData);
          
          // Get current images or initialize an empty array
          const currentImages: ImageInfo[] = observation.images || [];
          
          // Simply add the image to the observation
          const updates: Partial<InsertObservation> = {
            images: [...currentImages, validatedImage]
          };
          
          // Add the new image to the observation
          const updatedObservation = await dataStorage.updateObservation(id, updates);
          
          res.status(201).json({ 
            message: "Mobile image uploaded successfully", 
            image: validatedImage,
            observation: updatedObservation
          });
        } catch (error) {
          console.error("Error processing mobile upload:", error);
          
          // Clean up file if it was created
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
          
          return res.status(500).json({ 
            message: "Failed to process uploaded image",
            error: error instanceof Error ? error.message : "Unknown error"
          });
        }
      });
      
      req.on('error', (error) => {
        console.error("Error in mobile upload request:", error);
        
        // Clean up file if it was created
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
        
        res.status(500).json({ 
          message: "Upload request failed",
          error: error.message
        });
      });
      
    } catch (error) {
      console.error("Mobile upload error:", error);
      res.status(500).json({ 
        message: "Failed to upload image", 
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Route to delete an image from an observation
  app.delete("/api/observations/:id/images/:imageUrl", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const imageUrl = decodeURIComponent(req.params.imageUrl);
      
      console.log(`Starting image deletion for observation ${id}, image ${imageUrl}`);
      
      const observation = await dataStorage.getObservation(id);
      if (!observation) {
        console.log(`Observation ${id} not found`);
        return res.status(404).json({ message: "Observation not found" });
      }
      
      // Check if the observation has any images
      const currentImages: ImageInfo[] = observation.images || [];
      console.log(`Current observation images count: ${currentImages.length}`);
      
      // Find the index of the image to delete
      const imageIndex = currentImages.findIndex((img) => img.url === imageUrl);
      
      if (imageIndex === -1) {
        console.log(`Image not found in observation's images array`);
        return res.status(404).json({ message: "Image not found" });
      }
      
      console.log(`Image found at index ${imageIndex}`);
      
      // Create a new array without the image to delete
      const updatedImages = currentImages.filter((_, index) => index !== imageIndex);
      console.log(`Updated images array length: ${updatedImages.length}`);
      
      // Using a separate "images" update to ensure it's applied correctly
      const updatedObservation = await dataStorage.updateObservation(id, {
        images: updatedImages
      });
      
      if (!updatedObservation) {
        console.log(`Failed to update observation ${id}`);
        return res.status(500).json({ message: "Failed to update observation" });
      }
      
      console.log(`After update, observation has ${updatedObservation.images?.length || 0} images`);
      
      // Try to delete the physical file from the filesystem
      try {
        const filePath = path.join(__dirname, '..', 'public', imageUrl);
        console.log(`Attempting to delete file at: ${filePath}`);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(`Successfully deleted file: ${filePath}`);
        } else {
          console.log(`File does not exist at path: ${filePath}`);
        }
      } catch (fileError) {
        console.error('Failed to delete file:', fileError);
        // Continue even if file deletion fails - the image reference is gone from the database
      }
      
      // Return the updated observation so the client can update its state
      res.status(200).json({ 
        success: true,
        message: "Image deleted successfully", 
        observation: updatedObservation
      });
    } catch (error) {
      console.error("Image deletion error:", error);
      const errorMessage = error instanceof Error ? error.message : "Unexpected error";
      res.status(500).json({ message: `Failed to delete image: ${errorMessage}` });
    }
  });

  // Observation CRUD routes
  app.get("/api/observations", isAuthenticated, async (req, res) => {
    try {
      const observations = await dataStorage.getAllObservations();
      res.json(observations);
    } catch (error) {
      console.error("Failed to get observations:", error);
      res.status(500).json({ message: "Failed to retrieve observations" });
    }
  });
  
  app.get("/api/observations/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const observation = await dataStorage.getObservation(id);
      
      if (!observation) {
        return res.status(404).json({ message: "Observation not found" });
      }
      
      res.json(observation);
    } catch (error) {
      console.error("Failed to get observation:", error);
      res.status(500).json({ message: "Failed to retrieve observation" });
    }
  });
  
  app.post("/api/observations", isAuthenticated, async (req, res) => {
    try {
      console.log('Creating observation with data:', JSON.stringify(req.body, null, 2));
      const validatedData = observationInputSchema.parse(req.body);
      const observation = await dataStorage.createObservation(validatedData);
      res.status(201).json(observation);
    } catch (error) {
      console.error("Failed to create observation:", error);
      
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: "Invalid observation data", 
          errors: error.errors 
        });
      }
      
      res.status(500).json({ message: "Failed to create observation" });
    }
  });
  
  app.put("/api/observations/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      const observation = await dataStorage.getObservation(id);
      if (!observation) {
        return res.status(404).json({ message: "Observation not found" });
      }
      
      // Validate the input data
      const validatedData = observationInputSchema.parse(req.body);
      
      // Update the observation
      const updatedObservation = await dataStorage.updateObservation(id, validatedData);
      
      if (!updatedObservation) {
        return res.status(404).json({ message: "Failed to update observation" });
      }
      
      res.json(updatedObservation);
    } catch (error) {
      console.error("Failed to update observation:", error);
      
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: "Invalid observation data", 
          errors: error.errors 
        });
      }
      
      res.status(500).json({ message: "Failed to update observation" });
    }
  });
  
  app.delete("/api/observations/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      const observation = await dataStorage.getObservation(id);
      if (!observation) {
        return res.status(404).json({ message: "Observation not found" });
      }
      
      // Delete any attached images
      if (observation.images && observation.images.length > 0) {
        for (const image of observation.images) {
          try {
            const filePath = path.join(__dirname, '..', 'public', image.url);
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
              console.log(`Deleted file: ${filePath}`);
            }
          } catch (e) {
            console.error('Failed to delete file:', e);
            // Continue even if some files can't be deleted
          }
        }
      }
      
      const success = await dataStorage.deleteObservation(id);
      if (!success) {
        return res.status(500).json({ message: "Failed to delete observation" });
      }
      
      res.json({ message: "Observation deleted successfully" });
    } catch (error) {
      console.error("Failed to delete observation:", error);
      res.status(500).json({ message: "Failed to delete observation" });
    }
  });
  
  // Search endpoint
  app.post("/api/observations/search", isAuthenticated, async (req, res) => {
    try {
      console.log('Search request:', JSON.stringify(req.body, null, 2));
      const searchParams = req.body;
      const results = await dataStorage.searchObservations(searchParams);
      res.json(results);
    } catch (error) {
      console.error("Search error:", error);
      res.status(500).json({ message: "Failed to search observations" });
    }
  });
  
  // Import/Export endpoints
  app.get("/api/observations/export", isAuthenticated, async (req, res) => {
    try {
      // Allow optional filtering by IDs
      const ids = req.query.ids ? (req.query.ids as string).split(',').map(id => parseInt(id)) : undefined;
      
      const exportData = await dataStorage.exportObservations(ids);
      
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename=observations-export.json');
      res.send(exportData);
    } catch (error) {
      console.error("Export error:", error);
      res.status(500).json({ message: "Failed to export observations" });
    }
  });
  
  app.post("/api/observations/import", isAuthenticated, async (req, res) => {
    try {
      let importData = '';
      
      if (typeof req.body === 'string') {
        importData = req.body;
      } else if (req.body.data && typeof req.body.data === 'string') {
        importData = req.body.data;
      } else {
        importData = JSON.stringify(req.body);
      }
      
      const result = await dataStorage.importObservations(importData);
      res.json(result);
    } catch (error) {
      console.error("Import error:", error);
      res.status(500).json({ 
        message: "Failed to import observations",
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  // Create an HTTP server from the Express app
  const httpServer = createServer(app);
  
  // Return the server
  return httpServer;
}
