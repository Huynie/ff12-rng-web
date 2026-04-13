<script lang="ts">
    import { onMount, onDestroy, tick } from "svelte";
    import { PlatformType, Spells } from "../core/types";
    import CharacterInputRow from "./shared/CharacterInputRow.svelte";
    import HealInput from "./shared/HealInput.svelte";
    import ChestConfigPanel from "./chest/ChestConfigPanel.svelte";
    import AdvanceDirectionsPanel from "./chest/AdvanceDirectionsPanel.svelte";
    import ChestPositionsTable from "./chest/ChestPositionsTable.svelte";
    import ChestHistoryLog from "./chest/ChestHistoryLog.svelte";
    import {
        saveTabState,
        loadTabState,
        exportStateAsJson,
        importStateFromJson,
    } from "../utils/storage";
    import type {
        WorkerMessage,
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
    let healInputRef: { focusAndSelect: () => void } | undefined;
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

    type HistoryEntry = {
        action: 'heal' | 'attack';
        label: string;
        value: number; // heal value for 'heal', count for 'attack'
        rngIndex: number;
        heal: number;
        chestRewards: SerializedChestInstance['chestRewards'];
        advanceDirections: Array<{ advanceToAppear: number; advanceForItem: number }>;
    };
    let historyLog: HistoryEntry[] = [];
    let activeRightTab: 'positions' | 'history' = 'positions';
    let pendingHistoryEntry: { action: 'heal' | 'attack'; label: string; value: number } | null = null;

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
            historyLog: HistoryEntry[];
        }>("chest");
        if (saved?.chars) chars = saved.chars;
        if (saved?.chests) chests = saved.chests;
        if (saved?.historyLog) historyLog = saved.historyLog;
        initialized = true;

        if (historyLog.length > 0) {
            loading = true;
            // Replay is oldest-first, but historyLog is newest-first
            const replayLog = [...historyLog].reverse();
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
                    const first = replayLog[0];
                    worker.postMessage({ type: "FIND_FIRST", healValue: first.value, numRows });
                    step = 1;
                } else if (msg.type === "RESULT") {
                    if (step < replayLog.length) {
                        const entry = replayLog[step];
                        if (entry.action === 'heal') {
                            worker.postMessage({ type: "FIND_NEXT", healValue: entry.value, numRows });
                        } else {
                            worker.postMessage({ type: "CONSUME", count: entry.value, numRows });
                        }
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

    async function handleWorkerMessage(e: MessageEvent<WorkerMessage>) {
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
                        value: pendingHistoryEntry.value,
                        rngIndex: current.index,
                        heal: current.currentHeal,
                        chestRewards: current.chestRewards,
                        advanceDirections: [...advanceDirections],
                    }, ...historyLog].slice(0, 20);
                }
                pendingHistoryEntry = null;
            }

            await tick();
            healInputRef?.focusAndSelect();
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

    function onBegin() {
        if (!healValue) return;
        historyLog = [];
        pendingHistoryEntry = { action: 'heal', label: `Heal ${healValue}`, value: Number(healValue) };
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
        pendingHistoryEntry = { action: 'heal', label: `Heal ${healValue}`, value: Number(healValue) };
        errorMsg = "";
        loading = true;
        worker.postMessage({
            type: "FIND_NEXT",
            healValue: Number(healValue),
            numRows,
        });
    }

    function onConsume(e: CustomEvent<number>) {
        pendingHistoryEntry = { action: 'attack', label: `Attack ×${e.detail}`, value: e.detail };
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
        saveTabState("chest", { chars, chests, historyLog: [] });
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

    $: if (nextExpectedHeal !== null) canContinue = true;
    $: if (initialized) saveTabState("chest", { chars, chests, historyLog });
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

        <ChestConfigPanel bind:chests />

        <!-- Heal controls -->
        <div class="card bg-base-200 p-4">
          <HealInput
            bind:this={healInputRef}
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

        <AdvanceDirectionsPanel {advanceDirections} />

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
          <ChestPositionsTable
            {rows}
            {chests}
            bind:numRows
            on:numRowsChange={() => worker.postMessage({ type: "CALCULATE", numRows })}
          />
        {:else}
          <ChestHistoryLog {historyLog} {chests} />
        {/if}

      </div>

    </div>
</div>
