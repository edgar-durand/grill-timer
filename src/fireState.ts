import type { FireState, Timer } from './types';

/**
 * Deriva el estado del fuego de fondo a partir de la lista de timers.
 *
 * - sin timers                                   -> 'off'
 * - algún timer corriendo o esperando el giro    -> 'burning'
 * - timers activos, pero todos en pausa          -> 'low'
 * - todos los timers terminados (Done!)          -> 'ashes'
 */
export function getFireState(timers: Timer[]): FireState {
  if (timers.length === 0) return 'off';

  const active = timers.filter((t) => !t.done);
  if (active.length === 0) return 'ashes';

  const burning = active.some((t) => t.running || t.awaitingFlip);
  return burning ? 'burning' : 'low';
}
