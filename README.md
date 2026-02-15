# BodyOS

BodyOS ist jetzt als Hybrid-Stack aufgebaut:

- `Next.js` App (`/src`) als Backend + Web-App (API, DB, Auth.js)
- `Expo` App (`/apps/mobile`) als native iOS/Android/Web Client

So kannst du sofort mit Expo starten und später native Builds veröffentlichen, ohne das Backend neu zu bauen.

## Architektur

- Backend/API: Next.js App Router + Prisma + SQLite
- Web UI: Next.js
- Mobile UI: Expo Router (React Native)
- Mobile Auth: Bearer Token über `/api/mobile/login` und `/api/mobile/me`
- Session Auth (Web): NextAuth Credentials

## Voraussetzungen

- Node.js 20+
- npm
- Für iOS Builds: Xcode + Apple Developer Setup

## Setup

```bash
npm install
```

## Datenbank

```bash
npm run prisma:generate
npm run prisma:migrate
npm run seed:user
```

Standard Demo-Login:

- `demo@bodyos.local`
- `Passw0rd!`

## Web starten (Next.js)

```bash
npm run dev
```

## Mobile starten (Expo)

```bash
npm run dev:mobile
```

Nützliche mobile Commands:

```bash
npm run ios:mobile
npm run web:mobile
npm run build:mobile:web
```

## Mobile API Konfiguration

`apps/mobile/app.json`:

```json
{
  "expo": {
    "extra": {
      "apiBaseUrl": "http://localhost:3000"
    }
  }
}
```

Für echte Geräte muss `apiBaseUrl` auf deine LAN-IP zeigen (nicht `localhost`).

## Import JSON

Beispieldatei:

- `public/data/import-100-recipes.json`

Import via Web:

- Seite `/import`

Import via Mobile:

- Tab `Mehr` -> `Import`

## Löschen

- Soft Delete: löscht Produkt-/Rezept-/Planungsdaten
- Hard Delete: zusätzlich alle User/Profile/Sessions (`/api/import?mode=hard`)

## Hinweise für Produktion

- `NEXTAUTH_SECRET` stark und zufällig setzen
- SQLite für Einzel-Host ok; für mehrere Nutzer/Instanzen Postgres bevorzugen
- Mobile Token TTL aktuell 24h (`src/lib/auth/mobileToken.ts`)
- iOS/Android Release-Builds über EAS Build einrichten
