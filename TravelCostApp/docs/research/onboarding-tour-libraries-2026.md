# React Native in-app tour library alternatives (2026)

Research for wayfinder map [#335](https://github.com/HaDuve/TravelCostNative/issues/335), ticket [#338](https://github.com/HaDuve/TravelCostNative/issues/338).

**App context:** Expo 53, React Native 0.79.5, React Navigation v7 (bottom tabs + native stack — not Expo Router). Current library: `rn-tourguide` ^3.3.0.

## Current integration

| Area | Detail |
|------|--------|
| Provider | `TourGuideProvider` in `App.tsx` with custom tooltip (`Tourguide_Tooltip.tsx`) |
| Zones | 8 steps across `RecentExpenses` (zones 1–3, 8), `OverviewScreen` (4), `ProfileScreen` (5–7), `AddExpenseButton` (2) |
| Navigation | Manual `navigation.navigate(...)` in `ProfileScreen` `stepChange` handler — required because inactive tab screens unmount |
| Persistence | `loadTourConfig` / `saveStoppedTour` via secure store (`hadTour` key) |
| Trigger | `userCtx.needsTour`; auto-start after 1–3s delay when `canStart` |
| Coupling | `BlurPremium`, `ToastComponent`, `TripForm` gate on `needsTour` / `freshlyCreated` |
| Copy | i18n `walk1`–`walk8` — travel/nomad framing, predates home-first positioning |

## Evaluation criteria

1. **Maintenance** — last publish, open issues, New Architecture support
2. **Expo compatibility** — works in managed Expo / dev client without extra native modules
3. **Overlay UX** — spotlight shape, tooltip placement, animations, skip/finish
4. **Navigation across tabs** — first-class React Navigation v7 support vs manual hacks
5. **Accessibility** — screen reader, focus trap (most libraries are weak here)
6. **Bundle size** — dependency weight vs value

## Candidates

### 1. `rn-tourguide` 3.3.x (current)

| Criterion | Assessment |
|-----------|------------|
| Maintenance | **Poor.** npm last modified Oct 2024. Open New Architecture issues (#167). 65 open GitHub issues. OpenSSF scorecard: inactive. |
| Expo | Works today with `react-native-svg` (already installed). |
| Overlay UX | SVG mask + customizable tooltip. Known bugs: backdrop missing on step 1 (#160), dismissOnPress Android (#164), dimension mismatches (#158). |
| Multi-tab | **Manual only.** Long-standing issue #151; app already uses `stepChange` + `navigate` workaround. |
| A11y | No documented VoiceOver/TalkBack support; overlay blocks interaction by design. |
| Bundle | Moderate; pulls `react-native-svg` (already present). |

**Verdict:** Keep only if doing zero onboarding UX work. Technical debt grows on RN upgrades.

### 2. `react-native-ui-tour` 1.0.5 (fork of rn-tourguide)

| Criterion | Assessment |
|-----------|------------|
| Maintenance | **Active fork** (npm Jun 2026). Same `TourGuideProvider` / `TourGuideZone` API. |
| Expo | Same peer deps as rn-tourguide. |
| Overlay UX | Improved animations, safer refs, optional scroll support — same conceptual model. |
| Multi-tab | **Same limitation** — fork does not solve unmounted-screen refs. |
| A11y | Same as parent. |
| Bundle | Similar to rn-tourguide. |

**Verdict:** Lowest-effort swap if a spotlight tour is mandatory, but does not fix navigation fragility or strategic mismatch with expense-first onboarding.

### 3. `react-native-copilot` 3.3.3

| Criterion | Assessment |
|-----------|------------|
| Maintenance | **Stale** (npm Dec 2024). Maintainer acknowledges all steps must share a mounted parent (#119). |
| Multi-tab | **Unusable** for tabbed apps without per-screen copilot instances and custom “Next screen” glue. |
| Expo | Supported with `react-native-svg`. |

**Verdict:** Not suitable for this app’s tab navigator.

### 4. `@wrack/react-native-tour-guide` 1.0.1

| Criterion | Assessment |
|-----------|------------|
| Maintenance | Active (npm Jun 2026). ~1.2k weekly downloads. Claims New Architecture / Fabric ready. |
| Expo | Zero native dependencies beyond `react-native-svg`. |
| Overlay UX | Auto shape-matching spotlight, auto-scroll, themes, pulse animation, persistence hook. |
| Multi-tab | **No navigation adapter.** Steps target mounted elements; cross-tab would need custom navigation between steps (same class of problem as today). |
| A11y | Not documented. |
| Bundle | **< 50 KB** claimed. |

**Verdict:** Strong single-screen / few-step coach-mark library. Good if tour shrinks to 1–3 highlights on one screen.

### 5. `react-native-lumen` 1.1.6

| Criterion | Assessment |
|-----------|------------|
| Maintenance | **Most active** in set (npm Jul 2026). ~322 weekly downloads. RN 0.81 in dev deps. |
| Expo | Compatible; requires Reanimated, SVG, Gesture Handler, **worklets** — all already in TravelCostApp except verify `react-native-worklets` (Reanimated 3.19 may bundle this). |
| Overlay UX | Reanimated 3 animations, customizable renderers, morphing transitions, auto-scroll. |
| Multi-tab | **Pending-state model:** when next step’s `TourZone` is unmounted, overlay hides until user navigates and zone mounts. Does **not** auto-navigate tabs — still need programmatic tab switches or user-driven navigation. |
| A11y | Not documented. |
| Bundle | Heavier (Reanimated already paid for). |

**Verdict:** Best **full tour replacement** if keeping a multi-step spotlight flow. Migration cost: rewrite zones, rewire persistence, replace 6+ test mocks.

### 6. `react-native-quick-walkthrough` 0.7.0

| Criterion | Assessment |
|-----------|------------|
| Maintenance | Active (Jun 2026). RN ≥ 0.73, Expo SDK ≥ 50, New Architecture tested. |
| Multi-tab | **Expo Router adapter only.** README: “React Navigation adapter is not yet shipped.” |
| Navigation | Engine navigates routes automatically — ideal pattern, **wrong navigator for this app**. |

**Verdict:** Watch list if app ever moves to Expo Router; not viable today.

### 7. `react-native-tour-kit` 1.0.3

| Criterion | Assessment |
|-----------|------------|
| Maintenance | Very new (May 2026). ~11 weekly downloads, 0 dependents. |
| Multi-tab | Expo Router adapter only (same gap as quick-walkthrough). |

**Verdict:** Too immature and wrong navigation integration.

### 8. Lightweight custom hints (no library)

Patterns: contextual tooltips (`react-native-walkthrough-tooltip`), inline callouts, empty-state copy, one-time banner/toast, settings “Replay tips”.

| Criterion | Assessment |
|-----------|------------|
| Maintenance | App-owned; no upstream risk. |
| Multi-tab | Each hint is local to its screen — no cross-tab registry. |
| Overlay UX | Less polished than spotlight libraries; can match home-first “minimal interruption” goal. |
| A11y | Easier to keep hints as normal text/buttons. |
| Bundle | Smallest. |

**Verdict:** Best fit for **expense-first, minimal onboarding** where full tab tour may be removed anyway.

## Accessibility note

None of the surveyed libraries document VoiceOver/TalkBack behavior, focus management, or reduced-motion preferences. Any spotlight overlay is likely to be partially inaccessible. Prefer plain copy in empty states and standard buttons for critical first-run guidance.

## Recommendation

**Primary: remove the full guided tour** → replace with **lightweight contextual hints**.

| Reason | Detail |
|--------|--------|
| Product direction | Map destination is expense-first, minimal upfront choices. An auto-start 8-step tab-blocking tour conflicts with that. |
| Content | `walk1`–`walk8` are travel-centric and stale; redesigning steps is ticket [#340](https://github.com/HaDuve/TravelCostNative/issues/340) either way. |
| Technical | `rn-tourguide` is unmaintained; RN 0.81+ New Architecture reports are unresolved. |
| Navigation | No mature library offers **automatic React Navigation v7 tab tours** without manual glue. |
| Cost | Removing `TourGuideZone` usage, `stepChange` navigation, tooltip component, and tour-gating in `BlurPremium` / tests is simpler than migrating to another spotlight library for UX we may not want. |

**Suggested replacement pattern (for [#340](https://github.com/HaDuve/TravelCostNative/issues/340)):**

1. **First expense nudge** — inline callout or empty-state CTA on Recent Expenses (no overlay).
2. **Discover later** — feature discovery via empty states (Overview, My Budgets) and Settings → “Tips” / dev replay.
3. **Optional micro-tour** — if one spotlight moment is still wanted (e.g. “+” button only), use `@wrack/react-native-tour-guide` for 1–2 steps on a single screen.

**If product insists on keeping a multi-step spotlight tour:** replace with **`react-native-lumen`**, not `react-native-ui-tour`. Reanimated stack is already present; Lumen’s pending-state model matches tab unmounting better than rn-tourguide. Budget ~2–3 days for migration + test updates. Still requires explicit tab navigation between step groups.

**Do not adopt:** `react-native-copilot`, `react-native-tour-kit`, `react-native-quick-walkthrough` (until React Navigation adapter exists).

## Migration impact (if removing tour)

| File / area | Action |
|-------------|--------|
| `App.tsx` | Remove `TourGuideProvider` |
| `ProfileScreen.tsx` | Remove tour controller, `stepChange`, zones 5–7 |
| `RecentExpenses.tsx`, `OverviewScreen.tsx`, `AddExpenseButton.tsx` | Remove `TourGuideZone` wrappers |
| `Tourguide_Tooltip.tsx` | Delete or archive |
| `util/tourUtil.ts` | Repurpose or remove `hadTour` persistence |
| `BlurPremium.tsx`, `ToastComponent.tsx` | Decouple `needsTour` gating |
| `i18n/supportedLanguages.tsx` | Deprecate `walk1`–`walk8`, tour button labels |
| Tests | Remove `jest.mock("rn-tourguide")` from 6+ files |
| `package.json` | Remove `rn-tourguide` dependency |

## Sources

- [rn-tourguide GitHub](https://github.com/xcarpentier/rn-tourguide) — issues #151, #167, #160
- [react-native-ui-tour npm](https://www.npmjs.com/package/react-native-ui-tour) — v1.0.5, Jun 2026
- [@wrack/react-native-tour-guide npm](https://www.npmjs.com/package/@wrack/react-native-tour-guide)
- [react-native-lumen docs — multi-screen tours](https://thedev204.github.io/react-native-lumen/docs/guides/multi-screen-tours)
- [react-native-quick-walkthrough README](https://github.com/CarlosCaoLopez/react-native-quick-walkthrough) — Expo Router adapter; React Navigation adapter not shipped
- [react-native-copilot issue #119](https://github.com/mohebifar/react-native-copilot/issues/119) — multi-screen limitation
- npm registry metadata fetched 2026-07-27
