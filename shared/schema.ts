import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Person information schema
export const personSchema = z.object({
  name: z.string().optional(),
  heightMin: z.string().optional(),
  heightMax: z.string().optional(),
  buildPrimary: z.string().optional(),
  buildSecondary: z.string().optional(),
  hairColor: z.string().optional(),
  eyeColor: z.string().optional(),
  skinTone: z.string().optional(),
  tattoos: z.string().optional(),
  address: z.string().optional(),
  phoneNumber: z.string().optional(),
  email: z.string().optional(),
  workAddress: z.string().optional(),
  workPhone: z.string().optional(),
  
  // Keep the original fields for backward compatibility
  height: z.string().optional(),
  build: z.string().optional(),
});

// Vehicle information schema
export const vehicleSchema = z.object({
  make: z.string().optional(),
  model: z.string().optional(), 
  yearMin: z.string().optional(),
  yearMax: z.string().optional(),
  color: z.string().optional(),
  licensePlate: z.array(z.string().optional()).length(7).optional(),
  
  // Keep the original field for backward compatibility
  year: z.string().optional(),
});

// Image metadata schema
export const imageMetadataSchema = z.object({
  dateTaken: z.string().optional(),
  gpsCoordinates: z.string().optional(),
  latitude: z.number().refine(val => !isNaN(val), { message: "Must be a valid number" }).optional(),
  longitude: z.number().refine(val => !isNaN(val), { message: "Must be a valid number" }).optional(),
  altitude: z.number().refine(val => !isNaN(val), { message: "Must be a valid number" }).optional(),
  direction: z.string().optional(),  // compass direction
  speed: z.string().optional(),
  editHistory: z.string().optional(), // any modification info
  deviceInfo: z.string().optional()
});

// Image attachment schema
export const imageSchema = z.object({
  url: z.string(), // URL or base64 data
  name: z.string().optional(),
  description: z.string().optional(),
  dateAdded: z.string().optional(),
  metadata: imageMetadataSchema.optional()
});

// Additional notes schema
export const additionalNoteSchema = z.object({
  date: z.string(),
  time: z.string().optional(),
  content: z.string(),
  createdAt: z.string().optional()
});

// Observation schema for database
export const observations = pgTable("observations", {
  id: serial("id").primaryKey(),
  date: text("date").notNull(),
  time: text("time").notNull(),
  person: json("person").$type<z.infer<typeof personSchema>>(),
  vehicle: json("vehicle").$type<z.infer<typeof vehicleSchema>>(),
  notes: text("notes"),
  additionalNotes: json("additional_notes").$type<z.infer<typeof additionalNoteSchema>[]>(),
  images: json("images").$type<z.infer<typeof imageSchema>[]>(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Schema for inserting a new observation
export const insertObservationSchema = createInsertSchema(observations).pick({
  date: true,
  time: true,
  person: true,
  vehicle: true,
  notes: true,
  additionalNotes: true,
  images: true,
});

// Zod validation schema for observation input
export const observationInputSchema = z.object({
  date: z.string(),
  time: z.string(),
  person: personSchema,
  vehicle: vehicleSchema,
  notes: z.string().optional(),
  additionalNotes: z.array(additionalNoteSchema).optional().default([]),
  images: z.array(imageSchema).optional().default([]),
});

export type InsertObservation = z.infer<typeof insertObservationSchema>;
export type Observation = typeof observations.$inferSelect;
export type PersonInfo = z.infer<typeof personSchema>;
export type VehicleInfo = z.infer<typeof vehicleSchema>;
export type ImageInfo = z.infer<typeof imageSchema>;
export type ImageMetadata = z.infer<typeof imageMetadataSchema>;
export type AdditionalNote = z.infer<typeof additionalNoteSchema>;
