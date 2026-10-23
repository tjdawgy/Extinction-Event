# Unit micro controls (v2.12, branch `micro-controls`)

Built on the `micro-controls` branch from main at v2.11, tested on the phone, approved and merged into main as v2.12.

## What was built

- **Three tabs in the tray.** The old "Army" tab is now **Train**. The new **Army** tab sits beside Build and Train. Build and Train are stacked as before, and Army is one tall button to their right, so the tray is no taller.
- **The Army tab** shows only what you own:
  - **Group buttons**, each shown only while you own a unit in it: Infantry (Rifleman, Heavy, Sniper), Armor (Tank, Artillery, Titan) and Air (Gunship, Interceptor).
  - **A button for each unit type you own.**
  - Every button shows a count and that group's or type's current order.
  - Tap a button to select it, and tap it again to deselect.
  - The four order buttons (**Hold, Attack, Retreat, Regroup**) stay visible on the right while the buttons scroll.
  - A group or type disappears by itself when its last unit dies.
- **Selection highlight:** the selected units get a pulsing ring on the battlefield.
- **Regroup:** tap Regroup, then tap the battlefield.
  - The selected group or type goes there; with nothing selected, the whole army goes.
  - A flag with a dashed circle marks the spot. It disappears once every unit has arrived, or when a newer order replaces it.
  - After arriving, the units hold there until they get a new order. Each unit has its own spot around the flag, so they don't pile up on one point.
- **How orders combine:**
  - A global stance (top bar) applies to everyone and clears every group, type and Regroup order.
  - A group or type order overrides the global stance for its units.
  - If a unit is covered by both a group order and a type order, the most recent one wins.
  - Newly trained units follow the newest order that covers their type, otherwise the global stance.
- **The AI** uses the same orders under the same rules, but only for one small thing so far. On Normal and Hard it pulls its Artillery back to the rally flag when enemy ground units it can see come within 160 of them. It releases them 6 s after the danger is gone. Easy does nothing.
- **Saves:** format v12 keeps group and type orders, the selection and Regroup flags. Older saves load with no group orders.
- **Match report:** your orders appear in the timeline, e.g. "Order: Armor regroup". The AI's automatic Artillery pull-backs are counted instead of listed ("Artillery pulled back N times" under Enemy behavior), so they don't flood the timeline.

## Design decisions I made

1. **Tab layout:** Build and Train are stacked, as Build and Army were, so they keep the same button size. Army is one tall button beside them. This was the only way to fit three tabs without making the tray taller or the buttons tiny. Cards lose about 50 px of width, and they scroll as before.
2. **The order buttons never scroll away.** Hold, Attack, Retreat and Regroup sit in a fixed 2×2 block on the right, each about 64×32 px, and the group and type buttons scroll to their left.
3. **With nothing selected,** Hold, Attack and Retreat in the Army tab work exactly like the top bar: everyone, and all group orders cleared. Regroup with nothing selected sends the whole army.
4. **Precedence uses a counter, not a clock,** so "most recent" is exact even for two orders given in the same instant.
5. **A whole-army Regroup is the newest order of all at that moment.** A later group or type order still overrides it for its own units.
6. **Regroup is an attack-move:** units fight enemies in range on the way, as they do under every stance except Retreat. They aren't forced to walk past enemies.
7. **When the flag is done:** every unit following that order is within 14 of its own spot. A unit stuck in a fight keeps the flag up. Air units count too.
8. **Regroup can target fogged ground.** Walking there reveals only what your units then actually see. The target only has to be on the battlefield.
9. **No orders during GET READY or after the match.** Orders are also blocked while paused, and selecting is blocked while paused. Starting an ability's targeting cancels Regroup targeting, and the other way round.
10. **The top-bar stance buttons behave as before during GET READY.** Only the new Army-tab orders are blocked, so existing behavior doesn't change.
11. **The AI's micro is deliberately minimal** (the Artillery pull-back only), as asked. Full AI use of the controls is left for later.

## Test results

- **`npm test`:** 127 of 127 pass, including the fingerprint, re-recorded on purpose for the AI's Artillery pull-back.
- **New `tests/micro.test.js`** (7 tests):
  - Type and group orders move only their units.
  - The most recent order wins.
  - The global stance clears all orders.
  - Newly trained units follow type, then group, then global.
  - Regroup: arrival, the flag being done, units holding there, replacement, the whole army.
  - GET READY and game-over blocking, and invalid targets refused.
  - Save and resume mid-Regroup, and v11 migration.
  - Orders in the match log, and the AI's pull-back and release.
- **New `tests/micro-ui.test.js`** (5 tests, headless Chromium):
  - The three tabs.
  - Only owned groups and types listed, with counts, and a group disappearing when its last unit dies.
  - Select and order by tapping, and the selection rings.
  - Regroup by tapping the battlefield.
  - Blocking while paused and during GET READY.
  - The top bar clearing group orders.
  - Orders kept across a page reload.
  - **At 858×396 and 667×375:** every Army-tab button is at least 50×28 px, inside the tray (the tray is no taller than 80 px), with no overlap with the ability buttons, building panel, info panel or top bar.

## Ladder check (20 matches per row, v2.12 against v2.11)

| Row | v2.11 | v2.12 |
|---|---|---|
| AI Easy vs Normal | 0–20 | 0–20 |
| AI Normal vs Hard | 7–13 | 8–12 |
| AI Easy vs Hard | 0–20 | 1–19 |
| Calibrated rush vs Normal | 6–14 | 4–16 |
| Calibrated rush vs Hard | 1–19 | 1–19 |
| Turtle bot vs Normal | 1–19 | 1–19 |
| Eco bot vs Normal | 8–12 | 5–15 |
| Eco bot vs Hard | 4–16 | 8–12 |

Zero timeouts in every row, and Easy < Normal < Hard holds. Every change is within normal 20-match noise (about ±4).

## Performance (large battle with abilities, three alternating runs each, v2.11 against v2.12)

| CPU | v2.11 script / frame | v2.12 script / frame |
|---|---|---|
| 1× | 2.41 / 21.6 ms | 2.40 / 21.5 ms |
| 4× | 18.05 / 114.2 ms | 18.73 / 116.0 ms |
| 6× | 28.99 / 179.5 ms | 28.97 / 180.3 ms |

1× and 6× are equal. 4× is about 4% higher in script time (+1.6% in frame time). The runs at 1× and 6× show no matching rise, so I read it as noise, but I'm reporting it.

Memory over 15 game minutes, run back to back:

| Version | Heap after GC (1 / 5 / 10 / 15 min) | DOM nodes at 15 min |
|---|---|---|
| v2.11 (main) | 3.43 / 3.99 / 4.24 / 4.40 MB | 462 |
| v2.12 | 3.47 / 4.00 / 4.08 / 4.41 MB | 455 |

Equal: no memory growth from the micro controls.

## Screenshots (`docs/screenshots`)

- `micro-sheet-858x396.png`, `micro-sheet-667x375.png`: the whole sequence. Train tab, Army tab, Armor selected, Regroup targeting, Armor on the way with the flag, arrived (flag gone), a Riflemen-only Attack, and ability targeting with the Army tab open.
- `micro-army-tab-*`, `micro-selected-*`, `micro-regroup-*`, `micro-layout-abilities-*`: single frames at both sizes.

The "37/12" army count in the screenshots comes from the test setup, which spawns units directly. It isn't a game bug.

## What to try on your phone

1. **Train some Riflemen and a couple of Tanks, then open the Army tab.** Only Infantry, Armor and the two types should appear, with counts.
2. **Tap Armor:** your Tanks get rings on the battlefield. Tap **Attack**: only the Tanks advance, and the Riflemen keep holding.
3. **Tap Infantry, then Regroup, then a spot near a field node:** a flag appears, the Riflemen walk there, and the flag vanishes when they've all arrived. They then hold the node.
4. **Tap Attack in the top bar:** everyone attacks, and every button's order label goes back to the global stance.
5. **Train a new Tank while Armor has an order:** it follows the Armor order.
6. **Pause mid-Regroup, close the page, reopen and resume:** the flag and orders are still there.
7. **Check the button sizes and that nothing covers the ability buttons,** with the building panel open (tap a building) and with the long-press info open.

**How to open this branch's version** (main stays at v2.11):

- **Easiest:** open the private artifact https://claude.ai/artifact/L7Z2yrHMaLRrVdRheheRnB. It's this branch's `index.html` (v2.12), published as-is, and the title screen shows v2.12. Its saves are kept separately from your main version's.
- Or on GitHub: open `index.html` on the `micro-controls` branch, tap "Raw", and load it the way you normally load the game.
