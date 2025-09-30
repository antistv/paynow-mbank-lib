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
    const signature = signatureCalculator.calculateSignature(testData);
    
    expect(paynowClient.verifyNotification(signature, testData)).toBe(true);
    expect(paynowClient.verifyNotification('wrong-signature', testData)).toBe(false);
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

  it('should calculate consistent signatures', () => {
    const data = 'test data';
    const signature1 = signatureCalculator.calculateSignature(data);
    const signature2 = signatureCalculator.calculateSignature(data);
    
    expect(signature1).toBe(signature2);
  });

  it('should verify signatures correctly', () => {
    const data = 'test data';
    const signature = signatureCalculator.calculateSignature(data);
    
    expect(signatureCalculator.verifySignature(signature, data)).toBe(true);
    expect(signatureCalculator.verifySignature('wrong', data)).toBe(false);
  });
});