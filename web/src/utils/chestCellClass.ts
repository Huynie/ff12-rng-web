import { RewardType } from '../core/types';

export function chestCellClass(
    chestIndex: number,
    wantItem1: boolean,
    reward: { chestWillSpawn: boolean; reward: string },
    isPastRng: boolean,
): string {
    const opacity = isPastRng ? " opacity-60" : "";
    const isTarget =
        (wantItem1 && reward.reward === RewardType.Item1) ||
        (!wantItem1 && reward.reward === RewardType.Item2);

    if (!reward.chestWillSpawn) {
        if (!isTarget) return "";
        return chestIndex === 0
            ? `ring bg-indigo-200 ring-indigo-500 text-indigo-800 dark:ring-indigo-400 dark:bg-indigo-900/40 dark:text-indigo-200 ${opacity}`
            : `ring bg-sky-200 ring-sky-500 text-sky-800 dark:ring-sky-400 dark:bg-sky-900/40 dark:text-sky-200 ${opacity}`;
    }

    if (chestIndex === 0) {
        return isTarget
            ? `bg-blue-200 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200 font-bold ring ring-blue-400 dark:ring-blue-500${opacity}`
            : `bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 font-bold ring ring-blue-300 dark:ring-blue-600${opacity}`;
    } else {
        return isTarget
            ? `bg-cyan-200 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-200 font-bold ring ring-cyan-400 dark:ring-cyan-500${opacity}`
            : `bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300 font-bold ring ring-cyan-300 dark:ring-cyan-600${opacity}`;
    }
}
