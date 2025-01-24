import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
 
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getMonthOptions() {
  const options = [];
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();

  // Generate options for the next 12 months
  for (let i = 0; i < 12; i++) {
    const date = new Date(currentYear, currentMonth + i, 1);
    const value = date.toISOString().slice(0, 7);
    const label = date.toLocaleDateString('es', { month: 'long', year: 'numeric' });
    options.push({ value, label });
  }

  return options;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-UY', {
    style: 'currency',
    currency: 'UYU'
  }).format(amount);
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('es-UY', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}