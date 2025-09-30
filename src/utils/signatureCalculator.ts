import * as crypto from 'crypto';

export class SignatureCalculator {
  private signatureKey: string;

  constructor(signatureKey: string) {
    this.signatureKey = signatureKey;
  }

  /**
   * Oblicza podpis dla żądania płatności zgodnie z dokumentacją Paynow
   * @param data Dane do podpisania (request body jako JSON string)
   * @returns Base64 encoded signature
   */
  calculateSignature(data: string): string {
    const hmac = crypto.createHmac('sha256', this.signatureKey);
    hmac.update(data, 'utf8');
    return hmac.digest('base64');
  }

  /**
   * Weryfikuje podpis powiadomienia od Paynow
   * @param receivedSignature Podpis z nagłówka Signature
   * @param data Dane powiadomienia (request body jako JSON string)
   * @returns true jeśli podpis jest prawidłowy
   */
  verifySignature(receivedSignature: string, data: string): boolean {
    const calculatedSignature = this.calculateSignature(data);
    return calculatedSignature === receivedSignature;
  }
}