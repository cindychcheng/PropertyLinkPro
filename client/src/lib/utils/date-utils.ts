import { format, differenceInMonths, addMonths, addYears, differenceInDays, isValid } from 'date-fns';

// Format a date to display in UI
export function formatDisplayDate(date: Date | string | null | undefined): string {
  if (!date) return 'N/A';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  if (!isValid(dateObj)) return 'Invalid Date';
  
  return format(dateObj, 'MMM d, yyyy');
}

// Format a date to display month and day only (for birthdays)
export function formatBirthday(date: Date | string | null | undefined): string {
  if (!date) return 'N/A';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  if (!isValid(dateObj)) return 'Invalid Date';
  
  return format(dateObj, 'MMM d');
}

// Format a date for input fields
export function formatInputDate(date: Date | string | null | undefined): string {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  if (!isValid(dateObj)) return '';
  
  // Use UTC date to avoid timezone issues
  const year = dateObj.getUTCFullYear();
  const month = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getUTCDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
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
