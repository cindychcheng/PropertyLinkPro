/**
 * Server-side date utilities to ensure consistent date handling
 * 
 * PostgreSQL date type stores dates without time information, but when
 * JavaScript reads them, it applies the local timezone, which can cause
 * the date to shift. These utilities prevent those shifts.
 */

/**
 * Normalizes a date string from the client to ensure the date
 * doesn't shift when stored in PostgreSQL date fields
 * 
 * CRITICAL FIX: This specifically addresses the birthday shifting issues
 * by carefully preserving the exact date chosen by the user
 */
export function normalizeDate(dateStr: string | Date | null | undefined): Date | null {
  if (!dateStr) return null;

  // For debugging
  console.log("Original date value:", dateStr);
  
  // For date strings in YYYY-MM-DD format (from HTML date inputs)
  if (typeof dateStr === 'string' && dateStr.length === 10 && dateStr.includes('-')) {
    // Store the exact string parts for direct reassembly
    const [year, month, day] = dateStr.split('-');
    
    // Log the components
    console.log(`Parsed date parts: year=${year}, month=${month}, day=${day}`);
    
    // Create a date manually with the exact day the user selected
    // Important: month is 0-indexed in JS Date, so subtract 1
    const parsedYear = parseInt(year, 10);
    const parsedMonth = parseInt(month, 10) - 1; // Convert from 1-based to 0-based
    const parsedDay = parseInt(day, 10);
    
    // Create the date at noon UTC to avoid timezone issues
    const date = new Date(Date.UTC(parsedYear, parsedMonth, parsedDay, 12, 0, 0, 0));
    
    // Log the created date for debugging
    console.log("Normalized date:", date, "UTC string:", date.toUTCString());
    
    return date;
  } 
  
  // Handle regular Date objects or other string formats
  let date: Date;
  if (typeof dateStr === 'string') {
    date = new Date(dateStr);
  } else {
    date = new Date(dateStr);
  }
  
  // Ensure no time component to avoid timezone issues
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();
  
  // Create a new date at noon UTC
  const normalizedDate = new Date(Date.UTC(year, month, day, 12, 0, 0, 0));
  
  return normalizedDate;
}

/**
 * Converts a PostgreSQL date to a client-safe format
 * This ensures that what the database returns doesn't get timezone shifted
 */
export function formatDateForClient(date: Date | null | undefined): string | null {
  if (!date) return null;
  
  // Use UTC date components to avoid timezone shifts
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}