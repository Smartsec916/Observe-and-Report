import { z } from "zod";
import { personSchema, vehicleSchema, imageSchema } from "@shared/schema";

export type PersonInfo = z.infer<typeof personSchema>;
export type VehicleInfo = z.infer<typeof vehicleSchema>;
export type ImageInfo = z.infer<typeof imageSchema>;

export interface Observation {
  id: number;
  date: string;
  time: string;
  person: PersonInfo;
  vehicle: VehicleInfo;
  createdAt: Date;
  images?: ImageInfo[];
}

export interface SearchParams {
  query?: string;
  person?: Partial<PersonInfo>;
  vehicle?: Partial<VehicleInfo>;
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
  { value: "green", label: "Green" },
  { value: "yellow", label: "Yellow" },
  { value: "brown", label: "Brown" },
  { value: "gold", label: "Gold" },
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
