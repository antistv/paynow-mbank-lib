import axios, { AxiosInstance, AxiosError } from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { 
  PaynowConfig, 
  PaymentRequest, 
  PaymentResponse, 
  PaymentStatusResponse,
  PaymentNotification,
  PaynowApiError
} from '../types';
import { SignatureCalculator } from '../utils/signatureCalculator';

export class PaynowClient {
  private apiClient: AxiosInstance;
  private apiKey: string;
  private signatureCalculator: SignatureCalculator;
  private environment: 'sandbox' | 'production';

  constructor(config: PaynowConfig) {
    this.apiKey = config.apiKey;
    this.environment = config.environment || 'sandbox';
    this.signatureCalculator = new SignatureCalculator(config.signatureKey);

    const baseURL = this.environment === 'production' 
      ? 'https://api.paynow.pl/v3'
      : 'https://api.sandbox.paynow.pl/v3';

    this.apiClient = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
        'Api-Key': this.apiKey,
      },
      timeout: 30000,
    });
  }

  /**
   * Tworzy nową płatność w systemie Paynow
   */
  async createPayment(paymentRequest: PaymentRequest): Promise<PaymentResponse> {
    try {
      const idempotencyKey = uuidv4();
      const requestData = JSON.stringify(paymentRequest);
      const signature = this.signatureCalculator.calculateSignature(requestData);

      const response = await this.apiClient.post('/payments', paymentRequest, {
        headers: {
          'Signature': signature,
          'Idempotency-Key': idempotencyKey,
        },
      });

      return {
        paymentId: response.data.paymentId,
        redirectUrl: response.data.redirectUrl,
        status: response.data.status,
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Pobiera status płatności
   */
  async getPaymentStatus(paymentId: string): Promise<PaymentStatusResponse> {
    try {
      const response = await this.apiClient.get(`/payments/${paymentId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Weryfikuje powiadomienie od Paynow
   */
  verifyNotification(signature: string, notificationData: string): boolean {
    return this.signatureCalculator.verifySignature(signature, notificationData);
  }

  /**
   * Parsuje powiadomienie od Paynow
   */
  parseNotification(notificationData: string): PaymentNotification {
    try {
      return JSON.parse(notificationData) as PaymentNotification;
    } catch (error) {
      throw new Error('Invalid notification data format');
    }
  }

  /**
   * Obsługuje błędy API
   */
  private handleError(error: unknown): Error {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<PaynowApiError>;
      
      if (axiosError.response?.data?.errors) {
        const errorMessages = axiosError.response.data.errors
          .map(err => `${err.field ? `${err.field}: ` : ''}${err.message}`)
          .join(', ');
        return new Error(`Paynow API Error: ${errorMessages}`);
      }
      
      if (axiosError.response?.status) {
        return new Error(`Paynow API Error: HTTP ${axiosError.response.status}`);
      }
      
      if (axiosError.code === 'ECONNABORTED') {
        return new Error('Paynow API Error: Request timeout');
      }
      
      return new Error(`Paynow API Error: ${axiosError.message}`);
    }
    
    return new Error('Unexpected error occurred');
  }
}