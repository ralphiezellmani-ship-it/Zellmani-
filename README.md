# Zellmani - Website

En modern webbplats byggd med HTML, CSS, JavaScript och integrerad med Supabase för datalagrering.

## Features

✨ **Moderna tekniker:**
- HTML5, CSS3, JavaScript (ES6+)
- Supabase för databaskoppling
- Responsiv design
- Gradientdesign med animationer

📊 **Funktionalitet:**
- Dynamisk listning av leads från Supabase
- Kontaktformulär med Supabase-integration
- Navigeringsmeny med smooth scrolling
- Mobilvänlig layout

## Installation

```bash
# Klona repositoryt
git clone https://github.com/ralphiezellmani-ship-it/Zellmani-.git
cd Zellmani-

# Öppna i en webserver
# Alternativ 1: Använd Python
python3 -m http.server 8000

# Alternativ 2: Använd Node.js
npx http-server
```

Öppna sedan `http://localhost:8000` i din webbläsare.

## Konfiguration

Supabase-inställningarna är hårdkodade i `script.js`. För produktionsmiljö rekommenderar vi att flytta dessa till miljövariabler:

```javascript
// Ändra dessa i script.js
const SUPABASE_URL = 'https://xxxxx.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key-here';
```

## Databas Schema

Tabellen `leads` innehåller:
- `id` (UUID) - Primärnyckel
- `name` (text) - Namn
- `email` (text) - Email
- `kommun` (text) - Kommun
- `meddelande` (text) - Meddelande
- `created_at` (timestamp) - Skapd

## Deployment

Webbplatsen är deployerad på **Vercel**: 
- URL: (kommer snart)

## Filstruktur

```
.
├── index.html       # HTML-struktur
├── style.css        # Styling
├── script.js        # JavaScript-logik
├── vercel.json      # Vercel-konfiguration
└── README.md        # Denna fil
```

## Teknologi Stack

- **Frontend:** HTML, CSS, JavaScript
- **Backend/Database:** Supabase (PostgreSQL)
- **Hosting:** Vercel
- **Version Control:** Git/GitHub

## Framtida Förbättringar

- [ ] React-omskrivning för större projekt
- [ ] Autentisering med Supabase Auth
- [ ] Admin-panel för dataredigering
- [ ] Email-notifieringar vid nya leads
- [ ] Custom domain integration

## Licens

Denna projekt är licensierad under MIT License.

## Support

För frågor eller problem, kontakta: ralphiezellmani@gmail.com

---

**Skapadt med ❤️ av Zellmani Bot** | 2026
