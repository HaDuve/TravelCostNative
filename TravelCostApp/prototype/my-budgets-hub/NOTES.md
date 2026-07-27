# PROTOTYPE — My Budgets hub layout

**Question:** Where should **Join budget** and **Add another budget** live on Profile / My Budgets? Three structurally different layouts to compare before implementing onboarding #339.

**Wayfinder:** [First-run flow (#339)](https://github.com/HaDuve/TravelCostNative/issues/339) — decision **A** (My Budgets hub), pending layout validation.

## How to open

1. Set `DEVELOPER_MODE = true` in `confAppConstants.ts` (required — Settings hides Dev otherwise).
2. Run the app in dev (`pnpm start` from `TravelCostApp/`).
3. **Profile → Settings** → scroll to **DEVCONTENT** → **My Budgets hub prototype**.
4. Use the **bottom bar** to cycle variants (A / B / C).
5. Use **scenario chips** at the top to preview implicit-only, single named, and multi-budget states.

## Variants

| Key | Name | Idea |
|-----|------|------|
| **A** | Footer actions | Budget list first; Join + Add another in a fixed bottom bar |
| **B** | Action rows | Full-width action rows above the list |
| **C** | Compact header | Title + inline Join link + FAB-style add icon |

## Verdict

**B — Action rows** wins as-is (no hybrid).

Join + Add another as full-width rows above the list; budgets underneath under “Your budgets”. Feels smooth; discoverability of infrequent actions beats A’s footer and C’s compact header.

Delete this prototype folder when folded into ProfileScreen.
