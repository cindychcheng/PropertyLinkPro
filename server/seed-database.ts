import { format, addMonths } from "date-fns";
import { db } from "./db";
import { 
  landlords, 
  landlordOwners, 
  tenants, 
  rentalRateIncreases, 
  rentalRateHistory,
  ServiceType
} from "@shared/schema";

export async function seedDatabase() {
  try {
    console.log("Starting database seed...");
    
    // Check if we already have data
    const existingLandlords = await db.select().from(landlords);
    if (existingLandlords.length > 0) {
      console.log("Database already has data, skipping seed");
      return;
    }
    
    // Properties / Landlords
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

    // Landlord Owners
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

    // Tenants
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

    // We'll leave property4 vacant

    // Rental Rate Increases
    console.log("Seeding rental rate increases...");
    const today = new Date();
    const oneYearAgo = new Date(today);
    oneYearAgo.setFullYear(today.getFullYear() - 1);
    oneYearAgo.setMonth(today.getMonth() - 2);

    await db.insert(rentalRateIncreases).values({
      propertyAddress: property1.propertyAddress,
      latestRateIncreaseDate: format(oneYearAgo, 'yyyy-MM-dd'),
      latestRentalRate: 1850,
      nextAllowableRentalIncreaseDate: format(addMonths(oneYearAgo, 12), 'yyyy-MM-dd'),
      nextAllowableRentalRate: 1905.50,
      reminderDate: format(addMonths(oneYearAgo, 8), 'yyyy-MM-dd')
    });

    const twoYearsAgo = new Date(today);
    twoYearsAgo.setFullYear(today.getFullYear() - 2);
    
    await db.insert(rentalRateIncreases).values({
      propertyAddress: property2.propertyAddress,
      latestRateIncreaseDate: format(twoYearsAgo, 'yyyy-MM-dd'),
      latestRentalRate: 2200,
      nextAllowableRentalIncreaseDate: format(addMonths(twoYearsAgo, 12), 'yyyy-MM-dd'),
      nextAllowableRentalRate: 2266,
      reminderDate: format(addMonths(twoYearsAgo, 8), 'yyyy-MM-dd')
    });

    const sixMonthsAgo = new Date(today);
    sixMonthsAgo.setMonth(today.getMonth() - 6);
    
    await db.insert(rentalRateIncreases).values({
      propertyAddress: property3.propertyAddress,
      latestRateIncreaseDate: format(sixMonthsAgo, 'yyyy-MM-dd'),
      latestRentalRate: 1725,
      nextAllowableRentalIncreaseDate: format(addMonths(sixMonthsAgo, 12), 'yyyy-MM-dd'),
      nextAllowableRentalRate: 1776.75,
      reminderDate: format(addMonths(sixMonthsAgo, 8), 'yyyy-MM-dd')
    });

    // Rental Rate History
    console.log("Seeding rental rate history...");
    const twoYearsAndOneMonthAgo = new Date(twoYearsAgo);
    twoYearsAndOneMonthAgo.setMonth(twoYearsAgo.getMonth() - 1);
    
    await db.insert(rentalRateHistory).values({
      propertyAddress: property1.propertyAddress,
      increaseDate: format(oneYearAgo, 'yyyy-MM-dd'),
      previousRate: 1795,
      newRate: 1850,
      notes: "Annual rental increase"
    });

    await db.insert(rentalRateHistory).values({
      propertyAddress: property1.propertyAddress,
      increaseDate: format(new Date(oneYearAgo.getFullYear() - 1, oneYearAgo.getMonth(), oneYearAgo.getDate()), 'yyyy-MM-dd'),
      previousRate: 1750,
      newRate: 1795,
      notes: "Annual rental increase"
    });

    await db.insert(rentalRateHistory).values({
      propertyAddress: property2.propertyAddress,
      increaseDate: format(twoYearsAgo, 'yyyy-MM-dd'),
      previousRate: 2140,
      newRate: 2200,
      notes: "Annual increase plus additional for renovations"
    });

    await db.insert(rentalRateHistory).values({
      propertyAddress: property2.propertyAddress,
      increaseDate: format(new Date(twoYearsAgo.getFullYear() - 1, twoYearsAgo.getMonth(), twoYearsAgo.getDate()), 'yyyy-MM-dd'),
      previousRate: 2075,
      newRate: 2140,
      notes: "Standard annual increase"
    });

    await db.insert(rentalRateHistory).values({
      propertyAddress: property3.propertyAddress,
      increaseDate: format(sixMonthsAgo, 'yyyy-MM-dd'),
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