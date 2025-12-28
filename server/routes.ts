import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { setupAuth, registerAuthRoutes, authStorage } from "./replit_integrations/auth";
import { registerChatRoutes } from "./replit_integrations/chat";
import { registerImageRoutes } from "./replit_integrations/image";
import { GoogleGenAI } from "@google/genai";
import { insertPartSchema, insertCustomerSchema, insertVehicleSchema, insertJobCardSchema, insertTaskSchema } from "@shared/schema";

// Helper for AI insights
const ai = new GoogleGenAI({
  apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY,
  httpOptions: {
    apiVersion: "",
    baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL,
  },
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Register Integrations
  await setupAuth(app);
  registerAuthRoutes(app);
  registerChatRoutes(app);
  registerImageRoutes(app);

  // --- API Routes ---

  // Profiles
  app.get(api.profiles.me.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const userId = (req.user as any).claims.sub;
    const profile = await storage.getProfile(userId);
    if (!profile) return res.status(404).json({ message: "Profile not found" });
    res.json(profile);
  });

  app.put(api.profiles.update.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const userId = (req.user as any).claims.sub;
    try {
      const input = api.profiles.update.input.parse(req.body);
      const profile = await storage.updateProfile(userId, input);
      res.json(profile);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Customers
  app.get(api.customers.list.path, async (req, res) => {
    const customers = await storage.getCustomers(req.query.search as string);
    res.json(customers);
  });

  app.get(api.customers.get.path, async (req, res) => {
    const customer = await storage.getCustomer(Number(req.params.id));
    if (!customer) return res.status(404).json({ message: "Customer not found" });
    const vehicles = await storage.getVehicles(customer.id);
    res.json({ ...customer, vehicles });
  });

  app.post(api.customers.create.path, async (req, res) => {
    try {
      const input = api.customers.create.input.parse(req.body);
      const customer = await storage.createCustomer(input);
      res.status(201).json(customer);
    } catch (err) {
       if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Vehicles
  app.get(api.vehicles.list.path, async (req, res) => {
    const vehicles = await storage.getVehicles();
    res.json(vehicles);
  });

  app.post(api.vehicles.create.path, async (req, res) => {
    try {
      const input = api.vehicles.create.input.parse(req.body);
      const vehicle = await storage.createVehicle(input);
      res.status(201).json(vehicle);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Parts
  app.get(api.parts.list.path, async (req, res) => {
    const parts = await storage.getParts();
    res.json(parts);
  });

  app.post(api.parts.create.path, async (req, res) => {
    try {
      const input = api.parts.create.input.parse(req.body);
      const part = await storage.createPart(input);
      res.status(201).json(part);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Job Cards
  app.get(api.jobCards.list.path, async (req, res) => {
    const jobCards = await storage.getJobCards(req.query.status as string);
    res.json(jobCards);
  });

  app.get(api.jobCards.get.path, async (req, res) => {
    const jobCard = await storage.getJobCard(Number(req.params.id));
    if (!jobCard) return res.status(404).json({ message: "Job card not found" });
    res.json(jobCard);
  });

  app.post(api.jobCards.create.path, async (req, res) => {
    try {
      const input = api.jobCards.create.input.parse(req.body);
      const jobCard = await storage.createJobCard(input);
      
      // Log creation in timeline
      await storage.createTimelineEvent({
        jobCardId: jobCard.id,
        type: 'SYSTEM',
        status: 'Created',
        role: 'OWNER', 
        actorId: (req.user as any)?.claims?.sub || 'system',
        comment: 'Job card created',
      });

      res.status(201).json(jobCard);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put(api.jobCards.update.path, async (req, res) => {
    try {
      const input = api.jobCards.update.input.parse(req.body);
      const jobCard = await storage.updateJobCard(Number(req.params.id), input);
      
      // Log update in timeline if status changed
      if (input.status) {
         await storage.createTimelineEvent({
          jobCardId: jobCard.id,
          type: 'STATUS_CHANGE',
          status: input.status,
          role: 'OWNER',
          actorId: (req.user as any)?.claims?.sub || 'system',
          comment: `Status updated to ${input.status}`,
        });
      }

      res.json(jobCard);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // AI Insight Endpoint
  app.post(api.jobCards.aiInsight.path, async (req, res) => {
    try {
      const jobCardId = Number(req.params.id);
      const jobCard = await storage.getJobCard(jobCardId);
      if (!jobCard) return res.status(404).json({ message: "Job card not found" });

      // Construct prompt for Gemini
      const prompt = `
        Analyze this vehicle service job card and provide insights/recommendations:
        Vehicle: ${jobCard.vehicle.year} ${jobCard.vehicle.make} ${jobCard.vehicle.model}
        Issues/Tasks: ${jobCard.tasks.map(t => t.description).join(', ')}
        Current Status: ${jobCard.status}
        
        Provide a concise summary of the job status, potential risks, and recommendations for the technician or advisor.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      });

      const insight = response.response.text();
      
      // Save insight to timeline
      await storage.createTimelineEvent({
        jobCardId,
        type: 'AI_INSIGHT',
        status: 'Insight Generated',
        role: 'SYSTEM',
        actorId: 'system',
        comment: insight,
      });

      res.json({ insight });
    } catch (error) {
      console.error("AI Insight error:", error);
      res.status(500).json({ message: "Failed to generate AI insight" });
    }
  });

  // Tasks
  app.post(api.tasks.create.path, async (req, res) => {
    try {
      const input = api.tasks.create.input.parse(req.body);
      const task = await storage.createTask(input);
      res.status(201).json(task);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put(api.tasks.update.path, async (req, res) => {
    try {
      const input = api.tasks.update.input.parse(req.body);
      const task = await storage.updateTask(Number(req.params.id), input);
      res.json(task);
    } catch (err) {
       if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Initialize DB with seed data
  try {
    await ensureSystemUser();
    await seedDatabase();
  } catch (error) {
    console.error("Failed to seed database:", error);
  }

  return httpServer;
}

async function ensureSystemUser() {
  const systemUser = await authStorage.getUser('system');
  if (!systemUser) {
    await authStorage.upsertUser({
      id: 'system',
      email: 'system@autoserv.com',
      firstName: 'System',
      lastName: 'Admin',
    });
    console.log("System user created.");
  }
}

async function seedDatabase() {
  const parts = await storage.getParts();
  if (parts.length === 0) {
    console.log("Seeding database...");
    
    // Create Parts
    const part1 = await storage.createPart({ name: 'Engine Oil 5W-30', sku: 'EO-5W30-01', stock: 45, minStock: 10, price: "3200.00", category: 'Consumables', reserved: 4, location: 'Shelf A1' });
    const part2 = await storage.createPart({ name: 'Oil Filter', sku: 'OF-TY-001', stock: 2, minStock: 15, price: "850.50", category: 'Filters', reserved: 1, location: 'Shelf B2' });
    const part3 = await storage.createPart({ name: 'Brake Pads Front', sku: 'BP-F-02', stock: 12, minStock: 5, price: "4500.00", category: 'Brakes', reserved: 0, location: 'Shelf C3' });

    // Create Customers
    const cust1 = await storage.createCustomer({ name: 'Robert D\'Souza', phone: '+91 98765 43210', email: 'robert.dsouza@example.in', loyaltyPoints: 452, address: 'Mumbai, India', notes: 'VIP Customer' });
    const cust2 = await storage.createCustomer({ name: 'Anjali Gupta', phone: '+91 91234 56789', email: 'anjali.g@example.in', loyaltyPoints: 120, address: 'Delhi, India', notes: 'Preferred weekend appointments' });

    // Create Vehicles
    const veh1 = await storage.createVehicle({ customerId: cust1.id, vin: 'VIN-9876-XJ01-992', plateNumber: 'MH-01-AB-1234', make: 'Toyota', model: 'Camry', year: 2020, color: 'White' });
    const veh2 = await storage.createVehicle({ customerId: cust2.id, vin: 'VIN-1234-AB02-111', plateNumber: 'KA-03-MG-7890', make: 'Honda', model: 'Civic', year: 2021, color: 'Silver' });

    // Create Job Cards
    const jc1 = await storage.createJobCard({ 
      vehicleId: veh1.id, 
      customerId: cust1.id, 
      status: 'IN_PROGRESS', 
      estimatedAmount: "18500.00",
      advisorId: undefined, // Assign later
      technicianId: undefined
    });

    // Create Tasks
    await storage.createTask({ jobCardId: jc1.id, description: 'Engine Oil Change', status: 'COMPLETED', isCompleted: true, laborCost: "1200", startTime: new Date(), endTime: new Date() });
    await storage.createTask({ jobCardId: jc1.id, description: 'General Inspection', status: 'IN_PROGRESS', isCompleted: false, laborCost: "2500" });

    // Timeline
    await storage.createTimelineEvent({ jobCardId: jc1.id, type: 'SYSTEM', status: 'Created', role: 'OWNER', actorId: 'system', comment: 'Job card created via seed' });

    console.log("Database seeded successfully.");
  }
}
