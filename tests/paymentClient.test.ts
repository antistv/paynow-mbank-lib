import { PaynowClient } from '../src/client/paymentClient';
import { SignatureCalculator } from '../src/utils/signatureCalculator';
import { PaynowConfig, PaymentRequest, PaymentStatus } from '../src/types';

describe('PaynowClient', () => {
  let paynowClient: PaynowClient;
  const config: PaynowConfig = {
    apiKey: 'test-api-key',
    signatureKey: 'test-signature-key',
    environment: 'sandbox'
  };

  beforeEach(() => {
    paynowClient = new PaynowClient(config);
  });

  it('should create a PaynowClient instance', () => {
    expect(paynowClient).toBeInstanceOf(PaynowClient);
  });

  it('should verify notification signature correctly', () => {
    const signatureCalculator = new SignatureCalculator('test-signature-key');
    const testData = '{"paymentId":"TEST-123","status":"CONFIRMED"}';
    
    // Dla weryfikacji powiadomień używamy bezpośredniego dostępu do prywatnej metody
    // poprzez refleksję lub tworzymy własny podpis w sposób zgodny z Paynow
    const testSignature = 'mocked-signature';
    
    // Sprawdzamy czy metoda weryfikacji działa poprawnie z nieprawidłowym podpisem
    expect(paynowClient.verifyNotification('wrong-signature', testData)).toBe(false);
    
    // Test z poprawnym podpisem byłby możliwy gdyby znać dokładny algorytm Paynow
    // W realnym środowisku testowym używalibyśmy przykładów z dokumentacji Paynow
  });

  it('should parse notification data correctly', () => {
    const notificationData = JSON.stringify({
      paymentId: 'TEST-123',
      externalId: '12345',
      status: PaymentStatus.CONFIRMED,
      modifiedAt: '2024-01-01T12:00:00Z'
    });

    const parsed = paynowClient.parseNotification(notificationData);
    expect(parsed.paymentId).toBe('TEST-123');
    expect(parsed.status).toBe(PaymentStatus.CONFIRMED);
  });
});

describe('SignatureCalculator', () => {
  let signatureCalculator: SignatureCalculator;

  beforeEach(() => {
    signatureCalculator = new SignatureCalculator('test-key');
  });

  it('should calculate consistent API signatures', () => {
    const headers = { 'Api-Key': 'test-key', 'Content-Type': 'application/json' };
    const parameters = {};
    const body = '{"amount":1000,"description":"test"}';
    
    const signature1 = signatureCalculator.calculateSignature(headers, parameters, body);
    const signature2 = signatureCalculator.calculateSignature(headers, parameters, body);
    
    expect(signature1).toBe(signature2);
    expect(signature1).toBeTruthy();
  });

  it('should calculate different signatures for different data', () => {
    const headers1 = { 'Api-Key': 'test-key-1' };
    const headers2 = { 'Api-Key': 'test-key-2' };
    const body = '{"test":"data"}';
    
    const signature1 = signatureCalculator.calculateSignature(headers1, {}, body);
    const signature2 = signatureCalculator.calculateSignature(headers2, {}, body);
    
    expect(signature1).not.toBe(signature2);
  });

  it('should verify webhook notification signatures correctly', () => {
    const notificationData = '{"paymentId":"TEST-123","status":"CONFIRMED"}';
    
    // Test weryfikacji z nieprawidłowym podpisem
    expect(signatureCalculator.verifySignature('invalid-signature', notificationData)).toBe(false);
    
    // Test spójności implementacji - podpis wygenerowany przez nas powinien się weryfikować
    const testCalculator = new SignatureCalculator('test-key');
    const generatedSignature = (testCalculator as any).calculateSignatureSimple(notificationData);
    expect(testCalculator.verifySignature(generatedSignature, notificationData)).toBe(true);
    
    // Test z różnymi kluczami - różne klucze powinny dawać różne podpisy
    const calc1 = new SignatureCalculator('key1');
    const calc2 = new SignatureCalculator('key2');
    const sig1 = (calc1 as any).calculateSignatureSimple(notificationData);
    const sig2 = (calc2 as any).calculateSignatureSimple(notificationData);
    expect(sig1).not.toBe(sig2);
  });

  it('should sort headers alphabetically for consistent signatures', () => {
    const headers1 = { 'Z-Header': 'z', 'A-Header': 'a', 'M-Header': 'm' };
    const headers2 = { 'A-Header': 'a', 'M-Header': 'm', 'Z-Header': 'z' };
    const body = '{"test":true}';
    
    const signature1 = signatureCalculator.calculateSignature(headers1, {}, body);
    const signature2 = signatureCalculator.calculateSignature(headers2, {}, body);
    
    expect(signature1).toBe(signature2);
  });
});