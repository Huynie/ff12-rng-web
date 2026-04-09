<script lang="ts">
  export let label: string;
  export let value: number;

  $: text = value < 0
    ? 'Not found in range'
    : value === 0
      ? 'Advance 0 times (current position)'
      : `Advance ${value} time${value === 1 ? '' : 's'}`;
</script>

<div class="flex items-center gap-2 text-sm">
  <span class="font-medium text-base-content/70 w-32 shrink-0">{label}</span>
  <span class="badge badge-outline">{text}</span>
</div>
