import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { observationInputSchema, imageSchema } from "@shared/schema";
import { ZodError } from "zod";
import { isAuthenticated } from "./auth";
import fileUpload from "express-fileupload";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import { fileURLToPath } from "url";

// Get the directory name equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper function to handle image upload
const handleImageUpload = (req: any) => {
  if (!req.files || Object.keys(req.files).length === 0) {
    return null;
  }

  const uploadedFile = req.files.image;
  const fileExt = path.extname(uploadedFile.name);
  const fileName = `${uuidv4()}${fileExt}`;
  const uploadPath = path.join(__dirname, '../public/uploads', fileName);

  // Move the file to the upload directory
  uploadedFile.mv(uploadPath);

  // Return image metadata
  return {
    url: `/uploads/${fileName}`,
    name: uploadedFile.name,
    description: req.body.description || '',
    dateAdded: new Date().toISOString().split('T')[0]
  };
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Configure file upload middleware
  app.use(fileUpload({
    createParentPath: true,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  }));

  // Route to upload an image and attach it to an observation
  app.post("/api/observations/:id/images", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const observation = await storage.getObservation(id);
      
      if (!observation) {
        return res.status(404).json({ message: "Observation not found" });
      }
      
      const imageData = handleImageUpload(req);
      if (!imageData) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      // Validate the image data
      const validatedImage = imageSchema.parse(imageData);
      
      // Get current images or initialize an empty array
      const currentImages = observation.images || [];
      
      // Add the new image
      const updatedObservation = await storage.updateObservation(id, {
        images: [...currentImages, validatedImage]
      });
      
      res.status(201).json({ 
        message: "Image uploaded successfully", 
        image: validatedImage,
        observation: updatedObservation
      });
    } catch (error) {
      console.error("Image upload error:", error);
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: "Invalid image data", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Failed to upload image" });
    }
  });

  // Route to delete an image from an observation
  app.delete("/api/observations/:id/images/:imageUrl", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const imageUrl = decodeURIComponent(req.params.imageUrl);
      
      const observation = await storage.getObservation(id);
      if (!observation) {
        return res.status(404).json({ message: "Observation not found" });
      }
      
      const currentImages = observation.images || [];
      const imageIndex = currentImages.findIndex(img => img.url === imageUrl);
      
      if (imageIndex === -1) {
        return res.status(404).json({ message: "Image not found" });
      }
      
      // Remove the image from the array
      const updatedImages = [...currentImages];
      updatedImages.splice(imageIndex, 1);
      
      // Update the observation
      const updatedObservation = await storage.updateObservation(id, {
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
