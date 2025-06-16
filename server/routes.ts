import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, requireRole } from "./replitAuth";
import { z } from "zod";
import { 
  insertLandlordSchema, 
  insertLandlordOwnerSchema, 
  insertTenantSchema, 
  insertRentalRateIncreaseSchema,
  insertRentalRateHistorySchema,
  insertUserSchema,
  updateUserSchema
} from "@shared/schema";
import { fromZodError } from "zod-validation-error";


export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Registration route - allows users to request access
  app.post('/api/auth/register', async (req, res) => {
    try {
      const { firstName, lastName, email } = req.body;
      
      if (!firstName || !lastName || !email) {
        return res.status(400).json({ message: "First name, last name, and email are required" });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        if (existingUser.status === 'pending') {
          return res.status(400).json({ 
            message: "A registration request with this email is already pending approval." 
          });
        } else {
          return res.status(400).json({ 
            message: "An account with this email already exists. Please sign in instead." 
          });
        }
      }

      // Create a pending user registration
      const registrationData = {
        id: `pending_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // Temporary ID for pending users
        email,
        firstName,
        lastName,
        role: "read_only" as const,
        status: "pending" as const,
        createdBy: "self-registration",
      };

      await storage.createUser(registrationData);

      res.json({ 
        message: "Registration submitted successfully. Please wait for administrator approval.",
        status: "pending" 
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Failed to submit registration" });
    }
  });

  // User management routes (Super Admin only)
  app.get('/api/users', requireRole('super_admin'), async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.post('/api/users', requireRole('super_admin'), async (req: any, res) => {
    try {
      console.log("Creating user with data:", req.body);
      const result = insertUserSchema.safeParse(req.body);
      if (!result.success) {
        console.log("Validation failed:", result.error);
        return res.status(400).json({ message: fromZodError(result.error).message });
      }
      
      const user = await storage.createUser({
        ...result.data,
        createdBy: req.currentUser?.id || "system"
      });
      res.json(user);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  app.patch('/api/users/:id', requireRole('super_admin'), async (req: any, res) => {
    try {
      const result = updateUserSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: fromZodError(result.error) });
      }
      
      const user = await storage.updateUser(req.params.id, result.data);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.delete('/api/users/:id', requireRole('super_admin'), async (req, res) => {
    try {
      const success = await storage.deactivateUser(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deactivating user:", error);
      res.status(500).json({ message: "Failed to deactivate user" });
    }
  });

  // Approve pending user registration
  app.post('/api/users/:id/approve', requireRole('super_admin'), async (req: any, res) => {
    try {
      const { role = 'read_only' } = req.body;
      
      const user = await storage.updateUser(req.params.id, {
        status: 'active',
        role: role,
      });

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      await storage.logUserAction({
        actionType: 'approved',
        targetUserId: req.params.id,
        performedBy: req.currentUser?.id || "system",
        details: { previousStatus: 'pending', newStatus: 'active', role }
      });

      res.json({ message: "User approved successfully", user });
    } catch (error) {
      console.error("Error approving user:", error);
      res.status(500).json({ message: "Failed to approve user" });
    }
  });

  // Reject pending user registration
  app.post('/api/users/:id/reject', requireRole('super_admin'), async (req: any, res) => {
    try {
      // Get user first to check if they exist and are pending
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (user.status !== 'pending') {
        return res.status(400).json({ message: "Only pending registrations can be rejected" });
      }

      // Delete the pending user completely instead of deactivating
      const success = await storage.deleteUser(req.params.id);
      
      if (!success) {
        return res.status(500).json({ message: "Failed to reject user registration" });
      }

      await storage.logUserAction({
        actionType: 'rejected',
        targetUserId: req.params.id,
        performedBy: req.currentUser?.id || "system",
        details: { previousStatus: 'pending', action: 'rejected', email: user.email }
      });

      res.json({ message: "User registration rejected successfully" });
    } catch (error) {
      console.error("Error rejecting user:", error);
      res.status(500).json({ message: "Failed to reject user" });
    }
  });

  // Update user role
  app.patch('/api/users/:id/role', requireRole('super_admin'), async (req: any, res) => {
    try {
      const { role } = req.body;
      
      if (!role || !['read_only', 'standard', 'admin', 'super_admin'].includes(role)) {
        return res.status(400).json({ message: "Invalid role specified" });
      }

      const user = await storage.updateUser(req.params.id, { role });
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      await storage.logUserAction({
        actionType: 'role_updated',
        targetUserId: req.params.id,
        performedBy: req.currentUser?.id || "system",
        details: { newRole: role, previousRole: user.role }
      });

      res.json({ message: "User role updated successfully", user });
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Failed to update user role" });
    }
  });

  app.get('/api/audit-log', requireRole('admin'), async (req, res) => {
    try {
      const userId = req.query.userId as string;
      const auditLog = await storage.getUserAuditLog(userId);
      res.json(auditLog);
    } catch (error) {
      console.error("Error fetching audit log:", error);
      res.status(500).json({ message: "Failed to fetch audit log" });
    }
  });

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
      console.log(`API call for property: ${address}`);
      const property = await storage.getPropertyDetailsByAddress(address);
      
      if (!property) {
        console.log(`Property not found: ${address}`);
        return res.status(404).json({ message: "Property not found" });
      }
      
      console.log(`Returning property data for ${address}:`, {
        hasTenant: !!(property.tenant && !property.tenant.moveOutDate),
        tenantName: property.tenant?.name,
        hasRentalInfo: !!property.rentalInfo
      });
      console.log("Full property object being sent:", JSON.stringify(property, null, 2));
      
      // Prevent caching to ensure fresh data
      res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');
      
      res.json(property);
    } catch (err) {
      console.error(`Error fetching property ${req.params.address}:`, err);
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
  // Property-based tenant update (handles multiple tenants)
  app.put("/api/tenants/property/:address", async (req, res) => {
    try {
      console.log("Multiple tenants update by property address endpoint called");
      const address = decodeURIComponent(req.params.address);
      console.log(`Handling tenants for address: ${address}`);
      
      // Accept the new schema with multiple tenants
      const multiTenantSchema = z.object({
        propertyAddress: z.string(),
        serviceType: z.string(),
        tenants: z.array(
          z.object({
            id: z.number().optional(),
            name: z.string(),
            contactNumber: z.string().optional(),
            email: z.string().optional(),
            birthday: z.string().optional(),
            moveInDate: z.string(),
            moveOutDate: z.string().optional(),
            isPrimary: z.boolean().default(false)
          })
        )
      });
      
      const data = multiTenantSchema.parse(req.body);
      console.log("Validated tenant data:", data);
      
      // Process each tenant individually
      const results = [];
      
      for (const tenant of data.tenants) {
        const tenantData = {
          propertyAddress: data.propertyAddress,
          serviceType: data.serviceType, // Service type from the property
          name: tenant.name,
          contactNumber: tenant.contactNumber,
          email: tenant.email,
          birthday: tenant.birthday,
          moveInDate: tenant.moveInDate,
          moveOutDate: tenant.moveOutDate,
          isPrimary: tenant.isPrimary
        };
        
        // If tenant has ID, update it, otherwise create new
        if (tenant.id) {
          console.log(`Updating existing tenant with ID: ${tenant.id}`);
          const updatedTenant = await storage.updateTenant(tenant.id, tenantData);
          if (updatedTenant) {
            results.push(updatedTenant);
          }
        } else {
          console.log(`Creating new tenant for property ${data.propertyAddress}`);
          const newTenant = await storage.createTenant(tenantData);
          results.push(newTenant);
        }
      }
      
      if (results.length === 0) {
        return res.status(404).json({ message: "No tenants were updated or created" });
      }
      
      console.log(`Successfully updated/created ${results.length} tenants`);
      res.json(results);
    } catch (err) {
      console.error("Error updating tenants by address:", err);
      res.status(400).json(handleZodError(err));
    }
  });

  // These more generic routes must come after specific ones
  app.get("/api/tenants/:address", async (req, res) => {
    try {
      const address = decodeURIComponent(req.params.address);
      const tenants = await storage.getTenantsByPropertyAddress(address);
      
      if (!tenants || tenants.length === 0) {
        return res.status(404).json({ message: "No tenants found for this property" });
      }
      
      res.json(tenants);
    } catch (err) {
      res.status(500).json(handleZodError(err));
    }
  });

  app.post("/api/tenants", async (req, res) => {
    try {
      console.log("Creating new tenants");
      
      // Accept the new schema with multiple tenants
      const multiTenantSchema = z.object({
        propertyAddress: z.string(),
        serviceType: z.string(),
        tenants: z.array(
          z.object({
            name: z.string(),
            contactNumber: z.string().optional(),
            email: z.string().optional(),
            birthday: z.string().optional(),
            moveInDate: z.string(),
            moveOutDate: z.string().optional(),
            isPrimary: z.boolean().default(false)
          })
        )
      });
      
      const data = multiTenantSchema.parse(req.body);
      console.log("Validated new tenant data:", data);
      
      // Process each tenant individually
      const results = [];
      
      for (const tenant of data.tenants) {
        const tenantData = {
          propertyAddress: data.propertyAddress,
          serviceType: data.serviceType, // Make sure service type is included
          name: tenant.name,
          contactNumber: tenant.contactNumber,
          email: tenant.email,
          birthday: tenant.birthday,
          moveInDate: tenant.moveInDate,
          moveOutDate: tenant.moveOutDate,
          isPrimary: tenant.isPrimary
        };
        
        console.log(`Creating new tenant for property ${data.propertyAddress}`);
        const newTenant = await storage.createTenant(tenantData);
        results.push(newTenant);
      }
      
      res.status(201).json(results);
    } catch (err) {
      console.error("Error creating tenants:", err);
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
    console.log("=== INITIAL RENTAL RATE ENDPOINT HIT ===");
    console.log("Request body:", req.body);
    
    // Simply bypass the existing rental check entirely for initial rates
    try {
      // Validate request body with a custom schema
      const initialRateSchema = z.object({
        propertyAddress: z.string(),
        initialRentalRate: z.number().positive("Rental rate must be a positive number"),
        startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
      });
      
      const data = initialRateSchema.parse(req.body);
      
      // Get existing rental info to decide whether to create or update
      const existingIncrease = await storage.getRentalRateIncreaseByPropertyAddress(data.propertyAddress);
      console.log("Existing rental data:", existingIncrease ? "Found" : "Not found");
      
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
      
      // For new tenants, we need to either create or update the rental rate record
      let increase;
      if (existingIncrease) {
        // Update the existing record with new tenant's information
        console.log("UPDATING existing rental record for new tenant");
        increase = await storage.updateRentalRateIncrease(data.propertyAddress, {
          latestRateIncreaseDate: data.startDate,
          latestRentalRate: data.initialRentalRate,
          nextAllowableRentalIncreaseDate: nextAllowableDate.toISOString().split('T')[0],
          nextAllowableRentalRate: nextAllowableRate,
          reminderDate: reminderDate.toISOString().split('T')[0]
        });
      } else {
        // Create new rental rate record
        console.log("CREATING new rental record");
        increase = await storage.createRentalRateIncrease({
          propertyAddress: data.propertyAddress,
          latestRateIncreaseDate: data.startDate,
          latestRentalRate: data.initialRentalRate,
          nextAllowableRentalIncreaseDate: nextAllowableDate.toISOString().split('T')[0],
          nextAllowableRentalRate: nextAllowableRate,
          reminderDate: reminderDate.toISOString().split('T')[0]
        });
      }
      
      // Get tenant information to include in the history entry
      const tenant = await storage.getTenantByPropertyAddress(data.propertyAddress);
      const tenantName = tenant ? tenant.name : "No tenant";
      
      // Create a history entry for the initial rate with tenant information
      await storage.createRentalRateHistory({
        propertyAddress: data.propertyAddress,
        increaseDate: data.startDate,
        previousRate: 0, // No previous rate for initial entry
        newRate: data.initialRentalRate,
        notes: `Initial rental rate - Current tenant: ${tenantName}`
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
      
      // We've moved the update logic to the createRentalRateHistory method
      // This ensures the rental rate increases table is always updated correctly
      // and that the overview tab and Edit Rate dialog show the latest information
      
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
