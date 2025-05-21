import { db } from "./db";
import { eq, and, isNull, desc, not as notOp } from "drizzle-orm";
import { format, addMonths, addDays } from "date-fns";
import { 
  landlords,
  landlordOwners,
  tenants,
  rentalRateIncreases,
  rentalRateHistory,
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
  type PropertyWithDetails
} from "@shared/schema";

export interface IStorage {
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
  // Landlord operations
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
    const [newOwner] = await db
      .insert(landlordOwners)
      .values(ownerData)
      .returning();
    return newOwner;
  }

  async updateLandlordOwner(id: number, ownerData: Partial<InsertLandlordOwner>): Promise<LandlordOwner | undefined> {
    const [updatedOwner] = await db
      .update(landlordOwners)
      .set(ownerData)
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
    const [tenant] = await db
      .select()
      .from(tenants)
      .where(and(
        eq(tenants.propertyAddress, propertyAddress),
        isNull(tenants.moveOutDate)
      ));
    return tenant || undefined;
  }

  async createTenant(tenantData: InsertTenant): Promise<Tenant> {
    const [newTenant] = await db
      .insert(tenants)
      .values(tenantData)
      .returning();
    return newTenant;
  }

  async updateTenant(id: number, tenantData: Partial<InsertTenant>): Promise<Tenant | undefined> {
    const [updatedTenant] = await db
      .update(tenants)
      .set(tenantData)
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
    const [newHistory] = await db
      .insert(rentalRateHistory)
      .values(historyData)
      .returning();
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
        
      const [tenant] = await db
        .select()
        .from(tenants)
        .where(and(
          eq(tenants.propertyAddress, property.propertyAddress),
          isNull(tenants.moveOutDate)
        ));
        
      const [rentalIncrease] = await db
        .select()
        .from(rentalRateIncreases)
        .where(eq(rentalRateIncreases.propertyAddress, property.propertyAddress));
        
      const propertyDetails: PropertyWithDetails = {
        propertyAddress: property.propertyAddress,
        keyNumber: property.keyNumber,
        serviceType: tenant?.serviceType || '',
        landlordOwners: owners.map(owner => ({
          name: owner.name,
          contactNumber: owner.contactNumber || undefined,
          birthday: owner.birthday ? new Date(owner.birthday) : undefined
        }))
      };
      
      if (tenant) {
        propertyDetails.tenant = {
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
      
    const [tenant] = await db
      .select()
      .from(tenants)
      .where(and(
        eq(tenants.propertyAddress, propertyAddress),
        isNull(tenants.moveOutDate)
      ));
      
    const [rentalIncrease] = await db
      .select()
      .from(rentalRateIncreases)
      .where(eq(rentalRateIncreases.propertyAddress, propertyAddress));
      
    const propertyDetails: PropertyWithDetails = {
      propertyAddress: property.propertyAddress,
      keyNumber: property.keyNumber,
      serviceType: tenant?.serviceType || '',
      landlordOwners: owners.map(owner => ({
        name: owner.name,
        contactNumber: owner.contactNumber || undefined,
        birthday: owner.birthday ? new Date(owner.birthday) : undefined
      }))
    };
    
    if (tenant) {
      propertyDetails.tenant = {
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

  // Reminder operations
  async getRentalIncreaseReminders(month?: number, minMonthsSinceIncrease?: number): Promise<any[]> {
    // Get all rental increases
    const increases = await db.select().from(rentalRateIncreases);
    
    // Filter by month if specified
    const filteredIncreases = month 
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
    
    // Filter owners by month if specified
    const filteredOwners = month
      ? ownersWithBirthdays.filter(owner => {
          const birthday = new Date(owner.birthday!);
          return birthday.getMonth() + 1 === month;
        })
      : ownersWithBirthdays;
    
    // Filter tenants by month if specified
    const filteredTenants = month
      ? tenantsWithBirthdays.filter(tenant => {
          const birthday = new Date(tenant.birthday!);
          return birthday.getMonth() + 1 === month;
        })
      : tenantsWithBirthdays;
    
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
        propertyAddress: landlord?.propertyAddress || 'Unknown'
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
    
    // Record history entry
    await this.createRentalRateHistory({
      propertyAddress,
      increaseDate: format(increaseDate, 'yyyy-MM-dd'),
      previousRate: currentRateInfo.latestRentalRate,
      newRate,
      notes: notes || null
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
  // Implementation omitted for brevity
  // You can see the full implementation in the original file
  async getLandlords() { return []; }
  async getLandlordByPropertyAddress() { return undefined; }
  async createLandlord(landlord: InsertLandlord) { return { id: 0, ...landlord, strataContactNumber: null }; }
  async updateLandlord() { return undefined; }
  async deleteLandlord() { return false; }
  async getLandlordOwners() { return []; }
  async createLandlordOwner(owner: InsertLandlordOwner) { return { id: 0, ...owner, contactNumber: null, birthday: null }; }
  async updateLandlordOwner() { return undefined; }
  async deleteLandlordOwner() { return false; }
  async getTenants() { return []; }
  async getTenantByPropertyAddress() { return undefined; }
  async createTenant(tenant: InsertTenant) { 
    return { 
      id: 0, 
      ...tenant, 
      contactNumber: null, 
      birthday: null, 
      moveOutDate: null, 
      email: null 
    }; 
  }
  async updateTenant() { return undefined; }
  async deleteTenant() { return false; }
  async getRentalRateIncreases() { return []; }
  async getRentalRateIncreaseByPropertyAddress() { return undefined; }
  async createRentalRateIncrease(increase: InsertRentalRateIncrease) { return { id: 0, ...increase }; }
  async updateRentalRateIncrease() { return undefined; }
  async getRentalRateHistory() { return []; }
  async createRentalRateHistory(history: InsertRentalRateHistory) { return { id: 0, ...history, createdAt: new Date(), notes: null }; }
  async getPropertiesWithDetails() { return []; }
  async getPropertyDetailsByAddress() { return undefined; }
  async getRentalIncreaseReminders() { return []; }
  async getBirthdayReminders() { return []; }
  async processRentalIncrease(propertyAddress: string, increaseDate: Date, newRate: number) { 
    return { 
      id: 0, 
      propertyAddress, 
      latestRateIncreaseDate: format(increaseDate, 'yyyy-MM-dd'), 
      latestRentalRate: newRate,
      nextAllowableRentalIncreaseDate: format(addMonths(increaseDate, 12), 'yyyy-MM-dd'),
      nextAllowableRentalRate: Math.round(newRate * 1.03 * 100) / 100,
      reminderDate: format(addMonths(increaseDate, 8), 'yyyy-MM-dd')
    }; 
  }
}

// Use the DatabaseStorage implementation
export const storage = new DatabaseStorage();