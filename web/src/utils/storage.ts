// Persist and restore tab form state using localStorage.
// Each tab gets its own key. Values are JSON-serialized.

export function saveTabState(tab: string, state: unknown): void {
  try {
    localStorage.setItem(`ff12rng:${tab}`, JSON.stringify(state));
  } catch {
    // Storage unavailable — silently ignore
  }
}

export function loadTabState<T>(tab: string): T | null {
  try {
    const raw = localStorage.getItem(`ff12rng:${tab}`);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function exportStateAsJson(tab: string, state: unknown): void {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ff12rng-${tab}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importStateFromJson(): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) { reject(new Error('No file selected')); return; }
      const reader = new FileReader();
      reader.onload = () => {
        try {
          resolve(JSON.parse(reader.result as string));
        } catch {
          reject(new Error('Invalid JSON file'));
        }
      };
      reader.readAsText(file);
    };
    input.click();
  });
}
