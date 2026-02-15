# BodyOS (Expo Only)

BodyOS läuft jetzt als **eine einzige Expo-App** für:

- Web
- iOS
- Android

Es gibt **kein Next.js Backend** mehr. Alle Daten werden lokal in der App gespeichert (AsyncStorage).

## Start

```bash
npm install
npm run dev
```

## Plattformen

```bash
npm run web
npm run ios
npm run android
```

## Web Export

```bash
npm run export:web
```

## Features

- Login (lokaler Demo-User)
- Produkte und Rezepte
- Plan-Generierung
- Profil-Ziele und Ausschlüsse
- JSON Import
- Soft Delete und Hard Delete

## Demo Login

- Email: `demo@bodyos.local`
- Passwort: `Passw0rd!`

## Beispieldaten

In der Import-Seite gibt es einen Button `100 Rezepte laden` mit integrierter Beispieldatei.
