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

- Build small reusable fixture factories (Trip, Expense, Traveller, User context).
- Keep defaults realistic and override only what matters for behavior.
- Use deterministic dates/currency values in tests.

## Determinism cookbook

- Freeze time when date behavior matters.
- Use fixed exchange-rate inputs in unit tests.
- Avoid locale-dependent assertions unless the test is explicitly about locale output.

## TDD workflow

- Work in vertical slices:
  - RED: one failing behavior test
  - GREEN: minimal code to pass
  - REFACTOR: cleanup with tests green
- Start each new area with one tracer-bullet test.

## Baseline command and CI gate

- Local baseline: `npm test`
- CI requirement: pull requests must pass `npm test`

