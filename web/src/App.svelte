<script lang="ts">
  import { PlatformType } from './core/types';
  import ChestTab from './components/ChestTab.svelte';
  import StealTab from './components/StealTab.svelte';
  import SpawnTab from './components/SpawnTab.svelte';

  type Tab = 'chest' | 'steal' | 'spawn';

  let activeTab: Tab = 'chest';
  let platform: PlatformType = PlatformType.Ps2;
</script>

<div class="min-h-screen bg-base-100">
  <div class="max-w-5xl mx-auto px-2 py-2 md:px-4 md:py-4">

    <!-- Header -->
    <div class="flex flex-wrap items-center justify-between gap-4 mb-4">
      <h1 class="text-xl font-bold">FF12 RNG Helper</h1>
      <label class="flex items-center gap-2 text-sm">
        <span class="text-base-content/70">Platform</span>
        <select class="select select-bordered select-sm" bind:value={platform}>
          <option value={PlatformType.Ps2}>PS2</option>
          <option value={PlatformType.Ps4}>PS4 (Zodiac Age)</option>
        </select>
      </label>
    </div>

    <!-- Tabs -->
    <div role="tablist" class="tabs tabs-bordered mb-4">
      <button
        role="tab"
        class="tab"
        class:tab-active={activeTab === 'chest'}
        on:click={() => (activeTab = 'chest')}
      >Chest</button>
      <button
        role="tab"
        class="tab"
        class:tab-active={activeTab === 'steal'}
        on:click={() => (activeTab = 'steal')}
      >Steal</button>
      <button
        role="tab"
        class="tab"
        class:tab-active={activeTab === 'spawn'}
        on:click={() => (activeTab = 'spawn')}
      >Rare Game</button>
    </div>

    <!-- Tab content -->
    {#if activeTab === 'chest'}
      <ChestTab {platform} />
    {:else if activeTab === 'steal'}
      <StealTab {platform} />
    {:else}
      <SpawnTab {platform} />
    {/if}

  </div>
</div>
