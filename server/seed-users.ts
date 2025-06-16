import { db } from "./db";
import { users } from "@shared/schema";

/**
 * Seed script to create initial super admin users
 * Run this manually after setting up the database to create the first super admin accounts
 */
export async function seedInitialUsers() {
  console.log("Seeding initial super admin users...");
  
  // Add your Replit user ID here to become the first super admin
  const initialSuperAdmins = [
    {
      id: "REPLACE_WITH_YOUR_REPLIT_USER_ID", // Replace with actual Replit user ID
      role: "super_admin",
      status: "active",
      createdBy: "system"
    }
  ];

  for (const admin of initialSuperAdmins) {
    try {
      await db
        .insert(users)
        .values(admin)
        .onConflictDoNothing(); // Don't overwrite existing users
      
      console.log(`Added super admin: ${admin.id}`);
    } catch (error) {
      console.error(`Error adding super admin ${admin.id}:`, error);
    }
  }
  
  console.log("Initial user seeding completed");
}

// Run this script manually when needed
if (require.main === module) {
  seedInitialUsers()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("Error seeding users:", error);
      process.exit(1);
    });
}