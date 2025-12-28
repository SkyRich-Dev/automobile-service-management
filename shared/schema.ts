import { pgTable, text, serial, integer, boolean, timestamp, numeric, pgEnum, uuid } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./models/auth";

// Re-export auth and chat models
export * from "./models/auth";
export * from "./models/chat";

// Enums
export const userRoleEnum = pgEnum("user_role", [
  "OWNER", "MANAGER", "ADVISOR", "TECHNICIAN", "ACCOUNTS", "INVENTORY", "CUSTOMER"
]);

export const jobStatusEnum = pgEnum("job_status", [
  "APPOINTED", "CHECKED_IN", "IN_PROGRESS", "ON_HOLD", "QC_PENDING", "READY_FOR_DELIVERY", "DELIVERED"
]);

export const taskStatusEnum = pgEnum("task_status", [
  "PENDING", "IN_PROGRESS", "COMPLETED", "REJECTED"
]);

// Tables

export const profiles = pgTable("profiles", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  role: userRoleEnum("role").notNull().default("CUSTOMER"),
  branchId: text("branch_id"),
  phone: text("phone"),
  utilization: integer("utilization").default(0),
  avatar: text("avatar"),
});

export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  email: text("email").notNull(),
  loyaltyPoints: integer("loyalty_points").default(0),
  address: text("address"),
  notes: text("notes"),
});

export const vehicles = pgTable("vehicles", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull().references(() => customers.id),
  vin: text("vin").notNull().unique(),
  plateNumber: text("plate_number").notNull(),
  make: text("make").notNull(),
  model: text("model").notNull(),
  year: integer("year"),
  color: text("color"),
});

export const parts = pgTable("parts", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  sku: text("sku").notNull().unique(),
  category: text("category").notNull(),
  stock: integer("stock").notNull().default(0),
  minStock: integer("min_stock").notNull().default(5),
  price: numeric("price").notNull(),
  reserved: integer("reserved").notNull().default(0),
  location: text("location"),
});

export const jobCards = pgTable("job_cards", {
  id: serial("id").primaryKey(),
  vehicleId: integer("vehicle_id").notNull().references(() => vehicles.id),
  customerId: integer("customer_id").notNull().references(() => customers.id),
  advisorId: text("advisor_id").references(() => users.id),
  technicianId: text("technician_id").references(() => users.id),
  status: jobStatusEnum("status").notNull().default("APPOINTED"),
  estimatedAmount: numeric("estimated_amount").default("0"),
  actualAmount: numeric("actual_amount"),
  slaDeadline: timestamp("sla_deadline"),
  aiSummary: text("ai_summary"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  jobCardId: integer("job_card_id").notNull().references(() => jobCards.id),
  description: text("description").notNull(),
  status: taskStatusEnum("status").notNull().default("PENDING"),
  isCompleted: boolean("is_completed").default(false),
  laborCost: numeric("labor_cost").default("0"),
  startTime: timestamp("start_time"),
  endTime: timestamp("end_time"),
});

export const taskParts = pgTable("task_parts", {
  id: serial("id").primaryKey(),
  taskId: integer("task_id").notNull().references(() => tasks.id),
  partId: integer("part_id").notNull().references(() => parts.id),
  quantity: integer("quantity").notNull().default(1),
  price: numeric("price").notNull(), // Snapshot price at time of usage
  isReserved: boolean("is_reserved").default(false),
});

export const timelineEvents = pgTable("timeline_events", {
  id: serial("id").primaryKey(),
  jobCardId: integer("job_card_id").notNull().references(() => jobCards.id),
  type: text("type").notNull(), // 'STATUS_CHANGE' | 'TASK_LOG' | 'COMMUNICATION' | 'APPROVAL' | 'SYSTEM' | 'AI_INSIGHT'
  status: text("status"),
  actorId: text("actor_id").references(() => users.id), // The user who performed the action
  role: userRoleEnum("role"), // Snapshot of role
  comment: text("comment"),
  timestamp: timestamp("timestamp").defaultNow(),
});

// Relations
export const profilesRelations = relations(profiles, ({ one }) => ({
  user: one(users, {
    fields: [profiles.userId],
    references: [users.id],
  }),
}));

export const customersRelations = relations(customers, ({ many }) => ({
  vehicles: many(vehicles),
  jobCards: many(jobCards),
}));

export const vehiclesRelations = relations(vehicles, ({ one, many }) => ({
  customer: one(customers, {
    fields: [vehicles.customerId],
    references: [customers.id],
  }),
  jobCards: many(jobCards),
}));

export const jobCardsRelations = relations(jobCards, ({ one, many }) => ({
  vehicle: one(vehicles, {
    fields: [jobCards.vehicleId],
    references: [vehicles.id],
  }),
  customer: one(customers, {
    fields: [jobCards.customerId],
    references: [customers.id],
  }),
  advisor: one(users, {
    fields: [jobCards.advisorId],
    references: [users.id],
  }),
  technician: one(users, {
    fields: [jobCards.technicianId],
    references: [users.id],
  }),
  tasks: many(tasks),
  timelineEvents: many(timelineEvents),
}));

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  jobCard: one(jobCards, {
    fields: [tasks.jobCardId],
    references: [jobCards.id],
  }),
  parts: many(taskParts),
}));

export const taskPartsRelations = relations(taskParts, ({ one }) => ({
  task: one(tasks, {
    fields: [taskParts.taskId],
    references: [tasks.id],
  }),
  part: one(parts, {
    fields: [taskParts.partId],
    references: [parts.id],
  }),
}));

// Schemas & Types
export const insertProfileSchema = createInsertSchema(profiles);
export const insertCustomerSchema = createInsertSchema(customers);
export const insertVehicleSchema = createInsertSchema(vehicles);
export const insertPartSchema = createInsertSchema(parts);
export const insertJobCardSchema = createInsertSchema(jobCards);
export const insertTaskSchema = createInsertSchema(tasks);
export const insertTaskPartSchema = createInsertSchema(taskParts);
export const insertTimelineEventSchema = createInsertSchema(timelineEvents);

export type Profile = typeof profiles.$inferSelect;
export type Customer = typeof customers.$inferSelect;
export type Vehicle = typeof vehicles.$inferSelect;
export type Part = typeof parts.$inferSelect;
export type JobCard = typeof jobCards.$inferSelect;
export type Task = typeof tasks.$inferSelect;
export type TaskPart = typeof taskParts.$inferSelect;
export type TimelineEvent = typeof timelineEvents.$inferSelect;

export type InsertProfile = z.infer<typeof insertProfileSchema>;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type InsertVehicle = z.infer<typeof insertVehicleSchema>;
export type InsertPart = z.infer<typeof insertPartSchema>;
export type InsertJobCard = z.infer<typeof insertJobCardSchema>;
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type InsertTaskPart = z.infer<typeof insertTaskPartSchema>;
export type InsertTimelineEvent = z.infer<typeof insertTimelineEventSchema>;

// Complex Types for API
export type JobCardWithDetails = JobCard & {
  vehicle: Vehicle;
  customer: Customer;
  tasks: (Task & { parts: (TaskPart & { part: Part })[] })[];
  timeline: TimelineEvent[];
};
