import { format, differenceInMonths, addMonths, addYears, differenceInDays, isValid } from 'date-fns';

// Format a date to display in UI with timezone protection
export function formatDisplayDate(date: Date | string | null | undefined): string {
  if (!date) return 'N/A';
  
  let year: number;
  let month: number;
  let day: number;
  
  if (typeof date === 'string') {
    // If it's a date-only string like "2023-05-15"
    if (date.length === 10 && date.includes('-')) {
      const parts = date.split('-').map(num => parseInt(num, 10));
      year = parts[0];
      month = parts[1] - 1;  // Months are 0-indexed in JS Date
      day = parts[2];
    } else {
      // Parse other date formats
      const dateObj = new Date(date);
      year = dateObj.getFullYear();
      month = dateObj.getMonth();
      day = dateObj.getDate();
    }
  } else {
    // If a Date object was provided
    year = date.getFullYear();
    month = date.getMonth();
    day = date.getDate();
  }
  
  // Create a new date set to noon to avoid timezone boundary issues
  const normalizedDate = new Date(year, month, day, 12, 0, 0);
  
  if (!isValid(normalizedDate)) return 'Invalid Date';
  
  return format(normalizedDate, 'MMM d, yyyy');
}

// Format a date to display month and day only (for birthdays)
export function formatBirthday(date: Date | string | null | undefined): string {
  if (!date) return 'N/A';
  
  let year: number;
  let month: number;
  let day: number;
  
  if (typeof date === 'string') {
    // If it's a date-only string like "2023-05-15"
    if (date.length === 10 && date.includes('-')) {
      const parts = date.split('-').map(num => parseInt(num, 10));
      year = parts[0];
      month = parts[1] - 1;  // Months are 0-indexed in JS Date
      day = parts[2];
    } else {
      // Parse other date formats
      const dateObj = new Date(date);
      year = dateObj.getFullYear();
      month = dateObj.getMonth();
      day = dateObj.getDate();
    }
  } else {
    // If a Date object was provided
    year = date.getFullYear();
    month = date.getMonth();
    day = date.getDate();
  }
  
  // Create a new date set to noon to avoid timezone boundary issues
  const normalizedDate = new Date(year, month, day, 12, 0, 0);
  
  if (!isValid(normalizedDate)) return 'Invalid Date';
  
  return format(normalizedDate, 'MMM d');
}

// Format a date for input fields - prevents timezone shifts for birthdays
export function formatInputDate(date: Date | string | null | undefined): string {
  if (!date) return '';
  
  let dateObj: Date;
  let year: number;
  let month: number;
  let day: number;
  
  if (typeof date === 'string') {
    // If it's a date-only string like "2023-05-15"
    if (date.length === 10 && date.includes('-')) {
      const parts = date.split('-').map(num => parseInt(num, 10));
      year = parts[0];
      month = parts[1] - 1;  // Months are 0-indexed in JS Date
      day = parts[2];
    } else {
      // Parse other date formats
      dateObj = new Date(date);
      // Create a new date with just the date part (no time) to prevent timezone shifts
      year = dateObj.getFullYear();
      month = dateObj.getMonth();
      day = dateObj.getDate();
    }
  } else {
    // If a Date object was provided
    year = date.getFullYear();
    month = date.getMonth();
    day = date.getDate();
  }
  
  // Create a new date set to noon to avoid timezone boundary issues
  const normalizedDate = new Date(year, month, day, 12, 0, 0);
  
  if (!isValid(normalizedDate)) return '';
  
  // Format as YYYY-MM-DD for input fields
  const formattedYear = normalizedDate.getFullYear();
  // Month is 0-indexed in JS Date, so add 1 for display
  const formattedMonth = String(normalizedDate.getMonth() + 1).padStart(2, '0');
  const formattedDay = String(normalizedDate.getDate()).padStart(2, '0');
  
  return `${formattedYear}-${formattedMonth}-${formattedDay}`;
}

// Calculate months since a date
export function getMonthsSince(date: Date | string | null | undefined): number {
  if (!date) return 0;
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  if (!isValid(dateObj)) return 0;
  
  return differenceInMonths(new Date(), dateObj);
}

// Calculate reminder date (8 months after increase date, rounded to 1st of month)
export function calculateReminderDate(increaseDate: Date): Date {
  if (!isValid(increaseDate)) return new Date();
  
  const reminderMonth = addMonths(increaseDate, 8);
  return new Date(reminderMonth.getFullYear(), reminderMonth.getMonth(), 1);
}

// Calculate next allowable increase date (1 year after increase date)
export function calculateNextAllowableDate(increaseDate: Date): Date {
  if (!isValid(increaseDate)) return new Date();
  
  return addYears(increaseDate, 1);
}

// Calculate next allowable increase amount (3% increase)
export function calculateNextAllowableRate(currentRate: number): number {
  return parseFloat((currentRate * 1.03).toFixed(2));
}

// Format currency for display
export function formatCurrency(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined) return '$0.00';
  
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(numAmount);
}

// Format currency without dollar sign for input fields
export function formatCurrencyInput(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined) return '';
  
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  return numAmount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// Format percentage for display 
export function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}

// Return an appropriate CSS class based on months since increase
export function getMonthsSinceClass(months: number): string {
  if (months >= 10) return 'bg-error text-white';
  if (months >= 8) return 'bg-warning text-white';
  return 'bg-info text-white';
}
