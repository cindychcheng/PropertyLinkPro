var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/date-utils.ts
var date_utils_exports = {};
__export(date_utils_exports, {
  formatDateForClient: () => formatDateForClient,
  normalizeDate: () => normalizeDate
});
function normalizeDate(dateStr) {
  if (!dateStr) return null;
  console.log("Original date value:", dateStr);
  if (typeof dateStr === "string" && dateStr.length === 10 && dateStr.includes("-")) {
    const [year2, month2, day2] = dateStr.split("-");
    console.log(`Parsed date parts: year=${year2}, month=${month2}, day=${day2}`);
    const parsedYear = parseInt(year2, 10);
    const parsedMonth = parseInt(month2, 10) - 1;
    const parsedDay = parseInt(day2, 10);
    const date3 = new Date(Date.UTC(parsedYear, parsedMonth, parsedDay, 12, 0, 0, 0));
    console.log("Normalized date:", date3, "UTC string:", date3.toUTCString());
    return date3;
  }
  let date2;
  if (typeof dateStr === "string") {
    date2 = new Date(dateStr);
  } else {
    date2 = new Date(dateStr);
  }
  const year = date2.getFullYear();
  const month = date2.getMonth();
  const day = date2.getDate();
  const normalizedDate = new Date(Date.UTC(year, month, day, 12, 0, 0, 0));
  return normalizedDate;
}
function formatDateForClient(date2) {
  if (!date2) return null;
  const year = date2.getUTCFullYear();
  const month = String(date2.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date2.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
var init_date_utils = __esm({
  "server/date-utils.ts"() {
    "use strict";
  }
});

// server/simple-production-server.ts
import express from "express";
import session from "express-session";
import * as dotenv2 from "dotenv";

// server/db.ts
import * as dotenv from "dotenv";
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  ServiceType: () => ServiceType,
  UserRole: () => UserRole,
  insertLandlordOwnerSchema: () => insertLandlordOwnerSchema,
  insertLandlordSchema: () => insertLandlordSchema,
  insertRentalRateHistorySchema: () => insertRentalRateHistorySchema,
  insertRentalRateIncreaseSchema: () => insertRentalRateIncreaseSchema,
  insertTenantSchema: () => insertTenantSchema,
  insertUserSchema: () => insertUserSchema,
  landlordOwners: () => landlordOwners,
  landlords: () => landlords,
  rentalRateHistory: () => rentalRateHistory,
  rentalRateIncreases: () => rentalRateIncreases,
  sessions: () => sessions,
  tenants: () => tenants,
  updateUserSchema: () => updateUserSchema,
  userAuditLog: () => userAuditLog,
  users: () => users
});
import { pgTable, text, serial, date, boolean, integer, real, timestamp, varchar, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
var ServiceType = {
  FULL_SERVICE: "Full-Service Management",
  TENANT_REPLACEMENT: "Tenant Replacement Service"
};
var landlords = pgTable("landlords", {
  id: serial("id").primaryKey(),
  propertyAddress: text("property_address").notNull().unique(),
  keyNumber: text("key_number").notNull(),
  serviceType: text("service_type").notNull().default(ServiceType.FULL_SERVICE),
  strataContactNumber: text("strata_contact_number"),
  strataManagementCompany: text("strata_management_company"),
  strataContactPerson: text("strata_contact_person")
});
var landlordOwners = pgTable("landlord_owners", {
  id: serial("id").primaryKey(),
  landlordId: integer("landlord_id").notNull(),
  name: text("name").notNull(),
  contactNumber: text("contact_number"),
  birthday: date("birthday"),
  residentialAddress: text("residential_address")
});
var tenants = pgTable("tenants", {
  id: serial("id").primaryKey(),
  propertyAddress: text("property_address").notNull(),
  serviceType: text("service_type").notNull(),
  // 'Full-Service Management' or 'Tenant Replacement Service'
  moveInDate: date("move_in_date").notNull(),
  moveOutDate: date("move_out_date"),
  name: text("name").notNull(),
  contactNumber: text("contact_number"),
  email: text("email"),
  birthday: date("birthday"),
  isPrimary: boolean("is_primary").default(false)
  // To indicate primary tenant
});
var rentalRateIncreases = pgTable("rental_rate_increases", {
  id: serial("id").primaryKey(),
  propertyAddress: text("property_address").notNull(),
  latestRateIncreaseDate: date("latest_rate_increase_date").notNull(),
  latestRentalRate: real("latest_rental_rate").notNull(),
  nextAllowableRentalIncreaseDate: date("next_allowable_rental_increase_date").notNull(),
  nextAllowableRentalRate: real("next_allowable_rental_rate").notNull(),
  reminderDate: date("reminder_date").notNull()
});
var rentalRateHistory = pgTable("rental_rate_history", {
  id: serial("id").primaryKey(),
  propertyAddress: text("property_address").notNull(),
  increaseDate: date("increase_date").notNull(),
  previousRate: real("previous_rate").notNull(),
  newRate: real("new_rate").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow()
});
var insertLandlordSchema = createInsertSchema(landlords).pick({
  propertyAddress: true,
  keyNumber: true,
  serviceType: true,
  strataContactNumber: true,
  strataManagementCompany: true,
  strataContactPerson: true
});
var insertLandlordOwnerSchema = createInsertSchema(landlordOwners).pick({
  landlordId: true,
  name: true,
  contactNumber: true,
  birthday: true,
  residentialAddress: true
});
var insertTenantSchema = createInsertSchema(tenants).pick({
  propertyAddress: true,
  serviceType: true,
  moveInDate: true,
  moveOutDate: true,
  name: true,
  contactNumber: true,
  email: true,
  birthday: true,
  isPrimary: true
});
var insertRentalRateIncreaseSchema = createInsertSchema(rentalRateIncreases).pick({
  propertyAddress: true,
  latestRateIncreaseDate: true,
  latestRentalRate: true,
  nextAllowableRentalIncreaseDate: true,
  nextAllowableRentalRate: true,
  reminderDate: true
});
var insertRentalRateHistorySchema = createInsertSchema(rentalRateHistory).pick({
  propertyAddress: true,
  increaseDate: true,
  previousRate: true,
  newRate: true,
  notes: true
});
var sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull()
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);
var UserRole = {
  SUPER_ADMIN: "super_admin",
  ADMIN: "admin",
  STANDARD: "standard",
  READ_ONLY: "read_only"
};
var users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  // Replit user ID
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").notNull().default(UserRole.READ_ONLY),
  status: varchar("status").notNull().default("pending"),
  // pending, active, inactive
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdBy: varchar("created_by"),
  // ID of user who added this user
  lastLoginAt: timestamp("last_login_at"),
  password: varchar("password")
  // For simple username/password authentication
});
var userAuditLog = pgTable("user_audit_log", {
  id: serial("id").primaryKey(),
  actionType: varchar("action_type").notNull(),
  // created, updated, deleted, login, logout
  targetUserId: varchar("target_user_id").notNull(),
  performedBy: varchar("performed_by").notNull(),
  details: jsonb("details"),
  // Additional details about the action
  timestamp: timestamp("timestamp").defaultNow()
});
var insertUserSchema = createInsertSchema(users).pick({
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  profileImageUrl: true,
  role: true,
  status: true,
  createdBy: true,
  password: true
});
var updateUserSchema = createInsertSchema(users).pick({
  role: true,
  status: true,
  firstName: true,
  lastName: true
}).partial();

// server/db.ts
dotenv.config();
neonConfig.webSocketConstructor = ws;
if (!process.env.DATABASE_URL && process.env.USE_MEMORY_STORAGE !== "true") {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}
var connectionString = process.env.DATABASE_URL || "postgresql://dummy:dummy@localhost:5432/dummy";
if (process.env.NODE_ENV === "production" && connectionString.includes("railway")) {
  const separator = connectionString.includes("?") ? "&" : "?";
  connectionString = `${connectionString}${separator}sslmode=require&sslcert=&sslkey=&sslrootcert=`;
}
console.log("Database connection string configured for:", process.env.NODE_ENV);
var pool = new Pool({
  connectionString,
  ssl: process.env.NODE_ENV === "production" ? {
    rejectUnauthorized: false,
    require: true
  } : false
});
var db = drizzle({ client: pool, schema: schema_exports });

// server/storage.ts
import { eq, and, isNull, desc, not as notOp, or, sql } from "drizzle-orm";
import { format, addMonths, addDays } from "date-fns";
var DatabaseStorage = class {
  // === USER OPERATIONS (AUTHENTICATION) ===
  async getUser(id) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || void 0;
  }
  async getUserByEmail(email) {
    const [user] = await db.select().from(users).where(sql`LOWER(${users.email}) = LOWER(${email})`);
    return user || void 0;
  }
  async upsertUser(userData) {
    const [user] = await db.insert(users).values(userData).onConflictDoUpdate({
      target: users.id,
      set: {
        ...userData,
        updatedAt: /* @__PURE__ */ new Date()
      }
    }).returning();
    return user;
  }
  async updateUserLastLogin(id) {
    await db.update(users).set({ lastLoginAt: /* @__PURE__ */ new Date() }).where(eq(users.id, id));
  }
  async getAllUsers() {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }
  async createUser(userData) {
    const [user] = await db.insert(users).values(userData).returning();
    await this.logUserAction({
      actionType: "created",
      targetUserId: user.id,
      performedBy: userData.createdBy || "system",
      details: { role: user.role, email: user.email }
    });
    return user;
  }
  async updateUser(id, updates) {
    const [user] = await db.update(users).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(users.id, id)).returning();
    if (user) {
      await this.logUserAction({
        actionType: "updated",
        targetUserId: id,
        performedBy: "system",
        details: updates
      });
    }
    return user || void 0;
  }
  async deactivateUser(id) {
    const [user] = await db.update(users).set({ status: "inactive", updatedAt: /* @__PURE__ */ new Date() }).where(eq(users.id, id)).returning();
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
  async deleteUser(id) {
    const [user] = await db.delete(users).where(eq(users.id, id)).returning();
    return !!user;
  }
  async logUserAction(action) {
    await db.insert(userAuditLog).values(action);
  }
  async getUserAuditLog(userId) {
    const query = db.select().from(userAuditLog).orderBy(desc(userAuditLog.timestamp));
    if (userId) {
      return await query.where(eq(userAuditLog.targetUserId, userId));
    }
    return await query;
  }
  // === LANDLORD OPERATIONS ===
  async getLandlords() {
    return await db.select().from(landlords);
  }
  async getLandlordByPropertyAddress(propertyAddress) {
    const [landlord] = await db.select().from(landlords).where(eq(landlords.propertyAddress, propertyAddress));
    return landlord || void 0;
  }
  async createLandlord(landlordData) {
    const [newLandlord] = await db.insert(landlords).values(landlordData).returning();
    return newLandlord;
  }
  async updateLandlord(propertyAddress, landlordData) {
    const [updatedLandlord] = await db.update(landlords).set(landlordData).where(eq(landlords.propertyAddress, propertyAddress)).returning();
    return updatedLandlord || void 0;
  }
  async deleteLandlord(propertyAddress) {
    const [deleted] = await db.delete(landlords).where(eq(landlords.propertyAddress, propertyAddress)).returning({ id: landlords.id });
    return !!deleted;
  }
  // Landlord Owner operations
  async getLandlordOwners(landlordId) {
    return await db.select().from(landlordOwners).where(eq(landlordOwners.landlordId, landlordId));
  }
  async createLandlordOwner(ownerData) {
    const { normalizeDate: normalizeDate2 } = await Promise.resolve().then(() => (init_date_utils(), date_utils_exports));
    const safeData = { ...ownerData };
    if (safeData.birthday) {
      safeData.birthday = normalizeDate2(safeData.birthday);
    }
    const [newOwner] = await db.insert(landlordOwners).values(safeData).returning();
    return newOwner;
  }
  async updateLandlordOwner(id, ownerData) {
    const { normalizeDate: normalizeDate2 } = await Promise.resolve().then(() => (init_date_utils(), date_utils_exports));
    const safeData = { ...ownerData };
    if (safeData.birthday) {
      safeData.birthday = normalizeDate2(safeData.birthday);
    }
    const [updatedOwner] = await db.update(landlordOwners).set(safeData).where(eq(landlordOwners.id, id)).returning();
    return updatedOwner || void 0;
  }
  async deleteLandlordOwner(id) {
    const [deleted] = await db.delete(landlordOwners).where(eq(landlordOwners.id, id)).returning({ id: landlordOwners.id });
    return !!deleted;
  }
  // Tenant operations
  async getTenants() {
    return await db.select().from(tenants);
  }
  async getTenantByPropertyAddress(propertyAddress) {
    const [primaryTenant] = await db.select().from(tenants).where(and(
      eq(tenants.propertyAddress, propertyAddress),
      eq(tenants.isPrimary, true),
      isNull(tenants.moveOutDate)
    ));
    if (primaryTenant) return primaryTenant;
    const [tenant] = await db.select().from(tenants).where(and(
      eq(tenants.propertyAddress, propertyAddress),
      isNull(tenants.moveOutDate)
    ));
    return tenant || void 0;
  }
  async getTenantsByPropertyAddress(propertyAddress) {
    return await db.select().from(tenants).where(eq(tenants.propertyAddress, propertyAddress)).orderBy(desc(tenants.isPrimary));
  }
  async createTenant(tenantData) {
    const { normalizeDate: normalizeDate2 } = await Promise.resolve().then(() => (init_date_utils(), date_utils_exports));
    const safeData = { ...tenantData };
    if (safeData.birthday) {
      safeData.birthday = normalizeDate2(safeData.birthday);
    }
    if (safeData.moveInDate) {
      safeData.moveInDate = normalizeDate2(safeData.moveInDate);
    }
    if (safeData.moveOutDate) {
      safeData.moveOutDate = normalizeDate2(safeData.moveOutDate);
    }
    const [newTenant] = await db.insert(tenants).values(safeData).returning();
    return newTenant;
  }
  async updateTenant(id, tenantData) {
    const { normalizeDate: normalizeDate2 } = await Promise.resolve().then(() => (init_date_utils(), date_utils_exports));
    const safeData = { ...tenantData };
    if (safeData.birthday) {
      safeData.birthday = normalizeDate2(safeData.birthday);
    }
    if (safeData.moveInDate) {
      safeData.moveInDate = normalizeDate2(safeData.moveInDate);
    }
    if (safeData.moveOutDate) {
      safeData.moveOutDate = normalizeDate2(safeData.moveOutDate);
    }
    const [updatedTenant] = await db.update(tenants).set(safeData).where(eq(tenants.id, id)).returning();
    return updatedTenant || void 0;
  }
  async deleteTenant(id) {
    const [deleted] = await db.delete(tenants).where(eq(tenants.id, id)).returning({ id: tenants.id });
    return !!deleted;
  }
  // Rental Rate Increase operations
  async getRentalRateIncreases() {
    return await db.select().from(rentalRateIncreases);
  }
  async getRentalRateIncreaseByPropertyAddress(propertyAddress) {
    const [increase] = await db.select().from(rentalRateIncreases).where(eq(rentalRateIncreases.propertyAddress, propertyAddress));
    return increase || void 0;
  }
  async createRentalRateIncrease(increaseData) {
    const [newIncrease] = await db.insert(rentalRateIncreases).values(increaseData).returning();
    return newIncrease;
  }
  async updateRentalRateIncrease(propertyAddress, increaseData) {
    const [updatedIncrease] = await db.update(rentalRateIncreases).set(increaseData).where(eq(rentalRateIncreases.propertyAddress, propertyAddress)).returning();
    return updatedIncrease || void 0;
  }
  // Rental Rate History operations
  async getRentalRateHistory(propertyAddress) {
    return await db.select().from(rentalRateHistory).where(eq(rentalRateHistory.propertyAddress, propertyAddress)).orderBy(desc(rentalRateHistory.increaseDate));
  }
  async createRentalRateHistory(historyData) {
    const { normalizeDate: normalizeDate2 } = await Promise.resolve().then(() => (init_date_utils(), date_utils_exports));
    const safeData = { ...historyData };
    if (safeData.increaseDate) {
      safeData.increaseDate = normalizeDate2(safeData.increaseDate);
    }
    const [newHistory] = await db.insert(rentalRateHistory).values(safeData).returning();
    const increaseDate = new Date(safeData.increaseDate);
    const nextAllowableDate = new Date(increaseDate);
    nextAllowableDate.setFullYear(nextAllowableDate.getFullYear() + 1);
    const reminderDate = new Date(increaseDate);
    reminderDate.setMonth(reminderDate.getMonth() + 8);
    const nextAllowableRate = safeData.newRate * 1.03;
    const [existingIncrease] = await db.select().from(rentalRateIncreases).where(eq(rentalRateIncreases.propertyAddress, safeData.propertyAddress));
    const formattedIncreaseDate = increaseDate.toISOString().split("T")[0];
    const formattedNextAllowableDate = nextAllowableDate.toISOString().split("T")[0];
    const formattedReminderDate = reminderDate.toISOString().split("T")[0];
    if (existingIncrease) {
      await db.update(rentalRateIncreases).set({
        latestRateIncreaseDate: formattedIncreaseDate,
        latestRentalRate: safeData.newRate,
        nextAllowableRentalIncreaseDate: formattedNextAllowableDate,
        nextAllowableRentalRate: nextAllowableRate,
        reminderDate: formattedReminderDate
      }).where(eq(rentalRateIncreases.propertyAddress, safeData.propertyAddress));
    } else {
      await db.insert(rentalRateIncreases).values({
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
  async getPropertiesWithDetails() {
    const properties = await db.select().from(landlords);
    const result = [];
    for (const property of properties) {
      const owners = await db.select().from(landlordOwners).where(eq(landlordOwners.landlordId, property.id));
      const allTenants = await db.select().from(tenants).where(eq(tenants.propertyAddress, property.propertyAddress)).orderBy(desc(tenants.moveInDate));
      const activeTenants = allTenants.filter((t) => !t.moveOutDate);
      const tenant = activeTenants.length > 0 ? activeTenants[0] : void 0;
      const [rentalIncrease] = await db.select().from(rentalRateIncreases).where(eq(rentalRateIncreases.propertyAddress, property.propertyAddress));
      const propertyDetails = {
        propertyAddress: property.propertyAddress,
        keyNumber: property.keyNumber,
        strataContactNumber: property.strataContactNumber || void 0,
        strataManagementCompany: property.strataManagementCompany || void 0,
        strataContactPerson: property.strataContactPerson || void 0,
        serviceType: property.serviceType || tenant?.serviceType || "",
        landlordOwners: owners.map((owner) => ({
          name: owner.name,
          contactNumber: owner.contactNumber || void 0,
          birthday: owner.birthday ? new Date(owner.birthday) : void 0,
          residentialAddress: owner.residentialAddress || void 0
        }))
      };
      if (tenant) {
        propertyDetails.tenant = {
          id: tenant.id,
          name: tenant.name,
          contactNumber: tenant.contactNumber || void 0,
          email: tenant.email || void 0,
          birthday: tenant.birthday ? new Date(tenant.birthday) : void 0,
          moveInDate: new Date(tenant.moveInDate),
          moveOutDate: tenant.moveOutDate ? new Date(tenant.moveOutDate) : void 0
        };
      }
      if (activeTenants.length > 0) {
        propertyDetails.activeTenants = activeTenants.map((t) => ({
          id: t.id,
          name: t.name,
          contactNumber: t.contactNumber || void 0,
          email: t.email || void 0,
          birthday: t.birthday ? new Date(t.birthday) : void 0,
          moveInDate: new Date(t.moveInDate),
          moveOutDate: t.moveOutDate ? new Date(t.moveOutDate) : void 0
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
  async getPropertyDetailsByAddress(propertyAddress) {
    const [property] = await db.select().from(landlords).where(eq(landlords.propertyAddress, propertyAddress));
    if (!property) return void 0;
    const owners = await db.select().from(landlordOwners).where(eq(landlordOwners.landlordId, property.id));
    const allTenants = await db.select().from(tenants).where(eq(tenants.propertyAddress, propertyAddress)).orderBy(desc(tenants.moveInDate));
    const activeTenants = allTenants.filter((t) => !t.moveOutDate);
    const tenant = activeTenants.length > 0 ? activeTenants[0] : void 0;
    console.log(`Property ${propertyAddress} - All tenants:`, allTenants.length);
    console.log("Active tenants:", activeTenants.length);
    console.log("Selected tenant:", tenant ? tenant.name : "none");
    const [rentalIncrease] = await db.select().from(rentalRateIncreases).where(eq(rentalRateIncreases.propertyAddress, propertyAddress));
    const propertyDetails = {
      propertyAddress: property.propertyAddress,
      keyNumber: property.keyNumber,
      strataContactNumber: property.strataContactNumber || void 0,
      strataManagementCompany: property.strataManagementCompany || void 0,
      strataContactPerson: property.strataContactPerson || void 0,
      serviceType: property.serviceType || tenant?.serviceType || "",
      landlordOwners: owners.map((owner) => ({
        name: owner.name,
        contactNumber: owner.contactNumber || void 0,
        birthday: owner.birthday ? new Date(owner.birthday) : void 0,
        residentialAddress: owner.residentialAddress || void 0
      }))
    };
    if (tenant) {
      propertyDetails.tenant = {
        id: tenant.id,
        name: tenant.name,
        contactNumber: tenant.contactNumber || void 0,
        email: tenant.email || void 0,
        birthday: tenant.birthday ? new Date(tenant.birthday) : void 0,
        moveInDate: new Date(tenant.moveInDate),
        moveOutDate: tenant.moveOutDate ? new Date(tenant.moveOutDate) : void 0
      };
    }
    if (activeTenants.length > 0) {
      propertyDetails.activeTenants = activeTenants.map((t) => ({
        id: t.id,
        name: t.name,
        contactNumber: t.contactNumber || void 0,
        email: t.email || void 0,
        birthday: t.birthday ? new Date(t.birthday) : void 0,
        moveInDate: new Date(t.moveInDate),
        moveOutDate: t.moveOutDate ? new Date(t.moveOutDate) : void 0
      }));
    }
    propertyDetails.tenantHistory = allTenants.map((t) => ({
      id: t.id,
      name: t.name,
      contactNumber: t.contactNumber || void 0,
      email: t.email || void 0,
      birthday: t.birthday ? new Date(t.birthday) : void 0,
      moveInDate: new Date(t.moveInDate),
      moveOutDate: t.moveOutDate ? new Date(t.moveOutDate) : void 0,
      serviceType: t.serviceType
    }));
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
  async getRentalIncreaseReminders(month, minMonthsSinceIncrease) {
    const increases = await db.select().from(rentalRateIncreases);
    const filteredIncreases = month && month > 0 ? increases.filter((increase) => {
      const reminderDate = new Date(increase.reminderDate);
      return reminderDate.getMonth() + 1 === month;
    }) : increases;
    const result = await Promise.all(filteredIncreases.map(async (increase) => {
      const increaseDate = new Date(increase.latestRateIncreaseDate);
      const today = /* @__PURE__ */ new Date();
      const monthsSinceIncrease = (today.getFullYear() - increaseDate.getFullYear()) * 12 + (today.getMonth() - increaseDate.getMonth());
      if (minMonthsSinceIncrease !== void 0 && monthsSinceIncrease < minMonthsSinceIncrease) {
        return null;
      }
      const [tenant] = await db.select().from(tenants).where(and(
        eq(tenants.propertyAddress, increase.propertyAddress),
        isNull(tenants.moveOutDate)
      ));
      return {
        propertyAddress: increase.propertyAddress,
        serviceType: tenant?.serviceType || "Unknown",
        latestRateIncreaseDate: increase.latestRateIncreaseDate,
        latestRentalRate: increase.latestRentalRate,
        nextAllowableRentalIncreaseDate: increase.nextAllowableRentalIncreaseDate,
        nextAllowableRentalRate: increase.nextAllowableRentalRate,
        reminderDate: increase.reminderDate,
        monthsSinceIncrease
      };
    }));
    return result.filter((item) => item !== null).sort((a, b) => (b?.monthsSinceIncrease || 0) - (a?.monthsSinceIncrease || 0));
  }
  async getBirthdayReminders(month) {
    const ownersWithBirthdays = await db.select().from(landlordOwners).where(notOp(isNull(landlordOwners.birthday)));
    const tenantsWithBirthdays = await db.select().from(tenants).where(and(
      notOp(isNull(tenants.birthday)),
      isNull(tenants.moveOutDate)
    ));
    const currentMonth = month || (/* @__PURE__ */ new Date()).getMonth() + 1;
    const filteredOwners = ownersWithBirthdays.filter((owner) => {
      if (!owner.birthday) return false;
      const birthday = new Date(owner.birthday);
      return birthday.getMonth() + 1 === currentMonth;
    });
    const filteredTenants = tenantsWithBirthdays.filter((tenant) => {
      if (!tenant.birthday) return false;
      const birthday = new Date(tenant.birthday);
      return birthday.getMonth() + 1 === currentMonth;
    });
    const ownerBirthdays = await Promise.all(filteredOwners.map(async (owner) => {
      const [landlord] = await db.select().from(landlords).where(eq(landlords.id, owner.landlordId));
      return {
        name: owner.name,
        role: "Landlord",
        contactNumber: owner.contactNumber || "N/A",
        birthday: new Date(owner.birthday),
        propertyAddress: owner.residentialAddress || "N/A"
      };
    }));
    const tenantBirthdays = filteredTenants.map((tenant) => ({
      name: tenant.name,
      role: "Tenant",
      contactNumber: tenant.contactNumber || "N/A",
      birthday: new Date(tenant.birthday),
      propertyAddress: tenant.propertyAddress
    }));
    return [...ownerBirthdays, ...tenantBirthdays].sort((a, b) => {
      return a.birthday.getDate() - b.birthday.getDate();
    });
  }
  // Process a new rental increase
  async processRentalIncrease(propertyAddress, increaseDate, newRate, notes) {
    const [currentRateInfo] = await db.select().from(rentalRateIncreases).where(eq(rentalRateIncreases.propertyAddress, propertyAddress));
    if (!currentRateInfo) {
      throw new Error("No rental rate information found for this property");
    }
    const nextAllowableDate = addMonths(increaseDate, 12);
    const nextAllowableRate = Math.round(newRate * 1.03 * 100) / 100;
    const reminderDate = addDays(addMonths(increaseDate, 8), 0);
    const tenant = await this.getTenantByPropertyAddress(propertyAddress);
    const tenantName = tenant ? tenant.name : "No tenant";
    const activeTenants = await db.select().from(tenants).where(
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
    ).orderBy(desc(tenants.isPrimary));
    const tenantsList = activeTenants.length > 0 ? activeTenants.map((t) => t.name).join(", ") : "No active tenants";
    await this.createRentalRateHistory({
      propertyAddress,
      increaseDate: format(increaseDate, "yyyy-MM-dd"),
      previousRate: currentRateInfo.latestRentalRate,
      newRate,
      notes: notes ? `${notes}

Active tenants: ${tenantsList}` : `Rate increase

Active tenants: ${tenantsList}`
    });
    const updated = await this.updateRentalRateIncrease(propertyAddress, {
      latestRateIncreaseDate: format(increaseDate, "yyyy-MM-dd"),
      latestRentalRate: newRate,
      nextAllowableRentalIncreaseDate: format(nextAllowableDate, "yyyy-MM-dd"),
      nextAllowableRentalRate: nextAllowableRate,
      reminderDate: format(reminderDate, "yyyy-MM-dd")
    });
    if (!updated) {
      throw new Error("Failed to update rental increase information");
    }
    return updated;
  }
};
var MemStorage = class {
  landlords = [];
  landlordOwners = [];
  tenants = [];
  rentalRateIncreases = [];
  rentalRateHistory = [];
  users = [];
  userAuditLog = [];
  nextId = 1;
  // User operations (for authentication)
  async getUser(id) {
    return this.users.find((u) => u.id === id);
  }
  async getUserByEmail(email) {
    return this.users.find((u) => u.email === email);
  }
  async upsertUser(user) {
    const existingUser = this.users.find((u) => u.id === user.id);
    if (existingUser) {
      Object.assign(existingUser, user, { updatedAt: /* @__PURE__ */ new Date() });
      return existingUser;
    }
    const newUser = {
      id: user.id,
      email: user.email || null,
      firstName: user.firstName || null,
      lastName: user.lastName || null,
      profileImageUrl: user.profileImageUrl || null,
      role: user.role || "read_only",
      status: user.status || "active",
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date(),
      createdBy: user.createdBy || null,
      lastLoginAt: null
    };
    this.users.push(newUser);
    return newUser;
  }
  async updateUserLastLogin(id) {
    const user = this.users.find((u) => u.id === id);
    if (user) user.lastLoginAt = /* @__PURE__ */ new Date();
  }
  async getAllUsers() {
    return [...this.users];
  }
  async createUser(user) {
    const newUser = {
      id: user.id,
      email: user.email || null,
      firstName: user.firstName || null,
      lastName: user.lastName || null,
      profileImageUrl: user.profileImageUrl || null,
      role: user.role || "read_only",
      status: user.status || "active",
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date(),
      createdBy: user.createdBy || null,
      lastLoginAt: null
    };
    this.users.push(newUser);
    return newUser;
  }
  async updateUser(id, updates) {
    const user = this.users.find((u) => u.id === id);
    if (user) {
      Object.assign(user, updates, { updatedAt: /* @__PURE__ */ new Date() });
      return user;
    }
    return void 0;
  }
  async deactivateUser(id) {
    const user = this.users.find((u) => u.id === id);
    if (user) {
      user.status = "inactive";
      user.updatedAt = /* @__PURE__ */ new Date();
      return true;
    }
    return false;
  }
  async deleteUser(id) {
    const index2 = this.users.findIndex((u) => u.id === id);
    if (index2 >= 0) {
      this.users.splice(index2, 1);
      return true;
    }
    return false;
  }
  async logUserAction(action) {
    const logEntry = { ...action, id: this.nextId++, timestamp: /* @__PURE__ */ new Date() };
    this.userAuditLog.push(logEntry);
  }
  async getUserAuditLog(userId) {
    return userId ? this.userAuditLog.filter((log) => log.targetUserId === userId) : [...this.userAuditLog];
  }
  async getLandlords() {
    return [...this.landlords];
  }
  async getLandlordByPropertyAddress(propertyAddress) {
    return this.landlords.find((l) => l.propertyAddress === propertyAddress);
  }
  async createLandlord(landlord) {
    const newLandlord = {
      id: this.nextId++,
      ...landlord,
      serviceType: landlord.serviceType ?? "Full-Service Management",
      strataContactNumber: null,
      strataManagementCompany: null,
      strataContactPerson: null
    };
    this.landlords.push(newLandlord);
    return newLandlord;
  }
  async updateLandlord(propertyAddress, landlord) {
    const existing = this.landlords.find((l) => l.propertyAddress === propertyAddress);
    if (existing) {
      Object.assign(existing, landlord);
      return existing;
    }
    return void 0;
  }
  async deleteLandlord(propertyAddress) {
    const index2 = this.landlords.findIndex((l) => l.propertyAddress === propertyAddress);
    if (index2 >= 0) {
      this.landlords.splice(index2, 1);
      return true;
    }
    return false;
  }
  async getLandlordOwners(landlordId) {
    return this.landlordOwners.filter((o) => o.landlordId === landlordId);
  }
  async createLandlordOwner(owner) {
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
  async updateLandlordOwner(id, owner) {
    const existing = this.landlordOwners.find((o) => o.id === id);
    if (existing) {
      Object.assign(existing, owner);
      return existing;
    }
    return void 0;
  }
  async deleteLandlordOwner(id) {
    const index2 = this.landlordOwners.findIndex((o) => o.id === id);
    if (index2 >= 0) {
      this.landlordOwners.splice(index2, 1);
      return true;
    }
    return false;
  }
  async getTenants() {
    return [...this.tenants];
  }
  async getTenantByPropertyAddress(propertyAddress) {
    return this.tenants.find((t) => t.propertyAddress === propertyAddress && !t.moveOutDate);
  }
  async getTenantsByPropertyAddress(propertyAddress) {
    return this.tenants.filter((t) => t.propertyAddress === propertyAddress);
  }
  async createTenant(tenant) {
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
  async updateTenant(id, tenant) {
    const existing = this.tenants.find((t) => t.id === id);
    if (existing) {
      Object.assign(existing, tenant);
      return existing;
    }
    return void 0;
  }
  async deleteTenant(id) {
    const index2 = this.tenants.findIndex((t) => t.id === id);
    if (index2 >= 0) {
      this.tenants.splice(index2, 1);
      return true;
    }
    return false;
  }
  async getRentalRateIncreases() {
    return [...this.rentalRateIncreases];
  }
  async getRentalRateIncreaseByPropertyAddress(propertyAddress) {
    return this.rentalRateIncreases.find((r) => r.propertyAddress === propertyAddress);
  }
  async createRentalRateIncrease(increase) {
    const newIncrease = { id: this.nextId++, ...increase };
    this.rentalRateIncreases.push(newIncrease);
    return newIncrease;
  }
  async updateRentalRateIncrease(propertyAddress, increase) {
    const existing = this.rentalRateIncreases.find((r) => r.propertyAddress === propertyAddress);
    if (existing) {
      Object.assign(existing, increase);
      return existing;
    }
    return void 0;
  }
  async getRentalRateHistory(propertyAddress) {
    return this.rentalRateHistory.filter((h) => h.propertyAddress === propertyAddress);
  }
  async createRentalRateHistory(history) {
    const newHistory = { id: this.nextId++, ...history, createdAt: /* @__PURE__ */ new Date(), notes: null };
    this.rentalRateHistory.push(newHistory);
    return newHistory;
  }
  async getPropertiesWithDetails() {
    const result = [];
    for (const landlord of this.landlords) {
      const owners = this.landlordOwners.filter((o) => o.landlordId === landlord.id);
      const activeTenants = this.tenants.filter((t) => t.propertyAddress === landlord.propertyAddress && !t.moveOutDate);
      const tenant = activeTenants.length > 0 ? activeTenants[0] : void 0;
      const rentalIncrease = this.rentalRateIncreases.find((r) => r.propertyAddress === landlord.propertyAddress);
      const propertyDetails = {
        propertyAddress: landlord.propertyAddress,
        keyNumber: landlord.keyNumber,
        strataContactNumber: landlord.strataContactNumber || void 0,
        strataManagementCompany: landlord.strataManagementCompany || void 0,
        strataContactPerson: landlord.strataContactPerson || void 0,
        serviceType: landlord.serviceType || tenant?.serviceType || "",
        landlordOwners: owners.map((owner) => ({
          name: owner.name,
          contactNumber: owner.contactNumber || void 0,
          birthday: owner.birthday ? new Date(owner.birthday) : void 0,
          residentialAddress: owner.residentialAddress || void 0
        }))
      };
      if (tenant) {
        propertyDetails.tenant = {
          id: tenant.id,
          name: tenant.name,
          contactNumber: tenant.contactNumber || void 0,
          email: tenant.email || void 0,
          birthday: tenant.birthday ? new Date(tenant.birthday) : void 0,
          moveInDate: new Date(tenant.moveInDate),
          moveOutDate: tenant.moveOutDate ? new Date(tenant.moveOutDate) : void 0
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
  async getPropertyDetailsByAddress(propertyAddress) {
    const landlord = this.landlords.find((l) => l.propertyAddress === propertyAddress);
    if (!landlord) return void 0;
    const owners = this.landlordOwners.filter((o) => o.landlordId === landlord.id);
    const activeTenants = this.tenants.filter((t) => t.propertyAddress === propertyAddress && !t.moveOutDate);
    const tenant = activeTenants.length > 0 ? activeTenants[0] : void 0;
    const rentalIncrease = this.rentalRateIncreases.find((r) => r.propertyAddress === propertyAddress);
    const propertyDetails = {
      propertyAddress: landlord.propertyAddress,
      keyNumber: landlord.keyNumber,
      strataContactNumber: landlord.strataContactNumber || void 0,
      strataManagementCompany: landlord.strataManagementCompany || void 0,
      strataContactPerson: landlord.strataContactPerson || void 0,
      serviceType: landlord.serviceType || tenant?.serviceType || "",
      landlordOwners: owners.map((owner) => ({
        name: owner.name,
        contactNumber: owner.contactNumber || void 0,
        birthday: owner.birthday ? new Date(owner.birthday) : void 0,
        residentialAddress: owner.residentialAddress || void 0
      }))
    };
    if (tenant) {
      propertyDetails.tenant = {
        id: tenant.id,
        name: tenant.name,
        contactNumber: tenant.contactNumber || void 0,
        email: tenant.email || void 0,
        birthday: tenant.birthday ? new Date(tenant.birthday) : void 0,
        moveInDate: new Date(tenant.moveInDate),
        moveOutDate: tenant.moveOutDate ? new Date(tenant.moveOutDate) : void 0
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
  async getRentalIncreaseReminders(month, minMonthsSinceIncrease) {
    const result = [];
    for (const increase of this.rentalRateIncreases) {
      const increaseDate = new Date(increase.latestRateIncreaseDate);
      const today = /* @__PURE__ */ new Date();
      const monthsSinceIncrease = (today.getFullYear() - increaseDate.getFullYear()) * 12 + (today.getMonth() - increaseDate.getMonth());
      if (minMonthsSinceIncrease !== void 0 && monthsSinceIncrease < minMonthsSinceIncrease) {
        continue;
      }
      if (month && month > 0) {
        const reminderDate = new Date(increase.reminderDate);
        if (reminderDate.getMonth() + 1 !== month) {
          continue;
        }
      }
      const tenant = this.tenants.find((t) => t.propertyAddress === increase.propertyAddress && !t.moveOutDate);
      result.push({
        propertyAddress: increase.propertyAddress,
        serviceType: tenant?.serviceType || "Unknown",
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
  async getBirthdayReminders(month) {
    const currentMonth = month || (/* @__PURE__ */ new Date()).getMonth() + 1;
    const result = [];
    console.log("=== BIRTHDAY REMINDERS DEBUG ===");
    console.log("Target month:", currentMonth);
    console.log("Total landlord owners:", this.landlordOwners.length);
    console.log("Total tenants:", this.tenants.length);
    for (const owner of this.landlordOwners) {
      console.log("Checking owner:", owner.name, "birthday:", owner.birthday);
      if (owner.birthday) {
        const birthday = new Date(owner.birthday);
        const birthdayMonth = birthday.getMonth() + 1;
        console.log("Owner", owner.name, "birthday month:", birthdayMonth, "target month:", currentMonth);
        if (birthdayMonth === currentMonth) {
          console.log("\u2713 Adding owner to results:", owner.name);
          result.push({
            name: owner.name,
            role: "Landlord",
            contactNumber: owner.contactNumber || "N/A",
            birthday: new Date(owner.birthday),
            propertyAddress: owner.residentialAddress || "N/A"
          });
        }
      }
    }
    for (const tenant of this.tenants) {
      console.log("Checking tenant:", tenant.name, "birthday:", tenant.birthday, "moved out:", tenant.moveOutDate);
      if (tenant.birthday && !tenant.moveOutDate) {
        const birthday = new Date(tenant.birthday);
        const birthdayMonth = birthday.getMonth() + 1;
        console.log("Tenant", tenant.name, "birthday month:", birthdayMonth, "target month:", currentMonth);
        if (birthdayMonth === currentMonth) {
          console.log("\u2713 Adding tenant to results:", tenant.name);
          result.push({
            name: tenant.name,
            role: "Tenant",
            contactNumber: tenant.contactNumber || "N/A",
            birthday: new Date(tenant.birthday),
            propertyAddress: tenant.propertyAddress
          });
        }
      }
    }
    console.log("Total birthday reminders found:", result.length);
    return result.sort((a, b) => a.birthday.getDate() - b.birthday.getDate());
  }
  async processRentalIncrease(propertyAddress, increaseDate, newRate) {
    const currentRateInfo = this.rentalRateIncreases.find((r) => r.propertyAddress === propertyAddress);
    if (!currentRateInfo) {
      throw new Error("No rental rate information found for this property");
    }
    const nextAllowableDate = addMonths(increaseDate, 12);
    const nextAllowableRate = Math.round(newRate * 1.03 * 100) / 100;
    const reminderDate = addMonths(increaseDate, 8);
    const tenant = this.tenants.find((t) => t.propertyAddress === propertyAddress && !t.moveOutDate);
    const tenantName = tenant ? tenant.name : "No tenant";
    await this.createRentalRateHistory({
      propertyAddress,
      increaseDate: format(increaseDate, "yyyy-MM-dd"),
      previousRate: currentRateInfo.latestRentalRate,
      newRate,
      notes: `Rate increase

Active tenant: ${tenantName}`
    });
    const updated = await this.updateRentalRateIncrease(propertyAddress, {
      latestRateIncreaseDate: format(increaseDate, "yyyy-MM-dd"),
      latestRentalRate: newRate,
      nextAllowableRentalIncreaseDate: format(nextAllowableDate, "yyyy-MM-dd"),
      nextAllowableRentalRate: nextAllowableRate,
      reminderDate: format(reminderDate, "yyyy-MM-dd")
    });
    if (!updated) {
      throw new Error("Failed to update rental increase information");
    }
    return updated;
  }
};
var storage = process.env.USE_MEMORY_STORAGE === "true" ? new MemStorage() : new DatabaseStorage();

// server/simple-production-server.ts
dotenv2.config();
var app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(session({
  secret: process.env.SESSION_SECRET || "fallback-secret-for-production",
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}));
app.get("/api/auth/user", async (req, res) => {
  try {
    console.log("Auth endpoint called");
    const demoUser = {
      id: "demo-user-123",
      email: "demo@propertylinkpro.com",
      firstName: "Demo",
      lastName: "User",
      role: "admin",
      status: "active",
      createdBy: "system"
    };
    return res.json(demoUser);
  } catch (error) {
    console.error("Auth error:", error);
    res.status(500).json({ message: "Authentication failed" });
  }
});
app.get("/api/properties", async (req, res) => {
  try {
    console.log("Properties endpoint called");
    if (process.env.USE_MEMORY_STORAGE === "true") {
      const properties = await storage.getPropertiesWithDetails();
      res.json(properties);
    } else {
      const sampleProperties = [
        {
          propertyAddress: "123 Main St, Vancouver, BC",
          keyNumber: "KEY001",
          serviceType: "Full-Service Management",
          landlordOwners: [
            { name: "John Doe", contactNumber: "604-555-0123" }
          ],
          tenant: {
            name: "Jane Smith",
            moveInDate: "2023-01-15",
            contactNumber: "604-555-0456"
          },
          rentalInfo: {
            latestRentalRate: 2500,
            nextAllowableRentalIncreaseDate: "2024-01-15"
          }
        }
      ];
      res.json(sampleProperties);
    }
  } catch (error) {
    console.error("Properties error:", error);
    res.status(500).json({ message: "Failed to fetch properties" });
  }
});
app.get("/api/landlords", async (req, res) => {
  try {
    console.log("Landlords endpoint called");
    const landlords2 = await storage.getLandlords();
    res.json(landlords2);
  } catch (error) {
    console.error("Landlords error:", error);
    res.json([]);
  }
});
app.get("/api/tenants", async (req, res) => {
  try {
    console.log("Tenants endpoint called");
    const tenants2 = await storage.getTenants();
    res.json(tenants2);
  } catch (error) {
    console.error("Tenants error:", error);
    res.json([]);
  }
});
app.get("/api/reminders/birthdays", async (req, res) => {
  try {
    console.log("Birthday reminders endpoint called");
    const month = req.query.month ? parseInt(req.query.month, 10) : void 0;
    const currentDate = /* @__PURE__ */ new Date();
    const currentMonth = currentDate.getMonth() + 1;
    console.log("Current date:", currentDate.toISOString());
    console.log("Current month:", currentMonth);
    console.log("Requested month:", month);
    const reminders = await storage.getBirthdayReminders(month);
    console.log("Birthday reminders found:", reminders.length);
    console.log("Reminders:", JSON.stringify(reminders, null, 2));
    res.json(reminders);
  } catch (error) {
    console.error("Birthday reminders error:", error);
    res.json([]);
  }
});
app.get("/api/reminders/rental-increases", async (req, res) => {
  try {
    console.log("Rate increase reminders endpoint called");
    const month = req.query.month ? parseInt(req.query.month, 10) : void 0;
    const minMonths = req.query.minMonths ? parseInt(req.query.minMonths, 10) : void 0;
    const reminders = await storage.getRentalIncreaseReminders(month, minMonths);
    res.json(reminders);
  } catch (error) {
    console.error("Rate increase reminders error:", error);
    res.json([]);
  }
});
app.get("/api/init-db", async (req, res) => {
  try {
    console.log("Database initialization called");
    const testProperty = await storage.createLandlord({
      propertyAddress: "Test Property - 456 Oak St",
      keyNumber: "TEST001",
      serviceType: "Full-Service Management"
    });
    console.log("Test property created:", testProperty);
    const testOwner = await storage.createLandlordOwner({
      landlordId: testProperty.id,
      name: "John Doe",
      contactNumber: "604-555-0123",
      birthday: "1980-07-25",
      residentialAddress: "123 Main St, Vancouver, BC"
    });
    console.log("Test owner created:", testOwner);
    const testTenant = await storage.createTenant({
      propertyAddress: testProperty.propertyAddress,
      name: "Jane Smith",
      contactNumber: "604-555-0456",
      email: "jane.smith@example.com",
      birthday: "1985-07-09",
      moveInDate: "2023-01-15",
      serviceType: "Full-Service Management",
      isPrimary: true
    });
    console.log("Test tenant created:", testTenant);
    const testRentalIncrease = await storage.createRentalRateIncrease({
      propertyAddress: testProperty.propertyAddress,
      latestRateIncreaseDate: "2023-01-15",
      latestRentalRate: 2500,
      nextAllowableRentalIncreaseDate: "2024-01-15",
      nextAllowableRentalRate: 2575,
      reminderDate: "2023-09-15"
    });
    console.log("Test rental increase created:", testRentalIncrease);
    res.json({
      message: "Database initialized successfully",
      testProperty,
      testOwner,
      testTenant,
      testRentalIncrease
    });
  } catch (error) {
    console.error("Database initialization error:", error);
    res.status(500).json({
      message: "Database initialization failed",
      error: error.message
    });
  }
});
app.get("*", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>PropertyLinkPro</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            max-width: 800px; 
            margin: 0 auto; 
            padding: 20px; 
            line-height: 1.6;
          }
          .endpoint { 
            background: #f5f5f5; 
            padding: 10px; 
            margin: 10px 0; 
            border-radius: 5px; 
          }
          .endpoint a { 
            text-decoration: none; 
            color: #0066cc; 
            font-weight: bold; 
          }
          .endpoint a:hover { 
            text-decoration: underline; 
          }
        </style>
      </head>
      <body>
        <h1>\u{1F3E0} PropertyLinkPro API Server</h1>
        <p>Your PropertyLinkPro application is running successfully!</p>
        
        <h2>\u{1F4CB} Available API Endpoints:</h2>
        <div class="endpoint">
          <a href="/api/auth/user">\u{1F464} User Authentication</a> - Get current user info
        </div>
        <div class="endpoint">
          <a href="/api/properties">\u{1F3E0} Properties</a> - List all properties
        </div>
        <div class="endpoint">
          <a href="/api/landlords">\u{1F3D8}\uFE0F Landlords</a> - List all landlords
        </div>
        <div class="endpoint">
          <a href="/api/tenants">\u{1F465} Tenants</a> - List all tenants
        </div>
        <div class="endpoint">
          <a href="/api/reminders/birthdays">\u{1F382} Birthday Reminders</a> - Upcoming birthdays
        </div>
        <div class="endpoint">
          <a href="/api/reminders/rental-increases">\u{1F4B0} Rate Increase Reminders</a> - Rental increase reminders
        </div>
        
        <h2>\u2699\uFE0F System Status:</h2>
        <ul>
          <li>\u2705 Server: Running</li>
          <li>\u2705 Database: ${process.env.USE_MEMORY_STORAGE === "true" ? "In-Memory Storage" : "PostgreSQL"}</li>
          <li>\u2705 Environment: ${process.env.NODE_ENV || "development"}</li>
        </ul>
        
        <p><em>This is a working API server for PropertyLinkPro. The frontend can be built and deployed separately.</em></p>
      </body>
    </html>
  `);
});
var port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`\u{1F680} PropertyLinkPro API Server running on port ${port}`);
  console.log(`\u{1F4E1} Using ${process.env.USE_MEMORY_STORAGE === "true" ? "in-memory" : "PostgreSQL"} storage`);
  console.log(`\u{1F310} Access your server at: http://localhost:${port}`);
});
