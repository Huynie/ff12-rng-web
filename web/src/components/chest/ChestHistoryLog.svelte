<script lang="ts">
  import { chestCellClass } from '../../utils/chestCellClass';
  import type { SerializedChestInstance } from '../../workers/workerMessages';

  export let historyLog: Array<{
    action: 'heal' | 'attack';
    label: string;
    heal: number;
    chestRewards: SerializedChestInstance['chestRewards'];
  }>;
  export let chests: Array<{ wantItem1: boolean }>;
</script>

{#if historyLog.length > 0}
  <div class="overflow-y-auto md:max-h-[calc(100vh-10rem)] max-h-[50vh] flex flex-col gap-2">
    {#each historyLog as entry}
      <div class="card bg-base-200 px-3 py-2 flex flex-row flex-wrap items-center gap-x-3 gap-y-1">
        <span class="badge badge-sm {entry.action === 'heal' ? 'badge-success' : 'badge-secondary'}">{entry.action === 'heal' ? 'Healed' : entry.label}</span>
        <span class="text-xs text-base-content/50">next heal <strong class="text-base-content">{entry.heal}</strong></span>
        {#each entry.chestRewards as reward, i}
          <span class="text-xs {chestCellClass(i, chests[i]?.wantItem1 ?? false, reward, false)} px-2 py-0.5 rounded">
            C{i + 1}: {reward.reward === 'Gil' ? `${reward.gilAmount} gil` : reward.reward}{reward.chestWillSpawn ? ' ✓' : ''}
          </span>
        {/each}
      </div>
    {/each}
  </div>
{:else}
  <p class="text-xs text-base-content/40 px-1">No history yet. Begin tracking to see entries.</p>
{/if}
