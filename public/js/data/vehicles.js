// ============================================================================
// ZAVOZ — vehicle catalog data.
// -----------------------------------------------------------------------------
// This is PLACEHOLDER data. To manage real vehicles, edit the array below.
// Each entry is self-contained; add/remove/reorder freely.
//
//   id       — unique string (used for keys)
//   brand    — e.g. "Toyota"
//   model    — e.g. "Land Cruiser 300"
//   year     — number
//   engine   — free text, e.g. "3.5 V6 Twin-Turbo"
//   mileage  — number, km (0 for new)
//   country  — "china" | "korea" | "japan"
//   type     — "sedan" | "crossover" | "suv" | "minivan" | "sports" |
//              "motorcycle" | "special"
//   price    — approximate final price in Russia, RUB (number)
//   badge    — optional short label ("Новый", "Электро", "Аукцион", …)
//   image    — optional path to a real photo in /images. If omitted, an
//              elegant placeholder is generated automatically.
// ============================================================================

export const VEHICLES = [
  {
    id: 'lc300',
    brand: 'Toyota',
    model: 'Land Cruiser 300',
    year: 2024,
    engine: '3.5 V6 Twin-Turbo',
    mileage: 0,
    country: 'japan',
    type: 'suv',
    price: 9800000,
    badge: 'Новый',
  },
  {
    id: 'gv80',
    brand: 'Genesis',
    model: 'GV80',
    year: 2023,
    engine: '3.5 V6',
    mileage: 18000,
    country: 'korea',
    type: 'suv',
    price: 6400000,
  },
  {
    id: 'li-l9',
    brand: 'Li Auto',
    model: 'L9 Max',
    year: 2024,
    engine: 'EREV Hybrid',
    mileage: 5000,
    country: 'china',
    type: 'suv',
    price: 7200000,
    badge: 'Гибрид',
  },
  {
    id: 'zeekr-001',
    brand: 'Zeekr',
    model: '001',
    year: 2024,
    engine: 'Electric AWD',
    mileage: 0,
    country: 'china',
    type: 'crossover',
    price: 5100000,
    badge: 'Электро',
  },
  {
    id: 'alphard',
    brand: 'Toyota',
    model: 'Alphard Executive',
    year: 2023,
    engine: '2.5 Hybrid',
    mileage: 22000,
    country: 'japan',
    type: 'minivan',
    price: 8600000,
  },
  {
    id: 'g80',
    brand: 'Genesis',
    model: 'G80',
    year: 2022,
    engine: '2.5 Turbo',
    mileage: 41000,
    country: 'korea',
    type: 'sedan',
    price: 4300000,
  },
  {
    id: 'gr-supra',
    brand: 'Toyota',
    model: 'GR Supra',
    year: 2022,
    engine: '3.0 Turbo',
    mileage: 15000,
    country: 'japan',
    type: 'sports',
    price: 5600000,
    badge: 'Аукцион',
  },
  {
    id: 'bmw-x5-cn',
    brand: 'BMW',
    model: 'X5 xDrive40Li',
    year: 2024,
    engine: '3.0 Turbo',
    mileage: 0,
    country: 'china',
    type: 'suv',
    price: 8900000,
    badge: 'Новый',
  },
  {
    id: 'sorento',
    brand: 'Kia',
    model: 'Sorento',
    year: 2023,
    engine: '2.5 Turbo',
    mileage: 28000,
    country: 'korea',
    type: 'crossover',
    price: 3700000,
  },
  {
    id: 'harrier',
    brand: 'Toyota',
    model: 'Harrier',
    year: 2022,
    engine: '2.0',
    mileage: 34000,
    country: 'japan',
    type: 'crossover',
    price: 3900000,
  },
  {
    id: 'byd-han',
    brand: 'BYD',
    model: 'Han EV',
    year: 2024,
    engine: 'Electric',
    mileage: 3000,
    country: 'china',
    type: 'sedan',
    price: 3600000,
    badge: 'Электро',
  },
  {
    id: 'zx-excavator',
    brand: 'Hitachi',
    model: 'ZX200 Excavator',
    year: 2021,
    engine: 'Diesel',
    mileage: 4200,
    country: 'japan',
    type: 'special',
    price: 7400000,
    badge: 'Спецтехника',
  },
];

// Human-readable labels shared by the UI.
export const COUNTRY_LABELS = {
  china: 'Китай',
  korea: 'Корея',
  japan: 'Япония',
};

export const TYPE_LABELS = {
  sedan: 'Седан',
  crossover: 'Кроссовер',
  suv: 'Внедорожник',
  minivan: 'Минивэн',
  sports: 'Спорткар',
  motorcycle: 'Мотоцикл',
  special: 'Спецтехника',
};
