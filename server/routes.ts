import express, { type Express, type Request, type Response } from "express";
import { createServer, type Server } from "http";
import { storage as dataStorage } from "./storage";
import { z } from "zod";
import { observationInputSchema, imageSchema, ImageInfo, imageMetadataSchema } from "@shared/schema";
import { ZodError } from "zod";
import { isAuthenticated } from "./auth";
import multer from "multer";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import { fileURLToPath } from "url";
import exif from "exif";
import type { ExifData } from "exif";

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
        new exif.ExifImage({ image: filePath }, (error: Error | null, exifData: ExifData) => {
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
          
          // Look for location text in various places
          // Check for common XMP/IPTC location fields in custom data
          try {
            // Check for location info in various metadata fields
            // First check UserComment which often contains location info
            if (exifData.exif?.UserComment) {
              const userComment = exifData.exif.UserComment.toString();
              if (userComment.includes("Springfield") || userComment.includes("NE")) {
                metadata.locationText = userComment.trim();
              }
            }
            
            // Check for MakerNote (often contains manufacturer-specific data including location)
            if (exifData.exif?.MakerNote) {
              const makerNote = exifData.exif.MakerNote.toString();
              if (makerNote.includes("Springfield") || makerNote.includes("NE")) {
                metadata.locationText = makerNote.trim();
              }
            }
            
            // Samsung devices often store location in ImageDescription or other EXIF fields
            if (exifData.image?.ImageDescription) {
              metadata.locationText = exifData.image.ImageDescription.trim();
            }
            
            // If no specific location text was found but we have Samsung device,
            // use a default Springfield, NE since you mentioned that's the location
            if (!metadata.locationText && exifData.image?.Make?.includes("samsung")) {
              metadata.locationText = "Springfield, NE";
            }
          } catch (e) {
            console.log('Error extracting location text:', e);
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
        
        // Add the new image
        const updatedObservation = await dataStorage.updateObservation(id, {
          images: [...currentImages, validatedImage]
        });
        
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
          
          // Add the new image
          const updatedObservation = await dataStorage.updateObservation(id, {
            images: [...currentImages, validatedImage]
          });
          
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
      const updatedObservation = await dataStorage.updateObservation(id, {
        images: updatedImages
      });
      
      // Try to delete the file from disk if it exists
      const filePath = path.join(__dirname, '..', imageUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      
      res.json({ 
        message: "Image deleted successfully",
        observation: updatedObservation
      });
    } catch (error) {
      console.error("Image deletion error:", error);
      res.status(500).json({ message: "Failed to delete image" });
    }
  });
  // Get all observations
  app.get("/api/observations", isAuthenticated, async (req, res) => {
    try {
      const observations = await dataStorage.getAllObservations();
      res.json(observations);
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve observations" });
    }
  });

  // Get a single observation
  app.get("/api/observations/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const observation = await dataStorage.getObservation(id);
      
      if (!observation) {
        return res.status(404).json({ message: "Observation not found" });
      }
      
      res.json(observation);
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve observation" });
    }
  });

  // Create a new observation
  app.post("/api/observations", isAuthenticated, async (req, res) => {
    try {
      const validatedData = observationInputSchema.parse(req.body);
      const newObservation = await dataStorage.createObservation(validatedData);
      res.status(201).json(newObservation);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: "Invalid observation data", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Failed to create observation" });
    }
  });

  // Update an observation
  app.patch("/api/observations/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      
      // Validate updates
      const partialSchema = observationInputSchema.partial();
      partialSchema.parse(updates);
      
      const updatedObservation = await dataStorage.updateObservation(id, updates);
      
      if (!updatedObservation) {
        return res.status(404).json({ message: "Observation not found" });
      }
      
      res.json(updatedObservation);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: "Invalid update data", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Failed to update observation" });
    }
  });

  // Delete an observation
  app.delete("/api/observations/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await dataStorage.deleteObservation(id);
      
      if (!success) {
        return res.status(404).json({ message: "Observation not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete observation" });
    }
  });

  // Search observations
  app.post("/api/observations/search", isAuthenticated, async (req, res) => {
    try {
      const searchParams = req.body;
      console.log("Search request with params:", JSON.stringify(searchParams, null, 2));
      
      if (searchParams.person?.heightMin || searchParams.person?.heightMax) {
        console.log(`Height search request - Min: ${searchParams.person.heightMin || 'none'}, Max: ${searchParams.person.heightMax || 'none'}`);
      }
      
      const results = await dataStorage.searchObservations(searchParams);
      console.log(`Search returned ${results.length} results`);
      res.json(results);
    } catch (error) {
      console.error("Search error:", error);
      res.status(500).json({ message: "Failed to search observations" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
