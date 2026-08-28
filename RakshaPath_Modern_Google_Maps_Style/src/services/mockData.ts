import type { Coordinate, LocationPreset } from "../types/api";

// PRESETS: convenience shortcuts with pre-vetted coordinates, applied only
// when a preset button is explicitly clicked (see locationService — typed
// text is never silently matched against these via substring).
export const PRESET_ROUTES: LocationPreset[] = [
  {
    id: "preset-1",
    name: "Master Canteen → Infocity",
    origin: "Master Canteen, Station Square",
    destination: "Infocity, Patia",
    originCoord: { lat: 20.2678, lng: 85.8441 },
    destCoord: { lat: 20.3541, lng: 85.8189 },
    description: "Primary North-South Transit Corridor across Bhubaneswar"
  },
  {
    id: "preset-2",
    name: "KIIT University → Kalinga Stadium",
    origin: "KIIT University, Campus 3",
    destination: "Kalinga Stadium, Nayapalli",
    originCoord: { lat: 20.3533, lng: 85.8164 },
    destCoord: { lat: 20.2974, lng: 85.8242 },
    description: "University Corridor to Sports Complex via Nandankanan Rd"
  },
  {
    id: "preset-3",
    name: "Patia → Janpath",
    origin: "Patia Square, Bhubaneswar",
    destination: "Janpath, Saheed Nagar",
    originCoord: { lat: 20.3582, lng: 85.8153 },
    destCoord: { lat: 20.2872, lng: 85.8423 },
    description: "IT Park to Central Commercial Boulevard"
  },
  {
    id: "preset-4",
    name: "AIIMS Bhubaneswar → Utkal University",
    origin: "AIIMS Bhubaneswar, Sijua",
    destination: "Utkal University, Vani Vihar",
    originCoord: { lat: 20.2289, lng: 85.7778 },
    destCoord: { lat: 20.3015, lng: 85.8562 },
    description: "Healthcare Zone to Central Academic Hub via Highway"
  }
];

// Same role as PRESET_ROUTES: exact-match convenience coordinates for known
// landmarks (locationService.resolveLocation requires an exact, not partial,
// match before using these — anything else goes to real geocoding).
export const KNOWN_LANDMARKS: Record<string, Coordinate> = {
  "master canteen": { lat: 20.2678, lng: 85.8441 },
  "master canteen, station square": { lat: 20.2678, lng: 85.8441 },
  "infocity": { lat: 20.3541, lng: 85.8189 },
  "infocity, patia": { lat: 20.3541, lng: 85.8189 },
  "kiit": { lat: 20.3533, lng: 85.8164 },
  "kiit university": { lat: 20.3533, lng: 85.8164 },
  "kiit university, campus 3": { lat: 20.3533, lng: 85.8164 },
  "kalinga stadium": { lat: 20.2974, lng: 85.8242 },
  "kalinga stadium, nayapalli": { lat: 20.2974, lng: 85.8242 },
  "patia": { lat: 20.3582, lng: 85.8153 },
  "patia square": { lat: 20.3582, lng: 85.8153 },
  "patia square, bhubaneswar": { lat: 20.3582, lng: 85.8153 },
  "janpath": { lat: 20.2872, lng: 85.8423 },
  "janpath, saheed nagar": { lat: 20.2872, lng: 85.8423 },
  "aiims": { lat: 20.2289, lng: 85.7778 },
  "aiims bhubaneswar": { lat: 20.2289, lng: 85.7778 },
  "aiims bhubaneswar, sijua": { lat: 20.2289, lng: 85.7778 },
  "utkal university": { lat: 20.3015, lng: 85.8562 },
  "utkal university, vani vihar": { lat: 20.3015, lng: 85.8562 },
  "vani vihar": { lat: 20.3015, lng: 85.8562 },
  "saheed nagar": { lat: 20.2891, lng: 85.8436 },
  "jayadev vihar": { lat: 20.3021, lng: 85.8267 },
  "nayapalli": { lat: 20.2985, lng: 85.8194 },
  "chandrasekharpur": { lat: 20.3242, lng: 85.8174 },
  "cuttack road": { lat: 20.2743, lng: 85.8512 }
};
