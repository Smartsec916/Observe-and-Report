import express, { type Express, type Request } from "express";
import { createServer, type Server } from "http";
import { storage as dataStorage } from "./storage";
import { z } from "zod";
import { observationInputSchema, imageSchema } from "@shared/schema";
import { ZodError } from "zod";
import { isAuthenticated } from "./auth";
import multer from "multer";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import { fileURLToPath } from "url";

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
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: function (req, file, cb) {
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

  // Route to upload an image and attach it to an observation
  app.post("/api/observations/:id/images", isAuthenticated, upload.single('image'), async (req, res) => {
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
      
      // Create image metadata
      const imageData = {
        url: `/uploads/${req.file.filename}`,
        name: req.file.originalname,
        description: req.body.description || '',
        dateAdded: new Date().toISOString().split('T')[0]
      };
      
      // Validate the image data
      const validatedImage = imageSchema.parse(imageData);
      console.log('Image data validated:', validatedImage.url);
      
      // Get current images or initialize an empty array
      const currentImages = observation.images || [];
      
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

  // Route to delete an image from an observation
  app.delete("/api/observations/:id/images/:imageUrl", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const imageUrl = decodeURIComponent(req.params.imageUrl);
      
      const observation = await dataStorage.getObservation(id);
      if (!observation) {
        return res.status(404).json({ message: "Observation not found" });
      }
      
      const currentImages = observation.images || [];
      const imageIndex = currentImages.findIndex((img: any) => img.url === imageUrl);
      
      if (imageIndex === -1) {
        return res.status(404).json({ message: "Image not found" });
      }
      
      // Remove the image from the array
      const updatedImages = [...currentImages];
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
      const observations = await storage.getAllObservations();
      res.json(observations);
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve observations" });
    }
  });

  // Get a single observation
  app.get("/api/observations/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const observation = await storage.getObservation(id);
      
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
      const newObservation = await storage.createObservation(validatedData);
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
      
      const updatedObservation = await storage.updateObservation(id, updates);
      
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
      const success = await storage.deleteObservation(id);
      
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
      
      const results = await storage.searchObservations(searchParams);
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
