import express, { type Express, type Request, type Response } from "express";
import { createServer, type Server } from "http";
import { storage as dataStorage } from "./storage";
import { z } from "zod";
import { observationInputSchema, imageSchema, ImageInfo, InsertObservation } from "@shared/schema";
import { ZodError } from "zod";
import { isAuthenticated } from "./auth";
import multer from "multer";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import { fileURLToPath } from "url";
import { extractBasicMetadata } from "./imageMetadata";

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

// Configure multer upload
const upload = multer({ 
  storage: multerStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
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

  // GET all observations
  app.get("/api/observations", isAuthenticated, async (req, res) => {
    try {
      const observations = await dataStorage.getAllObservations();
      res.json(observations);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch observations" });
    }
  });

  // GET a single observation by ID
  app.get("/api/observations/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const observation = await dataStorage.getObservation(id);
      
      if (!observation) {
        return res.status(404).json({ message: "Observation not found" });
      }
      
      res.json(observation);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch observation" });
    }
  });

  // Route to upload an image and attach it to an observation
  app.post("/api/observations/:id/images", isAuthenticated, (req, res) => {
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
        const metadata = await extractBasicMetadata(req.file.path);
        
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
        
        // Add the image to the observation
        const updates: Partial<InsertObservation> = {
          images: [...currentImages, validatedImage]
        };
        
        // Update the observation
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

  // CREATE a new observation
  app.post("/api/observations", isAuthenticated, async (req, res) => {
    try {
      console.log('Creating observation with data:', req.body);
      
      // Validate the input with zod
      const validatedData = observationInputSchema.parse(req.body);
      
      // Create the observation
      const newObservation = await dataStorage.createObservation(validatedData);
      
      res.status(201).json(newObservation);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: "Invalid observation data", 
          errors: error.errors 
        });
      }
      
      const errorMessage = error instanceof Error ? error.message : "Failed to create observation";
      res.status(500).json({ message: errorMessage });
    }
  });

  // UPDATE an observation by ID
  app.put("/api/observations/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Validate the input with zod
      const validatedData = observationInputSchema.parse(req.body);
      
      // Update the observation
      const updatedObservation = await dataStorage.updateObservation(id, validatedData);
      
      if (!updatedObservation) {
        return res.status(404).json({ message: "Observation not found" });
      }
      
      res.json(updatedObservation);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: "Invalid observation data", 
          errors: error.errors 
        });
      }
      
      const errorMessage = error instanceof Error ? error.message : "Failed to update observation";
      res.status(500).json({ message: errorMessage });
    }
  });

  // DELETE an observation by ID
  app.delete("/api/observations/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Get the observation to access its images
      const observation = await dataStorage.getObservation(id);
      
      if (!observation) {
        return res.status(404).json({ message: "Observation not found" });
      }
      
      // Delete the observation
      const deleted = await dataStorage.deleteObservation(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Observation not found" });
      }
      
      // Delete any image files associated with the observation
      if (observation.images && observation.images.length > 0) {
        const uploadsDir = path.join(__dirname, '../public');
        
        for (const image of observation.images) {
          try {
            const imagePath = path.join(uploadsDir, image.url);
            if (fs.existsSync(imagePath)) {
              fs.unlinkSync(imagePath);
            }
          } catch (err) {
            console.error(`Failed to delete image file: ${image.url}`, err);
          }
        }
      }
      
      res.json({ message: "Observation deleted successfully" });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to delete observation";
      res.status(500).json({ message: errorMessage });
    }
  });

  // SEARCH observations
  app.post("/api/observations/search", isAuthenticated, async (req, res) => {
    try {
      const results = await dataStorage.searchObservations(req.body);
      res.json(results);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Search failed";
      res.status(500).json({ message: errorMessage });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);

  return httpServer;
}