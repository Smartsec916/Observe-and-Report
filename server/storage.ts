import { observations, type Observation, type InsertObservation, PersonInfo, VehicleInfo } from "@shared/schema";

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

  // Helper function to convert height string to numeric value for comparison
  private getHeightValue(heightStr: string): number {
    if (!heightStr || heightStr === 'placeholder' || heightStr === 'unknown') return -1;
    
    if (heightStr === 'under4ft10') return 0;
    if (heightStr === 'over6ft8') return 700; // A value higher than any specific height
    if (heightStr === 'variable') return -1; // Cannot be compared
    
    // Extract feet and inches, format expected: "5ft10" for 5'10"
    const match = heightStr.match(/(\d+)ft(\d+)/);
    if (match) {
      const feet = parseInt(match[1], 10);
      const inches = parseInt(match[2], 10);
      return feet * 12 + inches; // Convert to total inches
    }
    
    return -1;
  }

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
        const searchMinHeight = heightMin ? this.getHeightValue(heightMin) : 0;
        const searchMaxHeight = heightMax ? this.getHeightValue(heightMax) : 1000; // Large value if not specified
        
        results = results.filter(obs => {
          if (!obs.person) return false;
          
          let personHeightMatch = false;
          
          // Case 1: Person has specific height
          if (obs.person.height) {
            // For backward compatibility with single height values
            const personHeight = this.getHeightValue(obs.person.height);
            personHeightMatch = personHeight >= searchMinHeight && personHeight <= searchMaxHeight;
          } 
          // Case 2: Person has height range (min/max)
          else if (obs.person.heightMin || obs.person.heightMax) {
            const personMinHeight = obs.person.heightMin ? this.getHeightValue(obs.person.heightMin) : 0;
            const personMaxHeight = obs.person.heightMax ? this.getHeightValue(obs.person.heightMax) : personMinHeight;
            
            // Match if there's any overlap in the height ranges
            personHeightMatch = !(personMaxHeight < searchMinHeight || personMinHeight > searchMaxHeight);
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
        
        results = results.filter(obs => {
          if (!obs.vehicle) return false;
          
          let vehicleYearMatch = false;
          
          // Case 1: Vehicle has specific year
          if (obs.vehicle.year) {
            // For backward compatibility with single year values
            const vehicleYear = parseInt(obs.vehicle.year, 10) || 0;
            vehicleYearMatch = vehicleYear >= searchMinYear && vehicleYear <= searchMaxYear;
          } 
          // Case 2: Vehicle has year range
          else if (obs.vehicle.yearMin || obs.vehicle.yearMax) {
            const vehicleMinYear = obs.vehicle.yearMin ? parseInt(obs.vehicle.yearMin, 10) : 0;
            const vehicleMaxYear = obs.vehicle.yearMax ? parseInt(obs.vehicle.yearMax, 10) : vehicleMinYear;
            
            // Match if there's any overlap in the year ranges
            vehicleYearMatch = !(vehicleMaxYear < searchMinYear || vehicleMinYear > searchMaxYear);
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
