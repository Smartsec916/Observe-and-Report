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

  // Function to extract EXIF data from an image
  const extractImageMetadata = (filePath: string): Promise<Record<string, any>> => {
    return new Promise((resolve) => {
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
          if (exifData.gps) {
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
      
      const observation = await dataStorage.getObservation(id);
      if (!observation) {
        return res.status(404).json({ message: "Observation not found" });
      }
      
      const currentImages: ImageInfo[] = observation.images || [];
      const imageIndex = currentImages.findIndex((img) => img.url === imageUrl);
      
      if (imageIndex === -1) {
        return res.status(404).json({ message: "Image not found" });
      }
      
      // Remove the image from the array
      const updatedImages: ImageInfo[] = [...currentImages];
      updatedImages.splice(imageIndex, 1);
      
      // Update the observation
      const updates: Partial<InsertObservation> = {
        images: updatedImages
      };
      
      const updatedObservation = await dataStorage.updateObservation(id, updates);
      
      // Delete the file from the filesystem
      try {
        const filePath = path.join(__dirname, '..', 'public', imageUrl);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(`Deleted file: ${filePath}`);
        }
      } catch (e) {
        console.error('Failed to delete file:', e);
        // We still want to continue even if the file deletion fails
      }
      
      res.status(200).json({ 
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
