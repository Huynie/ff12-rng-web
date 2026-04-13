<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { chestCellClass } from '../../utils/chestCellClass';
  import type { SerializedChestInstance } from '../../workers/workerMessages';

  export let rows: SerializedChestInstance[];
  export let chests: Array<{ rngPosition: number; wantItem1: boolean }>;
  export let numRows: number;

  const dispatch = createEventDispatcher<{ numRowsChange: number }>();

  let selectedRows = new Set<number>();

  function toggleRow(index: number) {
    selectedRows = new Set(
      selectedRows.has(index)
        ? [...selectedRows].filter((i) => i !== index)
        : [...selectedRows, index],
    );
  }

  $: rngPosRowIndices = (() => {
    const firstFutureIdx = rows.findIndex((r) => !r.isPastRng);
    if (firstFutureIdx === -1) return new Map<number, number[]>();
    const map = new Map<number, number[]>();
    chests.forEach((chest, ci) => {
      if (chest.rngPosition > 0) {
        for (let i = 0; i < chest.rngPosition; i++) {
          const idx = firstFutureIdx + i;
          map.set(idx, [...(map.get(idx) ?? []), ci]);
        }
      }
    });
    return map;
  })();
</script>

{#if rows.length > 0}
  <div class="flex items-center gap-2 text-xs text-base-content/60 px-1 ml-auto">
    <span>Rows</span>
    <select
      class="select select-bordered select-xs w-24"
      bind:value={numRows}
      on:change={() => dispatch('numRowsChange', numRows)}
    >
      <option value={100}>100</option>
      <option value={200}>200</option>
      <option value={300}>300</option>
      <option value={400}>400</option>
      <option value={500}>500</option>
    </select>
  </div>
  <div class="overflow-x-auto md:max-h-[calc(100vh-10rem)] max-h-[50vh] overflow-y-auto">
    <table class="table table-md table-pin-rows">
      <thead>
        <tr>
          <th>Index<span class="tooltip tooltip-bottom inline-block normal-case font-normal" data-tip="Position in the RNG sequence."><span class="cursor-help opacity-40 hover:opacity-100">ⓘ</span></span></th>
          <th>Heal<span class="tooltip tooltip-bottom inline-block normal-case font-normal" data-tip="What a heal produces at this RNG position."><span class="cursor-help opacity-40 hover:opacity-100">ⓘ</span></span></th>
          <th>%<span class="tooltip tooltip-bottom inline-block normal-case font-normal" data-tip="rng mod 100 — compared against all chest probabilities. Only % = 0 passes a 1% spawn check."><span class="cursor-help opacity-40 hover:opacity-100">ⓘ</span></span></th>
          {#each chests as _, i}<th>Chest {i + 1}<span class="tooltip tooltip-bottom inline-block normal-case font-normal" data-tip="Bold = the chest physically spawns at this position. Highlighted = lands on your desired item."><span class="cursor-help opacity-40 hover:opacity-100">ⓘ</span></span></th>{/each}
        </tr>
      </thead>
      <tbody>
        {#each rows as row, rowIdx}
          {@const chestHighlight = rngPosRowIndices.get(rowIdx)}
          <tr
            class="{row.isPastRng ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-600' : ''} {!row.isPastRng && selectedRows.has(row.index) ? 'row-selected' : ''} {!row.isPastRng ? 'cursor-pointer' : ''}"
            on:click={() => { if (!row.isPastRng) toggleRow(row.index); }}
          >
            <td class="{!row.isPastRng && chestHighlight?.includes(0) ? 'border-l-4 border-blue-400 dark:border-blue-500' : ''}">{row.index}</td>
            <td>{row.currentHeal}</td>
            <td>{row.randToPercent}</td>
            {#each row.chestRewards as reward, i}
              <td
                class="{chestCellClass(i, chests[i].wantItem1, reward, row.isPastRng)} {!row.isPastRng && chestHighlight?.includes(1) && i === row.chestRewards.length - 1 ? 'border-r-4 border-cyan-400 dark:border-cyan-500' : ''}"
              >
                {reward.reward === "Gil" ? `${reward.gilAmount} gil` : reward.reward}
              </td>
            {/each}
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
{:else}
  <p class="text-xs text-base-content/40 px-1">Run Begin to see positions.</p>
{/if}
