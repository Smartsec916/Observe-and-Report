import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Person information schema
export const personSchema = z.object({
  // Name fields
  firstName: z.string().optional().default(''),
  middleName: z.string().optional().default(''),
  lastName: z.string().optional().default(''),
  
  // Age and DOB
  ageRangeMin: z.number().min(0).max(120).optional(),
  ageRangeMax: z.number().min(0).max(120).optional(),
  dobMonth: z.number().min(1).max(12).optional(),
  dobDay: z.number().min(1).max(31).optional(),
  dobYear: z.number().min(1900).max(new Date().getFullYear()).optional(),
  
  // Physical characteristics
  heightMin: z.string().optional().default(''),
  heightMax: z.string().optional().default(''),
  buildPrimary: z.string().optional().default(''),
  buildSecondary: z.string().optional().default(''),
  hairColor: z.string().optional().default(''),
  eyeColor: z.string().optional().default(''),
  skinTone: z.string().optional().default(''),
  tattoos: z.string().optional().default(''),
  
  // Contact information
  phoneNumber: z.string().optional().default(''),
  email: z.string().optional().default(''),
  occupation: z.string().optional().default(''),
  workPhone: z.string().optional().default(''),
  
  // Legacy address field (for backward compatibility)
  address: z.string().optional().default(''),
  workAddress: z.string().optional().default(''),
  
  // Structured address fields
  streetNumber: z.string().optional().default(''),
  streetName: z.string().optional().default(''), // Updated from 'street' to 'streetName' for consistency
  city: z.string().optional().default(''),
  state: z.string().optional().default(''),
  zipCode: z.string().optional().default(''),
  
  // Keep the original fields for backward compatibility
  name: z.string().optional().default(''),
  height: z.string().optional().default(''),
  build: z.string().optional().default(''),
});

// Vehicle information schema
export const vehicleSchema = z.object({
  make: z.string().optional().default(''),
  model: z.string().optional().default(''), 
  yearMin: z.string().optional().default(''),
  yearMax: z.string().optional().default(''),
  color: z.string().optional().default(''),
  licensePlate: z.array(z.string().optional()).length(7).optional(),
  
  // Keep the original field for backward compatibility
  year: z.string().optional().default(''),
});

// Location information schema (for image metadata)
export const locationSchema = z.object({
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  formattedAddress: z.string().optional().default(''),
  streetNumber: z.string().optional().default(''),
  streetName: z.string().optional().default(''),
  city: z.string().optional().default(''),
  state: z.string().optional().default(''),
  zipCode: z.string().optional().default('')
}).optional();

// Image metadata schema
export const imageMetadataSchema = z.object({
  dateTaken: z.string().optional().default(''),
  gpsCoordinates: z.string().optional().default(''),
  latitude: z.number().refine(val => !isNaN(val), { message: "Must be a valid number" }).optional(),
  longitude: z.number().refine(val => !isNaN(val), { message: "Must be a valid number" }).optional(),
  altitude: z.number().refine(val => !isNaN(val), { message: "Must be a valid number" }).optional(),
  direction: z.string().optional().default(''),  // compass direction
  speed: z.string().optional().default(''),
  editHistory: z.string().optional().default(''), // any modification info
  deviceInfo: z.string().optional().default(''),
  // Location information extracted from GPS coordinates
  location: locationSchema
});

// Incident location schema
export const incidentLocationSchema = z.object({
  streetNumber: z.string().optional().default(''),
  streetName: z.string().optional().default(''), // Updated from 'street' to 'streetName' for clarity
  city: z.string().optional().default(''),
  state: z.string().optional().default(''),
  zipCode: z.string().optional().default(''),
  // GPS coordinates - these remain optional without defaults as they are numbers
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  // Additional info
  notes: z.string().optional().default(''),
  // Generated/combined fields
  formattedAddress: z.string().optional().default(''), // Updated from 'fullAddress' to 'formattedAddress'
});

// Image attachment schema
export const imageSchema = z.object({
  url: z.string(), // URL or base64 data
  name: z.string().optional().default(''),
  description: z.string().optional().default(''),
  dateAdded: z.string().optional().default(''),
  metadata: imageMetadataSchema.optional()
});

// Additional notes schema
export const additionalNoteSchema = z.object({
  date: z.string(),
  time: z.string().optional().default(''),
  content: z.string(),
  createdAt: z.string().optional().default('')
});

// Observation schema for database
export const observations = pgTable("observations", {
  id: serial("id").primaryKey(),
  date: text("date").notNull(),
  time: text("time").notNull(),
  person: json("person").$type<z.infer<typeof personSchema>>(),
  vehicle: json("vehicle").$type<z.infer<typeof vehicleSchema>>(),
  location: json("location").$type<z.infer<typeof incidentLocationSchema>>(),
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
  location: true,
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
  location: incidentLocationSchema.optional().default({}),
  notes: z.string().optional().default(''),
  additionalNotes: z.array(additionalNoteSchema).optional().default([]),
  images: z.array(imageSchema).optional().default([]),
});

export type InsertObservation = z.infer<typeof insertObservationSchema>;
export type Observation = typeof observations.$inferSelect;
export type PersonInfo = z.infer<typeof personSchema>;
export type VehicleInfo = z.infer<typeof vehicleSchema>;
export type IncidentLocation = z.infer<typeof incidentLocationSchema>;
export type ImageInfo = z.infer<typeof imageSchema>;
export type ImageMetadata = z.infer<typeof imageMetadataSchema>;
export type AdditionalNote = z.infer<typeof additionalNoteSchema>;
