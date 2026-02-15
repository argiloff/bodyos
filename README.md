# BodyOS (Expo Only)

BodyOS ist eine einzelne Expo-App (kein Next.js, kein separates Backend) mit Fokus auf Ernährungsplanung:

- Web
- iOS
- Android

Alle Daten werden lokal in `AsyncStorage` gespeichert.

## Inhaltsverzeichnis

1. Überblick
2. Voraussetzungen
3. Setup und Start
4. Build und Export
5. Projektstruktur
6. Funktionsumfang
7. Datenmodell
8. JSON-Import (inkl. Bilder)
9. Bedien-Workflow
10. Funktionalitätstest (manuell)
11. Troubleshooting
12. Sicherheit und Grenzen

## 1. Überblick

Die App bietet:

- Login mit lokalem Demo-Account
- Produktverwaltung (CRUD, inkl. Bild)
- Rezeptverwaltung (CRUD, inkl. Schrittbilder)
- Planer für Tages-/Wochenpläne mit Makrozielen
- Kochmodus mit Schrittführung
- Einkaufsliste aus Plan
- Import von Produkten und Rezepten per JSON
- Soft-/Hard-Reset der lokalen Daten

## 2. Voraussetzungen

- Node.js 20+ empfohlen
- npm 10+ empfohlen
- Xcode (nur iOS lokal)
- Android Studio / Emulator (nur Android lokal)

## 3. Setup und Start

Im Repository-Root:

```bash
npm install
npm run dev
```

Plattform starten:

```bash
npm run web
npm run ios
npm run android
```

## 4. Build und Export

Typecheck:

```bash
npm run typecheck
```

Web Export:

```bash
npm run export:web
```

Output liegt unter:

- `apps/mobile/dist`

## 5. Projektstruktur

Root:

- `package.json` (Root-Skripte)
- `apps/mobile` (eigentliche App)

Wichtige App-Dateien:

- `apps/mobile/app/_layout.tsx` (Root-Navigation)
- `apps/mobile/app/(tabs)/_layout.tsx` (Bottom Tabs)
- `apps/mobile/app/(tabs)/index.tsx` (Dashboard)
- `apps/mobile/app/(tabs)/products.tsx` (Produkte)
- `apps/mobile/app/(tabs)/recipes.tsx` (Rezepte)
- `apps/mobile/app/(tabs)/planner.tsx` (Planer)
- `apps/mobile/app/(tabs)/more.tsx` (Mehr)
- `apps/mobile/app/plan/[id].tsx` (Plan-Details + Einkaufsliste)
- `apps/mobile/app/cook/[recipeId].tsx` (Kochmodus)
- `apps/mobile/app/import.tsx` (Import + Reset)
- `apps/mobile/src/auth/AuthContext.tsx` (Datenhaltung + Services)
- `apps/mobile/src/theme.ts` (hell/dunkel Theme)
- `apps/mobile/assets/data/import-100-recipes.json` (Beispieldaten)

## 6. Funktionsumfang

### Auth

- Lokaler Login ohne externen Provider
- Demo-Benutzer vordefiniert

### Produkte

- Erstellen, Bearbeiten, Löschen
- Optionales Produktbild (`imageUri`)
- Substitutionsliste (`allowed_substitutes`)
- Beim Umbenennen einer Produkt-ID werden Referenzen in Rezepten aktualisiert

### Rezepte

- Erstellen, Bearbeiten, Löschen
- Zutaten mit Grammangabe
- Schrittliste
- Optionale Schrittbilder (URL oder Galerie)
- Rezept-Assistent mit Produktsuche und Makro-Vorschau

### Planung

- Plan-Generierung über Zeitraum
- Ziele: kcal + Protein
- Berücksichtigung ausgeschlossener Produkte
- Ersetzungslogik über erlaubte Substitute

### Kochmodus

- Schritt-für-Schritt Navigation
- Fortschrittsanzeige
- Zutaten-Checkliste
- Schritt- und Produktbilder

### Einkaufsliste

- Aggregiert aus Plan-Mahlzeiten
- Mengen je Produkt aufsummiert

### Import/Reset

- JSON importieren (Produkte + Rezepte)
- Soft Reset: Produkte, Rezepte, Pläne löschen
- Hard Reset: kompletter Datenspeicher + Session löschen

## 7. Datenmodell

Gespeicherte Kernobjekte:

- `User`
  - `id`, `email`, `password`
- `Profile`
  - `userId`, `calorieTarget`, `proteinTarget`, `excludedProducts[]`
- `Product`
  - `id`, `name`, `category`
  - `kcal_per_100g`, `protein_per_100g`, `fat_per_100g`, `carbs_per_100g`, `fiber_per_100g`
  - `allowed_substitutes[]`
  - optional `imageUri`
- `Recipe`
  - `id`, `name`, `description`, `mealType`, `tags[]`
  - `instructions[]`
  - optional `stepImageUris[]`
  - `ingredients[]` mit `{ productId, amount_g }`
- `Plan`
  - `id`, `userId`, `startDate`, `endDate`, `calorieTarget`, `proteinTarget`
  - `meals[]` mit `{ date, mealType, recipeId }`

## 8. JSON-Import (inkl. Bilder)

Import erwartet dieses Format:

```json
{
  "products": [
    {
      "id": "haferflocken",
      "name": "Haferflocken",
      "category": "Kohlenhydratquelle",
      "kcal_per_100g": 370,
      "protein_per_100g": 13,
      "fat_per_100g": 7,
      "carbs_per_100g": 59,
      "fiber_per_100g": 10,
      "allowed_substitutes": ["reisflocken"],
      "imageUri": "https://example.com/oats.jpg"
    }
  ],
  "recipes": [
    {
      "id": "fruehstueck-001",
      "name": "Overnight Oats",
      "description": "Proteinreiches Frühstück",
      "mealType": "breakfast",
      "tags": ["proteinreich", "alltag"],
      "instructions": ["Zutaten mischen", "Kühlen", "Servieren"],
      "stepImageUris": [
        "https://example.com/step1.jpg",
        "https://example.com/step2.jpg",
        "https://example.com/step3.jpg"
      ],
      "ingredients": [
        { "productId": "haferflocken", "amount_g": 60 },
        { "productId": "skyr", "amount_g": 200 }
      ]
    }
  ]
}
```

Hinweise:

- `ingredients` akzeptiert `productId` und beim Import auch `product_id`.
- Vorhandene IDs werden aktualisiert (Upsert).
- Fehlende IDs werden übersprungen.
- `imageUri` und `stepImageUris` sind optional.

## 9. Bedien-Workflow

1. Einloggen mit Demo-User.
2. Unter `Produkte` Nahrungsmittel pflegen.
3. Unter `Rezepte` Rezepte mit Zutaten + Schritten erfassen.
4. Unter `Plan` Zeitraum + Ziele eingeben und Plan erzeugen.
5. Plan öffnen:
   - Mahlzeiten sehen
   - Kochmodus pro Rezept starten
   - Einkaufsliste nutzen
6. Unter `Mehr`:
   - Import
   - Profil (Ziele/Ausschlüsse)
   - Einstellungen

## 10. Funktionalitätstest (manuell)

Empfohlene Smoke-Tests nach Änderungen:

1. Login mit Demo-Account.
2. Produkt erstellen, bearbeiten (Name), speichern.
3. Produkt bearbeiten, ID ändern, speichern.
4. Rezept anlegen mit diesem Produkt.
5. Plan generieren (7 Tage).
6. Plan-Details öffnen und Einkaufsliste prüfen.
7. Kochmodus öffnen und Schritte durchklicken.
8. JSON mit Bildern importieren.
9. Soft Reset und Hard Reset prüfen.

## 11. Troubleshooting

### Web-Fehler: `Failed to set an indexed property [0] on 'CSSStyleDeclaration'`

Wenn nach Updates noch alter Code im Browser hängt:

1. Dev-Server stoppen.
2. Neu starten:
   - `npm run web`
3. Browser Hard Reload (Cache leeren).

Optional zusätzlich:

- Expo Metro Cache löschen:
  - `cd apps/mobile && npx expo start -c`

### Änderungen in Formularen wirken nicht

- Prüfen, ob im Bearbeitungsmodus gearbeitet wird (Produkte).
- Nach `Bearbeiten` springt das Formular nach oben.
- Danach explizit `Änderungen speichern` klicken.

### Bilder werden nicht angezeigt

- URL muss öffentlich erreichbar sein.
- Bei Galerie-Bildern Berechtigung erlauben.
- Auf Web sind lokale Gerätepfade nicht immer stabil nutzbar.

## 12. Sicherheit und Grenzen

- Kein Server, keine Cloud-Synchronisierung.
- Kein verschlüsselter Multi-User-Betrieb.
- Login ist lokal und für Self-Hosting/Demo ausgelegt.
- Daten können bei App-Neuinstallation verloren gehen.

## Demo Login

- E-Mail: `demo@bodyos.local`
- Passwort: `Passw0rd!`
