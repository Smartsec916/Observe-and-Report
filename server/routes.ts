import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { observationInputSchema } from "@shared/schema";
import { ZodError } from "zod";
import { isAuthenticated } from "./auth";

export async function registerRoutes(app: Express): Promise<Server> {
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
  app.post("/api/observations/search", async (req, res) => {
    try {
      const searchParams = req.body;
      const results = await storage.searchObservations(searchParams);
      res.json(results);
    } catch (error) {
      res.status(500).json({ message: "Failed to search observations" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
