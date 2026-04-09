<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { PlatformType, Spells } from '../core/types';
  import CharacterInputRow from './shared/CharacterInputRow.svelte';
  import HealInput from './shared/HealInput.svelte';
  import DirectionsBox from './shared/DirectionsBox.svelte';
  import type { WorkerMessage, SerializedSpawnInstance } from '../workers/workerMessages';

  export let platform: PlatformType = PlatformType.Ps2;

  let chars = [
    { level: '' as number | '', magic: '' as number | '', spell: Spells.Cure, serenity: false },
    { level: '' as number | '', magic: '' as number | '', spell: Spells.Cure, serenity: false },
    { level: '' as number | '', magic: '' as number | '', spell: Spells.Cure, serenity: false },
  ];

  let monsters = [
    { minChance: 1, maxChance: 20, rngPosition: 1 },
  ];

  let healValue = '';
  let numRows = 100;
  let consumeCount = 10;
  let loading = false;
  let canContinue = false;
  let nextExpectedHeal: number | null = null;
  let comboInfo = -1;
  let errorMsg = '';

  let rows: SerializedSpawnInstance[] = [];
  let spawnDirections: Array<{ directions: number }> = [];

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
      rows = msg.futureRng.spawnInstances ?? [];
      spawnDirections = msg.futureRng.spawnDirections ?? [];
    }
  }

  function buildInit() {
    const characters = chars
      .filter(c => c.level !== '' && c.magic !== '')
      .map(c => ({ level: Number(c.level), magic: Number(c.magic), spell: c.spell, serenity: c.serenity }));
    worker.postMessage({ type: 'INIT', mode: 'spawn', platform, characters, monsters: monsters.map(m => ({ ...m })) });
  }

  function onBegin() {
    if (!healValue) return;
    errorMsg = ''; loading = true; canContinue = false; rows = []; spawnDirections = [];
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
    rows = []; spawnDirections = []; errorMsg = ''; canContinue = false;
    nextExpectedHeal = null; comboInfo = -1; healValue = '';
    worker.postMessage({ type: 'REINIT' });
  }

  function onRecalculate(e: CustomEvent<number>) {
    loading = true;
    worker.postMessage({ type: 'CALCULATE', numRows: e.detail });
  }

  function addMonster() { monsters = [...monsters, { minChance: 1, maxChance: 20, rngPosition: 1 }]; }
  function removeMonster(i: number) { monsters = monsters.filter((_, idx) => idx !== i); }

  $: if (nextExpectedHeal !== null) canContinue = true;
</script>

<div class="flex flex-col gap-4 p-2 md:p-4">

  <!-- Row 1: Characters (left) + Monsters (right) -->
  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">

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

    <div class="card bg-base-200 p-4 flex flex-col gap-3">
      <div class="flex items-center justify-between">
        <h3 class="font-semibold text-sm">Rare Monsters</h3>
        <button class="btn btn-xs btn-outline" on:click={addMonster}>+ Add</button>
      </div>
      {#each monsters as m, i}
        <div class="flex flex-col gap-1">
          <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-base-content/60 uppercase tracking-wide">Monster {i + 1}</span>
            {#if monsters.length > 1}
              <button class="btn btn-xs btn-ghost text-error" on:click={() => removeMonster(i)}>✕</button>
            {/if}
          </div>
          <div class="grid grid-cols-3 gap-2 text-sm">
            <label class="flex flex-col gap-1">
              <span class="text-xs text-base-content/50">Min %</span>
              <input type="number" class="input input-bordered input-sm w-full" bind:value={m.minChance} />
            </label>
            <label class="flex flex-col gap-1">
              <span class="text-xs text-base-content/50">Max %</span>
              <input type="number" class="input input-bordered input-sm w-full" bind:value={m.maxChance} />
            </label>
            <label class="flex flex-col gap-1">
              <span class="text-xs text-base-content/50">RNG pos</span>
              <input type="number" class="input input-bordered input-sm w-full" bind:value={m.rngPosition} />
            </label>
          </div>
        </div>
      {/each}
    </div>

  </div>

  <!-- Row 2: Heal controls (left) + Spawn directions (right) -->
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
      <h3 class="font-semibold text-sm">Spawn directions</h3>
      {#if spawnDirections.length > 0}
        {#each spawnDirections as d, i}
          <DirectionsBox label="Monster {i + 1}" value={d.directions} />
        {/each}
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
            <th>Index</th><th>Heal</th>
            <th>Spawn %</th><th>Raw RNG</th>
            {#each monsters as _, i}<th>M{i + 1}</th>{/each}
          </tr>
        </thead>
        <tbody>
          {#each rows as row}
            <tr class:bg-success={row.isPastRng} class:bg-opacity-20={row.isPastRng}>
              <td>{row.index}</td>
              <td>{row.currentHeal}</td>
              <td>{(row.spawnChance * 100).toFixed(4)}%</td>
              <td>{row.rawRngValue}</td>
              {#each row.monsterSpawns as spawns}
                <td>{spawns ? '✓' : ''}</td>
              {/each}
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}

</div>
