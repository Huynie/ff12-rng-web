<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { PlatformType, Spells } from '../core/types';
  import CharacterInputRow from './shared/CharacterInputRow.svelte';
  import HealInput from './shared/HealInput.svelte';
  import DirectionsBox from './shared/DirectionsBox.svelte';
  import type { WorkerMessage, SerializedStealInstance } from '../workers/workerMessages';

  export let platform: PlatformType = PlatformType.Ps2;

  let chars = [
    { level: '' as number | '', magic: '' as number | '', spell: Spells.Cure, serenity: false },
    { level: '' as number | '', magic: '' as number | '', spell: Spells.Cure, serenity: false },
    { level: '' as number | '', magic: '' as number | '', spell: Spells.Cure, serenity: false },
  ];

  let healValue = '';
  let numRows = 100;
  let consumeCount = 10;
  let loading = false;
  let canContinue = false;
  let nextExpectedHeal: number | null = null;
  let comboInfo = -1;
  let errorMsg = '';

  let rows: SerializedStealInstance[] = [];
  let stealDirections: { advanceForRare: number; advanceForRareCuffs: number } | null = null;

  let worker: Worker;

  onMount(() => {
    worker = new Worker(new URL('../workers/rngSearch.worker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = handleWorkerMessage;
  });

  onDestroy(() => worker?.terminate());

  function handleWorkerMessage(e: MessageEvent<WorkerMessage>) {
    loading = false;
    const msg = e.data;
    if (msg.type === 'ERROR') { errorMsg = msg.message; canContinue = false; return; }
    if (msg.type === 'RESULT') {
      errorMsg = '';
      nextExpectedHeal = msg.nextHeal;
      healValue = String(msg.nextHeal);
      comboInfo = msg.combo;
      rows = msg.futureRng.stealInstances ?? [];
      stealDirections = msg.futureRng.stealDirections ?? null;
    }
  }

  function buildInit() {
    const characters = chars
      .filter(c => c.level !== '' && c.magic !== '')
      .map(c => ({ level: Number(c.level), magic: Number(c.magic), spell: c.spell, serenity: c.serenity }));
    worker.postMessage({ type: 'INIT', mode: 'steal', platform, characters });
  }

  function onBegin() {
    if (!healValue) return;
    errorMsg = ''; loading = true; canContinue = false; rows = []; stealDirections = null;
    buildInit();
    const origHandler = worker.onmessage;
    worker.onmessage = (e: MessageEvent<WorkerMessage>) => {
      if (e.data.type === 'READY') {
        worker.onmessage = origHandler;
        worker.postMessage({ type: 'FIND_FIRST', healValue: Number(healValue), numRows });
      }
    };
  }

  function onContinue() {
    if (!healValue) return;
    errorMsg = ''; loading = true;
    worker.postMessage({ type: 'FIND_NEXT', healValue: Number(healValue), numRows });
  }

  function onConsume(e: CustomEvent<number>) {
    errorMsg = ''; loading = true;
    worker.postMessage({ type: 'CONSUME', count: e.detail, numRows });
  }

  function onClear() {
    rows = []; stealDirections = null; errorMsg = ''; canContinue = false;
    nextExpectedHeal = null; comboInfo = -1; healValue = '';
    worker.postMessage({ type: 'REINIT' });
  }

  function onRecalculate(e: CustomEvent<number>) {
    loading = true;
    worker.postMessage({ type: 'CALCULATE', numRows: e.detail });
  }

  $: if (nextExpectedHeal !== null) canContinue = true;
</script>

<div class="flex flex-col gap-4 p-2 md:p-4">

  <!-- Row 1: Characters (left) + empty right (steal has no extra config) -->
  <div class="card bg-base-200 p-4 flex flex-col gap-4">
    <h3 class="font-semibold text-sm">Characters</h3>
    <div class="grid grid-cols-3 gap-4">
      {#each chars as c, i}
        <CharacterInputRow
          label="Char {i + 1}"
          bind:level={c.level}
          bind:magic={c.magic}
          bind:spell={c.spell}
          bind:serenity={c.serenity}
        />
      {/each}
    </div>
  </div>

  <!-- Row 2: Heal controls (left) + Steal directions (right) -->
  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">

    <div class="card bg-base-200 p-4">
      <HealInput
        bind:healValue
        bind:numRows
        bind:consumeCount
        {loading}
        {canContinue}
        {comboInfo}
        on:begin={onBegin}
        on:continue={onContinue}
        on:consume={onConsume}
        on:clear={onClear}
        on:recalculate={onRecalculate}
      />

      {#if errorMsg}
        <div class="alert alert-error text-sm mt-3">{errorMsg}</div>
      {/if}
    </div>

    <div class="card bg-base-200 p-4 flex flex-col gap-2">
      <h3 class="font-semibold text-sm">Steal directions</h3>
      {#if stealDirections}
        <DirectionsBox label="Rare steal"    value={stealDirections.advanceForRare} />
        <DirectionsBox label="Rare (Cuffs)" value={stealDirections.advanceForRareCuffs} />
      {:else}
        <p class="text-xs text-base-content/40">Run Begin to see directions.</p>
      {/if}
    </div>

  </div>

  <!-- Row 3: Results table -->
  {#if rows.length > 0}
    <div class="flex items-center gap-2 text-xs text-base-content/60 px-1">
      <span>Rows</span>
      <select class="select select-bordered select-xs w-24" bind:value={numRows} on:change={() => worker.postMessage({ type: "CALCULATE", numRows })}><option value={100}>100</option><option value={200}>200</option><option value={300}>300</option><option value={400}>400</option><option value={500}>500</option></select>
    </div>
    <div class="overflow-x-auto max-h-[50vh] overflow-y-auto">
      <table class="table table-md table-pin-rows">
        <thead>
          <tr>
            <th>Index<span class="tooltip tooltip-bottom inline-block normal-case font-normal" data-tip="Position in the RNG sequence."><span class="cursor-help opacity-40 hover:opacity-100">ⓘ</span></span></th>
            <th>Heal<span class="tooltip tooltip-bottom inline-block normal-case font-normal" data-tip="What a heal produces at this RNG position."><span class="cursor-help opacity-40 hover:opacity-100">ⓘ</span></span></th>
            <th>%<span class="tooltip tooltip-bottom inline-block normal-case font-normal" data-tip="rng mod 100 — compared against steal thresholds."><span class="cursor-help opacity-40 hover:opacity-100">ⓘ</span></span></th>
            <th>Normal steal<span class="tooltip tooltip-bottom inline-block normal-case font-normal" data-tip="Item obtained with a normal steal at this position."><span class="cursor-help opacity-40 hover:opacity-100">ⓘ</span></span></th>
            <th>Cuffs steal<span class="tooltip tooltip-bottom inline-block normal-case font-normal" data-tip="Item obtained when stealing with Thief's Cuffs equipped."><span class="cursor-help opacity-40 hover:opacity-100">ⓘ</span></span></th>
            <th>Lv99 Chocobo<span class="tooltip tooltip-bottom inline-block normal-case font-normal" data-tip="Whether a level 99 Red Chocobo can be stolen at this position."><span class="cursor-help opacity-40 hover:opacity-100">ⓘ</span></span></th>
          </tr>
        </thead>
        <tbody>
          {#each rows as row}
            <tr class:bg-success={row.isPastRng} class:bg-opacity-20={row.isPastRng}>
              <td>{row.index}</td>
              <td>{row.currentHeal}</td>
              <td>{row.randToPercent}</td>
              <td>{row.normalReward}</td>
              <td>{row.cuffsReward.join(' + ')}</td>
              <td>{row.lv99RedChocobo ? '✓' : ''}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}

</div>
