<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let healValue = '';
  export let numRows = 100;
  export let consumeCount = 10;
  export let loading = false;
  export let canContinue = false;
  export let comboInfo = -1;

  const dispatch = createEventDispatcher<{
    begin: void;
    continue: void;
    consume: number;
    clear: void;
    recalculate: number;
  }>();

  function onBeginKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') dispatch('begin');
  }

function onNumRowsChange() {
    if (canContinue) dispatch('recalculate', numRows);
  }

  const rowOptions = [100, 200, 300, 400, 500];

  let healInput: HTMLInputElement | undefined;

  export function focusAndSelect() {
    healInput?.focus();
    healInput?.select();
  }

  function onHealClick() {
    dispatch('continue');
  }

  function onHealKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') dispatch('continue');
  }
</script>

{#if !canContinue}
  <!-- Phase 1: Begin -->
  <div class="flex flex-wrap items-end gap-2">
    <div class="flex flex-col gap-1">
      <p class="text-xs font-semibold text-base-content/60 uppercase tracking-wide">Heal value<span class="tooltip tooltip-bottom inline-block normal-case font-normal" data-tip="Enter the heal amount shown in-game. Used to find your position in the RNG sequence."><span class="cursor-help opacity-50 hover:opacity-100">ⓘ</span></span></p>
      <input
        type="number"
        class="input input-bordered input-sm w-28"
        placeholder="e.g. 91"
        bind:value={healValue}
        on:keydown={onBeginKeydown}
        disabled={loading}
      />
    </div>
    <div class="flex flex-col gap-1">
      <p class="text-xs font-semibold text-base-content/60 uppercase tracking-wide">Rows</p>
      <select class="select select-bordered select-sm w-24" bind:value={numRows} on:change={onNumRowsChange}>
        {#each rowOptions as opt}
          <option value={opt}>{opt}</option>
        {/each}
      </select>
    </div>
    <span class="tooltip tooltip-bottom" data-tip="Start a fresh search using the entered heal value.">
      <button
        class="btn btn-primary btn-sm"
        on:click={() => dispatch('begin')}
        disabled={loading || !healValue}
      >
        {#if loading}
          <span class="loading loading-spinner loading-xs"></span>
        {:else}
          Begin
        {/if}
      </button>
    </span>
  </div>

{:else}
  <!-- Phase 2: Heal + Attack + Reset -->
  <div class="flex flex-col gap-2">
    <!-- All controls in one row -->
    <div class="flex flex-wrap items-end gap-1 lg:gap-6">
      <!-- Heal group -->
      <div class="flex flex-col gap-1">
        <p class="text-xs font-semibold text-base-content/60 uppercase tracking-wide">Next heal<span class="tooltip tooltip-bottom inline-block normal-case font-normal" data-tip="Enter each subsequent heal to narrow down your exact RNG position."><span class="cursor-help opacity-50 hover:opacity-100">ⓘ</span></span></p>
        <div class="flex items-center gap-1 lg:gap-2">
          <input
            type="number"
            class="input input-bordered input-sm w-14 lg:w-18"
            bind:value={healValue}
            bind:this={healInput}
            on:keydown={onHealKeydown}
            disabled={loading}
          />
          <span class="tooltip tooltip-bottom" data-tip="Submit this heal value to refine your RNG position.">
            <button
              class="btn btn-primary btn-sm"
              on:click={onHealClick}
              disabled={loading || !healValue}
            >
              {#if loading}
                <span class="loading loading-spinner loading-xs"></span>
              {:else}
                Heal
              {/if}
            </button>
          </span>
        </div>
      </div>

      <!-- Attack group -->
      <div class="flex flex-col gap-1">
        <p class="text-xs font-semibold text-base-content/60 uppercase tracking-wide">Attacks<span class="tooltip tooltip-bottom inline-block normal-case font-normal" data-tip="Each attack consumes 10 RNG values. Use this to move toward your target position."><span class="cursor-help opacity-50 hover:opacity-100">ⓘ</span></span></p>
        <div class="flex items-end gap-1 lg:gap-2">
          <input
            type="number"
            min="1"
            class="input input-bordered input-sm w-14 lg:w-16"
            bind:value={consumeCount}
            disabled={loading}
          />
          <span class="tooltip tooltip-bottom" data-tip="Execute attacks to advance RNG by (count × 10) positions.">
            <button
              class="btn btn-secondary btn-sm"
              on:click={() => dispatch('consume', consumeCount)}
              disabled={loading}
            >Attack</button>
          </span>
        </div>
      </div>

      <!-- Reset -->
      <span class="tooltip tooltip-bottom lg:ml-auto" data-tip="Clear all results and start over.">
        <button
          class="btn btn-outline btn-sm"
          on:click={() => dispatch('clear')}
          disabled={loading}
        >Reset</button>
      </span>
    </div>

    <!-- Combo info -->
    {#if comboInfo >= 0}
      <span class="text-xs text-base-content/60">Combo in <strong class="text-base-content">{comboInfo}</strong> attack(s)<span class="tooltip tooltip-right inline-block normal-case font-normal" data-tip="A combo fires a different number of RNG values than a normal attack and will throw off your count."><span class="cursor-help opacity-50 hover:opacity-100">ⓘ</span></span></span>
    {/if}
  </div>
{/if}
