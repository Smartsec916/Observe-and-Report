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

    // Filter by person attributes
    if (searchParams.person) {
      Object.entries(searchParams.person).forEach(([key, value]) => {
        if (value) {
          results = results.filter(obs => 
            obs.person && 
            obs.person[key as keyof PersonInfo] === value
          );
        }
      });
    }

    // Filter by vehicle attributes
    if (searchParams.vehicle) {
      Object.entries(searchParams.vehicle).forEach(([key, value]) => {
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
