// Type-level tests (assertions) - can be executed by tsd in future
import { PaynowClient, PaymentRequest, PaymentStatus } from '../../src';

// Basic compile-time contract checks
const client = new PaynowClient({ apiKey: 'a', signatureKey: 'b', environment: 'sandbox' });

const request: PaymentRequest = {
  amount: 1234,
  externalId: 'order-1',
  description: 'Test',
  buyer: { email: 'user@example.com' },
};

// createPayment should return a promise
(async () => {
  const p = await client.createPayment(request);
  p.paymentId satisfies string;
  p.status satisfies PaymentStatus;
})();

// Intentional wrong usage (commented out) – uncommenting should cause type errors
// Przykład błędnego użycia (odkomentuj aby zobaczyć błąd typów w edytorze):
// const badReq: PaymentRequest = { amount: '100', externalId: 'x', description: 'x', buyer: { email: 'a@b.pl' } };

export {};