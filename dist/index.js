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

// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";
import session2 from "express-session";

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
var pool = new Pool({ connectionString });
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
  // User operations (for authentication)
  async getUser(id) {
    return void 0;
  }
  async getUserByEmail(email) {
    return void 0;
  }
  async upsertUser(user) {
    return {
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
  }
  async updateUserLastLogin(id) {
    return;
  }
  async getAllUsers() {
    return [];
  }
  async createUser(user) {
    return {
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
  }
  async updateUser() {
    return void 0;
  }
  async deactivateUser() {
    return false;
  }
  async deleteUser() {
    return false;
  }
  async logUserAction() {
    return;
  }
  async getUserAuditLog() {
    return [];
  }
  async getLandlords() {
    return [];
  }
  async getLandlordByPropertyAddress() {
    return void 0;
  }
  async createLandlord(landlord) {
    return {
      id: 0,
      ...landlord,
      serviceType: landlord.serviceType ?? "Full-Service Management",
      strataContactNumber: null,
      strataManagementCompany: null,
      strataContactPerson: null
    };
  }
  async updateLandlord() {
    return void 0;
  }
  async deleteLandlord() {
    return false;
  }
  async getLandlordOwners() {
    return [];
  }
  async createLandlordOwner(owner) {
    return { id: 0, ...owner, contactNumber: null, birthday: null, residentialAddress: null };
  }
  async updateLandlordOwner() {
    return void 0;
  }
  async deleteLandlordOwner() {
    return false;
  }
  async getTenants() {
    return [];
  }
  async getTenantByPropertyAddress() {
    return void 0;
  }
  async getTenantsByPropertyAddress() {
    return [];
  }
  async createTenant(tenant) {
    return {
      id: 0,
      ...tenant,
      contactNumber: null,
      birthday: null,
      moveOutDate: null,
      email: null,
      isPrimary: tenant.isPrimary ?? false
    };
  }
  async updateTenant() {
    return void 0;
  }
  async deleteTenant() {
    return false;
  }
  async getRentalRateIncreases() {
    return [];
  }
  async getRentalRateIncreaseByPropertyAddress() {
    return void 0;
  }
  async createRentalRateIncrease(increase) {
    return { id: 0, ...increase };
  }
  async updateRentalRateIncrease() {
    return void 0;
  }
  async getRentalRateHistory() {
    return [];
  }
  async createRentalRateHistory(history) {
    return { id: 0, ...history, createdAt: /* @__PURE__ */ new Date(), notes: null };
  }
  async getPropertiesWithDetails() {
    return [];
  }
  async getPropertyDetailsByAddress() {
    return void 0;
  }
  async getRentalIncreaseReminders() {
    return [];
  }
  async getBirthdayReminders() {
    return [];
  }
  async processRentalIncrease(propertyAddress, increaseDate, newRate) {
    return {
      id: 0,
      propertyAddress,
      latestRateIncreaseDate: format(increaseDate, "yyyy-MM-dd"),
      latestRentalRate: newRate,
      nextAllowableRentalIncreaseDate: format(addMonths(increaseDate, 12), "yyyy-MM-dd"),
      nextAllowableRentalRate: Math.round(newRate * 1.03 * 100) / 100,
      reminderDate: format(addMonths(increaseDate, 8), "yyyy-MM-dd")
    };
  }
};
var storage = process.env.USE_MEMORY_STORAGE === "true" ? new MemStorage() : new DatabaseStorage();

// server/replitAuth.ts
import * as client from "openid-client";
import { Strategy } from "openid-client/passport";
import passport from "passport";
import session from "express-session";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
if (!process.env.REPLIT_DOMAINS) {
  throw new Error("Environment variable REPLIT_DOMAINS not provided");
}
var getOidcConfig = memoize(
  async () => {
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID
    );
  },
  { maxAge: 3600 * 1e3 }
);
function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1e3;
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true,
    ttl: sessionTtl / 1e3,
    // ttl in seconds
    tableName: "sessions"
  });
  return session({
    secret: process.env.SESSION_SECRET,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: sessionTtl
    }
  });
}
function updateUserSession(user, tokens) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}
async function upsertUser(claims) {
  await storage.upsertUser({
    id: claims["sub"],
    email: claims["email"],
    firstName: claims["first_name"],
    lastName: claims["last_name"],
    profileImageUrl: claims["profile_image_url"]
  });
}
async function setupAuth(app2) {
  app2.set("trust proxy", 1);
  app2.use(getSession());
  app2.use(passport.initialize());
  app2.use(passport.session());
  const config3 = await getOidcConfig();
  const verify = async (tokens, verified) => {
    try {
      const user = {};
      updateUserSession(user, tokens);
      const claims = tokens.claims();
      if (!claims || !claims["sub"]) {
        return verified(new Error("Invalid claims from OAuth provider"), false);
      }
      const userId = String(claims["sub"]);
      const userEmail = claims["email"] ? String(claims["email"]) : null;
      let dbUser = await storage.getUser(userId);
      if (!dbUser && userEmail) {
        const userByEmail = await storage.getUserByEmail(userEmail);
        if (userByEmail && userByEmail.status === "active") {
          console.log(`Creating new user record for linking: ${userId} with email: ${userEmail}`);
          dbUser = await storage.createUser({
            id: userId,
            email: userEmail,
            firstName: claims["first_name"] && typeof claims["first_name"] === "string" ? claims["first_name"] : userByEmail.firstName,
            lastName: claims["last_name"] && typeof claims["last_name"] === "string" ? claims["last_name"] : userByEmail.lastName,
            profileImageUrl: claims["profile_image_url"] && typeof claims["profile_image_url"] === "string" ? claims["profile_image_url"] : null,
            role: userByEmail.role,
            status: "active",
            createdBy: userByEmail.createdBy
          });
          console.log(`Successfully created linked user: ${dbUser.id}`);
          await storage.deleteUser(userByEmail.id);
          console.log(`Deleted temporary user record: ${userByEmail.id}`);
          await storage.logUserAction({
            actionType: "account_linked",
            targetUserId: userId,
            performedBy: "system",
            details: {
              linkedFromEmail: userEmail,
              previousTempId: userByEmail.id,
              role: userByEmail.role
            }
          });
        }
      }
      if (!dbUser) {
        await upsertUser(claims);
      }
      verified(null, user);
    } catch (error) {
      console.error("Authentication error:", error);
      verified(error, false);
    }
  };
  for (const domain of process.env.REPLIT_DOMAINS.split(",")) {
    const strategy = new Strategy(
      {
        name: `replitauth:${domain}`,
        config: config3,
        scope: "openid email profile offline_access",
        callbackURL: `https://${domain}/api/callback`
      },
      verify
    );
    passport.use(strategy);
  }
  passport.serializeUser((user, cb) => cb(null, user));
  passport.deserializeUser((user, cb) => cb(null, user));
  app2.get("/api/login", (req, res, next) => {
    const domain = process.env.REPLIT_DOMAINS.split(",")[0];
    passport.authenticate(`replitauth:${domain}`, {
      prompt: "login consent",
      scope: ["openid", "email", "profile", "offline_access"]
    })(req, res, next);
  });
  app2.get("/api/callback", (req, res, next) => {
    const domain = process.env.REPLIT_DOMAINS.split(",")[0];
    passport.authenticate(`replitauth:${domain}`, {
      successReturnToOrRedirect: "/",
      failureRedirect: "/api/login"
    })(req, res, next);
  });
  app2.get("/api/logout", (req, res) => {
    req.logout(() => {
      res.redirect(
        client.buildEndSessionUrl(config3, {
          client_id: process.env.REPL_ID,
          post_logout_redirect_uri: `${req.protocol}://${req.hostname}`
        }).href
      );
    });
  });
}
var requireRole = (minRole) => {
  return async (req, res, next) => {
    const user = req.user;
    if (!req.isAuthenticated() || !user.claims) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    try {
      const dbUser = await storage.getUser(user.claims.sub);
      if (!dbUser) {
        console.error(`User not found in database: ${user.claims.sub}, email: ${user.claims.email}`);
        return res.status(403).json({ message: "Access denied. Contact administrator." });
      }
      if (dbUser.status !== "active") {
        console.error(`User account inactive: ${user.claims.sub}, status: ${dbUser.status}`);
        return res.status(403).json({ message: "Account inactive. Contact administrator." });
      }
      await storage.updateUserLastLogin(user.claims.sub);
      const roleHierarchy = {
        "read_only": 1,
        "standard": 2,
        "admin": 3,
        "super_admin": 4
      };
      const userRoleLevel = roleHierarchy[dbUser.role] || 0;
      const requiredRoleLevel = roleHierarchy[minRole] || 0;
      if (userRoleLevel < requiredRoleLevel) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }
      req.currentUser = dbUser;
      return next();
    } catch (error) {
      console.error("Role check error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  };
};

// server/azureAuth.ts
import { ConfidentialClientApplication, LogLevel } from "@azure/msal-node";
var msalConfig = {
  auth: {
    clientId: process.env.AZURE_CLIENT_ID,
    clientSecret: process.env.AZURE_CLIENT_SECRET,
    authority: `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}`
  },
  system: {
    loggerOptions: {
      loggerCallback(loglevel, message, containsPii) {
        if (containsPii) return;
        console.log(message);
      },
      piiLoggingEnabled: false,
      logLevel: LogLevel.Warning
    }
  }
};
var msalInstance;
function setupAzureAuth(app2) {
  msalInstance = new ConfidentialClientApplication(msalConfig);
  app2.get("/api/auth/azure/login", async (req, res) => {
    console.log("\u{1F535} === MICROSOFT AUTHENTICATION INITIATED ===");
    console.log("\u{1F535} Request from host:", req.get("host"));
    console.log("\u{1F535} User agent:", req.get("user-agent"));
    console.log("\u{1F535} Session ID:", req.sessionID);
    console.log("\u{1F535} Azure credentials configured:", {
      clientId: !!process.env.AZURE_CLIENT_ID,
      clientSecret: !!process.env.AZURE_CLIENT_SECRET,
      tenantId: !!process.env.AZURE_TENANT_ID
    });
    try {
      const host = req.get("host");
      const protocol = host?.includes("replit.dev") || host?.includes("replit.app") ? "https" : req.protocol;
      const redirectUri = `${protocol}://${host}/api/auth/azure/callback`;
      console.log("\u{1F535} Azure login - redirect URI:", redirectUri);
      const authCodeUrlParameters = {
        scopes: ["user.read"],
        redirectUri
      };
      const response = await msalInstance.getAuthCodeUrl(authCodeUrlParameters);
      console.log("Azure auth URL generated successfully");
      console.log("Redirecting to Microsoft...");
      res.redirect(response);
    } catch (error) {
      console.error("Azure auth error:", error);
      res.status(500).json({ error: "Authentication failed" });
    }
  });
  app2.get("/api/auth/azure/callback", async (req, res) => {
    console.log("=== AZURE CALLBACK RECEIVED ===");
    console.log("Full URL:", req.url);
    console.log("Query params:", req.query);
    console.log("Headers host:", req.get("host"));
    console.log("Has auth code:", !!req.query.code);
    console.log("Has error:", !!req.query.error);
    console.log("Session ID at callback:", req.sessionID);
    if (req.query.error) {
      console.error("Azure auth error:", req.query.error);
      console.error("Error description:", req.query.error_description);
      return res.redirect("/?error=azure_auth_error");
    }
    try {
      const host = req.get("host");
      const protocol = host?.includes("replit.dev") || host?.includes("replit.app") ? "https" : req.protocol;
      const redirectUri = `${protocol}://${host}/api/auth/azure/callback`;
      console.log("Azure callback - redirect URI:", redirectUri);
      console.log("Azure callback - received code:", req.query.code ? "present" : "missing");
      console.log("Processing Microsoft authentication...");
      const tokenRequest = {
        code: req.query.code,
        scopes: ["user.read"],
        redirectUri
      };
      const response = await msalInstance.acquireTokenByCode(tokenRequest);
      if (!response || !response.account) {
        return res.status(400).json({ error: "Invalid authentication response" });
      }
      const email = response.account.username;
      console.log("=== AZURE AUTH SUCCESS ===");
      console.log("Azure auth successful for email:", email);
      console.log("Full account object:", JSON.stringify(response.account, null, 2));
      const dbUser = await storage.getUserByEmail(email);
      console.log("Database user lookup result:", dbUser ? "found" : "not found");
      if (dbUser) {
        console.log("User status:", dbUser.status);
        console.log("User role:", dbUser.role);
      }
      if (!dbUser) {
        console.log("User not found in database:", email);
        return res.redirect("/?error=user_not_found");
      }
      if (dbUser.status !== "active") {
        console.log("User not active:", email, "Status:", dbUser.status);
        return res.redirect("/?error=user_not_approved");
      }
      await storage.updateUserLastLogin(dbUser.id);
      if (!req.session) {
        console.error("Session object is undefined");
        return res.redirect("/?error=session_error");
      }
      req.session.azureAuth = {
        userId: dbUser.id,
        email,
        loginTime: Date.now()
      };
      console.log("Azure auth session created for user:", dbUser.id);
      console.log("Session ID:", req.sessionID);
      console.log("Session azureAuth:", req.session.azureAuth);
      console.log("Microsoft authentication successful for:", email);
      req.session.save((err) => {
        if (err) {
          console.error("Session save error:", err);
        } else {
          console.log("Session saved successfully");
        }
        console.log("Redirecting to dashboard...");
        res.redirect("/");
      });
    } catch (error) {
      console.error("=== AZURE CALLBACK ERROR ===");
      console.error("Error details:", error);
      console.error("Error message:", error?.message || "Unknown error");
      console.error("Error stack:", error?.stack || "No stack trace");
      res.redirect("/?error=auth_failed");
    }
  });
  app2.get("/api/auth/azure/logout", (req, res) => {
    if (req.session.azureAuth) {
      delete req.session.azureAuth;
    }
    const logoutUrl = `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}/oauth2/v2.0/logout?post_logout_redirect_uri=${encodeURIComponent(`${req.protocol}://${req.get("host")}`)}`;
    res.redirect(logoutUrl);
  });
}

// server/email-auth.ts
import jwt from "jsonwebtoken";
import { MailService } from "@sendgrid/mail";
var JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-for-dev";
var SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
var FROM_EMAIL = process.env.FROM_EMAIL || "noreply@yourapp.com";
var mailService = null;
if (SENDGRID_API_KEY) {
  mailService = new MailService();
  mailService.setApiKey(SENDGRID_API_KEY);
}
function generateEmailAuthToken(userId, email) {
  return jwt.sign(
    {
      userId,
      email,
      type: "email_auth"
    },
    JWT_SECRET,
    { expiresIn: "1h" }
  );
}
function verifyEmailAuthToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.type === "email_auth") {
      return decoded;
    }
    return null;
  } catch (error) {
    return null;
  }
}
async function sendMagicLink(email, baseUrl) {
  try {
    const user = await storage.getUserByEmail(email);
    if (!user || user.status !== "active") {
      return false;
    }
    const token = generateEmailAuthToken(user.id, email);
    const magicLink = `${baseUrl}/auth/magic?token=${token}`;
    if (!mailService) {
      console.log("=== MAGIC LINK FOR DEVELOPMENT ===");
      console.log(`Email: ${email}`);
      console.log(`Magic Link: ${magicLink}`);
      console.log("=====================================");
      return true;
    }
    const msg = {
      to: email,
      from: FROM_EMAIL,
      subject: "Sign in to Property Management System",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Sign in to Property Management System</h2>
          <p>Hi ${user.firstName || "there"},</p>
          <p>Click the button below to sign in to your account:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${magicLink}" 
               style="background-color: #007cba; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 4px; display: inline-block;">
              Sign In
            </a>
          </div>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #666;">${magicLink}</p>
          <p><em>This link will expire in 1 hour.</em></p>
          <p>If you didn't request this, please ignore this email.</p>
        </div>
      `
    };
    await mailService.send(msg);
    return true;
  } catch (error) {
    console.error("Error sending magic link:", error);
    return false;
  }
}

// server/email-service.ts
import { Resend } from "resend";
var resend = null;
if (process.env.RESEND_API_KEY) {
  resend = new Resend(process.env.RESEND_API_KEY);
}
async function sendEmail(params) {
  if (!resend) {
    console.log("=== EMAIL FOR DEVELOPMENT ===");
    console.log("To:", params.to);
    console.log("From:", params.from);
    console.log("Subject:", params.subject);
    console.log("Body:", params.html);
    console.log("===============================");
    return true;
  }
  try {
    const result = await resend.emails.send({
      from: params.from,
      to: params.to,
      subject: params.subject,
      html: params.html
    });
    console.log("Email sent successfully:", result.data?.id);
    return true;
  } catch (error) {
    console.error("Email sending failed:", error);
    return false;
  }
}
async function sendAccessRequestNotification(requestorName, requestorEmail, adminEmails, dashboardUrl) {
  const subject = `New Access Request - ${requestorName}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">New Access Request</h2>
      
      <p>A new user has requested access to the Property Management System:</p>
      
      <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Name:</strong> ${requestorName}</p>
        <p><strong>Email:</strong> ${requestorEmail}</p>
        <p><strong>Request Date:</strong> ${(/* @__PURE__ */ new Date()).toLocaleString()}</p>
      </div>
      
      <p>To approve or deny this request, please log in to the admin dashboard:</p>
      
      <a href="${dashboardUrl}" 
         style="display: inline-block; background: #007bff; color: white; padding: 12px 24px; 
                text-decoration: none; border-radius: 6px; margin: 10px 0;">
        Review Access Request
      </a>
      
      <p style="color: #666; font-size: 14px; margin-top: 30px;">
        This notification was sent automatically from the Property Management System.
      </p>
    </div>
  `;
  const emailPromises = adminEmails.map(
    (adminEmail) => sendEmail({
      to: adminEmail,
      from: "onboarding@resend.dev",
      subject,
      html
    })
  );
  try {
    const results = await Promise.all(emailPromises);
    return results.every((result) => result === true);
  } catch (error) {
    console.error("Failed to send access request notifications:", error);
    return false;
  }
}
async function sendAccessApprovedNotification(userName, userEmail, dashboardUrl) {
  const subject = "Property Management System - Access Approved";
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #2563eb; margin-bottom: 20px;">Access Approved</h1>
      
      <p style="font-size: 16px; margin-bottom: 16px;">Hello ${userName},</p>
      
      <p style="font-size: 16px; margin-bottom: 20px;">Great news! Your access request has been approved.</p>
      
      <div style="background: #f1f5f9; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb;">
        <h3 style="margin-top: 0; color: #1e40af;">How to Sign In:</h3>
        <p style="margin-bottom: 10px;"><strong>Option 1:</strong> Email login - Enter your email on the sign-in page</p>
        <p style="margin-bottom: 0;"><strong>Option 2:</strong> Use your Replit account if you have one</p>
      </div>
      
      <a href="${dashboardUrl}" 
         style="display: inline-block; background: #2563eb; color: white; padding: 14px 28px; 
                text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold;">
        Access System
      </a>
      
      <p style="color: #64748b; font-size: 14px; margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 20px;">
        This email was sent from the Property Management System. If you didn't request access, please ignore this message.
      </p>
    </div>
  `;
  console.log(`Attempting to send approval email to: ${userEmail}`);
  console.log("Testing direct email send to cindychcheng@gmail.com");
  const testSubject = `Access Approved for ${userName} (${userEmail})`;
  const testHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #2563eb;">User Approved: ${userName}</h1>
      <p>You have approved access for <strong>${userName}</strong> (${userEmail})</p>
      <p>They can now sign in to the Property Management System.</p>
      <hr style="margin: 20px 0;">
      <p style="color: #666; font-size: 14px;">This is a test email to verify delivery to cindychcheng@gmail.com</p>
    </div>
  `;
  console.log("Sending test email with subject:", testSubject);
  const result = await sendEmail({
    to: "cindychcheng@gmail.com",
    from: "onboarding@resend.dev",
    subject: testSubject,
    html: testHtml
  });
  if (result) {
    console.log("Test approval email sent successfully to cindychcheng@gmail.com");
    console.log("Please check your email inbox and spam folder");
  } else {
    console.log("Failed to send test approval email");
  }
  return result;
}

// server/simple-auth.ts
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
var scryptAsync = promisify(scrypt);
function setupSimpleAuth(app2) {
  app2.post("/api/simple/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      console.log("\u{1F511} Simple login attempt for user:", username);
      if (!username || !password) {
        return res.status(400).json({ error: "Username and password required" });
      }
      const adminUsername = process.env.ADMIN_USERNAME;
      const adminPassword = process.env.ADMIN_PASSWORD;
      if (!adminUsername || !adminPassword) {
        console.error("\u274C Admin credentials not configured properly");
        return res.status(500).json({ error: "Server configuration error" });
      }
      console.log("\u{1F50D} Checking credentials for user:", username);
      if (username === adminUsername && password === adminPassword) {
        console.log("\u2705 Credentials match, getting admin user");
        let adminUser = await storage.getUser("admin") || await storage.getUserByEmail("admin@instarealty.com");
        if (!adminUser) {
          console.log("\u274C Admin user not found in database");
          return res.status(500).json({ error: "Admin user configuration error" });
        }
        req.session.simpleAuth = {
          userId: adminUser.id,
          email: adminUser.email,
          loginTime: Date.now()
        };
        const { password: _, ...userWithoutPassword } = adminUser;
        console.log("\u{1F7E2} Simple auth login successful for admin");
        return res.json({ success: true, user: userWithoutPassword });
      }
      console.log("\u274C Invalid credentials provided");
      return res.status(401).json({ error: "Invalid credentials" });
    } catch (error) {
      console.error("Simple auth login error:", error);
      return res.status(500).json({ error: "Login failed" });
    }
  });
  app2.post("/api/simple/logout", (req, res) => {
    if (req.session.simpleAuth) {
      delete req.session.simpleAuth;
    }
    res.json({ success: true });
  });
}

// server/routes.ts
import { z } from "zod";
import { fromZodError } from "zod-validation-error";
async function registerRoutes(app2) {
  if (process.env.USE_MEMORY_STORAGE !== "true") {
    await setupAuth(app2);
  } else {
    app2.use(session2({
      secret: "dummy-secret-for-testing",
      resave: false,
      saveUninitialized: false,
      cookie: { secure: false }
    }));
  }
  if (process.env.USE_MEMORY_STORAGE !== "true") {
    setupAzureAuth(app2);
  }
  setupSimpleAuth(app2);
  app2.get("/api/auth/user", async (req, res) => {
    try {
      let userId = null;
      console.log("=== AUTH DEBUG ===");
      console.log("isAuthenticated:", req.isAuthenticated ? req.isAuthenticated() : "not available");
      console.log("req.user:", req.user ? "exists" : "null");
      console.log("req.session.emailAuth:", req.session.emailAuth);
      console.log("req.session.azureAuth:", req.session.azureAuth);
      console.log("req.session.simpleAuth:", req.session.simpleAuth);
      console.log("session ID:", req.sessionID);
      if (process.env.USE_MEMORY_STORAGE === "true") {
        console.log("Using memory storage - creating test user");
        userId = "test-user-123";
        let testUser = await storage.getUser(userId);
        if (!testUser) {
          testUser = await storage.createUser({
            id: userId,
            email: "test@example.com",
            firstName: "Test",
            lastName: "User",
            role: "admin",
            status: "active",
            createdBy: "system"
          });
        }
        console.log("Using test user:", testUser.email);
        return res.json(testUser);
      }
      if (req.session.simpleAuth && req.session.simpleAuth.userId) {
        userId = req.session.simpleAuth.userId;
        console.log("Using simple auth userId:", userId);
      } else if (req.session.azureAuth && req.session.azureAuth.userId) {
        userId = req.session.azureAuth.userId;
        console.log("Using Azure auth userId:", userId);
      } else if (req.isAuthenticated && req.isAuthenticated() && req.user && req.user.claims && req.user.claims.sub) {
        userId = req.user.claims.sub;
        console.log("Using Replit OAuth userId:", userId);
      } else if (req.session.emailAuth && req.session.emailAuth.userId) {
        userId = req.session.emailAuth.userId;
        console.log("Using email auth userId:", userId);
      }
      if (!userId) {
        console.log("No userId found, returning 401");
        return res.status(401).json({ message: "Unauthorized" });
      }
      const dbUser = await storage.getUser(userId);
      if (!dbUser || dbUser.status !== "active") {
        console.error(`User not found or inactive: ${userId}`);
        return res.status(401).json({ message: "User not found or inactive" });
      }
      console.log("Returning user:", dbUser.email);
      res.json(dbUser);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
  app2.post("/api/auth/magic-link", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }
      const baseUrl = `${req.protocol}://${req.hostname}`;
      const success = await sendMagicLink(email, baseUrl);
      if (!success) {
        return res.status(404).json({ message: "No active account found with this email" });
      }
      res.json({ message: "Magic link sent to your email" });
    } catch (error) {
      console.error("Error sending magic link:", error);
      res.status(500).json({ message: "Failed to send magic link" });
    }
  });
  app2.get("/api/auth/magic", async (req, res) => {
    try {
      const { token } = req.query;
      console.log("=== MAGIC LINK DEBUG ===");
      console.log("Token received:", token ? "exists" : "null");
      console.log("Session ID before:", req.sessionID);
      if (!token || typeof token !== "string") {
        console.log("Invalid token, redirecting with error");
        return res.redirect("/auth/magic?error=invalid_token");
      }
      const tokenData = verifyEmailAuthToken(token);
      console.log("Token data:", tokenData);
      if (!tokenData) {
        console.log("Token verification failed, redirecting with error");
        return res.redirect("/auth/magic?error=expired_token");
      }
      const user = await storage.getUser(tokenData.userId);
      console.log("User found:", user ? user.email : "null");
      if (!user || user.status !== "active") {
        console.log("User not found or inactive, redirecting with error");
        return res.redirect("/auth/magic?error=account_inactive");
      }
      req.session.emailAuth = {
        userId: user.id,
        email: user.email,
        loginTime: Date.now()
      };
      console.log("Session created:", req.session.emailAuth);
      console.log("Session ID after:", req.sessionID);
      await new Promise((resolve, reject) => {
        req.session.save((err) => {
          if (err) {
            console.error("Session save error:", err);
            reject(err);
          } else {
            console.log("Session saved successfully");
            resolve(true);
          }
        });
      });
      await storage.updateUserLastLogin(user.id);
      console.log("Authentication successful, returning user data");
      res.json({ message: "Authentication successful", user });
    } catch (error) {
      console.error("Error processing magic link:", error);
      res.status(401).json({ message: "Authentication failed" });
    }
  });
  app2.post("/api/auth/register", async (req, res) => {
    try {
      const { firstName, lastName, email } = req.body;
      if (!firstName || !lastName || !email) {
        return res.status(400).json({ message: "First name, last name, and email are required" });
      }
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        if (existingUser.status === "pending") {
          return res.status(400).json({
            message: "A registration request with this email is already pending approval."
          });
        } else {
          return res.status(400).json({
            message: "An account with this email already exists. Please sign in instead."
          });
        }
      }
      const registrationData = {
        id: `pending_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        // Temporary ID for pending users
        email: email.toLowerCase(),
        // Normalize email to lowercase
        firstName,
        lastName,
        role: "read_only",
        status: "pending",
        createdBy: "self-registration"
      };
      await storage.createUser(registrationData);
      try {
        const superAdmins = await storage.getAllUsers();
        const adminEmails = superAdmins.filter((user) => user.role === "super_admin" && user.status === "active" && user.email).map((admin) => admin.email).filter((email2) => email2 !== null);
        if (adminEmails.length > 0) {
          const dashboardUrl = `${req.protocol}://${req.hostname}`;
          await sendAccessRequestNotification(
            `${firstName} ${lastName}`,
            email,
            adminEmails,
            dashboardUrl
          );
          console.log(`Access request notification sent to ${adminEmails.length} admin(s)`);
        } else {
          console.log("No super admin emails found for notification");
        }
      } catch (emailError) {
        console.error("Failed to send admin notifications:", emailError);
      }
      res.json({
        message: "Registration submitted successfully. Please wait for administrator approval.",
        status: "pending"
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Failed to submit registration" });
    }
  });
  app2.get("/api/users", requireRole("super_admin"), async (req, res) => {
    try {
      const users2 = await storage.getAllUsers();
      const safeUsers = users2.map(({ password, ...user }) => user);
      res.json(safeUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });
  app2.post("/api/users", requireRole("super_admin"), async (req, res) => {
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
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });
  app2.patch("/api/users/:id", requireRole("super_admin"), async (req, res) => {
    try {
      const result = updateUserSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: fromZodError(result.error) });
      }
      const originalUser = await storage.getUser(req.params.id);
      if (!originalUser) {
        return res.status(404).json({ message: "User not found" });
      }
      const user = await storage.updateUser(req.params.id, result.data);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      if (originalUser.status === "pending" && user.status === "active" && user.email) {
        try {
          const dashboardUrl = `${req.protocol}://${req.hostname}`;
          await sendAccessApprovedNotification(
            `${user.firstName || ""} ${user.lastName || ""}`.trim() || "User",
            user.email,
            dashboardUrl
          );
          console.log(`Access approved notification sent to ${user.email}`);
        } catch (emailError) {
          console.error("Failed to send approval notification:", emailError);
        }
      }
      res.json(user);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });
  app2.delete("/api/users/:id", requireRole("super_admin"), async (req, res) => {
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
  app2.post("/api/users/:id/approve", requireRole("super_admin"), async (req, res) => {
    try {
      const { role = "read_only" } = req.body;
      const user = await storage.updateUser(req.params.id, {
        status: "active",
        role
      });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      if (user.email) {
        try {
          const dashboardUrl = `${req.protocol}://${req.hostname}`;
          await sendAccessApprovedNotification(
            `${user.firstName || ""} ${user.lastName || ""}`.trim() || "User",
            user.email,
            dashboardUrl
          );
          console.log(`Access approved notification sent to ${user.email}`);
        } catch (emailError) {
          console.error("Failed to send approval notification:", emailError);
        }
      }
      await storage.logUserAction({
        actionType: "approved",
        targetUserId: req.params.id,
        performedBy: req.currentUser?.id || "system",
        details: { previousStatus: "pending", newStatus: "active", role }
      });
      res.json({ message: "User approved successfully", user });
    } catch (error) {
      console.error("Error approving user:", error);
      res.status(500).json({ message: "Failed to approve user" });
    }
  });
  app2.post("/api/users/:id/reject", requireRole("super_admin"), async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      if (user.status !== "pending") {
        return res.status(400).json({ message: "Only pending registrations can be rejected" });
      }
      const success = await storage.deleteUser(req.params.id);
      if (!success) {
        return res.status(500).json({ message: "Failed to reject user registration" });
      }
      await storage.logUserAction({
        actionType: "rejected",
        targetUserId: req.params.id,
        performedBy: req.currentUser?.id || "system",
        details: { previousStatus: "pending", action: "rejected", email: user.email }
      });
      res.json({ message: "User registration rejected successfully" });
    } catch (error) {
      console.error("Error rejecting user:", error);
      res.status(500).json({ message: "Failed to reject user" });
    }
  });
  app2.patch("/api/users/:id/role", requireRole("super_admin"), async (req, res) => {
    try {
      const { role } = req.body;
      if (!role || !["read_only", "standard", "admin", "super_admin"].includes(role)) {
        return res.status(400).json({ message: "Invalid role specified" });
      }
      const user = await storage.updateUser(req.params.id, { role });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      await storage.logUserAction({
        actionType: "role_updated",
        targetUserId: req.params.id,
        performedBy: req.currentUser?.id || "system",
        details: { newRole: role, previousRole: user.role }
      });
      const { password: _, ...userWithoutPassword } = user;
      res.json({ message: "User role updated successfully", user: userWithoutPassword });
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Failed to update user role" });
    }
  });
  app2.get("/api/audit-log", requireRole("admin"), async (req, res) => {
    try {
      const userId = req.query.userId;
      const auditLog = await storage.getUserAuditLog(userId);
      res.json(auditLog);
    } catch (error) {
      console.error("Error fetching audit log:", error);
      res.status(500).json({ message: "Failed to fetch audit log" });
    }
  });
  const handleZodError = (err) => {
    if (err instanceof z.ZodError) {
      return { message: fromZodError(err).message, errors: err.errors };
    }
    if (err instanceof Error) {
      return { message: err.message };
    }
    return { message: "An unknown error occurred" };
  };
  app2.get("/api/properties", async (req, res) => {
    try {
      const properties = await storage.getPropertiesWithDetails();
      res.json(properties);
    } catch (err) {
      res.status(500).json(handleZodError(err));
    }
  });
  app2.get("/api/properties/:address", async (req, res) => {
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
      res.set("Cache-Control", "no-cache, no-store, must-revalidate");
      res.set("Pragma", "no-cache");
      res.set("Expires", "0");
      res.json(property);
    } catch (err) {
      console.error(`Error fetching property ${req.params.address}:`, err);
      res.status(500).json(handleZodError(err));
    }
  });
  app2.get("/api/landlords", async (req, res) => {
    try {
      const landlords2 = await storage.getLandlords();
      res.json(landlords2);
    } catch (err) {
      res.status(500).json(handleZodError(err));
    }
  });
  app2.post("/api/landlords", async (req, res) => {
    try {
      const landlordData = insertLandlordSchema.parse(req.body);
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
  app2.put("/api/landlords/:address", async (req, res) => {
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
  app2.delete("/api/landlords/:address", async (req, res) => {
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
  app2.get("/api/landlords/:address/owners", async (req, res) => {
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
  app2.post("/api/landlord-owners", async (req, res) => {
    try {
      const ownerData = insertLandlordOwnerSchema.parse(req.body);
      const owner = await storage.createLandlordOwner(ownerData);
      res.status(201).json(owner);
    } catch (err) {
      res.status(400).json(handleZodError(err));
    }
  });
  app2.put("/api/landlord-owners/:id", async (req, res) => {
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
  app2.delete("/api/landlord-owners/:id", async (req, res) => {
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
  app2.get("/api/tenants", async (req, res) => {
    try {
      const tenants2 = await storage.getTenants();
      res.json(tenants2);
    } catch (err) {
      res.status(500).json(handleZodError(err));
    }
  });
  app2.put("/api/tenants/property/:address", async (req, res) => {
    try {
      console.log("Multiple tenants update by property address endpoint called");
      const address = decodeURIComponent(req.params.address);
      console.log(`Handling tenants for address: ${address}`);
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
      const results = [];
      for (const tenant of data.tenants) {
        const tenantData = {
          propertyAddress: data.propertyAddress,
          serviceType: data.serviceType,
          // Service type from the property
          name: tenant.name,
          contactNumber: tenant.contactNumber,
          email: tenant.email,
          birthday: tenant.birthday,
          moveInDate: tenant.moveInDate,
          moveOutDate: tenant.moveOutDate,
          isPrimary: tenant.isPrimary
        };
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
  app2.get("/api/tenants/:address", async (req, res) => {
    try {
      const address = decodeURIComponent(req.params.address);
      const tenants2 = await storage.getTenantsByPropertyAddress(address);
      if (!tenants2 || tenants2.length === 0) {
        return res.status(404).json({ message: "No tenants found for this property" });
      }
      res.json(tenants2);
    } catch (err) {
      res.status(500).json(handleZodError(err));
    }
  });
  app2.post("/api/tenants", async (req, res) => {
    try {
      console.log("Creating new tenants");
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
      const results = [];
      for (const tenant of data.tenants) {
        const tenantData = {
          propertyAddress: data.propertyAddress,
          serviceType: data.serviceType,
          // Make sure service type is included
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
  app2.put("/api/tenants/:id", async (req, res) => {
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
  app2.delete("/api/tenants/:id", async (req, res) => {
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
  app2.get("/api/rental-increases", async (req, res) => {
    try {
      const increases = await storage.getRentalRateIncreases();
      res.json(increases);
    } catch (err) {
      res.status(500).json(handleZodError(err));
    }
  });
  app2.get("/api/rental-increases/:address", async (req, res) => {
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
  app2.post("/api/rental-increases", async (req, res) => {
    try {
      const increaseData = insertRentalRateIncreaseSchema.parse(req.body);
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
  app2.post("/api/rental-increases/initial", async (req, res) => {
    console.log("=== INITIAL RENTAL RATE ENDPOINT HIT ===");
    console.log("Request body:", req.body);
    try {
      const initialRateSchema = z.object({
        propertyAddress: z.string(),
        initialRentalRate: z.number().positive("Rental rate must be a positive number"),
        startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
      });
      const data = initialRateSchema.parse(req.body);
      const existingIncrease = await storage.getRentalRateIncreaseByPropertyAddress(data.propertyAddress);
      console.log("Existing rental data:", existingIncrease ? "Found" : "Not found");
      const startDate = new Date(data.startDate);
      const nextAllowableDate = new Date(startDate);
      nextAllowableDate.setFullYear(nextAllowableDate.getFullYear() + 1);
      const reminderDate = new Date(startDate);
      reminderDate.setMonth(reminderDate.getMonth() + 8);
      const nextAllowableRate = Math.round(data.initialRentalRate * 1.03 * 100) / 100;
      let increase;
      if (existingIncrease) {
        console.log("UPDATING existing rental record for new tenant");
        increase = await storage.updateRentalRateIncrease(data.propertyAddress, {
          latestRateIncreaseDate: data.startDate,
          latestRentalRate: data.initialRentalRate,
          nextAllowableRentalIncreaseDate: nextAllowableDate.toISOString().split("T")[0],
          nextAllowableRentalRate: nextAllowableRate,
          reminderDate: reminderDate.toISOString().split("T")[0]
        });
      } else {
        console.log("CREATING new rental record");
        increase = await storage.createRentalRateIncrease({
          propertyAddress: data.propertyAddress,
          latestRateIncreaseDate: data.startDate,
          latestRentalRate: data.initialRentalRate,
          nextAllowableRentalIncreaseDate: nextAllowableDate.toISOString().split("T")[0],
          nextAllowableRentalRate: nextAllowableRate,
          reminderDate: reminderDate.toISOString().split("T")[0]
        });
      }
      const tenant = await storage.getTenantByPropertyAddress(data.propertyAddress);
      const tenantName = tenant ? tenant.name : "No tenant";
      await storage.createRentalRateHistory({
        propertyAddress: data.propertyAddress,
        increaseDate: data.startDate,
        previousRate: 0,
        // No previous rate for initial entry
        newRate: data.initialRentalRate,
        notes: `Initial rental rate - Current tenant: ${tenantName}`
      });
      res.status(201).json(increase);
    } catch (err) {
      res.status(400).json(handleZodError(err));
    }
  });
  app2.put("/api/rental-increases/:address", async (req, res) => {
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
  app2.get("/api/rental-history/:address", async (req, res) => {
    try {
      const address = decodeURIComponent(req.params.address);
      const history = await storage.getRentalRateHistory(address);
      res.json(history);
    } catch (err) {
      res.status(500).json(handleZodError(err));
    }
  });
  app2.post("/api/rental-history", async (req, res) => {
    try {
      const historyData = insertRentalRateHistorySchema.parse(req.body);
      const history = await storage.createRentalRateHistory(historyData);
      res.status(201).json(history);
    } catch (err) {
      res.status(400).json(handleZodError(err));
    }
  });
  app2.get("/api/reminders/rental-increases", async (req, res) => {
    try {
      const month = req.query.month ? parseInt(req.query.month, 10) : void 0;
      const minMonths = req.query.minMonths ? parseInt(req.query.minMonths, 10) : void 0;
      const reminders = await storage.getRentalIncreaseReminders(month, minMonths);
      res.json(reminders);
    } catch (err) {
      res.status(500).json(handleZodError(err));
    }
  });
  app2.get("/api/reminders/birthdays", async (req, res) => {
    try {
      const month = req.query.month ? parseInt(req.query.month, 10) : void 0;
      const reminders = await storage.getBirthdayReminders(month);
      res.json(reminders);
    } catch (err) {
      res.status(500).json(handleZodError(err));
    }
  });
  app2.post("/api/process-rental-increase", async (req, res) => {
    try {
      const schema = z.object({
        propertyAddress: z.string(),
        increaseDate: z.string().transform((val) => new Date(val)),
        newRate: z.number().positive(),
        notes: z.string().optional()
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
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/seed-database.ts
import { format as format2, addMonths as addMonths2 } from "date-fns";
async function seedDatabase() {
  try {
    console.log("Starting database seed...");
    const existingLandlords = await db.select().from(landlords);
    if (existingLandlords.length > 0) {
      console.log("Database already has data, skipping seed");
      return;
    }
    console.log("Seeding landlords...");
    const [property1] = await db.insert(landlords).values({
      propertyAddress: "123 Main St, Unit 4B",
      keyNumber: "K-1001",
      strataContactNumber: "555-123-7890"
    }).returning();
    const [property2] = await db.insert(landlords).values({
      propertyAddress: "456 Maple Ave, Apt 201",
      keyNumber: "K-2002",
      strataContactNumber: "555-222-8888"
    }).returning();
    const [property3] = await db.insert(landlords).values({
      propertyAddress: "789 Oak St, Unit 2",
      keyNumber: "K-3003",
      strataContactNumber: null
    }).returning();
    const [property4] = await db.insert(landlords).values({
      propertyAddress: "101 Pine St, #3C",
      keyNumber: "K-4004",
      strataContactNumber: "555-444-9999"
    }).returning();
    const [property5] = await db.insert(landlords).values({
      propertyAddress: "202 Cedar Lane, Suite 5A",
      keyNumber: "K-5005",
      strataContactNumber: "555-666-7777",
      strataManagementCompany: "Pacific Property Management",
      strataContactPerson: "Alice Thompson"
    }).returning();
    console.log("Seeding landlord owners...");
    await db.insert(landlordOwners).values({
      landlordId: property1.id,
      name: "John Doe",
      contactNumber: "555-111-2222",
      birthday: "1975-05-15"
    });
    await db.insert(landlordOwners).values({
      landlordId: property1.id,
      name: "Jane Doe",
      contactNumber: "555-111-3333",
      birthday: "1980-07-22"
    });
    await db.insert(landlordOwners).values({
      landlordId: property2.id,
      name: "Robert Smith",
      contactNumber: "555-444-5555",
      birthday: "1968-03-30"
    });
    await db.insert(landlordOwners).values({
      landlordId: property3.id,
      name: "Emily Johnson",
      contactNumber: "555-777-8888",
      birthday: null
    });
    await db.insert(landlordOwners).values({
      landlordId: property4.id,
      name: "Michael Brown",
      contactNumber: "555-999-1111",
      birthday: "1972-11-05"
    });
    await db.insert(landlordOwners).values({
      landlordId: property5.id,
      name: "Patricia Evans",
      contactNumber: "555-888-2222",
      birthday: "1983-04-12"
    });
    console.log("Seeding tenants...");
    await db.insert(tenants).values({
      propertyAddress: property1.propertyAddress,
      name: "Sarah Wilson",
      serviceType: ServiceType.FULL_SERVICE,
      moveInDate: "2022-06-01",
      contactNumber: "555-222-3333",
      email: "sarah.wilson@example.com",
      birthday: "1990-02-14"
    });
    await db.insert(tenants).values({
      propertyAddress: property2.propertyAddress,
      name: "James Miller",
      serviceType: ServiceType.FULL_SERVICE,
      moveInDate: "2021-09-15",
      contactNumber: "555-333-4444",
      email: "james.miller@example.com",
      birthday: "1985-08-21"
    });
    await db.insert(tenants).values({
      propertyAddress: property3.propertyAddress,
      name: "Linda Davis",
      serviceType: ServiceType.TENANT_REPLACEMENT,
      moveInDate: "2023-01-10",
      contactNumber: "555-555-6666",
      email: "linda.davis@example.com",
      birthday: "1993-06-30"
    });
    console.log("Seeding rental rate increases...");
    const today = /* @__PURE__ */ new Date();
    const oneYearAgo = new Date(today);
    oneYearAgo.setFullYear(today.getFullYear() - 1);
    oneYearAgo.setMonth(today.getMonth() - 2);
    await db.insert(rentalRateIncreases).values({
      propertyAddress: property1.propertyAddress,
      latestRateIncreaseDate: format2(oneYearAgo, "yyyy-MM-dd"),
      latestRentalRate: 1850,
      nextAllowableRentalIncreaseDate: format2(addMonths2(oneYearAgo, 12), "yyyy-MM-dd"),
      nextAllowableRentalRate: 1905.5,
      reminderDate: format2(addMonths2(oneYearAgo, 8), "yyyy-MM-dd")
    });
    const twoYearsAgo = new Date(today);
    twoYearsAgo.setFullYear(today.getFullYear() - 2);
    await db.insert(rentalRateIncreases).values({
      propertyAddress: property2.propertyAddress,
      latestRateIncreaseDate: format2(twoYearsAgo, "yyyy-MM-dd"),
      latestRentalRate: 2200,
      nextAllowableRentalIncreaseDate: format2(addMonths2(twoYearsAgo, 12), "yyyy-MM-dd"),
      nextAllowableRentalRate: 2266,
      reminderDate: format2(addMonths2(twoYearsAgo, 8), "yyyy-MM-dd")
    });
    const sixMonthsAgo = new Date(today);
    sixMonthsAgo.setMonth(today.getMonth() - 6);
    await db.insert(rentalRateIncreases).values({
      propertyAddress: property3.propertyAddress,
      latestRateIncreaseDate: format2(sixMonthsAgo, "yyyy-MM-dd"),
      latestRentalRate: 1725,
      nextAllowableRentalIncreaseDate: format2(addMonths2(sixMonthsAgo, 12), "yyyy-MM-dd"),
      nextAllowableRentalRate: 1776.75,
      reminderDate: format2(addMonths2(sixMonthsAgo, 8), "yyyy-MM-dd")
    });
    console.log("Seeding rental rate history...");
    const twoYearsAndOneMonthAgo = new Date(twoYearsAgo);
    twoYearsAndOneMonthAgo.setMonth(twoYearsAgo.getMonth() - 1);
    await db.insert(rentalRateHistory).values({
      propertyAddress: property1.propertyAddress,
      increaseDate: format2(oneYearAgo, "yyyy-MM-dd"),
      previousRate: 1795,
      newRate: 1850,
      notes: "Annual rental increase"
    });
    await db.insert(rentalRateHistory).values({
      propertyAddress: property1.propertyAddress,
      increaseDate: format2(new Date(oneYearAgo.getFullYear() - 1, oneYearAgo.getMonth(), oneYearAgo.getDate()), "yyyy-MM-dd"),
      previousRate: 1750,
      newRate: 1795,
      notes: "Annual rental increase"
    });
    await db.insert(rentalRateHistory).values({
      propertyAddress: property2.propertyAddress,
      increaseDate: format2(twoYearsAgo, "yyyy-MM-dd"),
      previousRate: 2140,
      newRate: 2200,
      notes: "Annual increase plus additional for renovations"
    });
    await db.insert(rentalRateHistory).values({
      propertyAddress: property2.propertyAddress,
      increaseDate: format2(new Date(twoYearsAgo.getFullYear() - 1, twoYearsAgo.getMonth(), twoYearsAgo.getDate()), "yyyy-MM-dd"),
      previousRate: 2075,
      newRate: 2140,
      notes: "Standard annual increase"
    });
    await db.insert(rentalRateHistory).values({
      propertyAddress: property3.propertyAddress,
      increaseDate: format2(sixMonthsAgo, "yyyy-MM-dd"),
      previousRate: 1650,
      newRate: 1725,
      notes: "Increase after new tenant moved in"
    });
    console.log("Database seed completed successfully");
  } catch (error) {
    console.error("Error seeding database:", error);
    throw error;
  }
}

// server/index.ts
import * as dotenv2 from "dotenv";
dotenv2.config();
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  if (process.env.USE_MEMORY_STORAGE !== "true") {
    try {
      await seedDatabase();
      log("Database setup completed", "info");
    } catch (error) {
      log(`Error setting up database: ${error}`, "error");
    }
  } else {
    log("Using memory storage - skipping database setup", "info");
  }
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    try {
      await setupVite(app, server);
    } catch (error) {
      log(`Error setting up Vite: ${error}`, "error");
    }
  } else {
    serveStatic(app);
  }
  const port = process.env.PORT || 8080;
  server.listen(port, () => {
    log(`serving on port ${port}`);
    log(`Open your browser to http://localhost:${port}`);
  });
})();
