## Performance Testing Guide (Startup + First 5 Minutes)

This guide is designed for **human testers** and **agentic evaluation** to collect consistent performance signals from the instrumentation added in:

- `util/performance.ts`
- `util/performance-report.ts`
- `util/performance-hooks.tsx`
- `App.tsx`, context providers in `store/`, and key screens (`RecentExpenses`, `OverviewScreen`)

The app will emit structured logs:

- **`[PERF]`**: timed async/sync function calls (group + name + duration)
- **`[FPS]`**: FPS samples (drops logged when < 55 FPS)
- **`[RENDER]`**: component re-render events and context-change reasons

At **5 minutes after app start**, it prints a **Performance Report** automatically.

---

## What You’ll Produce

- **Device + build info** (platform, model, OS, app build type)
- **A single 5-minute log capture** including:
  - startup sequence
  - first-screen load
  - 5-minute report output
- **A short “tester summary”** (template provided below)

---

## Preconditions

- Use a **real device** if possible (simulators can hide or exaggerate UI-thread issues).
- Prefer **Release-like** builds for final validation, but start with Dev Client for iteration.
- Ensure the console shows logs from the app (Metro terminal, Xcode console, or Logcat).

---

## Test Matrix (Pick One “Primary” First)

- **Platform**
  - iOS (latest OS available)
  - Android (mid-tier device recommended)
- **Data size**
  - Small trip (< 50 expenses)
  - Medium trip (100–300 expenses)
  - Large trip (500+ expenses) — most important for bottlenecks
- **Network condition**
  - Strong connection
  - Weak/unstable connection
  - Airplane mode (offline path)

---

## Test Run Protocol (Exact Steps)

### Step 1 — Clean Start

Do ONE of the following (pick the most realistic for your test case):

- **Cold start** (preferred):
  - Force quit the app completely
  - Wait ~5 seconds
  - Launch the app fresh
- **Warm start**:
  - Background the app
  - Re-open from app switcher

### Step 2 — Start Log Capture

Start capturing logs immediately **before launching** (cold start) or **before bringing app foreground** (warm start).

You should see:

- `[FPS] Started monitoring phase: startup`
- a stream of `[PERF] ...` logs for startup functions

### Step 3 — Let Startup Complete

Wait until the app becomes interactive and the initial screen is visible.

Expected early phases you may see (from `App.tsx`):

- `startup` (initial)
- `offline-setup` (if offline)
- `online-setup`
- `authentication`
- `ready`

### Step 4 — First 5 Minutes Script (Light but Consistent)

For 5 minutes, do this **light interaction script** to simulate real usage without turning it into a stress test:

1. **Minute 0–1**
   - Don’t touch the UI for 10 seconds (observe first paint / idle)
   - Navigate once between tabs (e.g., `RecentExpenses` → `Overview` → back)
2. **Minute 1–3**
   - Pull-to-refresh once (if applicable and not blocked by offline queue)
   - Open one modal and close it (e.g., ManageExpense, Settings) if accessible
3. **Minute 3–5**
   - Scroll a list for ~15 seconds
   - Toggle graph/list where available
   - Return to the “home” tab

Keep interactions simple; the goal is to correlate normal user actions with performance signals.

### Step 5 — Wait for Auto-Report

At **5 minutes**, the app prints:

`========== PERFORMANCE REPORT ==========` (and sections that follow)

Stop capturing logs **after** this prints.

---

## What to Look For in Logs (Heuristics)

### `[PERF]` (Function Bottlenecks)

Focus on:

- **Startup functions > 500ms** (likely user-visible startup delay)
- **Any function > 1000ms** (high suspicion of UI-thread blocking or heavy IO)
- **Frequent functions** that are “only” 50–150ms but called many times (death by a thousand cuts)

In this codebase, common suspects (by architecture) include:

- Startup sequence in `App.tsx` (`onRootMount` and its awaits)
- Polling/background work:
  - `sendOfflineQueue(...)` (called on intervals)
  - network speed checks
  - trip-context polling (every ~2s)
- Storage operations:
  - MMKV writes tied to `expensesState` changes

### `[FPS]` (UI Smoothness)

The instrumentation logs drops when **FPS < 55**:

- Occasional drops during navigation are normal.
- Repeated drops during idle or simple scrolling are a red flag.

Pay special attention if drops coincide with:

- `[PERF] ... background-polling.*`
- `[PERF] ... context-update.*`

### `[RENDER]` (Unnecessary Re-renders)

Red flags:

- The same component logs **many re-renders** with “parent re-render”
- Renders attributed to multiple contexts changing frequently

Expected higher churn components:

- `RecentExpenses` (depends on multiple contexts)
- `OverviewScreen` (depends on contexts + computed data)

---

## Output Template (Paste Into Issue/Task)

### Environment

- **Platform**: iOS / Android
- **Device**: (model)
- **OS**: (version)
- **Build**: Dev Client / Release-like
- **Trip size**: small / medium / large (approx #expenses)
- **Network**: strong / weak / offline

### Observed UX

- **Startup perceived time**: (fast / ok / slow + estimate)
- **Scroll smoothness**: (smooth / minor stutter / bad)
- **Any freezes**: (yes/no + what action)

### Key Log Findings

- **Top 5 `[PERF]` slowest** (copy exact lines)
- **Any `[PERF]` repeating often** (copy exact lines + approx count)
- **FPS**:
  - Any repeated `[FPS] ... (DROP)`? (yes/no + phases)
- **Renders**:
  - Any component spamming `[RENDER]`? (copy a small sample)

### Hypothesis (1–3 bullets)

Examples:

- “Background polling (network speed / offline queue) causes re-render cascades every 5s”
- “Expenses MMKV write on every change creates stutters during scrolling”
- “Startup awaits are serialized and block first paint”

---

## Agentic Evaluation Checklist (How We’ll Analyze Your Output)

When you provide logs, we’ll extract:

- **Startup critical path**
  - longest `startup.*` calls
  - whether they’re serialized and could be parallelized/deferred
- **Polling impact**
  - time cost + cadence (e.g., every 2s / 5s)
  - correlation with FPS drops
- **Re-render cascades**
  - which contexts drive most renders
  - whether context value stability/memoization is needed
- **Storage IO hotspots**
  - MMKV write frequency
  - expensive reads in render-time paths

---

## Notes / Known Constraints

- FPS measurement via `requestAnimationFrame` is an approximation. It’s still useful for **relative comparisons** and correlation with timed events.
- Dev builds can exaggerate render costs; confirm any major findings in a release-like build.

