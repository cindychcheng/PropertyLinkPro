import {
  type Landlord,
  type InsertLandlord,
  type LandlordOwner,
  type InsertLandlordOwner,
  type Tenant,
  type InsertTenant,
  type RentalRateIncrease,
  type InsertRentalRateIncrease,
  type RentalRateHistory,
  type InsertRentalRateHistory,
  type PropertyWithDetails,
  ServiceType,
} from "@shared/schema";
import { add, differenceInMonths, format } from "date-fns";

// Define storage interface
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

export class MemStorage implements IStorage {
  private landlords: Map<number, Landlord>;
  private landlordOwners: Map<number, LandlordOwner>;
  private tenants: Map<number, Tenant>;
  private rentalRateIncreases: Map<number, RentalRateIncrease>;
  private rentalRateHistory: Map<number, RentalRateHistory>;
  
  private landlordCurrentId: number;
  private landlordOwnerCurrentId: number;
  private tenantCurrentId: number;
  private rentalRateIncreaseCurrentId: number;
  private rentalRateHistoryCurrentId: number;
  
  constructor() {
    this.landlords = new Map();
    this.landlordOwners = new Map();
    this.tenants = new Map();
    this.rentalRateIncreases = new Map();
    this.rentalRateHistory = new Map();
    
    this.landlordCurrentId = 1;
    this.landlordOwnerCurrentId = 1;
    this.tenantCurrentId = 1;
    this.rentalRateIncreaseCurrentId = 1;
    this.rentalRateHistoryCurrentId = 1;
    
    // Seed some initial data
    this.seedData();
  }
  
  // Landlord methods
  async getLandlords(): Promise<Landlord[]> {
    return Array.from(this.landlords.values());
  }
  
  async getLandlordByPropertyAddress(propertyAddress: string): Promise<Landlord | undefined> {
    return Array.from(this.landlords.values()).find(
      (landlord) => landlord.propertyAddress === propertyAddress
    );
  }
  
  async createLandlord(landlord: InsertLandlord): Promise<Landlord> {
    const id = this.landlordCurrentId++;
    const newLandlord: Landlord = { ...landlord, id };
    this.landlords.set(id, newLandlord);
    return newLandlord;
  }
  
  async updateLandlord(propertyAddress: string, landlordData: Partial<InsertLandlord>): Promise<Landlord | undefined> {
    const landlord = await this.getLandlordByPropertyAddress(propertyAddress);
    if (!landlord) return undefined;
    
    const updatedLandlord: Landlord = { ...landlord, ...landlordData };
    this.landlords.set(landlord.id, updatedLandlord);
    return updatedLandlord;
  }
  
  async deleteLandlord(propertyAddress: string): Promise<boolean> {
    const landlord = await this.getLandlordByPropertyAddress(propertyAddress);
    if (!landlord) return false;
    
    return this.landlords.delete(landlord.id);
  }
  
  // Landlord Owner methods
  async getLandlordOwners(landlordId: number): Promise<LandlordOwner[]> {
    return Array.from(this.landlordOwners.values()).filter(
      (owner) => owner.landlordId === landlordId
    );
  }
  
  async createLandlordOwner(owner: InsertLandlordOwner): Promise<LandlordOwner> {
    const id = this.landlordOwnerCurrentId++;
    const newOwner: LandlordOwner = { ...owner, id };
    this.landlordOwners.set(id, newOwner);
    return newOwner;
  }
  
  async updateLandlordOwner(id: number, ownerData: Partial<InsertLandlordOwner>): Promise<LandlordOwner | undefined> {
    const owner = this.landlordOwners.get(id);
    if (!owner) return undefined;
    
    const updatedOwner: LandlordOwner = { ...owner, ...ownerData };
    this.landlordOwners.set(id, updatedOwner);
    return updatedOwner;
  }
  
  async deleteLandlordOwner(id: number): Promise<boolean> {
    return this.landlordOwners.delete(id);
  }
  
  // Tenant methods
  async getTenants(): Promise<Tenant[]> {
    return Array.from(this.tenants.values());
  }
  
  async getTenantByPropertyAddress(propertyAddress: string): Promise<Tenant | undefined> {
    return Array.from(this.tenants.values()).find(
      (tenant) => tenant.propertyAddress === propertyAddress
    );
  }
  
  async createTenant(tenant: InsertTenant): Promise<Tenant> {
    const id = this.tenantCurrentId++;
    const newTenant: Tenant = { ...tenant, id };
    this.tenants.set(id, newTenant);
    return newTenant;
  }
  
  async updateTenant(id: number, tenantData: Partial<InsertTenant>): Promise<Tenant | undefined> {
    const tenant = this.tenants.get(id);
    if (!tenant) return undefined;
    
    const updatedTenant: Tenant = { ...tenant, ...tenantData };
    this.tenants.set(id, updatedTenant);
    return updatedTenant;
  }
  
  async deleteTenant(id: number): Promise<boolean> {
    return this.tenants.delete(id);
  }
  
  // Rental Rate Increase methods
  async getRentalRateIncreases(): Promise<RentalRateIncrease[]> {
    return Array.from(this.rentalRateIncreases.values());
  }
  
  async getRentalRateIncreaseByPropertyAddress(propertyAddress: string): Promise<RentalRateIncrease | undefined> {
    return Array.from(this.rentalRateIncreases.values()).find(
      (increase) => increase.propertyAddress === propertyAddress
    );
  }
  
  async createRentalRateIncrease(increase: InsertRentalRateIncrease): Promise<RentalRateIncrease> {
    const id = this.rentalRateIncreaseCurrentId++;
    const newIncrease: RentalRateIncrease = { ...increase, id };
    this.rentalRateIncreases.set(id, newIncrease);
    return newIncrease;
  }
  
  async updateRentalRateIncrease(propertyAddress: string, increaseData: Partial<InsertRentalRateIncrease>): Promise<RentalRateIncrease | undefined> {
    const increase = await this.getRentalRateIncreaseByPropertyAddress(propertyAddress);
    if (!increase) return undefined;
    
    const updatedIncrease: RentalRateIncrease = { ...increase, ...increaseData };
    this.rentalRateIncreases.set(increase.id, updatedIncrease);
    return updatedIncrease;
  }
  
  // Rental Rate History methods
  async getRentalRateHistory(propertyAddress: string): Promise<RentalRateHistory[]> {
    return Array.from(this.rentalRateHistory.values())
      .filter((history) => history.propertyAddress === propertyAddress)
      .sort((a, b) => {
        const dateA = new Date(a.increaseDate);
        const dateB = new Date(b.increaseDate);
        return dateB.getTime() - dateA.getTime(); // newest first
      });
  }
  
  async createRentalRateHistory(history: InsertRentalRateHistory): Promise<RentalRateHistory> {
    const id = this.rentalRateHistoryCurrentId++;
    const now = new Date();
    const newHistory: RentalRateHistory = { ...history, id, createdAt: now };
    this.rentalRateHistory.set(id, newHistory);
    return newHistory;
  }
  
  // Combined property details
  async getPropertiesWithDetails(): Promise<PropertyWithDetails[]> {
    const landlords = await this.getLandlords();
    const properties: PropertyWithDetails[] = [];
    
    for (const landlord of landlords) {
      const owners = await this.getLandlordOwners(landlord.id);
      const tenant = await this.getTenantByPropertyAddress(landlord.propertyAddress);
      const rentalIncrease = await this.getRentalRateIncreaseByPropertyAddress(landlord.propertyAddress);
      
      const property: PropertyWithDetails = {
        propertyAddress: landlord.propertyAddress,
        keyNumber: landlord.keyNumber,
        serviceType: tenant?.serviceType || "",
        landlordOwners: owners.map(owner => ({
          name: owner.name,
          contactNumber: owner.contactNumber,
          birthday: owner.birthday ? new Date(owner.birthday) : undefined,
        })),
      };
      
      if (tenant) {
        property.tenant = {
          name: tenant.name,
          contactNumber: tenant.contactNumber,
          email: tenant.email,
          birthday: tenant.birthday ? new Date(tenant.birthday) : undefined,
          moveInDate: new Date(tenant.moveInDate),
          moveOutDate: tenant.moveOutDate ? new Date(tenant.moveOutDate) : undefined,
        };
      }
      
      if (rentalIncrease) {
        property.rentalInfo = {
          latestRentalRate: rentalIncrease.latestRentalRate,
          latestRateIncreaseDate: new Date(rentalIncrease.latestRateIncreaseDate),
          nextAllowableRentalIncreaseDate: new Date(rentalIncrease.nextAllowableRentalIncreaseDate),
          nextAllowableRentalRate: rentalIncrease.nextAllowableRentalRate,
          reminderDate: new Date(rentalIncrease.reminderDate),
        };
      }
      
      properties.push(property);
    }
    
    return properties;
  }
  
  async getPropertyDetailsByAddress(propertyAddress: string): Promise<PropertyWithDetails | undefined> {
    const landlord = await this.getLandlordByPropertyAddress(propertyAddress);
    if (!landlord) return undefined;
    
    const owners = await this.getLandlordOwners(landlord.id);
    const tenant = await this.getTenantByPropertyAddress(propertyAddress);
    const rentalIncrease = await this.getRentalRateIncreaseByPropertyAddress(propertyAddress);
    
    const property: PropertyWithDetails = {
      propertyAddress: landlord.propertyAddress,
      keyNumber: landlord.keyNumber,
      serviceType: tenant?.serviceType || "",
      landlordOwners: owners.map(owner => ({
        name: owner.name,
        contactNumber: owner.contactNumber,
        birthday: owner.birthday ? new Date(owner.birthday) : undefined,
      })),
    };
    
    if (tenant) {
      property.tenant = {
        name: tenant.name,
        contactNumber: tenant.contactNumber,
        email: tenant.email,
        birthday: tenant.birthday ? new Date(tenant.birthday) : undefined,
        moveInDate: new Date(tenant.moveInDate),
        moveOutDate: tenant.moveOutDate ? new Date(tenant.moveOutDate) : undefined,
      };
    }
    
    if (rentalIncrease) {
      property.rentalInfo = {
        latestRentalRate: rentalIncrease.latestRentalRate,
        latestRateIncreaseDate: new Date(rentalIncrease.latestRateIncreaseDate),
        nextAllowableRentalIncreaseDate: new Date(rentalIncrease.nextAllowableRentalIncreaseDate),
        nextAllowableRentalRate: rentalIncrease.nextAllowableRentalRate,
        reminderDate: new Date(rentalIncrease.reminderDate),
      };
    }
    
    return property;
  }
  
  // Reminders
  async getRentalIncreaseReminders(month?: number, minMonthsSinceIncrease?: number): Promise<any[]> {
    const increases = await this.getRentalRateIncreases();
    const currentMonth = month || new Date().getMonth() + 1; // 1-12
    
    const reminders = [];
    const now = new Date();
    
    for (const increase of increases) {
      const reminderDate = new Date(increase.reminderDate);
      const reminderMonth = reminderDate.getMonth() + 1; // 1-12
      
      // Check if the reminder is for the specified month 
      if (reminderMonth === currentMonth) {
        const property = await this.getPropertyDetailsByAddress(increase.propertyAddress);
        const monthsSinceIncrease = differenceInMonths(
          now, 
          new Date(increase.latestRateIncreaseDate)
        );
        
        // Skip if we have a minimum months filter and it doesn't meet it
        if (minMonthsSinceIncrease && monthsSinceIncrease < minMonthsSinceIncrease) {
          continue;
        }
        
        if (property?.tenant) {
          reminders.push({
            propertyAddress: increase.propertyAddress,
            serviceType: property.tenant.serviceType,
            latestRateIncreaseDate: new Date(increase.latestRateIncreaseDate),
            latestRentalRate: increase.latestRentalRate,
            nextAllowableRentalIncreaseDate: new Date(increase.nextAllowableRentalIncreaseDate),
            nextAllowableRentalRate: increase.nextAllowableRentalRate,
            reminderDate: reminderDate,
            monthsSinceIncrease: monthsSinceIncrease,
          });
        }
      }
    }
    
    // Sort by months since increase (descending)
    return reminders.sort((a, b) => b.monthsSinceIncrease - a.monthsSinceIncrease);
  }
  
  async getBirthdayReminders(month?: number): Promise<any[]> {
    const properties = await this.getPropertiesWithDetails();
    const targetMonth = month || new Date().getMonth() + 1; // 1-12
    const reminders = [];
    
    // Add landlord birthdays
    for (const property of properties) {
      for (const owner of property.landlordOwners) {
        if (owner.birthday && owner.birthday.getMonth() + 1 === targetMonth) {
          reminders.push({
            name: owner.name,
            role: 'Landlord',
            contactNumber: owner.contactNumber,
            birthday: owner.birthday,
            propertyAddress: property.propertyAddress,
          });
        }
      }
      
      // Add tenant birthdays
      if (property.tenant?.birthday && property.tenant.birthday.getMonth() + 1 === targetMonth) {
        reminders.push({
          name: property.tenant.name,
          role: 'Tenant',
          contactNumber: property.tenant.contactNumber,
          birthday: property.tenant.birthday,
          propertyAddress: property.propertyAddress,
        });
      }
    }
    
    // Sort by day of month
    return reminders.sort((a, b) => a.birthday.getDate() - b.birthday.getDate());
  }
  
  // Process a new rental increase
  async processRentalIncrease(
    propertyAddress: string, 
    increaseDate: Date, 
    newRate: number, 
    notes?: string
  ): Promise<RentalRateIncrease> {
    // Get the current rental increase info
    const currentIncrease = await this.getRentalRateIncreaseByPropertyAddress(propertyAddress);
    if (!currentIncrease) {
      throw new Error(`No rental rate information found for property: ${propertyAddress}`);
    }
    
    // Calculate new values
    const nextAllowableDate = add(increaseDate, { years: 1 });
    const nextAllowableRate = parseFloat((newRate * 1.03).toFixed(2));
    
    // Set reminder date (8 months from increase date, 1st of the month)
    const reminderDate = add(increaseDate, { months: 8 });
    const reminderDay1 = new Date(
      reminderDate.getFullYear(),
      reminderDate.getMonth(),
      1
    );
    
    // Store the history record
    await this.createRentalRateHistory({
      propertyAddress,
      increaseDate,
      previousRate: currentIncrease.latestRentalRate,
      newRate,
      notes,
    });
    
    // Update the current increase record
    const updatedIncrease = await this.updateRentalRateIncrease(
      propertyAddress,
      {
        latestRateIncreaseDate: increaseDate,
        latestRentalRate: newRate,
        nextAllowableRentalIncreaseDate: nextAllowableDate,
        nextAllowableRentalRate: nextAllowableRate,
        reminderDate: reminderDay1,
      }
    );
    
    if (!updatedIncrease) {
      throw new Error(`Failed to update rental rate for property: ${propertyAddress}`);
    }
    
    return updatedIncrease;
  }
  
  // Seed data method for development
  private seedData() {
    // Add sample landlords
    const landlords = [
      { propertyAddress: "123 Main St, Unit 4B", keyNumber: "K-1234", strataContactNumber: "(555) 867-5309" },
      { propertyAddress: "456 Maple Ave, Apt 201", keyNumber: "K-5678", strataContactNumber: "(555) 123-4567" },
      { propertyAddress: "789 Oak St, Unit 2", keyNumber: "K-9012", strataContactNumber: "(555) 987-6543" },
      { propertyAddress: "101 Pine St, #3C", keyNumber: "K-3456", strataContactNumber: "(555) 246-8101" },
    ];
    
    landlords.forEach(async (landlord) => {
      const newLandlord = await this.createLandlord(landlord);
      
      // Add owners for each landlord
      const owner = {
        landlordId: newLandlord.id,
        name: ["John Doe", "Robert Johnson", "Maria Garcia", "David Wilson"][Math.floor(Math.random() * 4)],
        contactNumber: `(555) ${Math.floor(100 + Math.random() * 900)}-${Math.floor(1000 + Math.random() * 9000)}`,
        birthday: new Date(new Date().getFullYear() - 40 - Math.floor(Math.random() * 20), Math.floor(Math.random() * 12), Math.floor(1 + Math.random() * 28)),
      };
      
      await this.createLandlordOwner(owner);
      
      // Add tenants for some properties
      if (landlord.propertyAddress !== "101 Pine St, #3C") {
        const tenant = {
          propertyAddress: landlord.propertyAddress,
          serviceType: Math.random() > 0.5 ? ServiceType.FULL_SERVICE : ServiceType.TENANT_REPLACEMENT,
          moveInDate: new Date(2023, Math.floor(Math.random() * 3), 15), // Jan-Mar 2023
          name: ["Jane Smith", "Sarah Williams", "Michael Chen"][Math.floor(Math.random() * 3)],
          contactNumber: `(555) ${Math.floor(100 + Math.random() * 900)}-${Math.floor(1000 + Math.random() * 9000)}`,
          email: `tenant${Math.floor(Math.random() * 100)}@example.com`,
          birthday: new Date(new Date().getFullYear() - 30 - Math.floor(Math.random() * 20), Math.floor(Math.random() * 12), Math.floor(1 + Math.random() * 28)),
        };
        
        await this.createTenant(tenant);
        
        // Add rental rate increases
        const increaseDate = new Date(2023, Math.floor(Math.random() * 4), 15); // Jan-Apr 2023
        const latestRate = 1500 + Math.floor(Math.random() * 1000);
        
        const rentalIncrease = {
          propertyAddress: landlord.propertyAddress,
          latestRateIncreaseDate: increaseDate,
          latestRentalRate: latestRate,
          nextAllowableRentalIncreaseDate: add(increaseDate, { years: 1 }),
          nextAllowableRentalRate: parseFloat((latestRate * 1.03).toFixed(2)),
          reminderDate: new Date(increaseDate.getFullYear(), increaseDate.getMonth() + 8, 1), // 8 months later, 1st of month
        };
        
        await this.createRentalRateIncrease(rentalIncrease);
        
        // Add rental history (1-2 entries per property)
        const previousRate = latestRate - 50 - Math.floor(Math.random() * 100);
        
        await this.createRentalRateHistory({
          propertyAddress: landlord.propertyAddress,
          increaseDate: increaseDate,
          previousRate: previousRate,
          newRate: latestRate,
          notes: "Standard annual increase",
        });
        
        // Add another history entry for some properties
        if (Math.random() > 0.5) {
          const olderDate = add(increaseDate, { years: -1 });
          const olderPreviousRate = previousRate - 50 - Math.floor(Math.random() * 50);
          
          await this.createRentalRateHistory({
            propertyAddress: landlord.propertyAddress,
            increaseDate: olderDate,
            previousRate: olderPreviousRate,
            newRate: previousRate,
            notes: "Standard annual increase",
          });
        }
      } else {
        // Add rental info for vacant property
        const latestRate = 1500 + Math.floor(Math.random() * 1000);
        const increaseDate = add(new Date(), { months: -6 });
        
        const rentalIncrease = {
          propertyAddress: landlord.propertyAddress,
          latestRateIncreaseDate: increaseDate,
          latestRentalRate: latestRate,
          nextAllowableRentalIncreaseDate: add(increaseDate, { years: 1 }),
          nextAllowableRentalRate: parseFloat((latestRate * 1.03).toFixed(2)),
          reminderDate: new Date(increaseDate.getFullYear(), increaseDate.getMonth() + 8, 1),
        };
        
        await this.createRentalRateIncrease(rentalIncrease);
      }
    });
  }
}

import { db } from "./db";
import { eq, and, isNull, desc, asc, gte, lte } from "drizzle-orm";
import { format, addMonths, addDays } from "date-fns";

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

  async createLandlord(landlord: InsertLandlord): Promise<Landlord> {
    const [newLandlord] = await db
      .insert(landlords)
      .values(landlord)
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

  async createLandlordOwner(owner: InsertLandlordOwner): Promise<LandlordOwner> {
    const [newOwner] = await db
      .insert(landlordOwners)
      .values(owner)
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

  async createTenant(tenant: InsertTenant): Promise<Tenant> {
    const [newTenant] = await db
      .insert(tenants)
      .values(tenant)
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

  async createRentalRateIncrease(increase: InsertRentalRateIncrease): Promise<RentalRateIncrease> {
    const [newIncrease] = await db
      .insert(rentalRateIncreases)
      .values(increase)
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

  async createRentalRateHistory(history: InsertRentalRateHistory): Promise<RentalRateHistory> {
    const [newHistory] = await db
      .insert(rentalRateHistory)
      .values(history)
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
    return result.filter(Boolean).sort((a, b) => b.monthsSinceIncrease - a.monthsSinceIncrease);
  }

  async getBirthdayReminders(month?: number): Promise<any[]> {
    // Get all landlord owners with birthdays
    const ownersWithBirthdays = await db
      .select()
      .from(landlordOwners)
      .where(isNull(landlordOwners.birthday).not());
    
    // Get all tenants with birthdays
    const tenantsWithBirthdays = await db
      .select()
      .from(tenants)
      .where(and(
        isNull(tenants.birthday).not(),
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

// Use the DatabaseStorage implementation instead of MemStorage
export const storage = new DatabaseStorage();
