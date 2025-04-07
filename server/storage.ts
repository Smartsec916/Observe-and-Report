import { observations, type Observation, type InsertObservation, PersonInfo, VehicleInfo } from "@shared/schema";
import { encryptSensitiveFields, decryptSensitiveFields } from "./encryption";

// Define the sensitive fields that should be encrypted
const SENSITIVE_FIELDS = [
  'person.name', 
  'person.description',
  'notes',
  'additionalNotes'
];

// Helper functions moved outside for reuse
function getHeightInInches(heightStr: string): number {
  if (!heightStr || heightStr === 'placeholder' || heightStr === 'unknown') return -1;
  
  if (heightStr === 'under4ft10') return 58; // 4'10" minus a little (4'8" + 10")
  if (heightStr === 'over6ft8') return 80; // 6'8" = 80"
  if (heightStr === 'variable') return -1; // Cannot be compared
  
  // Check for a range format first - "4ft10-5ft2"
  const rangeMatch = heightStr.match(/(\d+)ft(\d+)-(\d+)ft(\d+)/);
  if (rangeMatch) {
    // This is a range, so we'll return the min height for now
    // The range handling will happen in the search logic
    const minFeet = parseInt(rangeMatch[1], 10);
    const minInches = parseInt(rangeMatch[2], 10);
    const maxFeet = parseInt(rangeMatch[3], 10);
    const maxInches = parseInt(rangeMatch[4], 10);
    
    console.log(`Parsed height range: ${minFeet}'${minInches}" to ${maxFeet}'${maxInches}"`);
    return minFeet * 12 + minInches; // Return the min height in inches
  }
  
  // Extract feet and inches, format expected: "5ft10" for 5'10"
  const match = heightStr.match(/(\d+)ft(\d+)/);
  if (match) {
    const feet = parseInt(match[1], 10);
    const inches = parseInt(match[2], 10);
    return feet * 12 + inches; // Convert to total inches
  }
  
  return -1;
}

// Helper to parse a height range and return [min, max] in inches
function parseHeightRange(heightStr: string): [number, number] {
  if (!heightStr) return [-1, -1];
  
  // Check for a range format - "4ft10-5ft2"
  const rangeMatch = heightStr.match(/(\d+)ft(\d+)-(\d+)ft(\d+)/);
  if (rangeMatch) {
    const minFeet = parseInt(rangeMatch[1], 10);
    const minInches = parseInt(rangeMatch[2], 10);
    const maxFeet = parseInt(rangeMatch[3], 10);
    const maxInches = parseInt(rangeMatch[4], 10);
    
    return [
      minFeet * 12 + minInches,
      maxFeet * 12 + maxInches
    ];
  }
  
  // If it's not a range, use the single height value for both min and max
  const height = getHeightInInches(heightStr);
  return [height, height];
}

// Helper to parse a year range and return [min, max]
function parseYearRange(yearStr: string): [number, number] {
  if (!yearStr) return [-1, -1];
  
  // Check for a range format - "2010-2015"
  const rangeMatch = yearStr.match(/(\d+)-(\d+)/);
  if (rangeMatch) {
    const minYear = parseInt(rangeMatch[1], 10);
    const maxYear = parseInt(rangeMatch[2], 10);
    return [minYear, maxYear];
  }
  
  // If it's not a range, use the single year value for both min and max
  const year = parseInt(yearStr, 10) || -1;
  return [year, year];
}

function heightToString(inches: number): string {
  if (inches < 0) return "Unknown";
  const feet = Math.floor(inches / 12);
  const remainingInches = inches % 12;
  return `${feet}'${remainingInches}"`;
}

// Interface for storage operations
export interface IStorage {
  getObservation(id: number): Promise<Observation | undefined>;
  getAllObservations(): Promise<Observation[]>;
  createObservation(observation: InsertObservation): Promise<Observation>;
  updateObservation(id: number, observation: Partial<InsertObservation>): Promise<Observation | undefined>;
  deleteObservation(id: number): Promise<boolean>;
  searchObservations(searchParams: SearchParams): Promise<Observation[]>;
  exportObservations(ids?: number[]): Promise<string>;
  importObservations(data: string): Promise<{ success: boolean; count: number; errors?: string[] }>;
}

// Search parameters interface
export interface SearchParams {
  query?: string;
  person?: Partial<PersonInfo>;
  vehicle?: Partial<VehicleInfo>;
  licensePlate?: (string | null)[];
  dateFrom?: string;
  dateTo?: string;
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private observations: Map<number, Observation>;
  private currentId: number;

  constructor() {
    this.observations = new Map();
    this.currentId = 1;
  }
  
  async exportObservations(ids?: number[]): Promise<string> {
    try {
      let observations: Observation[];
      
      // If specific IDs are provided, export only those observations
      if (ids && ids.length > 0) {
        observations = ids
          .map(id => this.observations.get(id))
          .filter((obs): obs is Observation => !!obs);
      } else {
        // Otherwise export all observations
        observations = Array.from(this.observations.values());
      }
      
      // Decrypt sensitive fields for export (they will be re-encrypted by the importer)
      const decryptedObservations = observations.map(obs => 
        decryptSensitiveFields(obs, SENSITIVE_FIELDS)
      );
      
      // Create export object with metadata
      const exportData = {
        version: "1.0",
        exportDate: new Date().toISOString(),
        observations: decryptedObservations
      };
      
      // Convert to JSON string
      return JSON.stringify(exportData);
    } catch (error) {
      console.error("Export error:", error);
      throw new Error("Failed to export observations");
    }
  }
  
  async importObservations(data: string): Promise<{ success: boolean; count: number; errors?: string[] }> {
    try {
      const errors: string[] = [];
      
      // Parse the imported data
      const importData = JSON.parse(data);
      
      if (!importData || !importData.observations || !Array.isArray(importData.observations)) {
        throw new Error("Invalid import data format");
      }
      
      // Extract observations from the import data
      const observations = importData.observations;
      
      // Track the number of successfully imported observations
      let successCount = 0;
      
      // Process each observation
      for (const obs of observations) {
        try {
          // Ensure the observation has required fields
          if (!obs.date || !obs.time || !obs.person || !obs.vehicle) {
            errors.push(`Invalid observation data: missing required fields`);
            continue;
          }
          
          // Prepare insert data (omitting id and createdAt which will be generated)
          const { id, createdAt, ...insertData } = obs;
          
          // Encrypt sensitive fields before storage
          const encryptedData = encryptSensitiveFields(insertData, SENSITIVE_FIELDS);
          
          // Create a new observation with a new ID
          const newId = this.currentId++;
          const newCreatedAt = new Date();
          
          const newObservation = {
            ...encryptedData,
            id: newId,
            createdAt: newCreatedAt
          } as Observation;
          
          // Add to storage
          this.observations.set(newId, newObservation);
          successCount++;
        } catch (error) {
          console.error("Error importing observation:", error);
          errors.push(`Failed to import observation: ${(error as Error).message}`);
        }
      }
      
      return {
        success: successCount > 0,
        count: successCount,
        errors: errors.length > 0 ? errors : undefined
      };
    } catch (error) {
      console.error("Import error:", error);
      return {
        success: false,
        count: 0,
        errors: [`Failed to import observations: ${(error as Error).message}`]
      };
    }
  }

  async getObservation(id: number): Promise<Observation | undefined> {
    const observation = this.observations.get(id);
    if (!observation) return undefined;
    
    // Decrypt sensitive fields before returning to the client
    return decryptSensitiveFields(observation, SENSITIVE_FIELDS);
  }

  async getAllObservations(): Promise<Observation[]> {
    const observations = Array.from(this.observations.values());
    
    // Decrypt sensitive fields in all observations before returning them
    return observations.map(obs => decryptSensitiveFields(obs, SENSITIVE_FIELDS));
  }

  async createObservation(insertObservation: InsertObservation): Promise<Observation> {
    const id = this.currentId++;
    const createdAt = new Date();
    
    // Encrypt sensitive fields before storage
    const encryptedData = encryptSensitiveFields(insertObservation, SENSITIVE_FIELDS);
    
    // Ensure proper type casting for TypeScript
    const observation = { 
      ...encryptedData, 
      id, 
      createdAt 
    } as Observation;
    
    this.observations.set(id, observation);
    
    // Return the decrypted version to the client
    return decryptSensitiveFields(observation, SENSITIVE_FIELDS);
  }

  async updateObservation(id: number, updates: Partial<InsertObservation>): Promise<Observation | undefined> {
    console.log(`Storage: Updating observation ${id} with:`, JSON.stringify(updates));
    
    const observation = this.observations.get(id);
    if (!observation) {
      console.log(`Storage: Observation ${id} not found`);
      return undefined;
    }
    
    console.log(`Storage: Original observation:`, JSON.stringify(observation));
    
    // Encrypt sensitive fields in the updates
    const encryptedUpdates = encryptSensitiveFields(updates, SENSITIVE_FIELDS);
    console.log(`Storage: Encrypted updates:`, JSON.stringify(encryptedUpdates));
    
    // Handle images array specially to ensure it's properly replaced
    const updatedObservation = { ...observation } as Observation;
    
    // Apply updates to the observation
    Object.keys(encryptedUpdates).forEach(key => {
      if (key === 'images') {
        // For images, make a deep copy to ensure complete isolation 
        // from the input reference and apply that copy
        const imagesCopy = JSON.parse(JSON.stringify((encryptedUpdates as any)[key]));
        (updatedObservation as any)[key] = imagesCopy;
        console.log(`Storage: Replaced images array with ${imagesCopy?.length} images`);
        console.log(`Storage: Image URLs: ${imagesCopy?.map((img: any) => img.url).join(', ')}`);
      } else {
        // For other fields, apply normally
        (updatedObservation as any)[key] = (encryptedUpdates as any)[key];
      }
    });

    console.log(`Storage: Updated observation before saving:`, JSON.stringify(updatedObservation));
    
    // Save back to storage
    this.observations.set(id, updatedObservation);
    
    // Verify the update was applied
    const savedObservation = this.observations.get(id);
    console.log(`Storage: Saved observation images length:`, savedObservation?.images?.length || 0);
    
    // Return the decrypted version to the client
    return decryptSensitiveFields(updatedObservation, SENSITIVE_FIELDS);
  }

  async deleteObservation(id: number): Promise<boolean> {
    return this.observations.delete(id);
  }

  // Use the shared height conversion methods instead of private methods

  async searchObservations(searchParams: SearchParams): Promise<Observation[]> {
    // Get all observations and decrypt sensitive fields for searching
    let results = Array.from(this.observations.values()).map(obs => 
      decryptSensitiveFields(obs, SENSITIVE_FIELDS)
    );
    
    // Score structure to track how well each observation matches search criteria
    const matchScores = new Map<number, number>();
    
    // Initialize all scores to 0
    results.forEach(obs => {
      matchScores.set(obs.id, 0);
    });

    // Text search across all fields
    if (searchParams.query) {
      const query = searchParams.query.toLowerCase();
      results = results.filter(obs => {
        const person = obs.person || {};
        const vehicle = obs.vehicle || {} as VehicleInfo;
        const notes = obs.notes || '';
        const additionalNotes = obs.additionalNotes || [];
        const images = obs.images || [];
        
        let totalMatches = 0;
        
        // Check person fields
        const personMatch = Object.values(person).some(value => {
          if (value && typeof value === 'string' && value.toLowerCase().includes(query)) {
            totalMatches++;
            return true;
          }
          return false;
        });
        
        // Check vehicle fields
        let vehicleMatch = Object.entries(vehicle).some(([key, value]) => {
          if (key === 'licensePlate') return false;
          if (value && typeof value === 'string' && value.toLowerCase().includes(query)) {
            totalMatches++;
            return true;
          }
          return false;
        });
        
        // Check license plate
        if (vehicle.licensePlate && Array.isArray(vehicle.licensePlate)) {
          const plateString = vehicle.licensePlate.join('');
          if (plateString.toLowerCase().includes(query)) {
            vehicleMatch = true;
            totalMatches += 2; // License plate matches are particularly important
          }
        }
        
        // Check notes
        const notesMatch = notes.toLowerCase().includes(query);
        if (notesMatch) totalMatches++;
        
        // Check additional notes
        const additionalNotesMatch = additionalNotes.some(note => {
          if (note.content && note.content.toLowerCase().includes(query)) {
            totalMatches++;
            return true;
          }
          return false;
        });
        
        // Check image descriptions and metadata
        const imagesMatch = images.some(image => {
          let matched = false;
          
          // Check image name or description
          if ((image.name && image.name.toLowerCase().includes(query)) || 
              (image.description && image.description.toLowerCase().includes(query))) {
            totalMatches++;
            matched = true;
          }
          
          // Check metadata for matches
          if (image.metadata) {
            const metadataMatch = Object.entries(image.metadata).some(([key, value]) => {
              // Check for location data in formatted address
              if (key === 'location' && value) {
                const location = value as any;
                if (location.formattedAddress && location.formattedAddress.toLowerCase().includes(query)) {
                  totalMatches++;
                  return true;
                }
                // Check each location property
                const locationMatch = Object.values(location).some(locValue => {
                  if (locValue && typeof locValue === 'string' && locValue.toLowerCase().includes(query)) {
                    totalMatches++;
                    return true;
                  }
                  return false;
                });
                return locationMatch;
              }
              
              if (value && typeof value === 'string' && value.toLowerCase().includes(query)) {
                totalMatches++;
                return true;
              }
              return false;
            });
            
            if (metadataMatch) matched = true;
          }
          
          return matched;
        });
        
        // Set score based on total matches
        if (totalMatches > 0) {
          const currentScore = matchScores.get(obs.id) || 0;
          matchScores.set(obs.id, currentScore + totalMatches);
        }
        
        return personMatch || vehicleMatch || notesMatch || additionalNotesMatch || imagesMatch;
      });
    }

    // Filter by person attributes with special handling for height and age ranges
    if (searchParams.person) {
      // First, extract height min/max and age min/max from search params to handle them separately
      const { heightMin, heightMax, ageRangeMin, ageRangeMax, ...otherPersonParams } = searchParams.person;
      
      // Handle height range filtering if either min or max is specified
      if (heightMin || heightMax) {
        const searchMinHeight = heightMin ? getHeightInInches(heightMin) : 0;
        const searchMaxHeight = heightMax ? getHeightInInches(heightMax) : 1000; // Large value if not specified
        
        console.log(`Searching for height range: ${heightToString(searchMinHeight)} to ${heightToString(searchMaxHeight)}`);
        
        results = results.filter(obs => {
          if (!obs.person) return false;
          
          // Name-based filtering should happen separately when other fields are checked
          if (heightMin && heightMin === "4ft11" && obs.person.name?.includes("John")) {
            console.log(`Found John with name: ${obs.person.name}, testing height...`);
          }
          
          let personHeightMatch = false;
          
          // Case 1: Person has legacy height field (could be a single value or a range)
          if (obs.person.height) {
            // For backward compatibility: Parse the height, which could be a range (e.g., "4ft10-5ft2")
            const [personMinHeight, personMaxHeight] = parseHeightRange(obs.person.height);
            
            // Check if there's any overlap between the ranges
            personHeightMatch = !(
              (personMaxHeight < searchMinHeight) || 
              (personMinHeight > searchMaxHeight)
            );
            
            console.log(`Comparing legacy height ${obs.person.height} (${heightToString(personMinHeight)} to ${heightToString(personMaxHeight)}) - match: ${personHeightMatch}`);
            
            // Special debugging for our test case
            if (heightMin && heightMin === "4ft11" && obs.person.name?.includes("John")) {
              console.log(`JOHN LEGACY HEIGHT TEST CASE - Range match: ${personHeightMatch}`);
              console.log(`  Legacy height parsed range: ${personMinHeight}-${personMaxHeight} inches`); 
              console.log(`  Search height range: ${searchMinHeight}-${searchMaxHeight} inches`);
              console.log(`  personMaxHeight < searchMinHeight: ${personMaxHeight < searchMinHeight}`);
              console.log(`  personMinHeight > searchMaxHeight: ${personMinHeight > searchMaxHeight}`);
            }
          } 
          // Case 2: Person has height range (min/max fields)
          else if (obs.person.heightMin || obs.person.heightMax) {
            const personMinHeight = obs.person.heightMin ? getHeightInInches(obs.person.heightMin) : 0;
            const personMaxHeight = obs.person.heightMax ? getHeightInInches(obs.person.heightMax) : personMinHeight || 1000;
            
            console.log(`Comparing person height range: ${obs.person.heightMin || 'none'}-${obs.person.heightMax || 'none'} ` +
                        `(${heightToString(personMinHeight)} to ${heightToString(personMaxHeight)})`);
            
            // Check if there's any overlap between the ranges
            // Two ranges overlap unless one ends before the other starts
            // No overlap if: person's max < search min OR person's min > search max
            personHeightMatch = !(
              (personMaxHeight < searchMinHeight) || 
              (personMinHeight > searchMaxHeight)
            );
            
            // Special debugging for our test case
            if (heightMin && heightMin === "4ft11" && obs.person.name?.includes("John")) {
              console.log(`JOHN TEST CASE - Range match: ${personHeightMatch}`);
              console.log(`  Person height range: ${personMinHeight}-${personMaxHeight} inches`); 
              console.log(`  Search height range: ${searchMinHeight}-${searchMaxHeight} inches`);
              console.log(`  personMaxHeight < searchMinHeight: ${personMaxHeight < searchMinHeight}`);
              console.log(`  personMinHeight > searchMaxHeight: ${personMinHeight > searchMaxHeight}`);
            }
          }
          
          // If no height is specified in the person record, include it in results
          if (!obs.person.height && !obs.person.heightMin && !obs.person.heightMax) {
            return true;
          }
          
          return personHeightMatch;
        });
      }
      
      // Handle age range filtering if either min or max is specified
      if (ageRangeMin !== undefined || ageRangeMax !== undefined) {
        const searchMinAge = ageRangeMin !== undefined ? ageRangeMin : 0;
        const searchMaxAge = ageRangeMax !== undefined ? ageRangeMax : 120; // Large value if not specified
        
        console.log(`Searching for age range: ${searchMinAge} to ${searchMaxAge}`);
        
        results = results.filter(obs => {
          if (!obs.person) return false;
          
          // Get person's age range - if ageRangeMax isn't set, use min value as both min and max
          const personMinAge = obs.person.ageRangeMin !== undefined ? obs.person.ageRangeMin : -1;
          const personMaxAge = obs.person.ageRangeMax !== undefined ? obs.person.ageRangeMax : 
                              (obs.person.ageRangeMin !== undefined ? obs.person.ageRangeMin : -1);
          
          // If we don't have age information for this person, include it in results
          if (personMinAge === -1 || personMaxAge === -1) return true;
          
          console.log(`Comparing person age range: ${personMinAge}-${personMaxAge}`);
          
          // Check if there's any overlap between the age ranges
          // For a range to overlap, it's NOT the case that one ends before other starts
          const ageRangeMatch = !(
            (personMaxAge < searchMinAge) || 
            (personMinAge > searchMaxAge)
          );
          
          console.log(`  Age range match: ${ageRangeMatch}`);
          return ageRangeMatch;
        });
      }
      
      // Handle all other person attributes with special handling for builds
      Object.entries(otherPersonParams).forEach(([key, value]) => {
        if (value) {
          // Special handling for build fields to search across both primary and secondary builds
          if (key === 'buildPrimary') {
            results = results.filter(obs => 
              obs.person && 
              (
                // Match if either buildPrimary or buildSecondary matches the search value
                obs.person.buildPrimary === value || 
                obs.person.buildSecondary === value ||
                // Match if the fields are empty or unset (empty string, null, undefined)
                !obs.person.buildPrimary || 
                obs.person.buildPrimary === '' || 
                obs.person.buildPrimary === 'unknown'
              )
            );
          } 
          else if (key === 'buildSecondary') {
            results = results.filter(obs => 
              obs.person && 
              (
                // Match if either buildSecondary or buildPrimary matches the search value
                obs.person.buildSecondary === value || 
                obs.person.buildPrimary === value ||
                // Match if the fields are empty or unset (empty string, null, undefined)
                !obs.person.buildSecondary || 
                obs.person.buildSecondary === '' || 
                obs.person.buildSecondary === 'unknown'
              )
            );
          }
          // Normal exact matching for other fields
          else {
            results = results.filter(obs => 
              obs.person && 
              (
                // If the observation has the field set, match it exactly
                obs.person[key as keyof PersonInfo] === value ||
                // If the field is empty/undefined in the observation, match any search value
                !obs.person[key as keyof PersonInfo] || 
                obs.person[key as keyof PersonInfo] === '' ||
                obs.person[key as keyof PersonInfo] === 'unknown'
              )
            );
          }
        }
      });
    }

    // Filter by vehicle attributes with special handling for year ranges
    if (searchParams.vehicle) {
      // Extract year min/max from search params
      const { yearMin, yearMax, ...otherVehicleParams } = searchParams.vehicle;
      
      // Handle year range filtering
      if (yearMin || yearMax) {
        const searchMinYear = yearMin ? parseInt(yearMin, 10) : 0;
        const searchMaxYear = yearMax ? parseInt(yearMax, 10) : 3000; // Large value if not specified
        
        console.log(`Searching for year range: ${searchMinYear} to ${searchMaxYear}`);
        
        results = results.filter(obs => {
          if (!obs.vehicle) return false;
          
          let vehicleYearMatch = false;
          
          // Case 1: Vehicle has legacy year field (could be a single year or a range like "2015-2020")
          if (obs.vehicle.year) {
            // For backward compatibility: Parse the year, which could be a range
            const [vehicleMinYear, vehicleMaxYear] = parseYearRange(obs.vehicle.year);
            
            // Check if there's any overlap between the ranges
            vehicleYearMatch = !(
              (vehicleMaxYear < searchMinYear) || 
              (vehicleMinYear > searchMaxYear)
            );
            
            console.log(`Comparing legacy year ${obs.vehicle.year} (${vehicleMinYear} to ${vehicleMaxYear}) - match: ${vehicleYearMatch}`);
          } 
          // Case 2: Vehicle has year range
          else if (obs.vehicle.yearMin || obs.vehicle.yearMax) {
            const vehicleMinYear = obs.vehicle.yearMin ? parseInt(obs.vehicle.yearMin, 10) : 0;
            // If yearMax isn't set, use the same year as yearMin for exact year search
            const vehicleMaxYear = obs.vehicle.yearMax ? parseInt(obs.vehicle.yearMax, 10) : 
                                  (obs.vehicle.yearMin ? parseInt(obs.vehicle.yearMin, 10) : 3000);
            
            console.log(`Comparing vehicle year range: ${obs.vehicle.yearMin || 'none'}-${obs.vehicle.yearMax || 'none'}`);
            
            // Check if there's any overlap between the ranges - same logic as height
            // For a range to overlap, it's NOT the case that one ends before the other starts
            vehicleYearMatch = !(
              (vehicleMaxYear < searchMinYear) || 
              (vehicleMinYear > searchMaxYear)
            );
            
            console.log(`  Year range match: ${vehicleYearMatch} (vehicleMinYear=${vehicleMinYear}, ` +
                      `vehicleMaxYear=${vehicleMaxYear}, searchMinYear=${searchMinYear}, searchMaxYear=${searchMaxYear})`);
          }
          
          // If no year is specified in the vehicle, include it in results
          if (!obs.vehicle.year && !obs.vehicle.yearMin && !obs.vehicle.yearMax) {
            return true;
          }
          
          return vehicleYearMatch;
        });
      }
      
      // Handle all other vehicle attributes with exact matching
      Object.entries(otherVehicleParams).forEach(([key, value]) => {
        if (value && key !== 'licensePlate') {
          results = results.filter(obs => 
            obs.vehicle && 
            (
              // If the observation has the field set, match it exactly
              obs.vehicle[key as keyof VehicleInfo] === value ||
              // If the field is empty/undefined in the observation, match any search value
              !obs.vehicle[key as keyof VehicleInfo] || 
              obs.vehicle[key as keyof VehicleInfo] === '' ||
              obs.vehicle[key as keyof VehicleInfo] === 'unknown'
            )
          );
        }
      });
    }

    // Filter by license plate (partial match)
    if (searchParams.licensePlate && searchParams.licensePlate.some(char => char !== null)) {
      results = results.filter(obs => {
        // If there's no vehicle or no license plate, include the result in search
        if (!obs.vehicle || !obs.vehicle.licensePlate || obs.vehicle.licensePlate.length === 0) return true;
        
        // Count the number of matches for scoring
        let matchCount = 0;
        const totalChars = searchParams.licensePlate!.filter(char => char !== null && char !== '').length;
        
        const isMatch = searchParams.licensePlate!.every((char, index) => {
          // Skip null values (wildcards)
          if (char === null || char === '') return true;
          
          const characterMatches = obs.vehicle!.licensePlate![index] === char;
          if (characterMatches) {
            matchCount++;
          }
          return characterMatches;
        });
        
        // Add score based on how many characters matched
        if (isMatch && matchCount > 0) {
          // Calculate match percentage (higher percentage = higher score)
          const matchPercentage = matchCount / totalChars;
          // Add bonus for license plate match - these are highly significant
          const scoreToAdd = Math.round(matchPercentage * 10) + matchCount;
          const currentScore = matchScores.get(obs.id) || 0;
          matchScores.set(obs.id, currentScore + scoreToAdd);
        }
        
        return isMatch;
      });
    }

    // Filter by date range
    if (searchParams.dateFrom) {
      results = results.filter(obs => obs.date >= searchParams.dateFrom!);
    }
    
    if (searchParams.dateTo) {
      results = results.filter(obs => obs.date <= searchParams.dateTo!);
    }

    // Text search scores are already added during the filtering process
    
    // Score person attribute matches
    if (searchParams.person) {
      const { heightMin, heightMax, ageRangeMin, ageRangeMax, ...otherPersonParams } = searchParams.person;
      
      // Score height matches
      if (heightMin || heightMax) {
        results.forEach(obs => {
          if (obs.person && (obs.person.height || obs.person.heightMin || obs.person.heightMax)) {
            const currentScore = matchScores.get(obs.id) || 0;
            matchScores.set(obs.id, currentScore + 2);
          }
        });
      }
      
      // Score age matches
      if (ageRangeMin !== undefined || ageRangeMax !== undefined) {
        results.forEach(obs => {
          if (obs.person && (obs.person.ageRangeMin !== undefined || obs.person.ageRangeMax !== undefined)) {
            const currentScore = matchScores.get(obs.id) || 0;
            matchScores.set(obs.id, currentScore + 2);
          }
        });
      }
      
      // Score other person attributes
      Object.entries(otherPersonParams).forEach(([key, value]) => {
        if (value) {
          results.forEach(obs => {
            if (obs.person) {
              // Exact matches get a higher score
              if (key === 'buildPrimary' && (obs.person.buildPrimary === value || obs.person.buildSecondary === value)) {
                const currentScore = matchScores.get(obs.id) || 0;
                matchScores.set(obs.id, currentScore + 2);
              } 
              else if (key === 'buildSecondary' && (obs.person.buildSecondary === value || obs.person.buildPrimary === value)) {
                const currentScore = matchScores.get(obs.id) || 0;
                matchScores.set(obs.id, currentScore + 2);
              }
              // Regular field matches
              else if (obs.person[key as keyof PersonInfo] === value) {
                const currentScore = matchScores.get(obs.id) || 0;
                matchScores.set(obs.id, currentScore + 2);
              }
            }
          });
        }
      });
    }
    
    // Score vehicle attribute matches
    if (searchParams.vehicle) {
      const { yearMin, yearMax, ...otherVehicleParams } = searchParams.vehicle;
      
      // Score year matches
      if (yearMin || yearMax) {
        results.forEach(obs => {
          if (obs.vehicle && (obs.vehicle.year || obs.vehicle.yearMin || obs.vehicle.yearMax)) {
            const currentScore = matchScores.get(obs.id) || 0;
            matchScores.set(obs.id, currentScore + 2);
          }
        });
      }
      
      // Score other vehicle attributes
      Object.entries(otherVehicleParams).forEach(([key, value]) => {
        if (value && key !== 'licensePlate') {
          results.forEach(obs => {
            if (obs.vehicle && obs.vehicle[key as keyof VehicleInfo] === value) {
              const currentScore = matchScores.get(obs.id) || 0;
              matchScores.set(obs.id, currentScore + 2);
            }
          });
        }
      });
    }
    
    // Score date range matches
    if (searchParams.dateFrom || searchParams.dateTo) {
      results.forEach(obs => {
        const currentScore = matchScores.get(obs.id) || 0;
        matchScores.set(obs.id, currentScore + 1);
      });
    }

    // Sort by match score (highest first) and then by date (newest first)
    results.sort((a, b) => {
      const scoreA = matchScores.get(a.id) || 0;
      const scoreB = matchScores.get(b.id) || 0;
      
      // Primary sort by score (highest first)
      if (scoreA !== scoreB) {
        return scoreB - scoreA;
      }
      
      // Secondary sort by date (newest first) when scores are equal
      const dateA = new Date(`${a.date}T${a.time}`);
      const dateB = new Date(`${b.date}T${b.time}`);
      return dateB.getTime() - dateA.getTime();
    });

    console.log('Sorted results by match score (first 3 results):');
    results.slice(0, 3).forEach(obs => {
      console.log(`ID: ${obs.id}, Score: ${matchScores.get(obs.id) || 0}`);
    });

    return results;
  }
}

export const storage = new MemStorage();
