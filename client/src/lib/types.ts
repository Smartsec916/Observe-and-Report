import { z } from "zod";
import { 
  personSchema, 
  vehicleSchema, 
  imageSchema, 
  imageMetadataSchema, 
  additionalNoteSchema,
  incidentLocationSchema
} from "@shared/schema";

export type PersonInfo = z.infer<typeof personSchema>;
export type VehicleInfo = z.infer<typeof vehicleSchema>;
export type ImageMetadata = z.infer<typeof imageMetadataSchema>;
export type ImageInfo = z.infer<typeof imageSchema>;
export type AdditionalNote = z.infer<typeof additionalNoteSchema>;
export type IncidentLocation = z.infer<typeof incidentLocationSchema>;

export interface Observation {
  id: number;
  date: string;
  time: string;
  person: PersonInfo;
  vehicle: VehicleInfo;
  location?: IncidentLocation;
  notes?: string;
  additionalNotes?: AdditionalNote[];
  createdAt: Date;
  images?: ImageInfo[];
}

export interface SearchParams {
  query?: string;
  person?: Partial<PersonInfo>;
  vehicle?: Partial<VehicleInfo>;
  location?: Partial<IncidentLocation>;
  licensePlate?: (string | null)[];
  dateFrom?: string;
  dateTo?: string;
}

// Options for dropdowns
export const heightOptions = [
  { value: "placeholder", label: "Select height" },
  { value: "unknown", label: "Unknown" },
  { value: "under4ft10", label: "Under 4'10\"" },
  { value: "4ft10", label: "4'10\"" },
  { value: "4ft11", label: "4'11\"" },
  { value: "5ft0", label: "5'0\"" },
  { value: "5ft1", label: "5'1\"" },
  { value: "5ft2", label: "5'2\"" },
  { value: "5ft3", label: "5'3\"" },
  { value: "5ft4", label: "5'4\"" },
  { value: "5ft5", label: "5'5\"" },
  { value: "5ft6", label: "5'6\"" },
  { value: "5ft7", label: "5'7\"" },
  { value: "5ft8", label: "5'8\"" },
  { value: "5ft9", label: "5'9\"" },
  { value: "5ft10", label: "5'10\"" },
  { value: "5ft11", label: "5'11\"" },
  { value: "6ft0", label: "6'0\"" },
  { value: "6ft1", label: "6'1\"" },
  { value: "6ft2", label: "6'2\"" },
  { value: "6ft3", label: "6'3\"" },
  { value: "6ft4", label: "6'4\"" },
  { value: "6ft5", label: "6'5\"" },
  { value: "6ft6", label: "6'6\"" },
  { value: "6ft7", label: "6'7\"" },
  { value: "6ft8", label: "6'8\"" },
  { value: "over6ft8", label: "Over 6'8\"" },
  { value: "variable", label: "Variable Height" }
];

export const buildOptions = [
  { value: "placeholder", label: "Select build" },
  { value: "slim", label: "Slim" },
  { value: "athletic", label: "Athletic" },
  { value: "average", label: "Average" },
  { value: "heavyset", label: "Heavyset" },
  { value: "muscular", label: "Muscular" }
];

export const hairColorOptions = [
  { value: "placeholder", label: "Select" },
  { value: "black", label: "Black" },
  { value: "brown", label: "Brown" },
  { value: "blonde", label: "Blonde" },
  { value: "red", label: "Red" },
  { value: "gray", label: "Gray" },
  { value: "white", label: "White" },
  { value: "dyed", label: "Dyed" },
  { value: "bald", label: "Bald" }
];

export const eyeColorOptions = [
  { value: "placeholder", label: "Select" },
  { value: "brown", label: "Brown" },
  { value: "blue", label: "Blue" },
  { value: "green", label: "Green" },
  { value: "hazel", label: "Hazel" },
  { value: "gray", label: "Gray" },
  { value: "amber", label: "Amber" }
];

export const skinToneOptions = [
  { value: "placeholder", label: "Select" },
  { value: "veryFair", label: "Very Fair" },
  { value: "fair", label: "Fair" },
  { value: "medium", label: "Medium" },
  { value: "olive", label: "Olive" },
  { value: "tan", label: "Tan" },
  { value: "brown", label: "Brown" },
  { value: "darkBrown", label: "Dark Brown" }
];

// Generate individual years from 1950 to current year
const currentYear = new Date().getFullYear();
const years = [];
for (let year = 1950; year <= currentYear; year++) {
  years.push({ value: year.toString(), label: year.toString() });
}

export const vehicleYearOptions = [
  { value: "placeholder", label: "Select year" },
  { value: "unknown", label: "Unknown" },
  { value: "pre1950", label: "Pre 1950" },
  ...years,
  { value: "variable", label: "Variable (Multiple Years)" }
];

export const vehicleColorOptions = [
  { value: "placeholder", label: "Select color" },
  { value: "black", label: "Black" },
  { value: "white", label: "White" },
  { value: "silver", label: "Silver" },
  { value: "gray", label: "Gray" },
  { value: "red", label: "Red" },
  { value: "blue", label: "Blue" },
  { value: "darkBlue", label: "Dark Blue" },
  { value: "lightBlue", label: "Light Blue" },
  { value: "green", label: "Green" },
  { value: "darkGreen", label: "Dark Green" },
  { value: "yellow", label: "Yellow" },
  { value: "orange", label: "Orange" },
  { value: "purple", label: "Purple" },
  { value: "pink", label: "Pink" },
  { value: "brown", label: "Brown" },
  { value: "tan", label: "Tan" },
  { value: "beige", label: "Beige" },
  { value: "gold", label: "Gold" },
  { value: "bronze", label: "Bronze" },
  { value: "maroon", label: "Maroon" },
  { value: "teal", label: "Teal" },
  { value: "burgundy", label: "Burgundy" },
  { value: "other", label: "Other" }
];

export const licensePlateOptions = [
  { value: "placeholder", label: "?" },
  ...'0123456789'.split('').map(char => ({ value: char, label: char })),
  ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map(char => ({ value: char, label: char })),
  // Special characters commonly found on license plates
  { value: "-", label: "-" },
  { value: "•", label: "•" },
  { value: ".", label: "." },
  { value: ":", label: ":" },
  { value: "◊", label: "◊" },
  { value: "♦", label: "♦" },
  { value: "□", label: "□" },
  { value: "■", label: "■" },
  { value: "○", label: "○" },
  { value: "●", label: "●" },
  { value: "△", label: "△" },
  { value: "▲", label: "▲" },
  { value: "☆", label: "☆" },
  { value: "★", label: "★" },
  { value: "♥", label: "♥" },
  { value: "*", label: "*" },
  { value: "+", label: "+" },
  { value: "=", label: "=" },
  { value: "/", label: "/" },
  { value: "\\", label: "\\" },
  { value: "#", label: "#" },
  { value: "@", label: "@" },
  { value: "&", label: "&" },
  { value: "%", label: "%" },
  { value: "$", label: "$" },
  { value: "!", label: "!" },
  { value: "?", label: "?" },
  { value: "<", label: "<" },
  { value: ">", label: ">" },
  { value: "(", label: "(" },
  { value: ")", label: ")" },
  { value: "[", label: "[" },
  { value: "]", label: "]" },
  { value: "{", label: "{" },
  { value: "}", label: "}" },
  { value: "_", label: "_" },
  { value: "~", label: "~" },
  { value: "^", label: "^" },
  { value: "|", label: "|" },
  { value: "unknown", label: "Unknown" }
];

export const stateOptions = [
  { value: "placeholder", label: "Select State" },
  { value: "AL", label: "Alabama" },
  { value: "AK", label: "Alaska" },
  { value: "AZ", label: "Arizona" },
  { value: "AR", label: "Arkansas" },
  { value: "CA", label: "California" },
  { value: "CO", label: "Colorado" },
  { value: "CT", label: "Connecticut" },
  { value: "DE", label: "Delaware" },
  { value: "DC", label: "District Of Columbia" },
  { value: "FL", label: "Florida" },
  { value: "GA", label: "Georgia" },
  { value: "HI", label: "Hawaii" },
  { value: "ID", label: "Idaho" },
  { value: "IL", label: "Illinois" },
  { value: "IN", label: "Indiana" },
  { value: "IA", label: "Iowa" },
  { value: "KS", label: "Kansas" },
  { value: "KY", label: "Kentucky" },
  { value: "LA", label: "Louisiana" },
  { value: "ME", label: "Maine" },
  { value: "MD", label: "Maryland" },
  { value: "MA", label: "Massachusetts" },
  { value: "MI", label: "Michigan" },
  { value: "MN", label: "Minnesota" },
  { value: "MS", label: "Mississippi" },
  { value: "MO", label: "Missouri" },
  { value: "MT", label: "Montana" },
  { value: "NE", label: "Nebraska" },
  { value: "NV", label: "Nevada" },
  { value: "NH", label: "New Hampshire" },
  { value: "NJ", label: "New Jersey" },
  { value: "NM", label: "New Mexico" },
  { value: "NY", label: "New York" },
  { value: "NC", label: "North Carolina" },
  { value: "ND", label: "North Dakota" },
  { value: "OH", label: "Ohio" },
  { value: "OK", label: "Oklahoma" },
  { value: "OR", label: "Oregon" },
  { value: "PA", label: "Pennsylvania" },
  { value: "RI", label: "Rhode Island" },
  { value: "SC", label: "South Carolina" },
  { value: "SD", label: "South Dakota" },
  { value: "TN", label: "Tennessee" },
  { value: "TX", label: "Texas" },
  { value: "UT", label: "Utah" },
  { value: "VT", label: "Vermont" },
  { value: "VA", label: "Virginia" },
  { value: "WA", label: "Washington" },
  { value: "WV", label: "West Virginia" },
  { value: "WI", label: "Wisconsin" },
  { value: "WY", label: "Wyoming" }
];
