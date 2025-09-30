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

/**
 * Główny klient do komunikacji z API Paynow.
 * Zapewnia metody tworzenia płatności, pobierania statusu oraz walidacji i parsowania powiadomień.
 * 
 * Przykład użycia:
 * ```ts
 * const client = new PaynowClient({ apiKey: 'xxx', signatureKey: 'yyy', environment: 'sandbox' });
 * const payment = await client.createPayment({
 *   amount: 1000,
 *   externalId: 'order-123',
 *   description: 'Zamówienie #123',
 *   buyer: { email: 'test@example.com' }
 * });
 * console.log(payment.redirectUrl);
 * ```
 */
export class PaynowClient {
  private apiClient: AxiosInstance;
  private apiKey: string;
  private signatureCalculator: SignatureCalculator;
  private environment: 'sandbox' | 'production';

  /**
   * Inicjalizuje klienta Paynow.
   * @param config Konfiguracja dostępu (klucze + środowisko)
   */
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
   * Tworzy nową płatność w systemie Paynow.
   * @param paymentRequest Dane płatności (kwota w groszach, opis, dane kupującego itd.)
   * @returns Id utworzonej płatności + status + opcjonalny URL przekierowania
   * @throws Error gdy API zwróci błąd lub wystąpi problem sieciowy
   */
  async createPayment(paymentRequest: PaymentRequest): Promise<PaymentResponse> {
    try {
      const idempotencyKey = uuidv4();
      const requestData = JSON.stringify(paymentRequest);
      
      // Przygotuj headers do podpisu (w kolejności alfabetycznej)
      const signatureHeaders = {
        'Api-Key': this.apiKey,
        'Idempotency-Key': idempotencyKey,
      };
      
      const signature = this.signatureCalculator.calculateSignature(
        signatureHeaders, 
        {}, // brak parametrów query dla POST /payments
        requestData
      );

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
   * Pobiera aktualny status płatności.
   * @param paymentId Id płatności zwrócone z createPayment
   * @returns Pełny obiekt statusu płatności
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
   * Weryfikuje podpis powiadomienia webhook od Paynow.
   * @param signature Wartość nagłówka `Signature`
   * @param notificationData Surowe body JSON (string) otrzymane w webhooku
   * @returns true jeśli podpis jest poprawny
   */
  verifyNotification(signature: string, notificationData: string): boolean {
    return this.signatureCalculator.verifySignature(signature, notificationData);
  }

  /**
   * Parsuje treść powiadomienia webhook do struktury typowanej.
   * Wcześniej upewnij się, że podpis jest zweryfikowany.
   * @param notificationData Surowe body JSON
   * @throws Error jeśli JSON jest niepoprawny
   */
  parseNotification(notificationData: string): PaymentNotification {
    try {
      return JSON.parse(notificationData) as PaymentNotification;
    } catch {
      throw new Error('Invalid notification data format');
    }
  }

  /**
   * Normalizuje błędy HTTP/Axios do instancji Error z czytelnym komunikatem.
   * @internal
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