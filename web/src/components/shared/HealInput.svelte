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

  function onContinueKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') dispatch('continue');
  }

  function onNumRowsChange() {
    if (canContinue) dispatch('recalculate', numRows);
  }

  const rowOptions = [100, 200, 300, 400, 500];
</script>

{#if !canContinue}
  <!-- Phase 1: Begin -->
  <div class="flex flex-wrap items-end gap-2">
    <div class="flex flex-col gap-1">
      <p class="text-xs font-semibold text-base-content/60 uppercase tracking-wide">Heal value</p>
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
  </div>

{:else}
  <!-- Phase 2: Heal + Attack + Reset -->
  <div class="flex flex-col gap-2">
    <!-- All controls in one row -->
    <div class="flex flex-wrap items-end gap-1 lg:gap-6">
      <!-- Heal group -->
      <div class="flex flex-col gap-1">
        <p class="text-xs font-semibold text-base-content/60 uppercase tracking-wide">Next heal</p>
        <div class="flex items-center gap-1 lg:gap-2">
          <input
            type="number"
            class="input input-bordered input-sm w-16 lg:w-18"
            bind:value={healValue}
            on:keydown={onContinueKeydown}
            disabled={loading}
          />
          <button
            class="btn btn-primary btn-sm"
            on:click={() => dispatch('continue')}
            disabled={loading || !healValue}
          >
            {#if loading}
              <span class="loading loading-spinner loading-xs"></span>
            {:else}
              Heal
            {/if}
          </button>
        </div>
      </div>

      <!-- Attack group -->
      <div class="flex items-end gap-1 lg:gap-2">
        <input
          type="number"
          min="1"
          class="input input-bordered input-sm w-16 lg:w-16"
          bind:value={consumeCount}
          disabled={loading}
        />
        <button
          class="btn btn-secondary btn-sm"
          on:click={() => dispatch('consume', consumeCount)}
          disabled={loading}
        >Attack</button>
      </div>

      <!-- Reset -->
      <button
        class="btn btn-outline btn-sm ml-auto"
        on:click={() => dispatch('clear')}
        disabled={loading}
      >Reset</button>
    </div>

    <!-- Combo info -->
    {#if comboInfo >= 0}
      <span class="text-xs text-base-content/60">Combo in <strong class="text-base-content">{comboInfo}</strong> attack(s)</span>
    {/if}
  </div>
{/if}
