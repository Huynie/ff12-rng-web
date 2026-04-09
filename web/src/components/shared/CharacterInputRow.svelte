<script lang="ts">
  import { Spells } from '../../core/types';
  import { SPELL_NAMES } from '../../core/Spell';

  export let label: string;
  export let level: number | '' = '';
  export let magic: number | '' = '';
  export let spell: Spells = Spells.Cure;
  export let serenity = false;
</script>

<div class="flex flex-col gap-1 w-full">
  <span class="text-xs font-semibold text-base-content/60 uppercase tracking-wide">{label}</span>

  <label class="flex items-center gap-2 text-sm">
    <span class="w-8 text-xs text-base-content/50">Lv</span>
    <input
      type="number"
      min="1"
      max="99"
      class="input input-bordered input-sm w-full"
      bind:value={level}
      placeholder="1"
    />
  </label>

  <label class="flex items-center gap-2 text-sm">
    <span class="w-8 text-xs text-base-content/50">Mag</span>
    <input
      type="number"
      min="0"
      max="99"
      class="input input-bordered input-sm w-full"
      bind:value={magic}
      placeholder="0"
    />
  </label>

  <select class="select select-bordered select-sm w-full" bind:value={spell}>
    {#each Object.values(Spells) as s}
      <option value={s}>{SPELL_NAMES[s]}</option>
    {/each}
  </select>

  <label class="flex items-center gap-2 cursor-pointer text-sm">
    <input type="checkbox" class="checkbox checkbox-sm" bind:checked={serenity} />
    <span class="text-xs">Serenity</span>
  </label>
</div>
