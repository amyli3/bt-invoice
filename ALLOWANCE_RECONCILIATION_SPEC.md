# Allowance ↔ Selection Reconciliation — Spec

## Problem

An allowance can now be invoiced from **two** places:

1. **Estimate wizard** — invoice the allowance's budgeted amount (a draw / deposit, possibly at a %).
2. **Selections wizard** (`SelectionsModalV5`) — invoice the *finalized selections* chosen against that allowance.

If a builder invoices the same allowance from **both**, a naïve invoice would double-bill
(allowance $5k **+** selections $6k = $11k for $6k of actual work). We need the two to
**reconcile, never add**.

## Core principle

> An allowance is a **budget placeholder**. The true cost is its **selections**.
> Everything invoiced against an allowance (estimate draws, deposits, prior true-ups) is
> "previously invoiced." Once selections finalize, the amount owed = **selections − previously
> invoiced**, and the client's **net lifetime charge for the allowance = the selections total.**

This is the same logic the selections wizard already applies internally via `billedUpfront`;
the spec generalizes it so it holds no matter *which* wizard invoiced the allowance.

## The math

Let:
- **A** = total already invoiced for the allowance (estimate draws + prior deposits/true-ups)
- **S** = finalized selections total for the allowance

**Amount to invoice now = S − A**

| Case | A (invoiced) | S (selections) | New line this invoice | Net lifetime |
|---|---|---|---|---|
| Over  | $5,000 | $6,000 | **+$1,000** (overage) | **$6,000** |
| Under | $5,000 | $4,000 | **−$1,000** (credit) | **$4,000** |
| Exact | $5,000 | $5,000 | **$0** (settled) | **$5,000** |

**Under-runs credit back** (your selection): the unspent $1k is returned, so the client nets to
the $4k actually spent — **not** kept as a standing allowance line.

> ⚠️ **Confirm:** your written example showed the under-run as `Allowance $1k + Selection $4k`
> (**$5k** total — keeps the remainder). That's the *opposite* of credit-back. The spec below
> assumes **credit-back → nets to $4k**. If you actually want "keep the remainder until the
> allowance is closed out," say so and I'll flip the Under row.

## Trigger: only reconcile once selections are finalized

A **partial draw against an allowance whose selections are still in progress is a deposit** — it
should stand on its own and **not** reconcile yet. Reconciliation (billing `S − A`) fires only
when the allowance's selections are **finalized / marked complete** (same gate the wizard uses
today via `isTrueable`). Until then, draws are just deposits.

## Two timing cases

### Same invoice (allowance draw + selections both added this invoice)
The allowance draw was never needed as a separate charge — the selections define the cost.
- **Reconciled display:** show the **selections at full (S)**; **drop the same-invoice allowance
  draw line.** Net = S.
- Over → `Selection $6,000`. Under → `Selection $4,000`. (No separate allowance line.)

### Cross invoice (allowance drawn on a prior invoice, selections this invoice)
The prior draw (A) is real and already billed, so this invoice reconciles against it.
- **Reconciled display:** `Selection $S` **+** an `Allowance — previously invoiced` credit line of
  **−A**. Net this invoice = **S − A** (a credit if S < A).
- This is exactly today's true-up reversal line, with A sourced from the prior draw.

## Matching key (the connective tissue)

To reconcile, the invoice must know that an estimate-allowance line and a set of selection lines
**belong to the same allowance**.

- **Preferred:** carry an explicit `allowanceId` on every allowance-derived line — the estimate
  draw line *and* each selection line — and group/reconcile by it.
- **Fallback:** match by cost code. **Fragile** — breaks on cross-code selections and when
  multiple allowances share a code. Not recommended as the primary key.

## Where the logic lives

A single **reconciliation pass at the invoice level**, run when lines are added (and on render):

1. Group all lines by `allowanceId`.
2. Per allowance, compute **A** (draw/deposit lines, incl. prior) and **S** (selection lines, only
   if finalized).
3. Emit reconciled lines per the timing cases above (drop same-invoice draws; emit a −A credit
   line for prior draws; selections at full).

Today this netting only happens *inside* the selections wizard because it privately tracks
`billedUpfront`. Moving it to the invoice level lets it work regardless of source wizard.

## Edge cases to handle

- **Cross-code selections** (allowance at code X, selections at Y/Z): reversal/credit sits at the
  allowance's code; selections at their own codes (existing behavior).
- **Multiple partial draws** across invoices: A = sum of all prior draws.
- **Over-draw then under-selection**: e.g. drew $5k, selections $4k → $1k credit (per credit-back).
- **Allowance never drawn, only selections**: A = 0 → bill selections at full (no reconciliation
  needed).
- **Selections not yet finalized**: no reconciliation; draws stand as deposits.

## Open questions

1. **Under-run treatment** — confirm credit-back vs. keep-remainder (see ⚠️ above).
2. **Does the estimate wizard tag its allowance lines with `allowanceId`?** If not, that's a
   prerequisite for reliable matching.
3. **Client-facing display of a credit** — as a negative line, or a labeled "Allowance credit" row?
4. **Same-invoice display** — drop the draw line entirely (proposed), or show it reduced to $0 for
   an audit trail?
