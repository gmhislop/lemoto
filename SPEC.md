# Lemoto — MVP Spec

## Doel

Een ride decision app voor motorrijders. De gebruiker plant ritten en krijgt per rit een stoplicht (groen / oranje / rood) op basis van het verwachte weer.

**Niet**: een weerapp met extra's  
**Wel**: een beslissingstool — "kan ik rijden?"

Dit is de kernpropositie van de app. Elke feature-beslissing toetst hieraan.

---

## Stack

| Onderdeel        | Keuze                          | Versie   |
|------------------|-------------------------------|----------|
| Framework        | Expo                          | SDK 52   |
| Routing          | Expo Router                   | v4       |
| Taal             | TypeScript                    | 5.x      |
| Styling          | NativeWind                    | v4       |
| Tailwind         | tailwindcss                   | 3.x      |
| Animaties        | react-native-reanimated       | 3.x      |
| Storage          | @react-native-async-storage   | 2.x      |
| Weer-API         | Open-Meteo                    | gratis   |
| Datepicker       | @react-native-community/datetimepicker | latest |

---

## Mapstructuur

```
app/
  _layout.tsx          # Root layout, tab/stack config
  index.tsx            # Home — overzicht ritten
  add-ride.tsx         # Rit toevoegen
  ride/[id].tsx        # Rit detail
  settings.tsx         # Persoonlijke voorkeuren

components/
  TrafficLight.tsx     # Stoplicht cirkel (groen/oranje/rood)
  RideCard.tsx         # Kaart in overzichtslijst
  WeatherReasons.tsx   # Lijst van redenen per factor
  QuickAdd.tsx         # "Vanavond" / "Dit weekend" knoppen

lib/
  weather-api.ts       # Open-Meteo fetch
  weather-score.ts     # Stoplichtberekening
  ride-storage.ts      # AsyncStorage CRUD
  date-utils.ts        # Helpers voor datum/tijd

types/
  ride.ts
  weather.ts
```

---

## TypeScript types

```ts
// types/ride.ts

export type TrafficLight = 'green' | 'orange' | 'red';

export interface Ride {
  id: string;                  // uuid
  label: string;               // bijv. "Woon-werk" of "Weekendrit"
  date: string;                // ISO 8601 datum: "2025-06-14"
  startTime: string;           // "18:00"
  durationHours: number;       // 1 | 1.5 | 2 | 3
  location: {
    lat: number;
    lon: number;
    label: string;             // bijv. "Amsterdam"
  };
  status?: TrafficLight;
  confidence?: 'high' | 'medium' | 'low'; // betrouwbaarheid voorspelling
  reasons?: WeatherReason[];
  fetchedAt?: string;          // ISO timestamp van laatste fetch
}
```

```ts
// types/weather.ts

export interface WeatherData {
  precipitationProbability: number;  // 0–100 (%) — max over tijdslot
  precipitationMm: number;           // mm per uur — max over tijdslot (niet gemiddeld!)
  windSpeedKmh: number;              // km/u — gemiddelde over tijdslot
  windGustsKmh: number;              // km/u — max over tijdslot
  temperatureC: number;              // °C — gemiddelde
  feelsLikeC: number;                // °C — gemiddelde
}

export interface WeatherReason {
  factor: 'rain' | 'wind' | 'temperature';
  label: string;
  severity: 'ok' | 'warning' | 'danger';
}

export interface UserPreferences {
  minTempC: number;       // default 10
  maxWindKmh: number;     // default 20
  rainTolerance: 'low' | 'normal' | 'high';
}
```

---

## Open-Meteo API

Geen API key nodig. Gratis.

### Endpoint

```
GET https://api.open-meteo.com/v1/forecast
```

### Query parameters

```
latitude=52.37
longitude=4.90
hourly=precipitation_probability,precipitation,wind_speed_10m,wind_gusts_10m,temperature_2m,apparent_temperature
wind_speed_unit=kmh
timezone=Europe/Amsterdam
forecast_days=7
```

### Fetch-strategie

Haal het tijdslot op voor de rit. Bij een rit van 18:00–20:00 (2 uur): indices voor 18:00, 19:00 en 20:00.

**Aggregatieregel per variabele:**

| Variabele               | Methode | Reden                                        |
|-------------------------|---------|----------------------------------------------|
| precipitationProbability| max     | Hoogste kans in het tijdslot telt             |
| precipitationMm         | max     | 0mm, 0mm, 3mm → je wordt nat, niet "gemiddeld ok" |
| windSpeedKmh            | gemiddeld | Geeft gevoel voor aanhoudend windniveau    |
| windGustsKmh            | max     | Hoogste stoot bepaalt gevaar                 |
| temperatureC            | gemiddeld | Representatief voor het tijdslot           |
| feelsLikeC              | gemiddeld |                                            |

```ts
// lib/weather-api.ts

export async function fetchWeatherForRide(
  lat: number,
  lon: number,
  date: string,       // "2025-06-14"
  startTime: string,  // "18:00"
  durationHours: number
): Promise<WeatherData>
```

---

## Stoplichtlogica

```ts
// lib/weather-score.ts

export function calculateTrafficLight(
  weather: WeatherData,
  prefs: UserPreferences
): { status: TrafficLight; reasons: WeatherReason[] }

// Drempelwaarden (defaults — overschrijfbaar via UserPreferences)
const DEFAULTS = {
  green:  { maxRainPct: 20, maxRainMm: 0.5, maxWindKmh: 20, minTempC: 10 },
  orange: { maxRainPct: 50, maxRainMm: 1.5, maxWindKmh: 35, minTempC: 5  },
};
```

### Wind: gebruik windstoten

```ts
const effectiveWind = Math.max(weather.windSpeedKmh, weather.windGustsKmh);
```

Windstoten zijn voor motorrijders gevaarlijker dan de gemiddelde windsnelheid. `effectiveWind` voorkomt "false greens" waarbij de gemiddelde wind laag is maar de stoten hoog.

### Regen: max, niet gemiddeld

`precipitationMm` is de **maximale** waarde over het tijdslot (niet het gemiddelde).
Rationale: 0mm + 0mm + 3mm = gemiddeld 1mm is misleidend. Je wordt nat.

### Redenen genereren

Elk actief criterium levert een `WeatherReason` op:

| Factor        | Severity  | Label voorbeeld                         |
|---------------|-----------|----------------------------------------|
| `rain`        | `warning` | "Kans op regen (35%)"                  |
| `rain`        | `danger`  | "Regen verwacht (1.8 mm/u)"            |
| `wind`        | `warning` | "Stevige wind (28 km/u)"               |
| `wind`        | `danger`  | "Harde wind + windstoten (42 km/u)"    |
| `temperature` | `warning` | "Koud (7°C)"                           |
| `temperature` | `danger`  | "Te koud om te rijden (2°C)"           |

---

## Confidence / betrouwbaarheid

Weersvoorspellingen worden onbetrouwbaarder naarmate ze verder in de toekomst liggen.

```ts
export function calculateConfidence(rideDate: string): 'high' | 'medium' | 'low'

// 0–1 dagen vooruit → 'high'
// 2–3 dagen vooruit → 'medium'
// 4–7 dagen vooruit → 'low'
```

Toon bij `low` confidence een badge: **"Voorspelling kan nog veranderen"**

Sla op in `Ride.confidence` na elke fetch.

---

## Schermen

### 1. Home (`/`)

- Lijst van geplande ritten gesorteerd op datum
- Per rit: `RideCard` met label, datum/tijd, stoplichtkleur, confidence badge
- FAB (floating action button) rechtsonder: "+ Rit toevoegen"
- `QuickAdd` balk bovenaan: "Vanavond" / "Dit weekend"
- Lege state: "Nog geen ritten gepland. Voeg je eerste rit toe."

### 2. Rit toevoegen (`/add-ride`)

- Invoervelden:
  - Label (tekstveld, optioneel, placeholder: "bijv. Woon-werk")
  - Datum (DateTimePicker)
  - Starttijd (DateTimePicker, time mode)
  - Duur (keuze: 1u / 1.5u / 2u / 3u)
  - Locatie (tekstveld + GPS-knop)
- Opslaan → terug naar Home, rit wordt direct opgehaald
- Validatie: datum mag niet in het verleden liggen

### 3. Rit detail (`/ride/[id]`)

- Hero tekst: status in DM Mono groot (zie STYLE.md)
- Aanbeveling headline (primair, bovenaan):
  - Groen: "Perfect voor een rit"
  - Oranje: "Kan, neem regenkleding mee"
  - Rood: "Niet ideaal, plan liever anders"
- Confidence badge indien `medium` of `low`
- `WeatherReasons` lijst met redenen
- Ruwe weerdata (inklapbaar): regen %, mm, wind (incl. windstoten), temp, gevoelstemperatuur
- Knop: "Vernieuwen"
- Knop: "Rit verwijderen"

### 4. Settings (`/settings`)

- Persoonlijke drempelwaarden:
  - Minimale temperatuur (slider, 0–20°C, default 10°C)
  - Maximale wind (slider, 10–60 km/u, default 20 km/u)
  - Regentolerantie (keuze: laag / normaal / hoog)
- Rijdersprofiel (informatief, geen logica in MVP):
  - Fair-weather rider
  - All-weather rider
  - Sport rider

---

## Storage (AsyncStorage)

```ts
// lib/ride-storage.ts

const RIDES_KEY = 'lemoto:rides';

export async function getRides(): Promise<Ride[]>    // gesorteerd op datum
export async function saveRide(ride: Ride): Promise<void>
export async function updateRide(id: string, updates: Partial<Ride>): Promise<void>
export async function deleteRide(id: string): Promise<void>
```

- Sla ritten op als JSON array
- Gebruik uuid voor IDs (geen timestamps — voorkomt collision)
- Sorteer bij `getRides()` altijd op `date` + `startTime`
- Na elke mutatie opnieuw serialiseren en wegschrijven

---

## Navigatie (Expo Router)

```ts
// app/_layout.tsx — Stack navigator als root
```

Navigatieflow:
```
Home (index)
  └─> Add Ride (modal/push)
  └─> Ride Detail (push via RideCard tap)
       └─> terug naar Home
Settings bereikbaar via icoon rechtsboven in Home header
```

---

## Componentenlijst

### `<TrafficLight status="green" | "orange" | "red" size="sm" | "md" | "lg" />`

Cirkel met kleur. Geen tekst. Pulseert zacht bij `green` (optioneel, Reanimated).

### `<RideCard ride={Ride} onPress={() => void} />`

Toont: label, datum + tijd, duur, locatie, stoplicht (sm), confidence badge indien laag.

### `<WeatherReasons reasons={WeatherReason[]} />`

Lijst van reden-items. Kleurcodering per severity. Icoon per factor.

### `<QuickAdd onSelect={(type: 'tonight' | 'weekend') => void} />`

Twee knoppen. Berekent datum/tijd automatisch:
- `tonight`: vandaag, 18:00, 2 uur
- `weekend`: aankomende zaterdag, 10:00, 3 uur

---

## MVP-scope (wat valt er BUITEN v1)

- Geen accounts of sync
- Geen pushnotificaties
- Geen kaart/routeweergave
- Geen uur-tot-uur tijdlijn
- Geen agenda-integratie
- Geen "beste moment van de dag"
- Geen AI

---

## Open-Meteo limieten

- Max 7 dagen vooruit
- Rate limit: ruim voor persoonlijk gebruik (10.000 calls/dag)
- Geen API key nodig
- Documentatie: https://open-meteo.com/en/docs
