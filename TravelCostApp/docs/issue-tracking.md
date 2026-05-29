# Issue tracking

PRDs and issues for this project are tracked on **GitHub**, repo `HaDuve/TravelCostNative`, using the `gh` CLI.

- Create issues/PRDs with `gh issue create`.
- A fully specified, agent-ready PRD/issue gets the **`ready-for-agent`** label (no further triage needed).
- New incoming items that still need scoping get **`needs-triage`** (and `needs-info` when waiting on the reporter).

This is the issue tracker the PRD/triage/issue-splitting workflows should target.

## Label vocabulary

Type:

- `Bug` — something isn't working
- `Enhancement` — new feature or request
- `Documentation` — docs improvements
- `Feedback` — from testers/users we'd like to implement
- `Sales` — about app sales
- `Learning` — a skill to learn/sharpen
- `MetaIssue` — checklist containing other issues

Area:

- `Frontend` — features, UI, UX
- `Backend` — databases and other backend
- `Styling` — styles / UI specifically

Priority:

- `0 - ASAP` — currently working on this (highest)
- `1 - High Priority` — almost ASAP
- `2 - Medium Priority` — fast, but not ASAP
- `3 - Low priority` — can be delayed
- `Postponed` — last priority until everything else is done

Complexity:

- `A - Trivial` — very low effort
- `AA - Easy/Medium` — low, slightly difficult
- `AAA - Complex` — high effort, hard
- `AAAA - WTF` — no clue, needs lots of prep

Workflow / status:

- `ready-for-agent` — fully specified for an AFK agent
- `needs-triage` — awaiting maintainer triage
- `needs-info` — waiting on reporter
- `Depends` — depends on other issues
- `no-issue-activity` — stale
- `good first issue`, `help wanted`, `question`, `Duplicate`, `invalid`, `wontfix`
