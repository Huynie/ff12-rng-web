<script lang="ts">
  export let chests: Array<{
    spawnChance: number;
    rngPosition: number;
    gilChance: number;
    itemChance: number;
    gilAmount: number;
    wantItem1: boolean;
  }>;

  // Trigger bind: in parent so mutations are detected reactively
  function touch() {
    chests = chests;
  }
</script>

<div class="card bg-base-200 p-4 flex flex-col gap-4">
  <h3 class="font-semibold text-sm">Chests</h3>
  <div class="flex flex-col gap-4">
    {#each chests as chest, i}
      <div class="flex flex-col gap-3">
        <span class="text-xs font-semibold text-base-content/60 uppercase tracking-wide">Chest {i + 1}</span>
        <div class="flex gap-5 text-sm">
          <div class="flex flex-col gap-1">
            <label class="flex items-center gap-2">
              <span class="text-xs text-base-content/50 min-w-14">RNG pos<span class="tooltip tooltip-right inline-block normal-case font-normal" data-tip="The position of this chest in the zone's chest loading order. Each chest in a zone consumes one RNG draw when you enter, in a fixed order. For example, the Zodiac Spear is position 8 because it's the 8th chest to load (after all single-spawn chests in that area have been permanently opened). Find this value by trial and error or from community guides."><span class="cursor-help opacity-50 hover:opacity-100">ⓘ</span></span></span>
              <input type="number" class="input input-bordered input-sm flex-1 min-w-0" bind:value={chest.rngPosition} on:input={touch} />
            </label>
            <label class="flex items-center gap-2">
              <span class="text-xs text-base-content/50 min-w-14">Spawn %<span class="tooltip tooltip-right inline-block normal-case font-normal" data-tip="Probability the chest appears when you zone in (e.g. 1 for Gendarme, 50 for common chests)."><span class="cursor-help opacity-50 hover:opacity-100">ⓘ</span></span></span>
              <input type="number" class="input input-bordered input-sm flex-1 min-w-0" bind:value={chest.spawnChance} on:input={touch} />
            </label>
            <label class="flex items-center gap-2">
              <span class="text-xs text-base-content/50 min-w-14">Item 1 %<span class="tooltip tooltip-right inline-block normal-case font-normal" data-tip="If it's an item, probability it's Item 1 vs Item 2."><span class="cursor-help opacity-50 hover:opacity-100">ⓘ</span></span></span>
              <input type="number" class="input input-bordered input-sm flex-1 min-w-0" bind:value={chest.itemChance} on:input={touch} />
            </label>
          </div>
          <div class="flex flex-col gap-1">
            <label class="flex items-center gap-2">
              <span class="text-xs text-base-content/50 min-w-14">Gil %<span class="tooltip tooltip-right inline-block normal-case font-normal" data-tip="If the chest spawns, probability it contains gil instead of an item."><span class="cursor-help opacity-50 hover:opacity-100">ⓘ</span></span></span>
              <input type="number" class="input input-bordered input-sm flex-1 min-w-0" bind:value={chest.gilChance} on:input={touch} />
            </label>
            <label class="flex items-center gap-2">
              <span class="text-xs text-base-content/50 min-w-14">Gil amt<span class="tooltip tooltip-right inline-block normal-case font-normal" data-tip="Max gil the chest can contain. Actual amount = 1 + (rng mod gilAmt)."><span class="cursor-help opacity-50 hover:opacity-100">ⓘ</span></span></span>
              <input type="number" class="input input-bordered input-sm flex-1 min-w-0" bind:value={chest.gilAmount} on:input={touch} />
            </label>
            <label class="flex items-center gap-2 cursor-pointer h-10">
              <input type="checkbox" class="checkbox checkbox-sm" bind:checked={chest.wantItem1} on:change={touch} />
              <span class="text-xs">Want Item 1<span class="tooltip tooltip-right inline-block normal-case font-normal" data-tip="Check if your desired item is Item 1. The app finds the nearest bold row where it lands."><span class="cursor-help opacity-50 hover:opacity-100">ⓘ</span></span></span>
            </label>
          </div>
        </div>
      </div>
    {/each}
  </div>
</div>
