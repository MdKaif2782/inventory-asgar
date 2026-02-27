import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format amount in BDT (Bangladeshi Taka)
export function formatBDT(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return '৳ 0.00';
  return `৳ ${amount.toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
