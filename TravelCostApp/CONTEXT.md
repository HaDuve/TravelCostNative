# Travel Cost

Shared travel expense tracking for groups: one trip holds expenses, budgets, travellers, splits, balances, and settlements.

## Language

### People

**User**:
A person with a signed-in app account (authentication identity). Users can create trips, join trips, and hold trip history — but merely having an account does not put them on any trip roster.
_Avoid_: Account (in domain speech), member

**Traveller**:
A User who appears on a specific trip’s roster. Every Traveller is a User; joining or creating a trip is what makes someone a Traveller for that trip. A User who has not completed onboarding or has not joined a trip is not a Traveller.
_Avoid_: Member, participant, user (when you mean someone on the trip roster)

### Trips

**Trip**:
The shared container where a group tracks travel spending together — expenses, travellers, budgets, and splits all belong to one trip.
_Avoid_: Trip budget (as a noun for the container), journey, group ledger

**Active trip**:
The trip a User has selected for day-to-day use — adding expenses, viewing the ledger, and seeing trip-level summaries. A User may belong to many trips but only one is active at a time.
_Avoid_: Current trip (implementation alias only), open trip

**Trip history**:
All trips a User can open (shown as “My Trips”) — not only past trips; includes current and future-dated trips. One is the **Active trip**.
_Avoid_: History (alone — implies completed trips only)

### Expenses

**Expense**:
A recorded cost on a trip — amount, when it applies, category, who paid, and how it is shared among travellers.
_Avoid_: Transaction, entry, payment

**Ranged expense**:
An expense whose cost applies across a span of dates (e.g. monthly accommodation), as opposed to a single calendar day. A ranged expense is still an **Expense**; “ranged” names the multi-day shape.
_Avoid_: Long-term expense (UI copy only), grouped expenses (implementation grouping)

**Deleted expense**:
An expense removed from the trip — it no longer appears in the ledger, budgets, splits, or summaries. Users treat it as gone; it is not shown again unless restored (if that capability is added later).
_Avoid_: Removed expense, archived expense

**Special expense**:
An expense flagged to stay off budget charts and spending summaries when the viewer hides special expenses. It is still a normal **Expense** for **Splits** and **Balances** — included in split calculations and visible on split summaries like any other expense.
_Avoid_: Private expense, excluded expense

### Money flow

**Split**:
How an expense’s cost is divided among travellers on that expense (equal, exact amount, percent, or self).
_Avoid_: Share, expense split

**Balance**:
The net amount one traveller owes another on a trip, rolled up across expenses. Shown on the split summary and simplified views.
_Avoid_: Open split (UI copy), debt (marketing copy)

**Paid back**:
Per-expense status: the travellers’ shares for that expense have been reimbursed to whoever paid. Expenses not yet paid back still count toward open **Balances**. (Code field: `isPaid`.)
_Avoid_: Paid (ambiguous with who paid upfront), isPaid (implementation name)

**Who paid**:
The traveller who fronted the money for an expense (before **Splits** allocate shares among travellers). Distinct from **Paid back** (whether shares have been reimbursed).
_Avoid_: Payer, paid by (code field: `whoPaid`)

**Settlement**:
Trip-wide act of clearing **Balances** to zero — recording that everyone has been paid back. Marks eligible expenses as **Paid back** (via trip settlement timestamp). Distinct from marking a single expense paid back.
_Avoid_: Settle splits (UI copy only)

**Balance simplification**:
Reducing how many payments are needed between travellers while net **Balances** stay the same — a planning view, not **Settlement** (no money has changed hands).
_Avoid_: Simplify splits (UI copy), simplified splits

**Ranged split**:
Spreading a **Ranged expense**’s total cost across its date span (one portion per day).
_Avoid_: Split up (UI copy)

**Ranged duplicate**:
Repeating a **Ranged expense**’s full amount on each day in its date span (multiply per day), as opposed to **Ranged split**.
_Avoid_: Duplicate (alone — ambiguous), multiply (UI copy)

### Budget

**Budget**:
A spending target on a trip. Qualifiers name the shape: **total budget** (whole trip), **daily budget** (per calendar day), and **dynamic daily budget** (recalculated daily target — see below).
_Avoid_: Spending limit, trip budget (as the trip container)

**Total budget**:
The cap on cumulative spending for the entire trip. The trip is **over total budget** when cumulative spend exceeds this amount.
_Avoid_: Trip budget (ambiguous with the trip itself)

**Daily budget**:
The spending target for a single calendar day. The day is **over daily budget** only when that day’s spend exceeds that day’s daily target — not merely because cumulative spend is high.

**Dynamic daily budget**:
A mode where the daily budget target is recalculated from remaining total budget and remaining trip days (e.g. after €1,200 spent with €1,800 left over 20 days, the target becomes ~€90/day). When enabled, “over daily budget” uses the current recalculated target, not necessarily the original figure entered at trip setup.
_Avoid_: Automatic budget (vague)

### Currency

**Trip currency**:
The currency a traveller lives with at home — where their money comes from — used as the trip’s reference for budgets, totals, and balances. It is **not** the currency of the country being visited; expenses abroad may be logged in other currencies and understood in trip currency for rollups.
_Avoid_: Base currency (ambiguous), local currency, destination currency

**Expense currency**:
The currency in which an expense was entered (e.g. cash spent in Japan). May differ from **Trip currency**; the app converts for trip-level totals.
_Avoid_: Foreign currency (implies trip currency is always “foreign”)

## Flagged ambiguities

Places where English UI copy or code identifiers still diverge from domain language above. Prefer domain terms in new work; align i18n and labels incrementally.

| Surface | Current wording / field | Domain term | Notes |
| ------- | ----------------------- | ----------- | ----- |
| Trip setup (i18n) | ~~“Base Currency”~~ → home / Heimatwährung / domicile copy (#221) | **Trip currency** | Aligned in #221 for EN/DE/FR/RU trip-currency alerts, info modals, and TripForm change-currency confirm. |
| Expense / trip models | `isPaid`, `isPaidTimestamp` | **Paid back**, **Settlement** (trip-wide) | `isPaid` is per-expense paid-back status; trip `isPaid` + timestamp drive trip-wide **Settlement**. |
| Split Summary UI (i18n) | ~~“open splits”, “Calculate open splits”, “No open splits”~~ → balance copy (#222) | **Balance** | Aligned in #222 for EN/DE/FR/RU: balances wording, button helpers, Settlement vs Balance simplification labels. |
| Split Summary UI (i18n) | ~~“settle splits”, “Could not settle splits”~~ → Settlement copy (#222) | **Settlement** | Aligned in #222; trip-wide settle actions and toasts use Settlement language. |
| Split Summary UI (i18n) | ~~“simplify splits”, “Could not simplify splits”~~ → Balance simplification copy (#222) | **Balance simplification** | Aligned in #222; “Simplify splits” + helper clarifies no money has moved. |

## Example dialogue

**Dev:** Bob joined our Japan **Trip** — is he a **User** or a **Traveller**?  
**Expert:** He’s a **Traveller** on that trip. He was already a **User** once he signed in; joining made him a **Traveller**.

**Dev:** Alice logs ¥5,000 in Tokyo on a EUR **Trip**. What currency is what?  
**Expert:** ¥5,000 is **Expense currency**. EUR is **Trip currency** — her home money, not “Japan’s currency.” Totals and **Budget** use **Trip currency**.

**Dev:** €600 rent for March — **Ranged split** or **Ranged duplicate**?  
**Expert:** **Ranged split** — spread across days. **Ranged duplicate** would count €600 every day; we almost never want that for rent.

**Dev:** Alice paid dinner; Bob still owes her. **Settlement** or **Paid back**?  
**Expert:** Bob marks that expense **Paid back** when he reimburses her. **Settlement** is trip-wide when everyone’s square.

**Dev:** Split Summary shows fewer lines after “simplify” — did they pay?  
**Expert:** No — that’s **Balance simplification**, fewer payments needed. **Settlement** is when money actually moved.
