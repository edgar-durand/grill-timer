export type FoodKey =
  | 'steak' | 'burger' | 'chicken' | 'veggies'
  | 'pork' | 'ribs' | 'lamb' | 'sausage' | 'drumstick'
  | 'salmon' | 'tuna' | 'whitefish'
  | 'shrimp' | 'squid' | 'scallop'
  | 'corn' | 'halloumi' | 'pineapple';
export type FoodCategory = 'meat' | 'poultry' | 'fish' | 'seafood' | 'veg' | 'other';
export type ThicknessKey = 'thin' | 'med' | 'thick';
export interface Food { key: FoodKey; label: string; photoUrl: string; tint: string; category: FoodCategory }
export interface Thickness { key: ThicknessKey; label: string }
export interface Doneness { key: string; label: string; mult: number }
export interface Timer {
  id: number; food: FoodKey; foodLabel: string; thicknessLabel: string; doneLabel: string;
  total: number; remaining: number; running: boolean; flipped: boolean; done: boolean;
  awaitingFlip: boolean;
  notificationIds?: string[];
}
export interface TimerConfig {
  food: FoodKey; foodLabel: string; thickness: ThicknessKey; thicknessLabel: string;
  doneMult: number; doneLabel: string;
}
export interface TimerStore {
  timers: Timer[];
  addTimer(cfg: TimerConfig): void;
  removeTimer(id: number): void;
  toggleRunning(id: number): void;
  confirmFlip(id: number): void;
}
export interface FoodPhotoProps {
  food: FoodKey; style?: import('react-native').StyleProp<import('react-native').ViewStyle>;
  zoom?: boolean; rounded?: number;
}
export interface HeaderProps { count: number; onAdd(): void }
export interface TimerCardProps { timer: Timer; onToggle(): void; onRemove(): void; onConfirmFlip(): void }
export interface EmptyStateProps { onAdd(): void }
export interface PickerSheetProps { onCancel(): void; onConfirm(cfg: TimerConfig): void }
export type FireState = 'off' | 'low' | 'burning' | 'ashes';
export interface FireBackgroundProps { state: FireState; flare?: boolean }
