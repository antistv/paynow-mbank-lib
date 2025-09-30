import * as crypto from 'crypto';

export class SignatureCalculator {
  private signatureKey: string;

  constructor(signatureKey: string) {
    this.signatureKey = signatureKey;
  }

  /**
   * Oblicza podpis dla żądania API zgodnie z dokumentacją Paynow.
   * Tworzy payload z posortowanych alfabetycznie headers, parameters i body.
   * @param headers Nagłówki HTTP (np. Api-Key, Idempotency-Key)
   * @param parameters Parametry query string (opcjonalne)
   * @param body Treść żądania jako JSON string
   * @returns Base64 encoded HMAC-SHA256 signature
   */
  calculateSignature(headers: Record<string, string>, parameters: Record<string, string> = {}, body: string): string {
    // Sortuj klucze alfabetycznie (wymagane przez Paynow API)
    const sortedHeaders: Record<string, string> = {};
    Object.keys(headers).sort().forEach(key => {
      sortedHeaders[key] = headers[key];
    });

    const sortedParameters: Record<string, string> = {};
    Object.keys(parameters).sort().forEach(key => {
      sortedParameters[key] = parameters[key];
    });

    // Konstruuj payload zgodnie z dokumentacją Paynow
    const payload = {
      headers: sortedHeaders,
      parameters: sortedParameters,
      body: body
    };

    const payloadString = JSON.stringify(payload);
    
    const hmac = crypto.createHmac('sha256', this.signatureKey);
    hmac.update(payloadString, 'utf8');
    return hmac.digest('base64');
  }

  /**
   * Oblicza prosty podpis HMAC-SHA256 dla powiadomień webhook.
   * Używa bezpośrednio body bez dodatkowej struktury payload.
   * @param data Surowe dane do podpisania
   * @returns Base64 encoded signature
   */
  private calculateSignatureSimple(data: string): string {
    const hmac = crypto.createHmac('sha256', this.signatureKey);
    hmac.update(data, 'utf8');
    return hmac.digest('base64');
  }

  /**
   * Weryfikuje podpis powiadomienia webhook od Paynow.
   * Powiadomienia używają prostszego schematu podpisywania niż API requests.
   * @param receivedSignature Podpis z nagłówka `Signature` w webhooku
   * @param data Dane powiadomienia (surowe body JSON jako string)
   * @returns true jeśli podpis jest prawidłowy
   */
  verifySignature(receivedSignature: string, data: string): boolean {
    const calculatedSignature = this.calculateSignatureSimple(data);
    return calculatedSignature === receivedSignature;
  }
}