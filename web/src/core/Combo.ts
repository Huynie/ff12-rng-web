export const INDEX_OF_PREVIOUS_COMBO_RNG = 5;
export const RNG_CONSUMED_FOR_ATTACK = 10;
const COMBO_CHANCE = 3;

export function isComboSuccessful(prng: number): boolean {
  return (prng % 100) < COMBO_CHANCE;
}
