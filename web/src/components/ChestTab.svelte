<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { PlatformType, Spells } from '../core/types';
  import CharacterInputRow from './shared/CharacterInputRow.svelte';
  import HealInput from './shared/HealInput.svelte';
  import { saveTabState, loadTabState, exportStateAsJson, importStateFromJson } from '../utils/storage';
  import type { WorkerMessage, SerializedFutureRng, SerializedChestInstance } from '../workers/workerMessages';

  export let platform: PlatformType = PlatformType.Ps2;

  let chars = [
    { level: '' as number | '', magic: '' as number | '', spell: Spells.Cure, serenity: false },
    { level: '' as number | '', magic: '' as number | '', spell: Spells.Cure, serenity: false },
    { level: '' as number | '', magic: '' as number | '', spell: Spells.Cure, serenity: false },
  ];

  let chests = [
    { spawnChance: 50, rngPosition: 5, gilChance: 50, itemChance: 50, gilAmount: 100, wantItem1: false },
    { spawnChance: 50, rngPosition: 5, gilChance: 50, itemChance: 50, gilAmount: 100, wantItem1: false },
  ];

  let healValue = '';
  let healHistory: number[] = [];
  let numRows = 100;
  let consumeCount = 10;
  let loading = false;
  let canContinue = false;
  let nextExpectedHeal: number | null = null;
  let comboInfo = -1;
  let errorMsg = '';

  let rows: SerializedChestInstance[] = [];
  let advanceDirections: Array<{ advanceToAppear: number; advanceForItem: number }> = [];
  let selectedRows = new Set<number>();

  function toggleRow(index: number) {
    selectedRows = new Set(selectedRows.has(index) ? [...selectedRows].filter(i => i !== index) : [...selectedRows, index]);
  }

  let worker: Worker;
  let initialized = false;

  onMount(() => {
    worker = new Worker(new URL('../workers/rngSearch.worker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = handleWorkerMessage;

    const saved = loadTabState<{ chars: typeof chars; chests: typeof chests; healHistory: number[] }>('chest');
    if (saved?.chars) chars = saved.chars;
    if (saved?.chests) chests = saved.chests;
    if (saved?.healHistory) healHistory = saved.healHistory;
    initialized = true;

    if (healHistory.length > 0) {
      loading = true;
      const history = [...healHistory];
      const characters = chars
        .filter(c => c.level !== '' && c.magic !== '')
        .map(c => ({ level: Number(c.level), magic: Number(c.magic), spell: c.spell, serenity: c.serenity }));
      worker.postMessage({ type: 'INIT', mode: 'chest', platform, characters, chests: chests.map(c => ({ ...c })) });

      let step = 0;
      const replay = (e: MessageEvent<WorkerMessage>) => {
        const msg = e.data;
        if (msg.type === 'READY') {
          worker.postMessage({ type: 'FIND_FIRST', healValue: history[0], numRows });
          step = 1;
        } else if (msg.type === 'RESULT') {
          if (step < history.length) {
            worker.postMessage({ type: 'FIND_NEXT', healValue: history[step], numRows });
            step++;
          } else {
            worker.onmessage = handleWorkerMessage;
            handleWorkerMessage(e);
          }
        } else if (msg.type === 'ERROR') {
          worker.onmessage = handleWorkerMessage;
          handleWorkerMessage(e);
        }
      };
      worker.onmessage = replay;
    }
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
      rows = msg.futureRng.chestInstances ?? [];
      advanceDirections = msg.futureRng.advanceDirections ?? [];
    }
  }

  function buildInit() {
    const characters = chars
      .filter(c => c.level !== '' && c.magic !== '')
      .map(c => ({ level: Number(c.level), magic: Number(c.magic), spell: c.spell, serenity: c.serenity }));
    worker.postMessage({ type: 'INIT', mode: 'chest', platform, characters, chests: chests.map(c => ({ ...c })) });
  }

  function pushHealHistory(val: number) {
    healHistory = [...healHistory, val].slice(-4);
    saveTabState('chest', { chars, chests, healHistory });
  }

  function onBegin() {
    if (!healValue) return;
    healHistory = [];
    pushHealHistory(Number(healValue));
    errorMsg = ''; loading = true; canContinue = false; rows = []; advanceDirections = [];
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
    pushHealHistory(Number(healValue));
    errorMsg = ''; loading = true;
    worker.postMessage({ type: 'FIND_NEXT', healValue: Number(healValue), numRows });
  }

  function onConsume(e: CustomEvent<number>) {
    errorMsg = ''; loading = true;
    worker.postMessage({ type: 'CONSUME', count: e.detail, numRows });
  }

  function onClear() {
    rows = []; advanceDirections = []; errorMsg = ''; canContinue = false;
    nextExpectedHeal = null; comboInfo = -1; healValue = ''; healHistory = [];
    saveTabState('chest', { chars, chests, healHistory: [] });
    worker.postMessage({ type: 'REINIT' });
  }

  function onRecalculate(e: CustomEvent<number>) {
    loading = true;
    worker.postMessage({ type: 'CALCULATE', numRows: e.detail });
  }

  function onSave() {
    const state = { chars, chests };
    saveTabState('chest', state);
    exportStateAsJson('chest', state);
  }

  async function onLoad() {
    try {
      const state = await importStateFromJson() as { chars: typeof chars; chests: typeof chests };
      if (state.chars) chars = state.chars;
      if (state.chests) chests = state.chests;
    } catch (e) { errorMsg = String(e); }
  }

  $: if (nextExpectedHeal !== null) canContinue = true;
  $: if (initialized) saveTabState('chest', { chars, chests, healHistory });
</script>

<div class="flex flex-col gap-4 p-2 md:p-4">

  <!-- Save / Load -->
  <div class="flex gap-2 justify-end">
    <button class="btn btn-xs btn-outline" on:click={onSave}>Export JSON</button>
    <button class="btn btn-xs btn-outline" on:click={onLoad}>Import JSON</button>
  </div>

  <!-- Row 1: mobile: Characters→Chests→Heal / desktop: 2-col grid -->
  <div class="flex flex-col md:grid md:grid-cols-2 gap-4">

    <!-- Characters: mobile order 1, desktop col 1 row 1 -->
    <div class="card bg-base-200 p-4 flex flex-col gap-4 order-1">
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

    <!-- Chests: mobile order 2, desktop col 2 rows 1-2 -->
    <div class="card bg-base-200 p-4 flex flex-col gap-4 order-2 md:row-span-2">
      <h3 class="font-semibold text-sm">Chests</h3>
      <div class="flex flex-col gap-4">
        {#each chests as chest, i}
          <div class="flex flex-col gap-3">
            <span class="text-xs font-semibold text-base-content/60 uppercase tracking-wide">Chest {i + 1}</span>
            <div class="flex gap-5 text-sm">
              <div class="flex flex-col gap-1">
                <label class="flex items-center gap-2">
                  <span class="text-xs text-base-content/50 w-14">RNG pos</span>
                  <input type="number" class="input input-bordered input-sm flex-1 min-w-0" bind:value={chest.rngPosition} />
                </label>
                <label class="flex items-center gap-2">
                  <span class="text-xs text-base-content/50 w-14">Spawn %</span>
                  <input type="number" class="input input-bordered input-sm flex-1 min-w-0" bind:value={chest.spawnChance} />
                </label>
                <label class="flex items-center gap-2">
                  <span class="text-xs text-base-content/50 w-14">Item 1 %</span>
                  <input type="number" class="input input-bordered input-sm flex-1 min-w-0" bind:value={chest.itemChance} />
                </label>
              </div>
              <div class="flex flex-col gap-1">
                <label class="flex items-center gap-2">
                  <span class="text-xs text-base-content/50 w-14">Gil %</span>
                  <input type="number" class="input input-bordered input-sm flex-1 min-w-0" bind:value={chest.gilChance} />
                </label>
                <label class="flex items-center gap-2">
                  <span class="text-xs text-base-content/50 w-14">Gil amt</span>
                  <input type="number" class="input input-bordered input-sm flex-1 min-w-0" bind:value={chest.gilAmount} />
                </label>
                <label class="flex items-center gap-2 cursor-pointer h-10">
                  <input type="checkbox" class="checkbox checkbox-sm" bind:checked={chest.wantItem1} />
                  <span class="text-xs">Want Item 1</span>
                </label>
              </div>
            </div>
          </div>
        {/each}
      </div>
    </div>

    <!-- Heal controls: desktop col 1 row 2 (hidden on mobile) -->
    <div class="hidden md:block card bg-base-200 p-4 order-3">
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

  </div>

  <!-- Row 2: Advance directions (full width) -->
  <div class="card bg-base-200 p-4 flex flex-col gap-2">
    <h3 class="font-semibold text-sm">Advance directions</h3>
    {#if advanceDirections.length > 0}
      <div class="grid gap-x-5 gap-y-3 text-sm" style="grid-template-columns: repeat({advanceDirections.length}, 1fr)">
        <!-- Chest titles -->
        {#each advanceDirections as _, i}
          <span class="text-sm font-semibold text-base-content/60 uppercase tracking-wide">Chest {i + 1}</span>
        {/each}
        <!-- Until spawn -->
        {#each advanceDirections as d, i}
          {#if i === 0}
            <span class="badge badge-md border-blue-400 bg-blue-100 text-blue-700 dark:border-blue-500 dark:bg-blue-900/30 dark:text-blue-300">{#if d.advanceToAppear >= 0}<strong>{d.advanceToAppear}</strong> until spawn{:else}Out of range{/if}</span>
          {:else}
            <span class="badge badge-md border-cyan-400 bg-cyan-100 text-cyan-700 dark:border-cyan-500 dark:bg-cyan-900/30 dark:text-cyan-300">{#if d.advanceToAppear >= 0}<strong>{d.advanceToAppear}</strong> until spawn{:else}Out of range{/if}</span>
          {/if}
        {/each}
        <!-- Until item -->
        {#each advanceDirections as d, i}
          {#if i === 0}
            <span class="badge badge-md border-blue-500 bg-blue-200 text-blue-800 dark:border-blue-400 dark:bg-blue-900/40 dark:text-blue-200">{#if d.advanceForItem >= 0}<strong>{d.advanceForItem}</strong> until item inside{:else}Out of range{/if}</span>
          {:else}
            <span class="badge badge-md border-cyan-500 bg-cyan-200 text-cyan-800 dark:border-cyan-400 dark:bg-cyan-900/40 dark:text-cyan-200">{#if d.advanceForItem >= 0}<strong>{d.advanceForItem}</strong> until item inside{:else}Out of range{/if}</span>
          {/if}
        {/each}
      </div>
    {:else}
      <p class="text-xs text-base-content/40">Run Begin to see directions.</p>
    {/if}
  </div>

  <!-- Heal controls: mobile only (below advance directions) -->
  <div class="md:hidden card bg-base-200 p-4">
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

  <!-- Row 3: Results table -->
  {#if rows.length > 0}
    <div class="flex items-center gap-2 text-xs text-base-content/60 px-1 ml-auto">
      <span>Rows</span>
      <select class="select select-bordered select-xs w-24" bind:value={numRows} on:change={() => worker.postMessage({ type: "CALCULATE", numRows })}><option value={100}>100</option><option value={200}>200</option><option value={300}>300</option><option value={400}>400</option><option value={500}>500</option></select>
    </div>
    <div class="overflow-x-auto max-h-[50vh] overflow-y-auto">
      <table class="table table-md table-pin-rows">
        <thead>
          <tr>
            <th>Index</th>
            <th>Heal</th>
            <th>%</th>
            {#each chests as _, i}<th>Chest {i + 1}</th>{/each}
          </tr>
        </thead>
        <tbody>
          {#each rows as row}
            <tr
              class:bg-success={row.isPastRng}
              class:bg-opacity-20={row.isPastRng}
              class:row-selected={!row.isPastRng && selectedRows.has(row.index)}
              class:cursor-pointer={!row.isPastRng}
              on:click={() => { if (!row.isPastRng) toggleRow(row.index); }}
            >
              <td>{row.index}</td>
              <td>{row.currentHeal}</td>
              <td>{row.randToPercent}</td>
              {#each row.chestRewards as reward}
                <td class:font-bold={reward.chestWillSpawn}>
                  {reward.reward === 'Gil' ? `${reward.gilAmount} gil` : reward.reward}
                </td>
              {/each}
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}

</div>
