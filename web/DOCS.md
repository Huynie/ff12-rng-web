# FF12 RNG Helper — Web App Documentation

A browser-based tool for Final Fantasy XII speedrunners and players who want to manipulate the game's pseudo-random number generator (PRNG). Works for both the PS2 original and the PS4 Zodiac Age remake.

---

## How it works

Final Fantasy XII uses a [Mersenne Twister](https://en.wikipedia.org/wiki/Mersenne_Twister) PRNG to determine outcomes for chest spawns, steal attempts, and rare monster encounters. The game initializes this sequence from a fixed seed (4537) on startup, meaning the entire sequence is deterministic and predictable once you know your position in it.

**Locating your position** is done by observing heal values. When a character casts Cure, Cura, Curaga, or Curaja, the game draws a value from the RNG sequence and uses it — along with the character's level, magic power, and spell — to calculate how much HP is restored. By entering one or more observed heal values, the tool searches backwards through the sequence to find where you currently are. Once located, it can predict every future value, letting you navigate to the exact position needed for your desired outcome.

### Platform differences

| Platform | Algorithm | Notes |
|---|---|---|
| PS2 | MT 1998 | Fixed seed (4537) at hardware boot |
| PS4 (Zodiac Age) | MT 2002 | Reseeds on app restart, not console restart |

---

## Character setup

All three tabs share the same character input panel. You can configure up to **3 characters**, each with:

| Field | Description |
|---|---|
| **Level** | Character's current level |
| **Magic** | Character's magic power stat |
| **Spell** | The cure spell being cast (Cure / Cura / Curaga / Curaja, with IZJS/TZA variants) |
| **Serenity** | Whether the character has the Serenity license equipped (boosts heal output) |

Characters with empty Level or Magic fields are ignored. You only need to fill in as many as you plan to use. For multi-character entry, cycle through all characters in order when entering heals.

---

## Common controls

Every tab uses the same heal input workflow:

### Phase 1 — Begin

Enter a heal value you just observed in-game and press **Begin** (or Enter). The tool searches the RNG sequence for a position that produces that heal value with your configured characters. This may take a moment — the search runs in a background Web Worker so the page stays responsive.

- **Rows** — how many future RNG positions to display in the results table (100–500).

### Phase 2 — Tracking

Once a position is found, the tool predicts your next heal value and enters it automatically. From here:

| Control | Description |
|---|---|
| **Next heal + Heal button** | Confirm the predicted value (or correct it if wrong) and advance one position |
| **Attack** | Advance the RNG by N positions without a heal. Use this when performing attacks, spells, or other RNG-consuming actions |
| **Reset** | Clear everything and start a new search |
| **Combo in N attack(s)** | How many attacks until the next combo proc. Useful when using punches to advance RNG, so you know when a coming attack will trigger a combo and disturb the count |

> **Tip:** RNG can be advanced quickly by using physical attacks (10 RNG per punch), staff hits (11), gunshots (8), or Fire (2). The Attack counter lets you skip ahead without entering every individual heal.

### Results table

The scrollable table shows upcoming RNG positions. Each row includes:

- **Index** — absolute position in the RNG sequence
- **Heal** — predicted heal value at that position
- **%** — the raw RNG value mod 100, used directly by many game mechanics (chest spawn checks, steal chances, etc.)
- Tab-specific columns (chest rewards, steal results, or monster spawns)

**Green rows** are past RNG positions (already consumed). Click any non-green row to toggle an amber highlight, useful for bookmarking a target position.

The **Rows** dropdown above the table recalculates and re-renders with a different row count without changing your current RNG position.

---

## Chest tab

Predicts what treasure chests will contain and when they will appear.

### Chest configuration

Configure up to **2 chests** simultaneously. Each chest requires:

| Field | Description |
|---|---|
| **RNG pos** | The index of the RNG value consumed after zoning that determines whether this chest spawns. Varies per chest and zone; must be determined through testing unless documented elsewhere |
| **Spawn %** | Probability (0–100) that the chest appears at all |
| **Gil %** | Probability (0–100) that the chest contains gil instead of an item |
| **Item 1 %** | If it's an item, the probability it's Item 1 vs Item 2 |
| **Gil amt** | Maximum gil amount (actual amount = 1 + RNG mod this value) |
| **Want Item 1** | Toggle on if you want Item 1; toggle off for Item 2. Used by the advance directions calculation |

> **IZJS/TZA chest data:** All chests have 50% Item 1 chance without the Diamond Armlet, and 95% with it.

### Results table columns

Each chest gets its own column showing the reward at that RNG position. **Bold text** means the chest will spawn at that position.

### Advance directions

Shows how many RNG positions you need to advance from your current position to hit the desired outcome for each chest:

- **N until spawn** — advance this many times to make the chest appear
- **N until item inside** — advance this many times so the chest contains your desired item (determined by the "Want Item 1" toggle)

If either value shows **Out of range**, no valid position was found within the displayed rows.

---

## Steal tab

Predicts steal outcomes at every RNG position.

Steal probabilities are fixed for all enemies (no configuration needed beyond characters):

| Steal type | Base chance | With Thief's Cuffs |
|---|---|---|
| Rare | 3% | 6% |
| Uncommon | 10% | 30% |
| Common | 55% | 80% |

### Results table columns

| Column | Description |
|---|---|
| **Normal steal** | Steal result without Thief's Cuffs (Rare / Uncommon / Common / None) |
| **Cuffs steal** | All steal tiers that would succeed with Thief's Cuffs equipped |
| **Lv99 Red Chocobo** | Whether this position satisfies the hidden condition for the level 99 Red Chocobo encounter |

### Steal directions

Shows:
- **Advance for rare steal** — positions until the next guaranteed rare steal
- **Advance for rare (Cuffs)** — positions until the next guaranteed rare steal with Thief's Cuffs

---

## Rare Game tab

Predicts when rare monsters will spawn.

### Monster configuration

Add up to multiple monsters (use **+ Add** / **✕** to manage). Each requires:

| Field | Description |
|---|---|
| **Min %** | Minimum spawn chance threshold (usually 0) |
| **Max %** | Maximum spawn chance — the listed probability for this rare game |
| **RNG pos** | RNG index consumed after zoning that determines this monster's spawn. For most rare game this is the last RNG consumed when zoning |

### Results table columns

| Column | Description |
|---|---|
| **Spawn %** | The raw spawn chance value at this position (4 decimal places) |
| **Raw RNG** | The underlying RNG integer |
| **M1, M2, ...** | A checkmark (✓) if the corresponding monster would spawn at this position |

### Spawn directions

Shows how many advances are needed to reach the next position where each configured monster spawns.

---

## Persistence

### Auto-save

All character inputs, chest/monster configuration, and the current heal history (last 4 values) are automatically saved to `localStorage`. On page refresh, the tool replays the saved heal history to restore your exact RNG position — no need to re-enter anything.

### Export / Import JSON

Use the **Export JSON** and **Import JSON** buttons (top right of each tab) to save and restore a full configuration snapshot as a `.json` file. Useful for sharing setups or backing up character/chest data between sessions.

---

## Tips

- If you cannot locate your position, something in the zone is consuming extra RNG (monster actions, NPC movement, character gambits). Try a cleaner zone or disable gambits.
- The **%** column is the most generally useful value — many game mechanics use `RNG mod 100` directly.
- The RNG position for a chest or rare monster can be determined experimentally: find your position, zone, cure again, and count how far down the list you moved. Rare game RNG position is usually that count minus one; chest position is usually one of the last values consumed during the zone transition.
