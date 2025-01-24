// Payment system models
export enum PaymentStatus {
  PAID = 'paid',
  PENDING = 'pending', 
  OVERDUE = 'overdue'
}

export enum PaymentMethod {
  CASH = 'cash',
  TRANSFER = 'transfer',
  CARD = 'card'
}

// Monthly fee configuration
export interface MonthlyFee {
  month: string; // YYYY-MM format
  amount: number;
  dueDay: number;
  description?: string;
}

// Discount configuration
export interface DiscountConfig {
  siblings: {
    enabled: boolean;
    amount: number;
    isPercentage: boolean;
  };
  customDiscounts: {
    id: string;
    name: string;
    amount: number;
    isPercentage: boolean;
    description?: string;
    months: string[]; // YYYY-MM format
  }[];
}

// Player fee status
export interface PlayerFeeStatus {
  active: boolean;
  customAmount?: number;
}

// Category fee configuration
export interface CategoryFeeConfig {
  id: string;
  categoryId: string;
  name: string;
  baseAmount: number;
  dueDay: number;
  isVariableAmount: boolean;
  monthlyFees?: MonthlyFee[];
  discounts: DiscountConfig;
  players: { [playerId: string]: PlayerFeeStatus };
  createdAt: string;
  updatedAt: string;
}

// Payment record
export interface Payment {
  id: string;
  playerId: string;
  playerName: string;
  categoryId: string;
  categoryName: string;
  amount: number;
  month: string; // YYYY-MM format
  dueDate: string;
  paymentDate?: string;
  status: PaymentStatus;
  paymentMethod?: PaymentMethod;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}