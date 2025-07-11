import { db } from "./db";
import { eq, and, isNull, desc, not as notOp, or, sql } from "drizzle-orm";
import { format, addMonths, addDays } from "date-fns";
import { 
  landlords,
  landlordOwners,
  tenants,
  rentalRateIncreases,
  rentalRateHistory,
  users,
  userAuditLog,
  type Landlord,
  type LandlordOwner,
  type Tenant,
  type RentalRateIncrease,
  type RentalRateHistory,
  type InsertLandlord,
  type InsertLandlordOwner,
  type InsertTenant,
  type InsertRentalRateIncrease,
  type InsertRentalRateHistory,
  type PropertyWithDetails,
  type User,
  type UpsertUser,
  type InsertUser,
  type UpdateUser,
  type UserAuditLog,
  type InsertUserAuditLog
} from "@shared/schema";

export interface IStorage {
  // User operations (for authentication)
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserLastLogin(id: string): Promise<void>;
  getAllUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: UpdateUser): Promise<User | undefined>;
  deactivateUser(id: string): Promise<boolean>;
  deleteUser(id: string): Promise<boolean>;
  logUserAction(action: InsertUserAuditLog): Promise<void>;
  getUserAuditLog(userId?: string): Promise<UserAuditLog[]>;
  
  // Landlord operations
  getLandlords(): Promise<Landlord[]>;
  getLandlordByPropertyAddress(propertyAddress: string): Promise<Landlord | undefined>;
  createLandlord(landlord: InsertLandlord): Promise<Landlord>;
  updateLandlord(propertyAddress: string, landlord: Partial<InsertLandlord>): Promise<Landlord | undefined>;
  deleteLandlord(propertyAddress: string): Promise<boolean>;
  
  // Landlord Owner operations
  getLandlordOwners(landlordId: number): Promise<LandlordOwner[]>;
  createLandlordOwner(owner: InsertLandlordOwner): Promise<LandlordOwner>;
  updateLandlordOwner(id: number, owner: Partial<InsertLandlordOwner>): Promise<LandlordOwner | undefined>;
  deleteLandlordOwner(id: number): Promise<boolean>;
  
  // Tenant operations
  getTenants(): Promise<Tenant[]>;
  getTenantByPropertyAddress(propertyAddress: string): Promise<Tenant | undefined>;
  getTenantsByPropertyAddress(propertyAddress: string): Promise<Tenant[]>; // Added for multiple tenants
  createTenant(tenant: InsertTenant): Promise<Tenant>;
  updateTenant(id: number, tenant: Partial<InsertTenant>): Promise<Tenant | undefined>;
  deleteTenant(id: number): Promise<boolean>;
  
  // Rental Rate Increase operations
  getRentalRateIncreases(): Promise<RentalRateIncrease[]>;
  getRentalRateIncreaseByPropertyAddress(propertyAddress: string): Promise<RentalRateIncrease | undefined>;
  createRentalRateIncrease(increase: InsertRentalRateIncrease): Promise<RentalRateIncrease>;
  updateRentalRateIncrease(propertyAddress: string, increase: Partial<InsertRentalRateIncrease>): Promise<RentalRateIncrease | undefined>;
  
  // Rental Rate History operations
  getRentalRateHistory(propertyAddress: string): Promise<RentalRateHistory[]>;
  createRentalRateHistory(history: InsertRentalRateHistory): Promise<RentalRateHistory>;
  
  // Combined operations
  getPropertiesWithDetails(): Promise<PropertyWithDetails[]>;
  getPropertyDetailsByAddress(propertyAddress: string): Promise<PropertyWithDetails | undefined>;
  
  // Reminder operations
  getRentalIncreaseReminders(month?: number, minMonthsSinceIncrease?: number): Promise<any[]>;
  getBirthdayReminders(month?: number): Promise<any[]>;
  
  // Process a new rental increase
  processRentalIncrease(
    propertyAddress: string, 
    increaseDate: Date, 
    newRate: number, 
    notes?: string
  ): Promise<RentalRateIncrease>;
}

// Database implementation
export class DatabaseStorage implements IStorage {
  
  // === USER OPERATIONS (AUTHENTICATION) ===
  
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    // Case-insensitive email lookup to handle Microsoft OAuth case variations
    const [user] = await db.select().from(users).where(sql`LOWER(${users.email}) = LOWER(${email})`);
    return user || undefined;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUserLastLogin(id: string): Promise<void> {
    await db
      .update(users)
      .set({ lastLoginAt: new Date() })
      .where(eq(users.id, id));
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
    
    // Log the user creation
    await this.logUserAction({
      actionType: "created",
      targetUserId: user.id,
      performedBy: userData.createdBy || "system",
      details: { role: user.role, email: user.email }
    });
    
    return user;
  }

  async updateUser(id: string, updates: UpdateUser): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    
    if (user) {
      await this.logUserAction({
        actionType: "updated",
        targetUserId: id,
        performedBy: "system", 
        details: updates
      });
    }
    
    return user || undefined;
  }

  async deactivateUser(id: string): Promise<boolean> {
    const [user] = await db
      .update(users)
      .set({ status: "inactive", updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    
    if (user) {
      await this.logUserAction({
        actionType: "deactivated",
        targetUserId: id,
        performedBy: "system",
        details: { previousStatus: "active" }
      });
      return true;
    }
    
    return false;
  }

  async deleteUser(id: string): Promise<boolean> {
    const [user] = await db
      .delete(users)
      .where(eq(users.id, id))
      .returning();
    
    return !!user;
  }

  async logUserAction(action: InsertUserAuditLog): Promise<void> {
    await db.insert(userAuditLog).values(action);
  }

  async getUserAuditLog(userId?: string): Promise<UserAuditLog[]> {
    const query = db.select().from(userAuditLog).orderBy(desc(userAuditLog.timestamp));
    
    if (userId) {
      return await query.where(eq(userAuditLog.targetUserId, userId));
    }
    
    return await query;
  }

  // === LANDLORD OPERATIONS ===
  
  async getLandlords(): Promise<Landlord[]> {
    return await db.select().from(landlords);
  }

  async getLandlordByPropertyAddress(propertyAddress: string): Promise<Landlord | undefined> {
    const [landlord] = await db
      .select()
      .from(landlords)
      .where(eq(landlords.propertyAddress, propertyAddress));
    return landlord || undefined;
  }

  async createLandlord(landlordData: InsertLandlord): Promise<Landlord> {
    const [newLandlord] = await db
      .insert(landlords)
      .values(landlordData)
      .returning();
    return newLandlord;
  }

  async updateLandlord(propertyAddress: string, landlordData: Partial<InsertLandlord>): Promise<Landlord | undefined> {
    const [updatedLandlord] = await db
      .update(landlords)
      .set(landlordData)
      .where(eq(landlords.propertyAddress, propertyAddress))
      .returning();
    return updatedLandlord || undefined;
  }

  async deleteLandlord(propertyAddress: string): Promise<boolean> {
    const [deleted] = await db
      .delete(landlords)
      .where(eq(landlords.propertyAddress, propertyAddress))
      .returning({ id: landlords.id });
    return !!deleted;
  }

  // Landlord Owner operations
  async getLandlordOwners(landlordId: number): Promise<LandlordOwner[]> {
    return await db
      .select()
      .from(landlordOwners)
      .where(eq(landlordOwners.landlordId, landlordId));
  }

  async createLandlordOwner(ownerData: InsertLandlordOwner): Promise<LandlordOwner> {
    // Import normalize function directly to prevent circular dependencies
    const { normalizeDate } = await import('./date-utils');
    
    // Make a copy of the data to avoid modifying the original
    const safeData = {...ownerData};
    
    // Handle date fields - normalize before storing in db
    if (safeData.birthday) {
      // Cast to any to allow assignment, then the db typing will handle it correctly
      (safeData as any).birthday = normalizeDate(safeData.birthday);
    }
    
    const [newOwner] = await db
      .insert(landlordOwners)
      .values(safeData)
      .returning();
    
    return newOwner;
  }

  async updateLandlordOwner(id: number, ownerData: Partial<InsertLandlordOwner>): Promise<LandlordOwner | undefined> {
    // Import normalize function directly to prevent circular dependencies
    const { normalizeDate } = await import('./date-utils');
    
    // Make a copy of the data to avoid modifying the original
    const safeData = {...ownerData};
    
    // Handle date fields - normalize before storing in db
    if (safeData.birthday) {
      // Cast to any to allow assignment, then the db typing will handle it correctly
      (safeData as any).birthday = normalizeDate(safeData.birthday);
    }
    
    const [updatedOwner] = await db
      .update(landlordOwners)
      .set(safeData)
      .where(eq(landlordOwners.id, id))
      .returning();
    return updatedOwner || undefined;
  }

  async deleteLandlordOwner(id: number): Promise<boolean> {
    const [deleted] = await db
      .delete(landlordOwners)
      .where(eq(landlordOwners.id, id))
      .returning({ id: landlordOwners.id });
    return !!deleted;
  }

  // Tenant operations
  async getTenants(): Promise<Tenant[]> {
    return await db
      .select()
      .from(tenants);
  }

  async getTenantByPropertyAddress(propertyAddress: string): Promise<Tenant | undefined> {
    // Try to find primary tenant first
    const [primaryTenant] = await db
      .select()
      .from(tenants)
      .where(and(
        eq(tenants.propertyAddress, propertyAddress),
        eq(tenants.isPrimary, true),
        isNull(tenants.moveOutDate)
      ));
    
    if (primaryTenant) return primaryTenant;
    
    // If no primary tenant, return any active tenant
    const [tenant] = await db
      .select()
      .from(tenants)
      .where(and(
        eq(tenants.propertyAddress, propertyAddress),
        isNull(tenants.moveOutDate)
      ));
    
    return tenant || undefined;
  }
  
  async getTenantsByPropertyAddress(propertyAddress: string): Promise<Tenant[]> {
    return await db
      .select()
      .from(tenants)
      .where(eq(tenants.propertyAddress, propertyAddress))
      .orderBy(desc(tenants.isPrimary)); // Primary tenants first
  }

  async createTenant(tenantData: InsertTenant): Promise<Tenant> {
    // Import normalize function directly to prevent circular dependencies
    const { normalizeDate } = await import('./date-utils');
    
    // Make a copy of the data to avoid modifying the original
    const safeData = {...tenantData};
    
    // Handle date fields - normalize before storing in db
    if (safeData.birthday) {
      // Cast to any to allow assignment, then the db typing will handle it correctly
      (safeData as any).birthday = normalizeDate(safeData.birthday);
    }
    
    if (safeData.moveInDate) {
      (safeData as any).moveInDate = normalizeDate(safeData.moveInDate);
    }
    
    if (safeData.moveOutDate) {
      (safeData as any).moveOutDate = normalizeDate(safeData.moveOutDate);
    }
    
    const [newTenant] = await db
      .insert(tenants)
      .values(safeData)
      .returning();
    return newTenant;
  }

  async updateTenant(id: number, tenantData: Partial<InsertTenant>): Promise<Tenant | undefined> {
    // Import normalize function directly to prevent circular dependencies
    const { normalizeDate } = await import('./date-utils');
    
    // Make a copy of the data to avoid modifying the original
    const safeData = {...tenantData};
    
    // Handle date fields - normalize before storing in db
    if (safeData.birthday) {
      // Cast to any to allow assignment, then the db typing will handle it correctly
      (safeData as any).birthday = normalizeDate(safeData.birthday);
    }
    
    if (safeData.moveInDate) {
      (safeData as any).moveInDate = normalizeDate(safeData.moveInDate);
    }
    
    if (safeData.moveOutDate) {
      (safeData as any).moveOutDate = normalizeDate(safeData.moveOutDate);
    }
    
    const [updatedTenant] = await db
      .update(tenants)
      .set(safeData)
      .where(eq(tenants.id, id))
      .returning();
    return updatedTenant || undefined;
  }

  async deleteTenant(id: number): Promise<boolean> {
    const [deleted] = await db
      .delete(tenants)
      .where(eq(tenants.id, id))
      .returning({ id: tenants.id });
    return !!deleted;
  }

  // Rental Rate Increase operations
  async getRentalRateIncreases(): Promise<RentalRateIncrease[]> {
    return await db
      .select()
      .from(rentalRateIncreases);
  }

  async getRentalRateIncreaseByPropertyAddress(propertyAddress: string): Promise<RentalRateIncrease | undefined> {
    const [increase] = await db
      .select()
      .from(rentalRateIncreases)
      .where(eq(rentalRateIncreases.propertyAddress, propertyAddress));
    return increase || undefined;
  }

  async createRentalRateIncrease(increaseData: InsertRentalRateIncrease): Promise<RentalRateIncrease> {
    const [newIncrease] = await db
      .insert(rentalRateIncreases)
      .values(increaseData)
      .returning();
    return newIncrease;
  }

  async updateRentalRateIncrease(propertyAddress: string, increaseData: Partial<InsertRentalRateIncrease>): Promise<RentalRateIncrease | undefined> {
    const [updatedIncrease] = await db
      .update(rentalRateIncreases)
      .set(increaseData)
      .where(eq(rentalRateIncreases.propertyAddress, propertyAddress))
      .returning();
    return updatedIncrease || undefined;
  }

  // Rental Rate History operations
  async getRentalRateHistory(propertyAddress: string): Promise<RentalRateHistory[]> {
    return await db
      .select()
      .from(rentalRateHistory)
      .where(eq(rentalRateHistory.propertyAddress, propertyAddress))
      .orderBy(desc(rentalRateHistory.increaseDate));
  }

  async createRentalRateHistory(historyData: InsertRentalRateHistory): Promise<RentalRateHistory> {
    // Import normalize function directly to prevent circular dependencies
    const { normalizeDate } = await import('./date-utils');
    
    // Make a copy of the data to avoid modifying the original
    const safeData = {...historyData};
    
    // Handle date fields - normalize before storing in db
    if (safeData.increaseDate) {
      // Cast to any to allow assignment, then the db typing will handle it correctly
      (safeData as any).increaseDate = normalizeDate(safeData.increaseDate);
    }
    
    const [newHistory] = await db
      .insert(rentalRateHistory)
      .values(safeData)
      .returning();
    
    // After creating a rental history entry, we need to update the rental increase record
    // to keep the overview tab and edit rate dialog in sync
    const increaseDate = new Date(safeData.increaseDate);
    
    // Calculate next allowable date (1 year from current date)
    const nextAllowableDate = new Date(increaseDate);
    nextAllowableDate.setFullYear(nextAllowableDate.getFullYear() + 1);
    
    // Calculate reminder date (8 months from current date)
    const reminderDate = new Date(increaseDate);
    reminderDate.setMonth(reminderDate.getMonth() + 8);
    
    // Calculate next allowable rate (3% increase)
    const nextAllowableRate = safeData.newRate * 1.03;
    
    // Update the rental rate increase record
    const [existingIncrease] = await db
      .select()
      .from(rentalRateIncreases)
      .where(eq(rentalRateIncreases.propertyAddress, safeData.propertyAddress));
    
    // Format dates as strings for database storage
    const formattedIncreaseDate = increaseDate.toISOString().split('T')[0];
    const formattedNextAllowableDate = nextAllowableDate.toISOString().split('T')[0];
    const formattedReminderDate = reminderDate.toISOString().split('T')[0];
    
    if (existingIncrease) {
      await db
        .update(rentalRateIncreases)
        .set({
          latestRateIncreaseDate: formattedIncreaseDate,
          latestRentalRate: safeData.newRate,
          nextAllowableRentalIncreaseDate: formattedNextAllowableDate,
          nextAllowableRentalRate: nextAllowableRate,
          reminderDate: formattedReminderDate
        })
        .where(eq(rentalRateIncreases.propertyAddress, safeData.propertyAddress));
    } else {
      // If no record exists, create one
      await db
        .insert(rentalRateIncreases)
        .values({
          propertyAddress: safeData.propertyAddress,
          latestRateIncreaseDate: formattedIncreaseDate,
          latestRentalRate: safeData.newRate,
          nextAllowableRentalIncreaseDate: formattedNextAllowableDate,
          nextAllowableRentalRate: nextAllowableRate,
          reminderDate: formattedReminderDate
        });
    }
    
    return newHistory;
  }

  // Combined operations
  async getPropertiesWithDetails(): Promise<PropertyWithDetails[]> {
    const properties = await db.select().from(landlords);
    
    const result: PropertyWithDetails[] = [];
    
    for (const property of properties) {
      const owners = await db
        .select()
        .from(landlordOwners)
        .where(eq(landlordOwners.landlordId, property.id));
        
      // Get all tenants for this property
      const allTenants = await db
        .select()
        .from(tenants)
        .where(eq(tenants.propertyAddress, property.propertyAddress))
        .orderBy(desc(tenants.moveInDate));
      
      // Get current active tenant (without moveOutDate) only
      const activeTenants = allTenants.filter(t => !t.moveOutDate);
      const tenant = activeTenants.length > 0 ? activeTenants[0] : undefined;
        
      const [rentalIncrease] = await db
        .select()
        .from(rentalRateIncreases)
        .where(eq(rentalRateIncreases.propertyAddress, property.propertyAddress));
        
      const propertyDetails: PropertyWithDetails = {
        propertyAddress: property.propertyAddress,
        keyNumber: property.keyNumber,
        strataContactNumber: property.strataContactNumber || undefined,
        strataManagementCompany: property.strataManagementCompany || undefined,
        strataContactPerson: property.strataContactPerson || undefined,
        serviceType: property.serviceType || tenant?.serviceType || '',
        landlordOwners: owners.map(owner => ({
          name: owner.name,
          contactNumber: owner.contactNumber || undefined,
          birthday: owner.birthday ? new Date(owner.birthday) : undefined,
          residentialAddress: owner.residentialAddress || undefined
        }))
      };
      
      if (tenant) {
        propertyDetails.tenant = {
          id: tenant.id,
          name: tenant.name,
          contactNumber: tenant.contactNumber || undefined,
          email: tenant.email || undefined,
          birthday: tenant.birthday ? new Date(tenant.birthday) : undefined,
          moveInDate: new Date(tenant.moveInDate),
          moveOutDate: tenant.moveOutDate ? new Date(tenant.moveOutDate) : undefined
        };
      }
      
      // Add all active tenants (co-tenants)
      if (activeTenants.length > 0) {
        propertyDetails.activeTenants = activeTenants.map(t => ({
          id: t.id,
          name: t.name,
          contactNumber: t.contactNumber || undefined,
          email: t.email || undefined,
          birthday: t.birthday ? new Date(t.birthday) : undefined,
          moveInDate: new Date(t.moveInDate),
          moveOutDate: t.moveOutDate ? new Date(t.moveOutDate) : undefined
        }));
      }
      
      if (rentalIncrease) {
        propertyDetails.rentalInfo = {
          latestRentalRate: rentalIncrease.latestRentalRate,
          latestRateIncreaseDate: new Date(rentalIncrease.latestRateIncreaseDate),
          nextAllowableRentalIncreaseDate: new Date(rentalIncrease.nextAllowableRentalIncreaseDate),
          nextAllowableRentalRate: rentalIncrease.nextAllowableRentalRate,
          reminderDate: new Date(rentalIncrease.reminderDate)
        };
      }
      
      result.push(propertyDetails);
    }
    
    return result;
  }

  async getPropertyDetailsByAddress(propertyAddress: string): Promise<PropertyWithDetails | undefined> {
    const [property] = await db
      .select()
      .from(landlords)
      .where(eq(landlords.propertyAddress, propertyAddress));
      
    if (!property) return undefined;
    
    const owners = await db
      .select()
      .from(landlordOwners)
      .where(eq(landlordOwners.landlordId, property.id));
      
    // Get ALL tenants for this property (both current and past)
    const allTenants = await db
      .select()
      .from(tenants)
      .where(eq(tenants.propertyAddress, propertyAddress))
      .orderBy(desc(tenants.moveInDate));
    
    // The current active tenant (without moveOutDate) or the most recent one
    const activeTenants = allTenants.filter(t => !t.moveOutDate);
    const tenant = activeTenants.length > 0 ? activeTenants[0] : undefined;
    
    // Debug: Log tenant detection
    console.log(`Property ${propertyAddress} - All tenants:`, allTenants.length);
    console.log('Active tenants:', activeTenants.length);
    console.log('Selected tenant:', tenant ? tenant.name : 'none');
      
    const [rentalIncrease] = await db
      .select()
      .from(rentalRateIncreases)
      .where(eq(rentalRateIncreases.propertyAddress, propertyAddress));
      
    const propertyDetails: PropertyWithDetails = {
      propertyAddress: property.propertyAddress,
      keyNumber: property.keyNumber,
      strataContactNumber: property.strataContactNumber || undefined,
      strataManagementCompany: property.strataManagementCompany || undefined,
      strataContactPerson: property.strataContactPerson || undefined,
      serviceType: property.serviceType || tenant?.serviceType || '',
      landlordOwners: owners.map(owner => ({
        name: owner.name,
        contactNumber: owner.contactNumber || undefined,
        birthday: owner.birthday ? new Date(owner.birthday) : undefined,
        residentialAddress: owner.residentialAddress || undefined
      }))
    };
    
    // Add current active tenant (primary tenant for backwards compatibility)
    if (tenant) {
      propertyDetails.tenant = {
        id: tenant.id,
        name: tenant.name,
        contactNumber: tenant.contactNumber || undefined,
        email: tenant.email || undefined,
        birthday: tenant.birthday ? new Date(tenant.birthday) : undefined,
        moveInDate: new Date(tenant.moveInDate),
        moveOutDate: tenant.moveOutDate ? new Date(tenant.moveOutDate) : undefined
      };
    }
    
    // Add all active tenants (co-tenants)
    if (activeTenants.length > 0) {
      propertyDetails.activeTenants = activeTenants.map(t => ({
        id: t.id,
        name: t.name,
        contactNumber: t.contactNumber || undefined,
        email: t.email || undefined,
        birthday: t.birthday ? new Date(t.birthday) : undefined,
        moveInDate: new Date(t.moveInDate),
        moveOutDate: t.moveOutDate ? new Date(t.moveOutDate) : undefined
      }));
    }
    
    // Add tenant history (all tenants including past ones)
    propertyDetails.tenantHistory = allTenants.map(t => ({
      id: t.id,
      name: t.name,
      contactNumber: t.contactNumber || undefined,
      email: t.email || undefined,
      birthday: t.birthday ? new Date(t.birthday) : undefined,
      moveInDate: new Date(t.moveInDate),
      moveOutDate: t.moveOutDate ? new Date(t.moveOutDate) : undefined,
      serviceType: t.serviceType
    }));
    
    // For new tenants like Kiki, don't show old rental info from previous tenants
    console.log("=== RENTAL INFO LOGIC ===");
    console.log("Has rental increase:", !!rentalIncrease);
    console.log("Has tenant:", !!tenant);
    console.log("Tenant has moveOutDate:", tenant?.moveOutDate);
    
    if (rentalIncrease && tenant && !tenant.moveOutDate) {
      const tenantMoveInDate = new Date(tenant.moveInDate);
      const rateIncreaseDate = new Date(rentalIncrease.latestRateIncreaseDate);
      
      console.log("Tenant move-in date:", tenantMoveInDate.toISOString());
      console.log("Rate increase date:", rateIncreaseDate.toISOString());
      console.log("Rate is after move-in:", rateIncreaseDate >= tenantMoveInDate);
      
      // Only include rental info if it was set after the current tenant moved in
      if (rateIncreaseDate >= tenantMoveInDate) {
        console.log("Including rental info for current tenant");
        propertyDetails.rentalInfo = {
          latestRentalRate: rentalIncrease.latestRentalRate,
          latestRateIncreaseDate: new Date(rentalIncrease.latestRateIncreaseDate),
          nextAllowableRentalIncreaseDate: new Date(rentalIncrease.nextAllowableRentalIncreaseDate),
          nextAllowableRentalRate: rentalIncrease.nextAllowableRentalRate,
          reminderDate: new Date(rentalIncrease.reminderDate)
        };
      } else {
        console.log("NOT including rental info - rate is from previous tenant");
      }
    } else {
      console.log("NOT including rental info - missing data or tenant moved out");
    }
    
    return propertyDetails;
  }

  // Reminder operations
  async getRentalIncreaseReminders(month?: number, minMonthsSinceIncrease?: number): Promise<any[]> {
    // Get all rental increases
    const increases = await db.select().from(rentalRateIncreases);
    
    // Filter by month if specified and not zero
    // Month value of 0 means "show all months" (no filtering)
    const filteredIncreases = (month && month > 0) 
      ? increases.filter(increase => {
          const reminderDate = new Date(increase.reminderDate);
          return reminderDate.getMonth() + 1 === month;
        })
      : increases;
    
    // Calculate months since increase for each property
    const result = await Promise.all(filteredIncreases.map(async increase => {
      const increaseDate = new Date(increase.latestRateIncreaseDate);
      const today = new Date();
      const monthsSinceIncrease = 
        (today.getFullYear() - increaseDate.getFullYear()) * 12 + 
        (today.getMonth() - increaseDate.getMonth());
      
      // Filter by minimum months since increase if specified
      if (minMonthsSinceIncrease !== undefined && monthsSinceIncrease < minMonthsSinceIncrease) {
        return null;
      }
      
      // Get tenant info for the service type
      const [tenant] = await db
        .select()
        .from(tenants)
        .where(and(
          eq(tenants.propertyAddress, increase.propertyAddress),
          isNull(tenants.moveOutDate)
        ));
      
      return {
        propertyAddress: increase.propertyAddress,
        serviceType: tenant?.serviceType || 'Unknown',
        latestRateIncreaseDate: increase.latestRateIncreaseDate,
        latestRentalRate: increase.latestRentalRate,
        nextAllowableRentalIncreaseDate: increase.nextAllowableRentalIncreaseDate,
        nextAllowableRentalRate: increase.nextAllowableRentalRate,
        reminderDate: increase.reminderDate,
        monthsSinceIncrease
      };
    }));
    
    // Filter out null values and sort by months since increase (descending)
    return result.filter(item => item !== null)
      .sort((a, b) => (b?.monthsSinceIncrease || 0) - (a?.monthsSinceIncrease || 0));
  }

  async getBirthdayReminders(month?: number): Promise<any[]> {
    // Get all landlord owners with birthdays
    const ownersWithBirthdays = await db
      .select()
      .from(landlordOwners)
      .where(notOp(isNull(landlordOwners.birthday)));
    
    // Get all tenants with birthdays
    const tenantsWithBirthdays = await db
      .select()
      .from(tenants)
      .where(and(
        notOp(isNull(tenants.birthday)),
        isNull(tenants.moveOutDate)
      ));
    
    // Get current month if not specified
    const currentMonth = month || new Date().getMonth() + 1;
    
    // Filter owners by specified month (or current month)
    const filteredOwners = ownersWithBirthdays.filter(owner => {
      if (!owner.birthday) return false;
      const birthday = new Date(owner.birthday);
      return birthday.getMonth() + 1 === currentMonth;
    });
    
    // Filter tenants by specified month (or current month)
    const filteredTenants = tenantsWithBirthdays.filter(tenant => {
      if (!tenant.birthday) return false;
      const birthday = new Date(tenant.birthday);
      return birthday.getMonth() + 1 === currentMonth;
    });
    
    // Format owner birthdays
    const ownerBirthdays = await Promise.all(filteredOwners.map(async owner => {
      const [landlord] = await db
        .select()
        .from(landlords)
        .where(eq(landlords.id, owner.landlordId));
      
      return {
        name: owner.name,
        role: 'Landlord',
        contactNumber: owner.contactNumber || 'N/A',
        birthday: new Date(owner.birthday!),
        propertyAddress: owner.residentialAddress || 'N/A'
      };
    }));
    
    // Format tenant birthdays
    const tenantBirthdays = filteredTenants.map(tenant => ({
      name: tenant.name,
      role: 'Tenant',
      contactNumber: tenant.contactNumber || 'N/A',
      birthday: new Date(tenant.birthday!),
      propertyAddress: tenant.propertyAddress
    }));
    
    // Combine and sort by day of month
    return [...ownerBirthdays, ...tenantBirthdays].sort((a, b) => {
      return a.birthday.getDate() - b.birthday.getDate();
    });
  }

  // Process a new rental increase
  async processRentalIncrease(
    propertyAddress: string, 
    increaseDate: Date, 
    newRate: number, 
    notes?: string
  ): Promise<RentalRateIncrease> {
    // Get current rental rate info
    const [currentRateInfo] = await db
      .select()
      .from(rentalRateIncreases)
      .where(eq(rentalRateIncreases.propertyAddress, propertyAddress));
    
    if (!currentRateInfo) {
      throw new Error("No rental rate information found for this property");
    }
    
    // Calculate next allowable date and rate (12 months from this increase)
    const nextAllowableDate = addMonths(increaseDate, 12);
    const nextAllowableRate = Math.round(newRate * 1.03 * 100) / 100; // 3% increase
    const reminderDate = addDays(addMonths(increaseDate, 8), 0); // 8 months from increase date
    
    // Get tenant information to include in the history entry
    const tenant = await this.getTenantByPropertyAddress(propertyAddress);
    const tenantName = tenant ? tenant.name : "No tenant";
    
    // Get all active tenants for this property at the time of increase
    const activeTenants = await db
      .select()
      .from(tenants)
      .where(
        and(
          eq(tenants.propertyAddress, propertyAddress),
          or(
            isNull(tenants.moveOutDate),
            and(
              notOp(isNull(tenants.moveOutDate)), 
              sql`${tenants.moveOutDate} > ${increaseDate}`
            )
          ),
          sql`${tenants.moveInDate} <= ${increaseDate}`
        )
      )
      .orderBy(desc(tenants.isPrimary));
    
    const tenantsList = activeTenants.length > 0 
      ? activeTenants.map(t => t.name).join(", ") 
      : "No active tenants";
    
    // Record history entry with all tenant information
    await this.createRentalRateHistory({
      propertyAddress,
      increaseDate: format(increaseDate, 'yyyy-MM-dd'),
      previousRate: currentRateInfo.latestRentalRate,
      newRate,
      notes: notes 
        ? `${notes}\n\nActive tenants: ${tenantsList}` 
        : `Rate increase\n\nActive tenants: ${tenantsList}`
    });
    
    // Update the rental rate increase info
    const updated = await this.updateRentalRateIncrease(propertyAddress, {
      latestRateIncreaseDate: format(increaseDate, 'yyyy-MM-dd'),
      latestRentalRate: newRate,
      nextAllowableRentalIncreaseDate: format(nextAllowableDate, 'yyyy-MM-dd'),
      nextAllowableRentalRate: nextAllowableRate,
      reminderDate: format(reminderDate, 'yyyy-MM-dd')
    });
    
    if (!updated) {
      throw new Error("Failed to update rental increase information");
    }
    
    return updated;
  }
}

// In-memory storage implementation for backwards compatibility
export class MemStorage implements IStorage {
  private landlords: Landlord[] = [];
  private landlordOwners: LandlordOwner[] = [];
  private tenants: Tenant[] = [];
  private rentalRateIncreases: RentalRateIncrease[] = [];
  private rentalRateHistory: RentalRateHistory[] = [];
  private users: User[] = [];
  private userAuditLog: UserAuditLog[] = [];
  private nextId = 1;

  // User operations (for authentication)
  async getUser(id: string) { return this.users.find(u => u.id === id); }
  async getUserByEmail(email: string) { return this.users.find(u => u.email === email); }
  async upsertUser(user: UpsertUser) { 
    const existingUser = this.users.find(u => u.id === user.id);
    if (existingUser) {
      Object.assign(existingUser, user, { updatedAt: new Date() });
      return existingUser;
    }
    const newUser = { 
      id: user.id!, 
      email: user.email || null, 
      firstName: user.firstName || null, 
      lastName: user.lastName || null, 
      profileImageUrl: user.profileImageUrl || null, 
      role: user.role || "read_only", 
      status: user.status || "active", 
      createdAt: new Date(), 
      updatedAt: new Date(), 
      createdBy: user.createdBy || null, 
      lastLoginAt: null 
    };
    this.users.push(newUser);
    return newUser;
  }
  async updateUserLastLogin(id: string) { 
    const user = this.users.find(u => u.id === id);
    if (user) user.lastLoginAt = new Date();
  }
  async getAllUsers() { return [...this.users]; }
  async createUser(user: InsertUser) { 
    const newUser = { 
      id: user.id, 
      email: user.email || null, 
      firstName: user.firstName || null, 
      lastName: user.lastName || null, 
      profileImageUrl: user.profileImageUrl || null, 
      role: user.role || "read_only", 
      status: user.status || "active", 
      createdAt: new Date(), 
      updatedAt: new Date(), 
      createdBy: user.createdBy || null, 
      lastLoginAt: null 
    };
    this.users.push(newUser);
    return newUser;
  }
  async updateUser(id: string, updates: UpdateUser) { 
    const user = this.users.find(u => u.id === id);
    if (user) {
      Object.assign(user, updates, { updatedAt: new Date() });
      return user;
    }
    return undefined;
  }
  async deactivateUser(id: string) { 
    const user = this.users.find(u => u.id === id);
    if (user) {
      user.status = "inactive";
      user.updatedAt = new Date();
      return true;
    }
    return false;
  }
  async deleteUser(id: string) { 
    const index = this.users.findIndex(u => u.id === id);
    if (index >= 0) {
      this.users.splice(index, 1);
      return true;
    }
    return false;
  }
  async logUserAction(action: InsertUserAuditLog) { 
    const logEntry = { ...action, id: this.nextId++, timestamp: new Date() };
    this.userAuditLog.push(logEntry);
  }
  async getUserAuditLog(userId?: string) { 
    return userId ? this.userAuditLog.filter(log => log.targetUserId === userId) : [...this.userAuditLog];
  }
  
  async getLandlords() { return [...this.landlords]; }
  async getLandlordByPropertyAddress(propertyAddress: string) { 
    return this.landlords.find(l => l.propertyAddress === propertyAddress);
  }
  async createLandlord(landlord: InsertLandlord) { 
    const newLandlord = { 
      id: this.nextId++, 
      ...landlord, 
      serviceType: landlord.serviceType ?? 'Full-Service Management',
      strataContactNumber: null, 
      strataManagementCompany: null, 
      strataContactPerson: null 
    };
    this.landlords.push(newLandlord);
    return newLandlord;
  }
  async updateLandlord(propertyAddress: string, landlord: Partial<InsertLandlord>) { 
    const existing = this.landlords.find(l => l.propertyAddress === propertyAddress);
    if (existing) {
      Object.assign(existing, landlord);
      return existing;
    }
    return undefined;
  }
  async deleteLandlord(propertyAddress: string) { 
    const index = this.landlords.findIndex(l => l.propertyAddress === propertyAddress);
    if (index >= 0) {
      this.landlords.splice(index, 1);
      return true;
    }
    return false;
  }
  async getLandlordOwners(landlordId: number) { 
    return this.landlordOwners.filter(o => o.landlordId === landlordId);
  }
  async createLandlordOwner(owner: InsertLandlordOwner) { 
    const newOwner = { 
      id: this.nextId++, 
      ...owner, 
      contactNumber: null, 
      birthday: null, 
      residentialAddress: null 
    };
    this.landlordOwners.push(newOwner);
    return newOwner;
  }
  async updateLandlordOwner(id: number, owner: Partial<InsertLandlordOwner>) { 
    const existing = this.landlordOwners.find(o => o.id === id);
    if (existing) {
      Object.assign(existing, owner);
      return existing;
    }
    return undefined;
  }
  async deleteLandlordOwner(id: number) { 
    const index = this.landlordOwners.findIndex(o => o.id === id);
    if (index >= 0) {
      this.landlordOwners.splice(index, 1);
      return true;
    }
    return false;
  }
  async getTenants() { return [...this.tenants]; }
  async getTenantByPropertyAddress(propertyAddress: string) { 
    return this.tenants.find(t => t.propertyAddress === propertyAddress && !t.moveOutDate);
  }
  async getTenantsByPropertyAddress(propertyAddress: string) { 
    return this.tenants.filter(t => t.propertyAddress === propertyAddress);
  }
  async createTenant(tenant: InsertTenant) { 
    const newTenant = { 
      id: this.nextId++, 
      ...tenant, 
      contactNumber: null, 
      birthday: null, 
      moveOutDate: null, 
      email: null,
      isPrimary: tenant.isPrimary ?? false
    };
    this.tenants.push(newTenant);
    return newTenant;
  }
  async updateTenant(id: number, tenant: Partial<InsertTenant>) { 
    const existing = this.tenants.find(t => t.id === id);
    if (existing) {
      Object.assign(existing, tenant);
      return existing;
    }
    return undefined;
  }
  async deleteTenant(id: number) { 
    const index = this.tenants.findIndex(t => t.id === id);
    if (index >= 0) {
      this.tenants.splice(index, 1);
      return true;
    }
    return false;
  }
  async getRentalRateIncreases() { return [...this.rentalRateIncreases]; }
  async getRentalRateIncreaseByPropertyAddress(propertyAddress: string) { 
    return this.rentalRateIncreases.find(r => r.propertyAddress === propertyAddress);
  }
  async createRentalRateIncrease(increase: InsertRentalRateIncrease) { 
    const newIncrease = { id: this.nextId++, ...increase };
    this.rentalRateIncreases.push(newIncrease);
    return newIncrease;
  }
  async updateRentalRateIncrease(propertyAddress: string, increase: Partial<InsertRentalRateIncrease>) { 
    const existing = this.rentalRateIncreases.find(r => r.propertyAddress === propertyAddress);
    if (existing) {
      Object.assign(existing, increase);
      return existing;
    }
    return undefined;
  }
  async getRentalRateHistory(propertyAddress: string) { 
    return this.rentalRateHistory.filter(h => h.propertyAddress === propertyAddress);
  }
  async createRentalRateHistory(history: InsertRentalRateHistory) { 
    const newHistory = { id: this.nextId++, ...history, createdAt: new Date(), notes: null };
    this.rentalRateHistory.push(newHistory);
    return newHistory;
  }
  async getPropertiesWithDetails(): Promise<PropertyWithDetails[]> { 
    const result: PropertyWithDetails[] = [];
    
    for (const landlord of this.landlords) {
      const owners = this.landlordOwners.filter(o => o.landlordId === landlord.id);
      const activeTenants = this.tenants.filter(t => t.propertyAddress === landlord.propertyAddress && !t.moveOutDate);
      const tenant = activeTenants.length > 0 ? activeTenants[0] : undefined;
      const rentalIncrease = this.rentalRateIncreases.find(r => r.propertyAddress === landlord.propertyAddress);
      
      const propertyDetails: PropertyWithDetails = {
        propertyAddress: landlord.propertyAddress,
        keyNumber: landlord.keyNumber,
        strataContactNumber: landlord.strataContactNumber || undefined,
        strataManagementCompany: landlord.strataManagementCompany || undefined,
        strataContactPerson: landlord.strataContactPerson || undefined,
        serviceType: landlord.serviceType || tenant?.serviceType || '',
        landlordOwners: owners.map(owner => ({
          name: owner.name,
          contactNumber: owner.contactNumber || undefined,
          birthday: owner.birthday ? new Date(owner.birthday) : undefined,
          residentialAddress: owner.residentialAddress || undefined
        }))
      };
      
      if (tenant) {
        propertyDetails.tenant = {
          id: tenant.id,
          name: tenant.name,
          contactNumber: tenant.contactNumber || undefined,
          email: tenant.email || undefined,
          birthday: tenant.birthday ? new Date(tenant.birthday) : undefined,
          moveInDate: new Date(tenant.moveInDate),
          moveOutDate: tenant.moveOutDate ? new Date(tenant.moveOutDate) : undefined
        };
      }
      
      if (rentalIncrease) {
        propertyDetails.rentalInfo = {
          latestRentalRate: rentalIncrease.latestRentalRate,
          latestRateIncreaseDate: new Date(rentalIncrease.latestRateIncreaseDate),
          nextAllowableRentalIncreaseDate: new Date(rentalIncrease.nextAllowableRentalIncreaseDate),
          nextAllowableRentalRate: rentalIncrease.nextAllowableRentalRate,
          reminderDate: new Date(rentalIncrease.reminderDate)
        };
      }
      
      result.push(propertyDetails);
    }
    
    return result;
  }
  async getPropertyDetailsByAddress(propertyAddress: string) { 
    const landlord = this.landlords.find(l => l.propertyAddress === propertyAddress);
    if (!landlord) return undefined;
    
    const owners = this.landlordOwners.filter(o => o.landlordId === landlord.id);
    const activeTenants = this.tenants.filter(t => t.propertyAddress === propertyAddress && !t.moveOutDate);
    const tenant = activeTenants.length > 0 ? activeTenants[0] : undefined;
    const rentalIncrease = this.rentalRateIncreases.find(r => r.propertyAddress === propertyAddress);
    
    const propertyDetails: PropertyWithDetails = {
      propertyAddress: landlord.propertyAddress,
      keyNumber: landlord.keyNumber,
      strataContactNumber: landlord.strataContactNumber || undefined,
      strataManagementCompany: landlord.strataManagementCompany || undefined,
      strataContactPerson: landlord.strataContactPerson || undefined,
      serviceType: landlord.serviceType || tenant?.serviceType || '',
      landlordOwners: owners.map(owner => ({
        name: owner.name,
        contactNumber: owner.contactNumber || undefined,
        birthday: owner.birthday ? new Date(owner.birthday) : undefined,
        residentialAddress: owner.residentialAddress || undefined
      }))
    };
    
    if (tenant) {
      propertyDetails.tenant = {
        id: tenant.id,
        name: tenant.name,
        contactNumber: tenant.contactNumber || undefined,
        email: tenant.email || undefined,
        birthday: tenant.birthday ? new Date(tenant.birthday) : undefined,
        moveInDate: new Date(tenant.moveInDate),
        moveOutDate: tenant.moveOutDate ? new Date(tenant.moveOutDate) : undefined
      };
    }
    
    if (rentalIncrease) {
      propertyDetails.rentalInfo = {
        latestRentalRate: rentalIncrease.latestRentalRate,
        latestRateIncreaseDate: new Date(rentalIncrease.latestRateIncreaseDate),
        nextAllowableRentalIncreaseDate: new Date(rentalIncrease.nextAllowableRentalIncreaseDate),
        nextAllowableRentalRate: rentalIncrease.nextAllowableRentalRate,
        reminderDate: new Date(rentalIncrease.reminderDate)
      };
    }
    
    return propertyDetails;
  }
  async getRentalIncreaseReminders(month?: number, minMonthsSinceIncrease?: number) { 
    const result = [];
    
    for (const increase of this.rentalRateIncreases) {
      const increaseDate = new Date(increase.latestRateIncreaseDate);
      const today = new Date();
      const monthsSinceIncrease = 
        (today.getFullYear() - increaseDate.getFullYear()) * 12 + 
        (today.getMonth() - increaseDate.getMonth());
      
      if (minMonthsSinceIncrease !== undefined && monthsSinceIncrease < minMonthsSinceIncrease) {
        continue;
      }
      
      if (month && month > 0) {
        const reminderDate = new Date(increase.reminderDate);
        if (reminderDate.getMonth() + 1 !== month) {
          continue;
        }
      }
      
      const tenant = this.tenants.find(t => t.propertyAddress === increase.propertyAddress && !t.moveOutDate);
      
      result.push({
        propertyAddress: increase.propertyAddress,
        serviceType: tenant?.serviceType || 'Unknown',
        latestRateIncreaseDate: increase.latestRateIncreaseDate,
        latestRentalRate: increase.latestRentalRate,
        nextAllowableRentalIncreaseDate: increase.nextAllowableRentalIncreaseDate,
        nextAllowableRentalRate: increase.nextAllowableRentalRate,
        reminderDate: increase.reminderDate,
        monthsSinceIncrease
      });
    }
    
    return result.sort((a, b) => (b?.monthsSinceIncrease || 0) - (a?.monthsSinceIncrease || 0));
  }
  async getBirthdayReminders(month?: number) { 
    const currentMonth = month || new Date().getMonth() + 1;
    const result = [];
    
    console.log("=== BIRTHDAY REMINDERS DEBUG ===");
    console.log("Target month:", currentMonth);
    console.log("Total landlord owners:", this.landlordOwners.length);
    console.log("Total tenants:", this.tenants.length);
    
    // Check landlord owners
    for (const owner of this.landlordOwners) {
      console.log("Checking owner:", owner.name, "birthday:", owner.birthday);
      if (owner.birthday) {
        const birthday = new Date(owner.birthday);
        const birthdayMonth = birthday.getMonth() + 1;
        console.log("Owner", owner.name, "birthday month:", birthdayMonth, "target month:", currentMonth);
        if (birthdayMonth === currentMonth) {
          console.log("✓ Adding owner to results:", owner.name);
          result.push({
            name: owner.name,
            role: 'Landlord',
            contactNumber: owner.contactNumber || 'N/A',
            birthday: new Date(owner.birthday),
            propertyAddress: owner.residentialAddress || 'N/A'
          });
        }
      }
    }
    
    // Check tenants
    for (const tenant of this.tenants) {
      console.log("Checking tenant:", tenant.name, "birthday:", tenant.birthday, "moved out:", tenant.moveOutDate);
      if (tenant.birthday && !tenant.moveOutDate) {
        const birthday = new Date(tenant.birthday);
        const birthdayMonth = birthday.getMonth() + 1;
        console.log("Tenant", tenant.name, "birthday month:", birthdayMonth, "target month:", currentMonth);
        if (birthdayMonth === currentMonth) {
          console.log("✓ Adding tenant to results:", tenant.name);
          result.push({
            name: tenant.name,
            role: 'Tenant',
            contactNumber: tenant.contactNumber || 'N/A',
            birthday: new Date(tenant.birthday),
            propertyAddress: tenant.propertyAddress
          });
        }
      }
    }
    
    console.log("Total birthday reminders found:", result.length);
    return result.sort((a, b) => a.birthday.getDate() - b.birthday.getDate());
  }
  async processRentalIncrease(propertyAddress: string, increaseDate: Date, newRate: number) { 
    const currentRateInfo = this.rentalRateIncreases.find(r => r.propertyAddress === propertyAddress);
    if (!currentRateInfo) {
      throw new Error("No rental rate information found for this property");
    }
    
    const nextAllowableDate = addMonths(increaseDate, 12);
    const nextAllowableRate = Math.round(newRate * 1.03 * 100) / 100;
    const reminderDate = addMonths(increaseDate, 8);
    
    const tenant = this.tenants.find(t => t.propertyAddress === propertyAddress && !t.moveOutDate);
    const tenantName = tenant ? tenant.name : "No tenant";
    
    // Create history entry
    await this.createRentalRateHistory({
      propertyAddress,
      increaseDate: format(increaseDate, 'yyyy-MM-dd'),
      previousRate: currentRateInfo.latestRentalRate,
      newRate,
      notes: `Rate increase\n\nActive tenant: ${tenantName}`
    });
    
    // Update rental rate increase
    const updated = await this.updateRentalRateIncrease(propertyAddress, {
      latestRateIncreaseDate: format(increaseDate, 'yyyy-MM-dd'),
      latestRentalRate: newRate,
      nextAllowableRentalIncreaseDate: format(nextAllowableDate, 'yyyy-MM-dd'),
      nextAllowableRentalRate: nextAllowableRate,
      reminderDate: format(reminderDate, 'yyyy-MM-dd')
    });
    
    if (!updated) {
      throw new Error("Failed to update rental increase information");
    }
    
    return updated;
  }
}

// Use the DatabaseStorage implementation or MemStorage for testing
export const storage = process.env.USE_MEMORY_STORAGE === 'true' 
  ? new MemStorage() 
  : new DatabaseStorage();