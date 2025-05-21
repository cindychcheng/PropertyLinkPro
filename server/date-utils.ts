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
 */
export function normalizeDate(dateStr: string | Date | null | undefined): Date | null {
  if (!dateStr) return null;
  
  let date: Date;
  
  if (typeof dateStr === 'string') {
    // Parse the date string - if it's YYYY-MM-DD format
    if (dateStr.length === 10 && dateStr.includes('-')) {
      const [year, month, day] = dateStr.split('-').map(n => parseInt(n, 10));
      // Create date with noon time to avoid timezone boundaries
      date = new Date(year, month - 1, day, 12, 0, 0, 0);
    } else {
      // Handle other date formats
      date = new Date(dateStr);
    }
  } else {
    // It's already a Date object
    date = dateStr;
  }
  
  // Set time to noon to avoid timezone boundary issues
  date.setHours(12, 0, 0, 0);
  
  return date;
}

/**
 * Converts a PostgreSQL date to a client-safe format
 * This ensures that what the database returns doesn't get timezone shifted
 */
export function formatDateForClient(date: Date | null | undefined): string | null {
  if (!date) return null;
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}