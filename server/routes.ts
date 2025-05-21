import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { 
  insertLandlordSchema, 
  insertLandlordOwnerSchema, 
  insertTenantSchema, 
  insertRentalRateIncreaseSchema,
  insertRentalRateHistorySchema
} from "@shared/schema";
import { fromZodError } from "zod-validation-error";


export async function registerRoutes(app: Express): Promise<Server> {
  // Error handler for validation errors
  const handleZodError = (err: unknown) => {
    if (err instanceof z.ZodError) {
      return { message: fromZodError(err).message, errors: err.errors };
    }
    
    if (err instanceof Error) {
      return { message: err.message };
    }
    
    return { message: "An unknown error occurred" };
  };

  // Get all properties with details
  app.get("/api/properties", async (req, res) => {
    try {
      const properties = await storage.getPropertiesWithDetails();
      res.json(properties);
    } catch (err) {
      res.status(500).json(handleZodError(err));
    }
  });

  // Get property by address
  app.get("/api/properties/:address", async (req, res) => {
    try {
      const address = decodeURIComponent(req.params.address);
      const property = await storage.getPropertyDetailsByAddress(address);
      
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }
      
      res.json(property);
    } catch (err) {
      res.status(500).json(handleZodError(err));
    }
  });

  // Landlord routes
  app.get("/api/landlords", async (req, res) => {
    try {
      const landlords = await storage.getLandlords();
      res.json(landlords);
    } catch (err) {
      res.status(500).json(handleZodError(err));
    }
  });

  app.post("/api/landlords", async (req, res) => {
    try {
      const landlordData = insertLandlordSchema.parse(req.body);
      
      // Check if property address already exists
      const existingLandlord = await storage.getLandlordByPropertyAddress(landlordData.propertyAddress);
      if (existingLandlord) {
        return res.status(400).json({ message: "Property address already exists" });
      }
      
      const landlord = await storage.createLandlord(landlordData);
      res.status(201).json(landlord);
    } catch (err) {
      res.status(400).json(handleZodError(err));
    }
  });

  app.put("/api/landlords/:address", async (req, res) => {
    try {
      const address = decodeURIComponent(req.params.address);
      const landlordData = insertLandlordSchema.partial().parse(req.body);
      
      const updatedLandlord = await storage.updateLandlord(address, landlordData);
      
      if (!updatedLandlord) {
        return res.status(404).json({ message: "Landlord not found" });
      }
      
      res.json(updatedLandlord);
    } catch (err) {
      res.status(400).json(handleZodError(err));
    }
  });

  app.delete("/api/landlords/:address", async (req, res) => {
    try {
      const address = decodeURIComponent(req.params.address);
      const success = await storage.deleteLandlord(address);
      
      if (!success) {
        return res.status(404).json({ message: "Landlord not found" });
      }
      
      res.status(204).send();
    } catch (err) {
      res.status(500).json(handleZodError(err));
    }
  });

  // Landlord Owner routes
  app.get("/api/landlords/:address/owners", async (req, res) => {
    try {
      const address = decodeURIComponent(req.params.address);
      const landlord = await storage.getLandlordByPropertyAddress(address);
      
      if (!landlord) {
        return res.status(404).json({ message: "Landlord not found" });
      }
      
      const owners = await storage.getLandlordOwners(landlord.id);
      res.json(owners);
    } catch (err) {
      res.status(500).json(handleZodError(err));
    }
  });

  app.post("/api/landlord-owners", async (req, res) => {
    try {
      const ownerData = insertLandlordOwnerSchema.parse(req.body);
      const owner = await storage.createLandlordOwner(ownerData);
      res.status(201).json(owner);
    } catch (err) {
      res.status(400).json(handleZodError(err));
    }
  });

  app.put("/api/landlord-owners/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const ownerData = insertLandlordOwnerSchema.partial().parse(req.body);
      
      const updatedOwner = await storage.updateLandlordOwner(id, ownerData);
      
      if (!updatedOwner) {
        return res.status(404).json({ message: "Owner not found" });
      }
      
      res.json(updatedOwner);
    } catch (err) {
      res.status(400).json(handleZodError(err));
    }
  });

  app.delete("/api/landlord-owners/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const success = await storage.deleteLandlordOwner(id);
      
      if (!success) {
        return res.status(404).json({ message: "Owner not found" });
      }
      
      res.status(204).send();
    } catch (err) {
      res.status(500).json(handleZodError(err));
    }
  });

  // Tenant routes
  app.get("/api/tenants", async (req, res) => {
    try {
      const tenants = await storage.getTenants();
      res.json(tenants);
    } catch (err) {
      res.status(500).json(handleZodError(err));
    }
  });

  // Special routes with specific path patterns must be before generic ones
  // Property-based tenant update
  app.put("/api/tenants/property/:address", async (req, res) => {
    try {
      console.log("Tenant update by property address endpoint called");
      const address = decodeURIComponent(req.params.address);
      console.log(`Looking up tenant for address: ${address}`);
      const tenantData = insertTenantSchema.partial().parse(req.body);
      
      // Get the tenant first by property address
      const existingTenant = await storage.getTenantByPropertyAddress(address);
      
      if (!existingTenant) {
        console.log("No tenant found for this property address");
        return res.status(404).json({ message: "Tenant not found for this property" });
      }
      
      console.log(`Found tenant with ID: ${existingTenant.id}`);
      
      // Update using the ID we retrieved
      const updatedTenant = await storage.updateTenant(existingTenant.id, tenantData);
      
      if (!updatedTenant) {
        return res.status(404).json({ message: "Failed to update tenant" });
      }
      
      console.log("Tenant updated successfully");
      res.json(updatedTenant);
    } catch (err) {
      console.error("Error updating tenant by address:", err);
      res.status(400).json(handleZodError(err));
    }
  });

  // These more generic routes must come after specific ones
  app.get("/api/tenants/:address", async (req, res) => {
    try {
      const address = decodeURIComponent(req.params.address);
      const tenant = await storage.getTenantByPropertyAddress(address);
      
      if (!tenant) {
        return res.status(404).json({ message: "Tenant not found" });
      }
      
      res.json(tenant);
    } catch (err) {
      res.status(500).json(handleZodError(err));
    }
  });

  app.post("/api/tenants", async (req, res) => {
    try {
      const tenantData = insertTenantSchema.parse(req.body);
      
      // Check if a tenant already exists for this property
      const existingTenant = await storage.getTenantByPropertyAddress(tenantData.propertyAddress);
      if (existingTenant) {
        return res.status(400).json({ message: "A tenant already exists for this property" });
      }
      
      const tenant = await storage.createTenant(tenantData);
      res.status(201).json(tenant);
    } catch (err) {
      res.status(400).json(handleZodError(err));
    }
  });

  app.put("/api/tenants/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const tenantData = insertTenantSchema.partial().parse(req.body);
      
      const updatedTenant = await storage.updateTenant(id, tenantData);
      
      if (!updatedTenant) {
        return res.status(404).json({ message: "Tenant not found" });
      }
      
      res.json(updatedTenant);
    } catch (err) {
      res.status(400).json(handleZodError(err));
    }
  });

  app.delete("/api/tenants/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const success = await storage.deleteTenant(id);
      
      if (!success) {
        return res.status(404).json({ message: "Tenant not found" });
      }
      
      res.status(204).send();
    } catch (err) {
      res.status(500).json(handleZodError(err));
    }
  });

  // Rental Rate Increase routes
  app.get("/api/rental-increases", async (req, res) => {
    try {
      const increases = await storage.getRentalRateIncreases();
      res.json(increases);
    } catch (err) {
      res.status(500).json(handleZodError(err));
    }
  });

  app.get("/api/rental-increases/:address", async (req, res) => {
    try {
      const address = decodeURIComponent(req.params.address);
      const increase = await storage.getRentalRateIncreaseByPropertyAddress(address);
      
      if (!increase) {
        return res.status(404).json({ message: "Rental rate increase not found" });
      }
      
      res.json(increase);
    } catch (err) {
      res.status(500).json(handleZodError(err));
    }
  });

  app.post("/api/rental-increases", async (req, res) => {
    try {
      const increaseData = insertRentalRateIncreaseSchema.parse(req.body);
      
      // Check if rental increase already exists for this property
      const existingIncrease = await storage.getRentalRateIncreaseByPropertyAddress(increaseData.propertyAddress);
      if (existingIncrease) {
        return res.status(400).json({ message: "Rental rate increase already exists for this property" });
      }
      
      const increase = await storage.createRentalRateIncrease(increaseData);
      res.status(201).json(increase);
    } catch (err) {
      res.status(400).json(handleZodError(err));
    }
  });
  
  // Add initial rental rate (first rental rate for a property)
  app.post("/api/rental-increases/initial", async (req, res) => {
    try {
      // Validate request body with a custom schema
      const initialRateSchema = z.object({
        propertyAddress: z.string(),
        initialRentalRate: z.number().positive("Rental rate must be a positive number"),
        startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
      });
      
      const data = initialRateSchema.parse(req.body);
      
      // Check if rental increase already exists for this property
      const existingIncrease = await storage.getRentalRateIncreaseByPropertyAddress(data.propertyAddress);
      if (existingIncrease) {
        return res.status(400).json({ message: "Rental rate information already exists for this property" });
      }
      
      // Create initial rental rate with appropriate calculations
      const startDate = new Date(data.startDate);
      
      // Calculate next allowable increase date (1 year from start date)
      const nextAllowableDate = new Date(startDate);
      nextAllowableDate.setFullYear(nextAllowableDate.getFullYear() + 1);
      
      // Calculate reminder date (8 months from start date)
      const reminderDate = new Date(startDate);
      reminderDate.setMonth(reminderDate.getMonth() + 8);
      
      // Calculate next allowable rate (3% increase)
      const nextAllowableRate = Math.round(data.initialRentalRate * 1.03 * 100) / 100;
      
      // Create the rental rate increase record
      const increase = await storage.createRentalRateIncrease({
        propertyAddress: data.propertyAddress,
        latestRateIncreaseDate: data.startDate,
        latestRentalRate: data.initialRentalRate,
        nextAllowableRentalIncreaseDate: nextAllowableDate.toISOString().split('T')[0],
        nextAllowableRentalRate: nextAllowableRate,
        reminderDate: reminderDate.toISOString().split('T')[0]
      });
      
      // Also create a history entry for the initial rate
      await storage.createRentalRateHistory({
        propertyAddress: data.propertyAddress,
        increaseDate: data.startDate,
        previousRate: 0, // No previous rate for initial entry
        newRate: data.initialRentalRate,
        notes: "Initial rental rate"
      });
      
      res.status(201).json(increase);
    } catch (err) {
      res.status(400).json(handleZodError(err));
    }
  });

  app.put("/api/rental-increases/:address", async (req, res) => {
    try {
      const address = decodeURIComponent(req.params.address);
      const increaseData = insertRentalRateIncreaseSchema.partial().parse(req.body);
      
      const updatedIncrease = await storage.updateRentalRateIncrease(address, increaseData);
      
      if (!updatedIncrease) {
        return res.status(404).json({ message: "Rental rate increase not found" });
      }
      
      res.json(updatedIncrease);
    } catch (err) {
      res.status(400).json(handleZodError(err));
    }
  });

  // Rental Rate History routes
  app.get("/api/rental-history/:address", async (req, res) => {
    try {
      const address = decodeURIComponent(req.params.address);
      const history = await storage.getRentalRateHistory(address);
      res.json(history);
    } catch (err) {
      res.status(500).json(handleZodError(err));
    }
  });

  app.post("/api/rental-history", async (req, res) => {
    try {
      const historyData = insertRentalRateHistorySchema.parse(req.body);
      const history = await storage.createRentalRateHistory(historyData);
      res.status(201).json(history);
    } catch (err) {
      res.status(400).json(handleZodError(err));
    }
  });

  // Reminder routes
  app.get("/api/reminders/rental-increases", async (req, res) => {
    try {
      const month = req.query.month ? parseInt(req.query.month as string, 10) : undefined;
      const minMonths = req.query.minMonths ? parseInt(req.query.minMonths as string, 10) : undefined;
      
      const reminders = await storage.getRentalIncreaseReminders(month, minMonths);
      res.json(reminders);
    } catch (err) {
      res.status(500).json(handleZodError(err));
    }
  });

  app.get("/api/reminders/birthdays", async (req, res) => {
    try {
      const month = req.query.month ? parseInt(req.query.month as string, 10) : undefined;
      const reminders = await storage.getBirthdayReminders(month);
      res.json(reminders);
    } catch (err) {
      res.status(500).json(handleZodError(err));
    }
  });

  // Process a rental increase
  app.post("/api/process-rental-increase", async (req, res) => {
    try {
      const schema = z.object({
        propertyAddress: z.string(),
        increaseDate: z.string().transform(val => new Date(val)),
        newRate: z.number().positive(),
        notes: z.string().optional(),
      });
      
      const data = schema.parse(req.body);
      
      const result = await storage.processRentalIncrease(
        data.propertyAddress,
        data.increaseDate,
        data.newRate,
        data.notes
      );
      
      res.status(200).json(result);
    } catch (err) {
      res.status(400).json(handleZodError(err));
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
