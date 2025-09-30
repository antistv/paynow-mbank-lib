// Paynow API Types based on public documentation (model uproszczony pod bibliotekę)
// Wszystkie kwoty: w groszach (integer). Daty jako ISO string.

/**
 * Konfiguracja klienta Paynow
 */
export interface PaynowConfig {
  apiKey: string;
  signatureKey: string;
  environment?: 'sandbox' | 'production';
}

export interface PaymentBuyer {
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: {
    prefix: string; // e.g., "+48"
    number: string; // e.g., "123456789"
  };
  address?: {
    billing?: {
      street?: string;
      houseNumber?: string;
      apartmentNumber?: string;
      zipcode?: string;
      city?: string;
      county?: string;
      country?: string; // e.g., "PL"
    };
    shipping?: {
      street?: string;
      houseNumber?: string;
      apartmentNumber?: string;
      zipcode?: string;
      city?: string;
      county?: string;
      country?: string; // e.g., "PL"
    };
  };
  locale?: string; // e.g., "pl", "en" default is "pl-PL"
  externalId?: string | number; // optional buyer ID
}

export interface OrderItem {
  name: string;
  producer?: string;
  category: string;
  quantity: number;
  price: number; // cena w groszach
}

export interface PaymentRequest {
  amount: number; // w groszach (np. 1000 = 10.00 PLN)
  externalId: string | number;
  description: string;
  buyer: PaymentBuyer;
  continueUrl?: string; // URL powrotu z płatności
  currency?: 'PLN' | 'EUR' | 'USD' | 'GBP'; // domyślnie 'PLN'
  validityTime?: number; // ważność płatności w sekundach
  orderItems?: OrderItem[];
}

export interface PaymentResponse {
  paymentId: string;
  redirectUrl?: string;
  status: PaymentStatus;
}

export interface PaymentNotification {
  paymentId: string;
  externalId: string;
  status: PaymentStatus;
  modifiedAt: string;
}

export enum PaymentStatus {
  NEW = 'NEW',
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  REJECTED = 'REJECTED',
  ERROR = 'ERROR',
  EXPIRED = 'EXPIRED',
  ABANDONED = 'ABANDONED',
}

export interface PaymentStatusResponse {
  paymentId: string;
  externalId: string;
  status: PaymentStatus;
  amount: number;
  currency: string;
  buyer: PaymentBuyer;
  createdAt: string;
  modifiedAt: string;
}

export interface PaynowError {
  message: string;
  code?: string;
  field?: string;
}

export interface PaynowApiError {
  errors: PaynowError[];
}