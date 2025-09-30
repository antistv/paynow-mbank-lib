# 💳 Paynow mBank Library

Nieoficjalna biblioteka Node.js/TypeScript do integracji z bramką płatniczą **Paynow** od mBanku.

[![npm version](https://badge.fury.io/js/paynow-mbank-lib.svg)](https://www.npmjs.com/package/paynow-mbank-lib)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🚀 Instalacja

```bash
npm install paynow-mbank-lib
```

## 📖 Szybki Start

### 1. Konfiguracja

```javascript
import { PaynowClient } from 'paynow-mbank-lib';
// lub: const { PaynowClient } = require('paynow-mbank-lib');

const paynow = new PaynowClient({
  apiKey: 'twoj-api-key',
  signatureKey: 'twoj-signature-key',
  environment: 'sandbox' // lub 'production'
});
```

### 2. Tworzenie płatności

```javascript
const payment = await paynow.createPayment({
  amount: 1000, // 10.00 PLN (w groszach)
  externalId: 'zamowienie-123',
  description: 'Zakup w sklepie online',
  buyer: {
    email: 'klient@example.com',
    firstName: 'Jan',
    lastName: 'Kowalski'
  },
  continueUrl: 'https://twojsklep.pl/success'
});

console.log('URL płatności:', payment.redirectUrl);
console.log('ID płatności:', payment.paymentId);
```

### 3. Sprawdzanie statusu płatności

```javascript
const status = await paynow.getPaymentStatus(payment.paymentId);
console.log('Status:', status.status);
console.log('Kwota:', status.amount);
```

### 4. Obsługa powiadomień (webhooks)

```javascript
// Express.js przykład
app.post('/paynow-webhook', express.raw({ type: 'application/json' }), (req, res) => {
  const signature = req.headers['signature'];
  const body = req.body.toString();

  // Weryfikacja podpisu
  if (!paynow.verifyNotification(signature, body)) {
    return res.status(400).send('Invalid signature');
  }

  // Parsowanie powiadomienia
  const notification = paynow.parseNotification(body);
  
  console.log(`Płatność ${notification.paymentId} ma status: ${notification.status}`);
  
  // Tutaj przetwarzaj zmianę statusu
  switch (notification.status) {
    case 'CONFIRMED':
      console.log('Płatność potwierdzona!');
      break;
    case 'REJECTED':
      console.log('Płatność odrzucona');
      break;
  }

  res.status(200).send('OK');
});
```

## 🔧 API Reference

### PaynowClient

#### Konstruktor
```typescript
new PaynowClient(config: PaynowConfig)
```

#### Metody

##### `createPayment(request: PaymentRequest): Promise<PaymentResponse>`
Tworzy nową płatność w systemie Paynow.

##### `getPaymentStatus(paymentId: string): Promise<PaymentStatusResponse>`
Pobiera aktualny status płatności.

##### `verifyNotification(signature: string, data: string): boolean`
Weryfikuje podpis powiadomienia od Paynow.

##### `parseNotification(data: string): PaymentNotification`
Parsuje dane powiadomienia od Paynow.

### Typy danych

```typescript
interface PaynowConfig {
  apiKey: string;
  signatureKey: string;
  environment?: 'sandbox' | 'production';
}

interface PaymentRequest {
  amount: number; // w groszach
  externalId: string | number;
  description: string;
  buyer: PaymentBuyer;
  continueUrl?: string;
  currency?: 'PLN';
}

interface PaymentBuyer {
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
}

enum PaymentStatus {
  NEW = 'NEW',
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  REJECTED = 'REJECTED',
  ERROR = 'ERROR'
}
```

## 🧪 Testowanie

```bash
# Uruchom wszystkie testy
npm test

# Testy w trybie watch
npm run test:watch

# Testy z pokryciem kodu
npm test -- --coverage
```

## 🏗️ Rozwój

```bash
# Sklonuj repozytorium
git clone https://github.com/yourusername/paynow-mbank-lib.git

# Zainstaluj zależności
npm install

# Budowanie w trybie watch
npm run build:watch

# Linting
npm run lint
npm run lint:fix
```

## ⚠️ Uwagi

- To jest **nieoficjalna** biblioteka, nie jest związana z mBankiem
- Zawsze testuj integrację w środowisku sandbox przed wdrożeniem
- Pamiętaj o zabezpieczeniu kluczy API

## 🤝 Contributing

1. Fork projektu
2. Stwórz branch na feature (`git checkout -b feature/AmazingFeature`)
3. Commit zmiany (`git commit -m 'Add some AmazingFeature'`)
4. Push do brancha (`git push origin feature/AmazingFeature`)
5. Otwórz Pull Request

## 📄 Licencja

MIT License - zobacz [LICENSE](LICENSE) po szczegóły.

## 🔗 Linki

- [Oficjalna dokumentacja Paynow](https://docs.paynow.pl/)
- [Paynow Sandbox](https://panel.sandbox.paynow.pl/)
- [Issues](https://github.com/yourusername/paynow-mbank-lib/issues)
- [NPM Package](https://www.npmjs.com/package/paynow-mbank-lib)