import type { Food, Thickness, FoodKey, ThicknessKey, Doneness } from './types';

const q = '?auto=format&fit=crop&w=800&h=600&q=70';

export const FOODS: Food[] = [
  { key: 'steak', label: 'Steak', photoUrl: 'https://images.unsplash.com/photo-1600891964092-4316c288032e' + q, tint: '#8C2F1B' },
  { key: 'burger', label: 'Burger', photoUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd' + q, tint: '#A8561F' },
  { key: 'chicken', label: 'Chicken', photoUrl: 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6' + q, tint: '#B8741F' },
  { key: 'veggies', label: 'Veggies', photoUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999' + q, tint: '#4E7A3A' },
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
};
