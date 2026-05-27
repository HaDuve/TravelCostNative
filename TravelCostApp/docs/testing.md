# Testing Playbook

This document defines how we test TravelCostApp with Jest + React Native Testing Library.

## Domain language source of truth

- Use domain terms from `CONTEXT.md` in test names and assertions.
- Do not redefine glossary terms here.
- If language conflicts appear, update `CONTEXT.md` first, then adjust tests.

## Testing layers (v1)

- Unit tests for domain logic in `util/`.
- Component tests for key screens/components with React Native Testing Library.
- No E2E runner in v1.

## Test locations and naming

- Put tests in `__tests__/` by area (`util/`, `components/`, `screens/`).
- Name files by behavior, not implementation detail.
- Prefer names that include glossary terms:
  - `paid-back-status.test.ts`
  - `balance-simplification.test.ts`
  - `ranged-expense-deduplication.test.ts`

## Behavior-first test style

- Test public behavior, not private internals.
- For util tests: call exported functions directly.
- For component tests: assert user-visible states/interactions.
- Avoid brittle assertions tied to internal function calls.

## Mocking strategy

- No real network in tests.
- Mock Firebase/HTTP at boundaries.
- Mock native storage or device modules when needed (for example MMKV/device APIs).
- Prefer fixture data over deep mock chains.

## Fixture guidelines

- Reuse factories in `__tests__/fixtures/` (`makeExpense`, `renderWithAppProviders`).
- Build small reusable fixture factories (Trip, Expense, Traveller, User context).
- Keep defaults realistic and override only what matters for behavior.
- Use deterministic dates/currency values in tests.

## Determinism cookbook

Freeze time, dates, and exchange rates so money and period logic stay stable across locales and CI.

### Fake timers (Luxon / `Date.now`)

```typescript
beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date("2026-01-15T12:00:00.000Z"));
});

afterEach(() => {
  jest.useRealTimers();
});
```

### Fixed `Date` in fixtures

```typescript
import { makeExpense } from "../fixtures/expense";

const expense = makeExpense({
  date: new Date("2026-01-15T12:00:00.000Z"),
  startDate: new Date("2026-01-15T12:00:00.000Z"),
  endDate: new Date("2026-01-15T12:00:00.000Z"),
});
```

### Stubbed exchange rates

```typescript
jest.mock("../../util/currencyExchange", () => ({
  getRate: jest.fn(async () => 1),
}));
```

Use a fixed numeric rate when conversion behavior matters:

```typescript
import { getRate } from "../../util/currencyExchange";

(getRate as jest.Mock).mockResolvedValue(1.25);
```

- Avoid locale-dependent assertions unless the test is explicitly about locale output.

## TDD workflow

- Work in vertical slices:
  - RED: one failing behavior test
  - GREEN: minimal code to pass
  - REFACTOR: cleanup with tests green
- Start each new area with one tracer-bullet test.

## Baseline command and CI gate

- Local baseline: `pnpm test` (from `TravelCostApp/`)
- Serial runs (debugging order-dependent issues): `pnpm test --runInBand`
- Do **not** use `pnpm test -- --runInBand` — the extra `--` makes Jest treat `--runInBand` as a path pattern (`No tests found`).
- CI requirement: pull requests must pass `pnpm test` (see `.github/workflows/test.yml`)
- Package manager: [package-manager.md](./package-manager.md)

## Tracer-bullet examples

| Layer | Example file |
| ----- | ------------ |
| Util / domain | `__tests__/util/expense-range.test.ts` |
| Util / Split | `__tests__/util/equal-split.test.ts` |
| Util / Balance | `__tests__/util/balance-simplification.test.ts` |
| Component | `__tests__/components/expenses-summary.test.tsx` |
| Screen | `__tests__/screens/recent-expenses-screen.test.tsx` |
| Providers | `__tests__/fixtures/app-providers.tsx` |

## Target coverage (issue #227)

Bottom-tab screens: RecentExpenses, Overview, Financial, Profile, Finder. Key components: ExpensesSummary, Split Summary. Util: Splits, Balances, Settlement/Paid back, ranged dedup.
