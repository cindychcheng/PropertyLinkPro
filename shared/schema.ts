import { pgTable, text, serial, date, boolean, integer, real, timestamp, varchar, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enum for service types
export const ServiceType = {
  FULL_SERVICE: "Full-Service Management",
  TENANT_REPLACEMENT: "Tenant Replacement Service",
} as const;

export type ServiceTypeEnum = typeof ServiceType[keyof typeof ServiceType];

// Landlords table
export const landlords = pgTable("landlords", {
  id: serial("id").primaryKey(),
  propertyAddress: text("property_address").notNull().unique(),
  keyNumber: text("key_number").notNull(),
  serviceType: text("service_type").notNull().default(ServiceType.FULL_SERVICE),
  strataContactNumber: text("strata_contact_number"),
  strataManagementCompany: text("strata_management_company"),
  strataContactPerson: text("strata_contact_person"),
});

// Landlord owners - allows multiple owners per property
export const landlordOwners = pgTable("landlord_owners", {
  id: serial("id").primaryKey(),
  landlordId: integer("landlord_id").notNull(),
  name: text("name").notNull(),
  contactNumber: text("contact_number"),
  birthday: date("birthday"),
  residentialAddress: text("residential_address"),
});

// Tenants table
export const tenants = pgTable("tenants", {
  id: serial("id").primaryKey(),
  propertyAddress: text("property_address").notNull(),
  serviceType: text("service_type").notNull(), // 'Full-Service Management' or 'Tenant Replacement Service'
  moveInDate: date("move_in_date").notNull(),
  moveOutDate: date("move_out_date"),
  name: text("name").notNull(),
  contactNumber: text("contact_number"),
  email: text("email"),
  birthday: date("birthday"),
  isPrimary: boolean("is_primary").default(false), // To indicate primary tenant
});

// Rental rate increase tracker
export const rentalRateIncreases = pgTable("rental_rate_increases", {
  id: serial("id").primaryKey(),
  propertyAddress: text("property_address").notNull(),
  latestRateIncreaseDate: date("latest_rate_increase_date").notNull(),
  latestRentalRate: real("latest_rental_rate").notNull(),
  nextAllowableRentalIncreaseDate: date("next_allowable_rental_increase_date").notNull(),
  nextAllowableRentalRate: real("next_allowable_rental_rate").notNull(),
  reminderDate: date("reminder_date").notNull(),
});

// Rental rate increase history
export const rentalRateHistory = pgTable("rental_rate_history", {
  id: serial("id").primaryKey(),
  propertyAddress: text("property_address").notNull(),
  increaseDate: date("increase_date").notNull(),
  previousRate: real("previous_rate").notNull(),
  newRate: real("new_rate").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Zod schemas for validation
export const insertLandlordSchema = createInsertSchema(landlords).pick({
  propertyAddress: true,
  keyNumber: true,
  serviceType: true,
  strataContactNumber: true,
  strataManagementCompany: true,
  strataContactPerson: true,
});

export const insertLandlordOwnerSchema = createInsertSchema(landlordOwners).pick({
  landlordId: true,
  name: true,
  contactNumber: true,
  birthday: true,
  residentialAddress: true,
});

export const insertTenantSchema = createInsertSchema(tenants).pick({
  propertyAddress: true,
  serviceType: true,
  moveInDate: true,
  moveOutDate: true,
  name: true,
  contactNumber: true,
  email: true,
  birthday: true,
  isPrimary: true,
});

export const insertRentalRateIncreaseSchema = createInsertSchema(rentalRateIncreases).pick({
  propertyAddress: true,
  latestRateIncreaseDate: true,
  latestRentalRate: true,
  nextAllowableRentalIncreaseDate: true,
  nextAllowableRentalRate: true,
  reminderDate: true,
});

export const insertRentalRateHistorySchema = createInsertSchema(rentalRateHistory).pick({
  propertyAddress: true,
  increaseDate: true,
  previousRate: true,
  newRate: true,
  notes: true,
});

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User roles enum
export const UserRole = {
  SUPER_ADMIN: "super_admin",
  ADMIN: "admin", 
  STANDARD: "standard",
  READ_ONLY: "read_only",
} as const;

export type UserRoleEnum = typeof UserRole[keyof typeof UserRole];

// Users table for authentication and authorization
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(), // Replit user ID
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").notNull().default(UserRole.READ_ONLY),
  status: varchar("status").notNull().default("pending"), // pending, active, inactive
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdBy: varchar("created_by"), // ID of user who added this user
  lastLoginAt: timestamp("last_login_at"),
  password: varchar("password"), // For simple username/password authentication
});

// User audit log for tracking user management actions
export const userAuditLog = pgTable("user_audit_log", {
  id: serial("id").primaryKey(),
  actionType: varchar("action_type").notNull(), // created, updated, deleted, login, logout
  targetUserId: varchar("target_user_id").notNull(),
  performedBy: varchar("performed_by").notNull(),
  details: jsonb("details"), // Additional details about the action
  timestamp: timestamp("timestamp").defaultNow(),
});

// Validation schemas for user management
export const insertUserSchema = createInsertSchema(users).pick({
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  profileImageUrl: true,
  role: true,
  status: true,
  createdBy: true,
  password: true,
});

export const updateUserSchema = createInsertSchema(users).pick({
  role: true,
  status: true,
  firstName: true,
  lastName: true,
}).partial();

// Type interfaces
export type Landlord = typeof landlords.$inferSelect;
export type InsertLandlord = z.infer<typeof insertLandlordSchema>;

export type LandlordOwner = typeof landlordOwners.$inferSelect;
export type InsertLandlordOwner = z.infer<typeof insertLandlordOwnerSchema>;

export type Tenant = typeof tenants.$inferSelect;
export type InsertTenant = z.infer<typeof insertTenantSchema>;

export type RentalRateIncrease = typeof rentalRateIncreases.$inferSelect;
export type InsertRentalRateIncrease = z.infer<typeof insertRentalRateIncreaseSchema>;

export type RentalRateHistory = typeof rentalRateHistory.$inferSelect;
export type InsertRentalRateHistory = z.infer<typeof insertRentalRateHistorySchema>;

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;
export type UpsertUser = typeof users.$inferInsert;

export type UserAuditLog = typeof userAuditLog.$inferSelect;
export type InsertUserAuditLog = typeof userAuditLog.$inferInsert;

// Combined types for frontend use
export type PropertyWithDetails = {
  propertyAddress: string;
  keyNumber: string;
  strataContactNumber?: string;
  strataManagementCompany?: string;
  strataContactPerson?: string;
  serviceType: string;
  landlordOwners: Array<{
    name: string;
    contactNumber?: string;
    birthday?: Date;
    residentialAddress?: string;
  }>;
  // Current active tenant (the one without a moveOutDate)
  tenant?: {
    id: number;
    name: string;
    contactNumber?: string;
    email?: string;
    birthday?: Date;
    moveInDate: Date;
    moveOutDate?: Date;
  };
  // All current active tenants (without moveOutDate)
  activeTenants?: Array<{
    id: number;
    name: string;
    contactNumber?: string;
    email?: string;
    birthday?: Date;
    moveInDate: Date;
    moveOutDate?: Date;
  }>;
  // All tenants for this property, including past tenants
  tenantHistory?: Array<{
    id: number;
    name: string;
    contactNumber?: string;
    email?: string;
    birthday?: Date;
    moveInDate: Date;
    moveOutDate?: Date;
  }>;
  rentalInfo?: {
    latestRentalRate: number;
    latestRateIncreaseDate: Date;
    nextAllowableRentalIncreaseDate: Date;
    nextAllowableRentalRate: number;
    reminderDate: Date;
  };
};
