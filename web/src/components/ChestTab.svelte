<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import { PlatformType, RewardType, Spells } from "../core/types";
    import CharacterInputRow from "./shared/CharacterInputRow.svelte";
    import HealInput from "./shared/HealInput.svelte";
    import {
        saveTabState,
        loadTabState,
        exportStateAsJson,
        importStateFromJson,
    } from "../utils/storage";
    import type {
        WorkerMessage,
        SerializedFutureRng,
        SerializedChestInstance,
    } from "../workers/workerMessages";

    export let platform: PlatformType = PlatformType.Ps2;

    let chars = [
        {
            level: "" as number | "",
            magic: "" as number | "",
            spell: Spells.Cure,
            serenity: false,
        },
        {
            level: "" as number | "",
            magic: "" as number | "",
            spell: Spells.Cure,
            serenity: false,
        },
        {
            level: "" as number | "",
            magic: "" as number | "",
            spell: Spells.Cure,
            serenity: false,
        },
    ];

    let chests = [
        {
            spawnChance: 50,
            rngPosition: 5,
            gilChance: 50,
            itemChance: 50,
            gilAmount: 100,
            wantItem1: false,
        },
        {
            spawnChance: 50,
            rngPosition: 5,
            gilChance: 50,
            itemChance: 50,
            gilAmount: 100,
            wantItem1: false,
        },
    ];

    let healValue = "";
    let healHistory: number[] = [];
    let numRows = 100;
    let consumeCount = 10;
    let loading = false;
    let canContinue = false;
    let nextExpectedHeal: number | null = null;
    let comboInfo = -1;
    let errorMsg = "";

    let rows: SerializedChestInstance[] = [];
    let advanceDirections: Array<{
        advanceToAppear: number;
        advanceForItem: number;
    }> = [];
    let selectedRows = new Set<number>();

    type HistoryEntry = {
        action: 'heal' | 'attack';
        label: string;
        rngIndex: number;
        heal: number;
        chestRewards: SerializedChestInstance['chestRewards'];
        advanceDirections: Array<{ advanceToAppear: number; advanceForItem: number }>;
    };
    let historyLog: HistoryEntry[] = [];
    let activeRightTab: 'positions' | 'history' = 'positions';
    let pendingHistoryEntry: { action: 'heal' | 'attack'; label: string } | null = null;

    function toggleRow(index: number) {
        selectedRows = new Set(
            selectedRows.has(index)
                ? [...selectedRows].filter((i) => i !== index)
                : [...selectedRows, index],
        );
    }

    let worker: Worker;
    let initialized = false;

    onMount(() => {
        worker = new Worker(
            new URL("../workers/rngSearch.worker.ts", import.meta.url),
            { type: "module" },
        );
        worker.onmessage = handleWorkerMessage;

        const saved = loadTabState<{
            chars: typeof chars;
            chests: typeof chests;
            healHistory: number[];
        }>("chest");
        if (saved?.chars) chars = saved.chars;
        if (saved?.chests) chests = saved.chests;
        if (saved?.healHistory) healHistory = saved.healHistory;
        initialized = true;

        if (healHistory.length > 0) {
            loading = true;
            const history = [...healHistory];
            const characters = chars
                .filter((c) => c.level !== "" && c.magic !== "")
                .map((c) => ({
                    level: Number(c.level),
                    magic: Number(c.magic),
                    spell: c.spell,
                    serenity: c.serenity,
                }));
            worker.postMessage({
                type: "INIT",
                mode: "chest",
                platform,
                characters,
                chests: chests.map((c) => ({ ...c })),
            });

            let step = 0;
            const replay = (e: MessageEvent<WorkerMessage>) => {
                const msg = e.data;
                if (msg.type === "READY") {
                    worker.postMessage({
                        type: "FIND_FIRST",
                        healValue: history[0],
                        numRows,
                    });
                    step = 1;
                } else if (msg.type === "RESULT") {
                    if (step < history.length) {
                        worker.postMessage({
                            type: "FIND_NEXT",
                            healValue: history[step],
                            numRows,
                        });
                        step++;
                    } else {
                        worker.onmessage = handleWorkerMessage;
                        handleWorkerMessage(e);
                    }
                } else if (msg.type === "ERROR") {
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
        if (msg.type === "ERROR") {
            errorMsg = msg.message;
            canContinue = false;
            return;
        }
        if (msg.type === "RESULT") {
            errorMsg = "";
            nextExpectedHeal = msg.nextHeal;
            healValue = String(msg.nextHeal);
            comboInfo = msg.combo;
            rows = msg.futureRng.chestInstances ?? [];
            advanceDirections = msg.futureRng.advanceDirections ?? [];

            if (pendingHistoryEntry) {
                const current = rows.find(r => !r.isPastRng);
                if (current) {
                    historyLog = [{
                        action: pendingHistoryEntry.action,
                        label: pendingHistoryEntry.label,
                        rngIndex: current.index,
                        heal: current.currentHeal,
                        chestRewards: current.chestRewards,
                        advanceDirections: [...advanceDirections],
                    }, ...historyLog].slice(0, 20);
                }
                pendingHistoryEntry = null;
            }
        }
    }

    function buildInit() {
        const characters = chars
            .filter((c) => c.level !== "" && c.magic !== "")
            .map((c) => ({
                level: Number(c.level),
                magic: Number(c.magic),
                spell: c.spell,
                serenity: c.serenity,
            }));
        worker.postMessage({
            type: "INIT",
            mode: "chest",
            platform,
            characters,
            chests: chests.map((c) => ({ ...c })),
        });
    }

    function pushHealHistory(val: number) {
        healHistory = [...healHistory, val].slice(-4);
        saveTabState("chest", { chars, chests, healHistory });
    }

    function onBegin() {
        if (!healValue) return;
        healHistory = [];
        historyLog = [];
        pushHealHistory(Number(healValue));
        pendingHistoryEntry = { action: 'heal', label: `Heal ${healValue}` };
        errorMsg = "";
        loading = true;
        canContinue = false;
        rows = [];
        advanceDirections = [];
        buildInit();
        const origHandler = worker.onmessage;
        worker.onmessage = (e: MessageEvent<WorkerMessage>) => {
            if (e.data.type === "READY") {
                worker.onmessage = origHandler;
                worker.postMessage({
                    type: "FIND_FIRST",
                    healValue: Number(healValue),
                    numRows,
                });
            }
        };
    }

    function onContinue() {
        if (!healValue) return;
        pushHealHistory(Number(healValue));
        pendingHistoryEntry = { action: 'heal', label: `Heal ${healValue}` };
        errorMsg = "";
        loading = true;
        worker.postMessage({
            type: "FIND_NEXT",
            healValue: Number(healValue),
            numRows,
        });
    }

    function onConsume(e: CustomEvent<number>) {
        pendingHistoryEntry = { action: 'attack', label: `Attack ×${e.detail}` };
        errorMsg = "";
        loading = true;
        worker.postMessage({ type: "CONSUME", count: e.detail, numRows });
    }

    function onClear() {
        rows = [];
        advanceDirections = [];
        historyLog = [];
        activeRightTab = 'positions';
        errorMsg = "";
        canContinue = false;
        nextExpectedHeal = null;
        comboInfo = -1;
        healValue = "";
        healHistory = [];
        saveTabState("chest", { chars, chests, healHistory: [] });
        worker.postMessage({ type: "REINIT" });
    }

    function onRecalculate(e: CustomEvent<number>) {
        loading = true;
        worker.postMessage({ type: "CALCULATE", numRows: e.detail });
    }

    function onSave() {
        const state = { chars, chests };
        saveTabState("chest", state);
        exportStateAsJson("chest", state);
    }

    async function onLoad() {
        try {
            const state = (await importStateFromJson()) as {
                chars: typeof chars;
                chests: typeof chests;
            };
            if (state.chars) chars = state.chars;
            if (state.chests) chests = state.chests;
        } catch (e) {
            errorMsg = String(e);
        }
    }

    function chestCellClass(
        chestIndex: number,
        reward: { chestWillSpawn: boolean; reward: string },
        rowisPastRng: boolean,
    ): string {
        const opacity = rowisPastRng ? " opacity-60" : "";
        const wantItem = chests[chestIndex].wantItem1;
        const isTarget =
            (wantItem && reward.reward === RewardType.Item1) ||
            (!wantItem && reward.reward === RewardType.Item2);

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

    $: if (nextExpectedHeal !== null) canContinue = true;
    $: if (initialized) saveTabState("chest", { chars, chests, healHistory });

    // Highlight all rows from the first future row up to each chest's rng position (inclusive)
    $: rngPosRowIndices = (() => {
        const firstFutureIdx = rows.findIndex((r) => !r.isPastRng);
        if (firstFutureIdx === -1) return new Map<number, number[]>();
        const map = new Map<number, number[]>(); // rowIdx → chestIndices
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

<div class="flex flex-col gap-4 p-2 md:p-4">
    <!-- Save / Load -->
    <div class="flex gap-2 justify-end">
        <button class="btn btn-xs btn-outline" on:click={onSave}
            >Export JSON</button
        >
        <button class="btn btn-xs btn-outline" on:click={onLoad}
            >Import JSON</button
        >
    </div>

    <!-- 2-col on desktop: left = panels, right = table. Mobile: single stack. -->
    <div class="flex flex-col md:grid md:grid-cols-2 md:items-start gap-4">

      <!-- Left column: all panels stacked (also the full mobile stack) -->
      <div class="flex flex-col gap-4">

        <!-- Characters -->
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

        <!-- Chests -->
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
                      <input type="number" class="input input-bordered input-sm flex-1 min-w-0" bind:value={chest.rngPosition} />
                    </label>
                    <label class="flex items-center gap-2">
                      <span class="text-xs text-base-content/50 min-w-14">Spawn %<span class="tooltip tooltip-right inline-block normal-case font-normal" data-tip="Probability the chest appears when you zone in (e.g. 1 for Gendarme, 50 for common chests)."><span class="cursor-help opacity-50 hover:opacity-100">ⓘ</span></span></span>
                      <input type="number" class="input input-bordered input-sm flex-1 min-w-0" bind:value={chest.spawnChance} />
                    </label>
                    <label class="flex items-center gap-2">
                      <span class="text-xs text-base-content/50 min-w-14">Item 1 %<span class="tooltip tooltip-right inline-block normal-case font-normal" data-tip="If it's an item, probability it's Item 1 vs Item 2."><span class="cursor-help opacity-50 hover:opacity-100">ⓘ</span></span></span>
                      <input type="number" class="input input-bordered input-sm flex-1 min-w-0" bind:value={chest.itemChance} />
                    </label>
                  </div>
                  <div class="flex flex-col gap-1">
                    <label class="flex items-center gap-2">
                      <span class="text-xs text-base-content/50 min-w-14">Gil %<span class="tooltip tooltip-right inline-block normal-case font-normal" data-tip="If the chest spawns, probability it contains gil instead of an item."><span class="cursor-help opacity-50 hover:opacity-100">ⓘ</span></span></span>
                      <input type="number" class="input input-bordered input-sm flex-1 min-w-0" bind:value={chest.gilChance} />
                    </label>
                    <label class="flex items-center gap-2">
                      <span class="text-xs text-base-content/50 min-w-14">Gil amt<span class="tooltip tooltip-right inline-block normal-case font-normal" data-tip="Max gil the chest can contain. Actual amount = 1 + (rng mod gilAmt)."><span class="cursor-help opacity-50 hover:opacity-100">ⓘ</span></span></span>
                      <input type="number" class="input input-bordered input-sm flex-1 min-w-0" bind:value={chest.gilAmount} />
                    </label>
                    <label class="flex items-center gap-2 cursor-pointer h-10">
                      <input type="checkbox" class="checkbox checkbox-sm" bind:checked={chest.wantItem1} />
                      <span class="text-xs">Want Item 1<span class="tooltip tooltip-right inline-block normal-case font-normal" data-tip="Check if your desired item is Item 1. The app finds the nearest bold row where it lands."><span class="cursor-help opacity-50 hover:opacity-100">ⓘ</span></span></span>
                    </label>
                  </div>
                </div>
              </div>
            {/each}
          </div>
        </div>

        <!-- Heal controls -->
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

        <!-- Advance directions -->
        <div class="card bg-base-200 p-4 flex flex-col gap-2">
          <h3 class="font-semibold text-sm">Advance directions<span class="tooltip tooltip-bottom inline-block normal-case font-normal" data-tip="How many RNG positions to consume before zoning to land on your target chest result."><span class="cursor-help opacity-40 hover:opacity-100">ⓘ</span></span></h3>
          {#if advanceDirections.length > 0}
            <div class="grid gap-x-5 gap-y-3 text-sm" style="grid-template-columns: repeat({advanceDirections.length}, 1fr)">
              {#each advanceDirections as _, i}
                <span class="text-sm font-semibold text-base-content/60 uppercase tracking-wide">Chest {i + 1}</span>
              {/each}
              {#each advanceDirections as d, i}
                {#if i === 0}
                  <span class="badge badge-md border-blue-400 bg-blue-100 text-blue-700 dark:border-blue-500 dark:bg-blue-900/30 dark:text-blue-300">{#if d.advanceToAppear >= 0}<strong>{d.advanceToAppear}</strong> to spawn{:else}Out of range{/if}{#if i === 0}<span class="tooltip tooltip-left inline-block normal-case font-normal" data-tip="Advance RNG by this many before zoning to make the chest appear."><span class="cursor-help opacity-50 hover:opacity-100">ⓘ</span></span>{/if}</span>
                {:else}
                  <span class="badge badge-md border-cyan-400 bg-cyan-100 text-cyan-700 dark:border-cyan-500 dark:bg-cyan-900/30 dark:text-cyan-300">{#if d.advanceToAppear >= 0}<strong>{d.advanceToAppear}</strong> to spawn{:else}Out of range{/if}</span>
                {/if}
              {/each}
              {#each advanceDirections as d, i}
                {#if i === 0}
                  <span class="badge badge-md border-indigo-500 bg-indigo-200 text-indigo-800 dark:border-indigo-400 dark:bg-indigo-900/40 dark:text-indigo-200">{#if d.advanceForItem >= 0}<strong>{d.advanceForItem}</strong> to item{:else}Out of range{/if}{#if i === 0}<span class="tooltip tooltip-left inline-block normal-case font-normal" data-tip="Advance RNG by this many to land on a row where the chest spawns AND contains your desired item."><span class="cursor-help opacity-50 hover:opacity-100">ⓘ</span></span>{/if}</span>
                {:else}
                  <span class="badge badge-md border-sky-500 bg-sky-200 text-sky-800 dark:border-sky-400 dark:bg-sky-900/40 dark:text-sky-200">{#if d.advanceForItem >= 0}<strong>{d.advanceForItem}</strong> to item{:else}Out of range{/if}</span>
                {/if}
              {/each}
            </div>
          {:else}
            <p class="text-xs text-base-content/40">Run Begin to see directions.</p>
          {/if}
        </div>

      </div>

      <!-- Right column: tabbed Positions / History -->
      <div class="flex flex-col gap-2">

        <!-- Tab bar -->
        <div role="tablist" class="tabs tabs-bordered">
          <button role="tab" class="tab" class:tab-active={activeRightTab === 'positions'} on:click={() => activeRightTab = 'positions'}>Positions</button>
          <button role="tab" class="tab" class:tab-active={activeRightTab === 'history'} on:click={() => activeRightTab = 'history'}>
            History
            {#if historyLog.length > 0}<span class="badge badge-xs ml-1">{historyLog.length}</span>{/if}
          </button>
        </div>

        {#if activeRightTab === 'positions'}
          {#if rows.length > 0}
            <div class="flex items-center gap-2 text-xs text-base-content/60 px-1 ml-auto">
              <span>Rows</span>
              <select class="select select-bordered select-xs w-24" bind:value={numRows} on:change={() => worker.postMessage({ type: "CALCULATE", numRows })}>
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
                          class="{chestCellClass(i, reward, row.isPastRng)} {!row.isPastRng && chestHighlight?.includes(1) && i === row.chestRewards.length - 1 ? 'border-r-4 border-cyan-400 dark:border-cyan-500' : ''}"
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

        {:else}
          <!-- History tab -->
          {#if historyLog.length > 0}
            <div class="overflow-y-auto md:max-h-[calc(100vh-10rem)] max-h-[50vh] flex flex-col gap-2">
              {#each historyLog as entry}
                <div class="card bg-base-200 p-3 flex flex-col gap-2">
                  <div class="flex items-center gap-2">
                    <span class="badge badge-sm {entry.action === 'heal' ? 'badge-primary' : 'badge-secondary'}">{entry.label}</span>
                    <span class="text-xs text-base-content/50">idx <strong class="text-base-content">{entry.rngIndex}</strong></span>
                    <span class="text-xs text-base-content/50">heal <strong class="text-base-content">{entry.heal}</strong></span>
                  </div>
                  <div class="flex flex-wrap gap-2">
                    {#each entry.chestRewards as reward, i}
                      <span class="text-xs {chestCellClass(i, reward, false)} px-2 py-0.5 rounded">
                        C{i + 1}: {reward.reward === 'Gil' ? `${reward.gilAmount} gil` : reward.reward}{reward.chestWillSpawn ? ' ✓' : ''}
                      </span>
                    {/each}
                  </div>
                </div>
              {/each}
            </div>
          {:else}
            <p class="text-xs text-base-content/40 px-1">No history yet. Begin tracking to see entries.</p>
          {/if}
        {/if}

      </div>

    </div>
</div>
