import { observations, type Observation, type InsertObservation, PersonInfo, VehicleInfo } from "@shared/schema";

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

  async getObservation(id: number): Promise<Observation | undefined> {
    return this.observations.get(id);
  }

  async getAllObservations(): Promise<Observation[]> {
    return Array.from(this.observations.values());
  }

  async createObservation(insertObservation: InsertObservation): Promise<Observation> {
    const id = this.currentId++;
    const createdAt = new Date();
    const observation: Observation = { ...insertObservation, id, createdAt };
    this.observations.set(id, observation);
    return observation;
  }

  async updateObservation(id: number, updates: Partial<InsertObservation>): Promise<Observation | undefined> {
    const observation = this.observations.get(id);
    if (!observation) {
      return undefined;
    }

    const updatedObservation: Observation = {
      ...observation,
      ...updates,
    };

    this.observations.set(id, updatedObservation);
    return updatedObservation;
  }

  async deleteObservation(id: number): Promise<boolean> {
    return this.observations.delete(id);
  }

  // Use the shared height conversion methods instead of private methods

  async searchObservations(searchParams: SearchParams): Promise<Observation[]> {
    let results = Array.from(this.observations.values());

    // Text search across all fields
    if (searchParams.query) {
      const query = searchParams.query.toLowerCase();
      results = results.filter(obs => {
        const person = obs.person || {};
        const vehicle = obs.vehicle || {};
        
        // Check person fields
        const personMatch = Object.values(person).some(value => 
          value && typeof value === 'string' && value.toLowerCase().includes(query)
        );
        
        // Check vehicle fields
        let vehicleMatch = Object.entries(vehicle).some(([key, value]) => {
          if (key === 'licensePlate' || key === 'additionalLocations') return false;
          return value && typeof value === 'string' && value.toLowerCase().includes(query);
        });
        
        // Check license plate
        if (vehicle.licensePlate) {
          const plateString = vehicle.licensePlate.join('');
          if (plateString.toLowerCase().includes(query)) {
            vehicleMatch = true;
          }
        }
        
        // Check additional locations
        if (vehicle.additionalLocations) {
          const locationsMatch = vehicle.additionalLocations.some(
            loc => loc.toLowerCase().includes(query)
          );
          if (locationsMatch) {
            vehicleMatch = true;
          }
        }
        
        return personMatch || vehicleMatch;
      });
    }

    // Filter by person attributes with special handling for height ranges
    if (searchParams.person) {
      // First, extract height min/max from search params to handle them separately
      const { heightMin, heightMax, ...otherPersonParams } = searchParams.person;
      
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
          
          return personHeightMatch;
        });
      }
      
      // Handle all other person attributes with exact matching
      Object.entries(otherPersonParams).forEach(([key, value]) => {
        if (value) {
          results = results.filter(obs => 
            obs.person && 
            obs.person[key as keyof PersonInfo] === value
          );
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
            const vehicleMaxYear = obs.vehicle.yearMax ? parseInt(obs.vehicle.yearMax, 10) : vehicleMinYear || 3000;
            
            console.log(`Comparing vehicle year range: ${obs.vehicle.yearMin || 'none'}-${obs.vehicle.yearMax || 'none'}`);
            
            // Check if there's any overlap between the ranges - same logic as height
            vehicleYearMatch = !(
              (vehicleMaxYear < searchMinYear) || 
              (vehicleMinYear > searchMaxYear)
            );
            
            console.log(`  Year range match: ${vehicleYearMatch} (vehicleMinYear=${vehicleMinYear}, ` +
                      `vehicleMaxYear=${vehicleMaxYear}, searchMinYear=${searchMinYear}, searchMaxYear=${searchMaxYear})`);
          }
          
          return vehicleYearMatch;
        });
      }
      
      // Handle all other vehicle attributes with exact matching
      Object.entries(otherVehicleParams).forEach(([key, value]) => {
        if (value && key !== 'licensePlate' && key !== 'additionalLocations') {
          results = results.filter(obs => 
            obs.vehicle && 
            obs.vehicle[key as keyof VehicleInfo] === value
          );
        }
      });
    }

    // Filter by license plate (partial match)
    if (searchParams.licensePlate && searchParams.licensePlate.some(char => char !== null)) {
      results = results.filter(obs => {
        if (!obs.vehicle || !obs.vehicle.licensePlate) return false;
        
        return searchParams.licensePlate!.every((char, index) => {
          // Skip null values (wildcards)
          if (char === null || char === '') return true;
          
          return obs.vehicle!.licensePlate![index] === char;
        });
      });
    }

    // Filter by date range
    if (searchParams.dateFrom) {
      results = results.filter(obs => obs.date >= searchParams.dateFrom!);
    }
    
    if (searchParams.dateTo) {
      results = results.filter(obs => obs.date <= searchParams.dateTo!);
    }

    // Sort by date (newest first)
    results.sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.time}`);
      const dateB = new Date(`${b.date}T${b.time}`);
      return dateB.getTime() - dateA.getTime();
    });

    return results;
  }
}

export const storage = new MemStorage();
