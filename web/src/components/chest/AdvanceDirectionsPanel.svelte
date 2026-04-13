<script lang="ts">
  export let advanceDirections: Array<{ advanceToAppear: number; advanceForItem: number }>;
</script>

<div class="card bg-base-200 p-4 flex flex-col gap-2">
  <h3 class="font-semibold text-sm">Advance directions<span class="tooltip tooltip-bottom inline-block normal-case font-normal" data-tip="How many RNG positions to consume before zoning to land on your target chest result."><span class="cursor-help opacity-40 hover:opacity-100">ⓘ</span></span></h3>
  {#if advanceDirections.length > 0}
    <div class="grid gap-x-5 gap-y-3 text-sm" style="grid-template-columns: repeat({advanceDirections.length}, 1fr)">
      {#each advanceDirections as _, i}
        <span class="text-sm font-semibold text-base-content/60 uppercase tracking-wide">Chest {i + 1}</span>
      {/each}
      {#each advanceDirections as d, i}
        {#if i === 0}
          <span class="badge badge-md border-blue-400 bg-blue-100 text-blue-700 dark:border-blue-500 dark:bg-blue-900/30 dark:text-blue-300">{#if d.advanceToAppear >= 0}<strong>{d.advanceToAppear}</strong> to spawn{:else}Out of range{/if}<span class="tooltip tooltip-left inline-block normal-case font-normal" data-tip="Advance RNG by this many before zoning to make the chest appear."><span class="cursor-help opacity-50 hover:opacity-100">ⓘ</span></span></span>
        {:else}
          <span class="badge badge-md border-cyan-400 bg-cyan-100 text-cyan-700 dark:border-cyan-500 dark:bg-cyan-900/30 dark:text-cyan-300">{#if d.advanceToAppear >= 0}<strong>{d.advanceToAppear}</strong> to spawn{:else}Out of range{/if}</span>
        {/if}
      {/each}
      {#each advanceDirections as d, i}
        {#if i === 0}
          <span class="badge badge-md border-indigo-500 bg-indigo-200 text-indigo-800 dark:border-indigo-400 dark:bg-indigo-900/40 dark:text-indigo-200">{#if d.advanceForItem >= 0}<strong>{d.advanceForItem}</strong> to item{:else}Out of range{/if}<span class="tooltip tooltip-left inline-block normal-case font-normal" data-tip="Advance RNG by this many to land on a row where the chest spawns AND contains your desired item."><span class="cursor-help opacity-50 hover:opacity-100">ⓘ</span></span></span>
        {:else}
          <span class="badge badge-md border-sky-500 bg-sky-200 text-sky-800 dark:border-sky-400 dark:bg-sky-900/40 dark:text-sky-200">{#if d.advanceForItem >= 0}<strong>{d.advanceForItem}</strong> to item{:else}Out of range{/if}</span>
        {/if}
      {/each}
    </div>
  {:else}
    <p class="text-xs text-base-content/40">Run Begin to see directions.</p>
  {/if}
</div>
