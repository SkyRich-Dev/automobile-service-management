import { db } from "./db";
import {
  profiles, customers, vehicles, parts, jobCards, tasks, taskParts, timelineEvents,
  type Profile, type Customer, type Vehicle, type Part, type JobCard, type Task, type TaskPart, type TimelineEvent,
  type InsertProfile, type InsertCustomer, type InsertVehicle, type InsertPart, type InsertJobCard, type InsertTask, type InsertTaskPart, type InsertTimelineEvent,
  type JobCardWithDetails
} from "@shared/schema";
import { eq, desc, and } from "drizzle-orm";

export interface IStorage {
  // Profiles
  getProfile(userId: string): Promise<Profile | undefined>;
  updateProfile(userId: string, profile: Partial<InsertProfile>): Promise<Profile>;

  // Customers
  getCustomers(search?: string): Promise<Customer[]>;
  getCustomer(id: number): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;

  // Vehicles
  getVehicles(customerId?: number): Promise<Vehicle[]>;
  getVehicle(id: number): Promise<Vehicle | undefined>;
  createVehicle(vehicle: InsertVehicle): Promise<Vehicle>;

  // Parts
  getParts(): Promise<Part[]>;
  getPart(id: number): Promise<Part | undefined>;
  createPart(part: InsertPart): Promise<Part>;
  updatePartStock(id: number, quantityChange: number): Promise<Part>;

  // Job Cards
  getJobCards(status?: string): Promise<JobCardWithDetails[]>;
  getJobCard(id: number): Promise<JobCardWithDetails | undefined>;
  createJobCard(jobCard: InsertJobCard): Promise<JobCard>;
  updateJobCard(id: number, updates: Partial<InsertJobCard>): Promise<JobCard>;

  // Tasks
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: number, updates: Partial<InsertTask>): Promise<Task>;
  
  // Timeline
  createTimelineEvent(event: InsertTimelineEvent): Promise<TimelineEvent>;
}

export class DatabaseStorage implements IStorage {
  // Profiles
  async getProfile(userId: string): Promise<Profile | undefined> {
    const [profile] = await db.select().from(profiles).where(eq(profiles.userId, userId));
    return profile;
  }

  async updateProfile(userId: string, updates: Partial<InsertProfile>): Promise<Profile> {
    const existing = await this.getProfile(userId);
    if (existing) {
      const [updated] = await db.update(profiles)
        .set(updates)
        .where(eq(profiles.userId, userId))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(profiles)
        .values({ userId, ...updates } as InsertProfile)
        .returning();
      return created;
    }
  }

  // Customers
  async getCustomers(search?: string): Promise<Customer[]> {
    if (search) {
      // Simple search implementation
      // For generic search, Drizzle's ilike or similar would be used. 
      // Since schema.ts imports specific types, we assume simple select for now 
      // and filter in memory if needed for MVP or add ilike.
      // Let's return all for now as list is small or add basic filtering later.
      return db.select().from(customers); 
    }
    return db.select().from(customers);
  }

  async getCustomer(id: number): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.id, id));
    return customer;
  }

  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    const [newCustomer] = await db.insert(customers).values(customer).returning();
    return newCustomer;
  }

  // Vehicles
  async getVehicles(customerId?: number): Promise<Vehicle[]> {
    if (customerId) {
      return db.select().from(vehicles).where(eq(vehicles.customerId, customerId));
    }
    return db.select().from(vehicles);
  }

  async getVehicle(id: number): Promise<Vehicle | undefined> {
    const [vehicle] = await db.select().from(vehicles).where(eq(vehicles.id, id));
    return vehicle;
  }

  async createVehicle(vehicle: InsertVehicle): Promise<Vehicle> {
    const [newVehicle] = await db.insert(vehicles).values(vehicle).returning();
    return newVehicle;
  }

  // Parts
  async getParts(): Promise<Part[]> {
    return db.select().from(parts);
  }

  async getPart(id: number): Promise<Part | undefined> {
    const [part] = await db.select().from(parts).where(eq(parts.id, id));
    return part;
  }

  async createPart(part: InsertPart): Promise<Part> {
    const [newPart] = await db.insert(parts).values(part).returning();
    return newPart;
  }

  async updatePartStock(id: number, quantityChange: number): Promise<Part> {
    // This is a simplified stock update. Concurrency handling might be needed in prod.
    const part = await this.getPart(id);
    if (!part) throw new Error("Part not found");
    
    const [updated] = await db.update(parts)
      .set({ stock: part.stock + quantityChange })
      .where(eq(parts.id, id))
      .returning();
    return updated;
  }

  // Job Cards
  async getJobCards(status?: string): Promise<JobCardWithDetails[]> {
    const query = db.query.jobCards.findMany({
      where: status ? eq(jobCards.status, status as any) : undefined,
      with: {
        vehicle: true,
        customer: true,
        tasks: {
          with: {
            parts: {
              with: {
                part: true
              }
            }
          }
        },
        timelineEvents: true
      },
      orderBy: [desc(jobCards.createdAt)]
    });
    return query as unknown as Promise<JobCardWithDetails[]>;
  }

  async getJobCard(id: number): Promise<JobCardWithDetails | undefined> {
    const query = db.query.jobCards.findFirst({
      where: eq(jobCards.id, id),
      with: {
        vehicle: true,
        customer: true,
        tasks: {
          with: {
            parts: {
              with: {
                part: true
              }
            }
          }
        },
        timelineEvents: true
      }
    });
    return query as unknown as Promise<JobCardWithDetails | undefined>;
  }

  async createJobCard(jobCard: InsertJobCard): Promise<JobCard> {
    const [newJobCard] = await db.insert(jobCards).values(jobCard).returning();
    return newJobCard;
  }

  async updateJobCard(id: number, updates: Partial<InsertJobCard>): Promise<JobCard> {
    const [updated] = await db.update(jobCards)
      .set(updates)
      .where(eq(jobCards.id, id))
      .returning();
    return updated;
  }

  // Tasks
  async createTask(task: InsertTask): Promise<Task> {
    const [newTask] = await db.insert(tasks).values(task).returning();
    return newTask;
  }

  async updateTask(id: number, updates: Partial<InsertTask>): Promise<Task> {
    const [updated] = await db.update(tasks)
      .set(updates)
      .where(eq(tasks.id, id))
      .returning();
    return updated;
  }

  // Timeline
  async createTimelineEvent(event: InsertTimelineEvent): Promise<TimelineEvent> {
    const [newEvent] = await db.insert(timelineEvents).values(event).returning();
    return newEvent;
  }
}

export const storage = new DatabaseStorage();
