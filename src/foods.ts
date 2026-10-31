import type { Food, FoodCategory, Thickness, FoodKey, ThicknessKey, Doneness } from './types';

const q = '?auto=format&fit=crop&w=800&h=600&q=70';
const u = (id: string) => 'https://images.unsplash.com/' + id + q;

export const CATEGORIES: { key: FoodCategory | 'all'; label: string }[] = [
  { key: 'all', label: 'Todos' },
  { key: 'meat', label: 'Carnes' },
  { key: 'poultry', label: 'Aves' },
  { key: 'fish', label: 'Pescados' },
  { key: 'seafood', label: 'Mariscos' },
  { key: 'veg', label: 'Verduras' },
  { key: 'other', label: 'Otros' },
];

export const FOODS: Food[] = [
  { key: 'steak', label: 'Steak', photoUrl: u('photo-1600891964092-4316c288032e'), tint: '#8C2F1B', category: 'meat' },
  { key: 'burger', label: 'Burger', photoUrl: u('photo-1568901346375-23c9450c58cd'), tint: '#A8561F', category: 'meat' },
  { key: 'pork', label: 'Chuleta de cerdo', photoUrl: u('photo-1432139509613-5c4255815697'), tint: '#9A4A32', category: 'meat' },
  { key: 'ribs', label: 'Costillas', photoUrl: u('photo-1544025162-d76694265947'), tint: '#7A2E1A', category: 'meat' },
  { key: 'lamb', label: 'Cordero', photoUrl: u('photo-1603360946369-dc9bb6258143'), tint: '#85382B', category: 'meat' },
  { key: 'sausage', label: 'Salchichas y chorizo', photoUrl: u('photo-1432139555190-58524dae6a55'), tint: '#A0402A', category: 'meat' },
  { key: 'chicken', label: 'Chicken', photoUrl: u('photo-1598103442097-8b74394b95c6'), tint: '#B8741F', category: 'poultry' },
  { key: 'drumstick', label: 'Pollo en muslos', photoUrl: u('photo-1527477396000-e27163b481c2'), tint: '#B0621C', category: 'poultry' },
  { key: 'salmon', label: 'Salmón', photoUrl: u('photo-1467003909585-2f8a72700288'), tint: '#C25A3C', category: 'fish' },
  { key: 'tuna', label: 'Atún', photoUrl: u('photo-1580476262798-bddd9f4b7369'), tint: '#8E2F3A', category: 'fish' },
  { key: 'whitefish', label: 'Pescado blanco', photoUrl: u('photo-1519708227418-c8fd9a32b7a2'), tint: '#5B7C8D', category: 'fish' },
  { key: 'shrimp', label: 'Camarones y gambas', photoUrl: u('photo-1565680018434-b513d5e5fd47'), tint: '#C8663A', category: 'seafood' },
  { key: 'squid', label: 'Pulpo y calamar', photoUrl: u('photo-1599487488170-d11ec9c172f0'), tint: '#7A4B6B', category: 'seafood' },
  { key: 'scallop', label: 'Vieiras', photoUrl: u('photo-1559737558-2f5a35f4523b'), tint: '#B88A5A', category: 'seafood' },
  { key: 'veggies', label: 'Veggies', photoUrl: u('photo-1540420773420-3366772f4999'), tint: '#4E7A3A', category: 'veg' },
  { key: 'corn', label: 'Maíz', photoUrl: u('photo-1551754655-cd27e38d2076'), tint: '#B58A12', category: 'veg' },
  { key: 'halloumi', label: 'Halloumi y queso', photoUrl: u('photo-1486297678162-eb2a19b0a32d'), tint: '#A8892F', category: 'other' },
  { key: 'pineapple', label: 'Piña y fruta', photoUrl: u('photo-1550258987-190a2d41a8ba'), tint: '#B07A12', category: 'other' },
];

export const THICKNESS: Thickness[] = [
  { key: 'thin', label: 'Thin' },
  { key: 'med', label: 'Medium' },
  { key: 'thick', label: 'Thick' },
];

// base minutes per side
export const BASE: Record<FoodKey, Record<ThicknessKey, number>> = {
  steak: { thin: 3, med: 4.5, thick: 6.5 },
  burger: { thin: 3.5, med: 5, thick: 6.5 },
  chicken: { thin: 5, med: 7, thick: 9.5 },
  veggies: { thin: 2.5, med: 3.5, thick: 5 },
  pork: { thin: 4, med: 6, thick: 8 },
  ribs: { thin: 10, med: 15, thick: 20 },
  lamb: { thin: 3.5, med: 5, thick: 7 },
  sausage: { thin: 4, med: 6, thick: 8 },
  drumstick: { thin: 7, med: 10, thick: 13 },
  salmon: { thin: 2.5, med: 4, thick: 5.5 },
  tuna: { thin: 1, med: 2, thick: 3 },
  whitefish: { thin: 3, med: 4.5, thick: 6 },
  shrimp: { thin: 1.5, med: 2.5, thick: 3.5 },
  squid: { thin: 1, med: 2, thick: 3.5 },
  scallop: { thin: 1.5, med: 2.5, thick: 3.5 },
  corn: { thin: 3, med: 4.5, thick: 6 },
  halloumi: { thin: 1.5, med: 2.5, thick: 3.5 },
  pineapple: { thin: 2, med: 3, thick: 4 },
};

export const DONENESS: Record<FoodKey, Doneness[]> = {
  steak: [
    { key: 'rare', label: 'Rare', mult: 0.75 },
    { key: 'medium', label: 'Medium', mult: 1 },
    { key: 'welldone', label: 'Well Done', mult: 1.35 },
  ],
  burger: [
    { key: 'medium', label: 'Medium', mult: 0.9 },
    { key: 'welldone', label: 'Well Done', mult: 1.2 },
  ],
  chicken: [{ key: 'welldone', label: 'Fully Cooked', mult: 1 }],
  veggies: [
    { key: 'tender', label: 'Tender-Crisp', mult: 0.85 },
    { key: 'soft', label: 'Soft', mult: 1.15 },
  ],
  pork: [
    { key: 'juicy', label: 'Jugoso', mult: 0.9 },
    { key: 'welldone', label: 'Bien hecho', mult: 1.15 },
  ],
  ribs: [
    { key: 'tender', label: 'Tiernas', mult: 1 },
    { key: 'falloff', label: 'Se deshacen', mult: 1.3 },
  ],
  lamb: [
    { key: 'pink', label: 'Rosado', mult: 0.8 },
    { key: 'medium', label: 'Medio', mult: 1 },
    { key: 'welldone', label: 'Bien hecho', mult: 1.3 },
  ],
  sausage: [{ key: 'done', label: 'Bien hechas', mult: 1 }],
  drumstick: [{ key: 'welldone', label: 'Bien hecho', mult: 1 }],
  salmon: [
    { key: 'medium', label: 'Medio', mult: 0.85 },
    { key: 'welldone', label: 'Bien hecho', mult: 1.15 },
  ],
  tuna: [
    { key: 'rare', label: 'Poco hecho', mult: 0.6 },
    { key: 'medium', label: 'Medio', mult: 1 },
  ],
  whitefish: [
    { key: 'juicy', label: 'En su punto', mult: 1 },
    { key: 'welldone', label: 'Bien hecho', mult: 1.2 },
  ],
  shrimp: [
    { key: 'juicy', label: 'Jugosas', mult: 0.9 },
    { key: 'welldone', label: 'Bien hechas', mult: 1.15 },
  ],
  squid: [
    { key: 'tender', label: 'Tierno', mult: 0.8 },
    { key: 'welldone', label: 'Bien hecho', mult: 1.2 },
  ],
  scallop: [
    { key: 'pearly', label: 'Nacaradas', mult: 0.85 },
    { key: 'welldone', label: 'Bien hechas', mult: 1.15 },
  ],
  corn: [
    { key: 'golden', label: 'Dorado', mult: 1 },
    { key: 'charred', label: 'Tostado', mult: 1.3 },
  ],
  halloumi: [
    { key: 'golden', label: 'Dorado', mult: 1 },
    { key: 'crispy', label: 'Muy dorado', mult: 1.3 },
  ],
  pineapple: [
    { key: 'caramel', label: 'Caramelizada', mult: 1 },
    { key: 'charred', label: 'Muy dorada', mult: 1.3 },
  ],
};
