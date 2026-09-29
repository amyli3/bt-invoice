# Payment on proposals: design rationale

**Author:** Amy Li
**Date:** 2026-08-26
**Prototype surface:** Proposal page, Payment section ("Request payment upon approval") and the payment schedule it seeds

---

## 1. The design in one paragraph

The builder sets payment terms and a payment schedule on the proposal, and optionally checks
"Request payment upon approval." That first payment is not an extra charge on top of the schedule.
It *is* draw 1. When the client approves the proposal, Buildertrend carries the agreed number
forward into the first invoice instead of making someone re-key it on the job.

## 2. The problem this solves

The payment plan already exists in the proposal today. It exists as text, so the builder rebuilds it
by hand as invoices after the client signs.

The clearest description of the current state comes from Kayla Rodriguez (2026-06-30). Her
salesperson pre-populates a draw schedule inside the proposal, and then:

> "Once the customer signs the proposal, I will go in, I will lock the estimate and then I will
> create all the scheduled draws... I will open up that PDF proposal, I will scroll all the way down
> till I find the draw schedule that he's pre-populated for the customer to follow. And then I will
> start by making the invoices, invoice number one deposit... and I will copy and paste the verbiage
> that he's put in those line items."

Ten draws, saved as drafts. And on the first one:

> "The only one that will be released upon converting the lead to a job is gonna be the deposit."

So the trigger is proposal approval, the deposit is draw 1, and the handoff between the two documents
is a human reading a PDF and retyping it.

## 3. Key reframe: deposits already exist, disconnected

This is not a request for a new way to take money. Buildertrend already has a Deposit tab in a job's
Financial section, with deposit requests, due dates, and QuickBooks sync. Builders use it and like it:

> "The deposit feature is so nice to use in Buildertrend, but..." (Erin Coole, 2026-07-08, on QBO
> account mapping)

The gap is upstream of it. The amount is agreed in the proposal; the deposit object lives on the job;
nothing carries the number across. The design connects two things that already exist.

## 4. Evidence: proposal approval is the payment trigger

### 2026 (EnjoyHQ)

| Source | Date | What they said |
|---|---|---|
| Zane Bennett, Established GC, $2 to 4.99M | 07-10 | "The start of a project for us is when they sign the builder contract as then we can **request a deposit (another thing not handled well by BT)** and start a schedule of the job." Tagged to Lead Proposals. |
| Kayla Rodriguez | 06-30 | Creates all 10 draws by copy-paste from the signed proposal PDF; releases only the deposit at lead-to-job conversion. |
| Chuck Regan | 06-17 | Named payment schedule templates chosen while writing the contract: "We take 50% down as a deposit and then 50% upon delivery... you would select Schedule A... It would load onto the contract. And then once that contract is signed and enters our production pipeline..." |
| David Lipsky | 06-25 | Design retainer invoiced at 100% first, then "when they approve the big project, I invoice 25% of the labor as a deposit." |
| Alex Dorfman | 08-12 | 50/50 under $100k, 10-15-15-60 over. Deposit is a percent of contract price, pulled from Buildertrend. |
| Michael Hill | 06-23 | Collects a 50% deposit; currently at risk of double-billing between allowances and approved selections. |
| Vik Terala | 02-12 | 5% deposit taken at quick-quote signoff, then "we go into our contract proposal." |
| Lincoln Alexander (in-app) | 05-24 | "Ability to **automate sending deposit link after estimate is approved**." |
| Adam Peters | 04-27 | Will not book subs until "I've got a deposit from this person." |
| Ryan Schwarz | 07-06 | Design deposit to get drafting started. |
| Lauren Farris, Renew Design and Build (in-app) | 07-07 | Collects a deposit to start design work, balance when design completes, which can take up to a year. Wants an option for no terms / no due date so it does not read as overdue. |

### 2025 fixed-price and draw-schedule research (local Confluence exports)

| Participant | What they said |
|---|---|
| Jasmine Robinson | "Material deposit collected upon proposal approval (a portion of the contract price. Used towards job.)" $100k job, $10k deposit, remaining $90k across draws. Also: "Thinks attaching draw schedule to proposal would save time." |
| Jared Glick | 33% at signing. "Schedule / draws aren't created until proposal signing." |
| Shawn Welland | 50 / 20 / 20 / 10. "Clients are aware of the payment structure from the proposal signing." Hand-created all four invoices upfront so the client could see the structure in the portal. |
| Sue Craft | "Draw 1 - Deposit: 25% of project." |
| Misty Boston | Deposit plus a 10% mobilization fee, deliberately set up as a deposit invoice because homeowners will not be billed for unstarted work. |
| Paul Plourde | "Excited to see that automated upon proposal signing." Follow-up logged to automate invoice release off contract signing. |

## 5. Design decisions and the evidence behind each

**The deposit owns draw 1 rather than sitting beside it.**
Jasmine's deposit is a portion of the contract price used toward the job. Sue's draw 1 *is* the
deposit. Jared's 33% at signing is the first of 33/33/34. Kayla's "invoice number one deposit."
Treating them as two payments would overstate what the client owes.

**Percent of contract price is a valid default on a build proposal.**
By build-proposal time the contract price exists, and builders state the deposit as a percent of it:
50% (Shawn, Alex, Michael), 25% (Sue, David Lipsky's labor deposit), 33% (Jared), 10% (Alex over
$100k, Jasmine's material deposit), 5% (Vik).

**Generate and release on approval, not send-alongside.**
Two reasons. First, the job may not exist yet: Andrea Weig's job is created and the schedule attached
once the build contract is signed, and Kayla releases the deposit "upon converting the lead to a job."
An invoice sent with the proposal has nowhere to live. Second, Jared Glick hand-adds sales tax and
custom description per invoice and explicitly does not want invoices created before he is ready to
send. He asked for a notification to review. So approval should stage the invoice and tell the
builder. Unattended auto-send should be a choice, not the only path.

**Payment terms are job level, not per document.**
Every invoice the job sends inherits the due-date rule from here. Sue Craft called out payment terms
plus invoice date as the thing that would replace her manual due-date math.

**Payment schedule templates are a real ask, not a nice-to-have.**
Chuck Regan already runs named schedules ("Schedule A") selected at contract-writing time. Ryan
Courech uses identical draw milestones on every job. Andrea Weig applies a standard template and
hand-types the numbers into it.

## 6. Two requirements this data adds

**Deposit belongs to the proposal, not the lead.**
Filed as High Priority via Claire Wigler (04-11) and written up by Amy Ross (04-14): remodeling leads
carry multiple scopes, "clients frequently want to accept multiple proposals at once," and
**"deposits are collected per scope."** Buildertrend allows one accepted proposal per lead, so builders
fake it with three leads named Smith Kitchen, Smith Bathroom, Smith Addition, which then corrupts job
costing and time-clock allocation. If the deposit is a property of the proposal rather than the lead,
this ask is satisfied by the same model.

**The deposit nets against the original contract only.**
Kimberly Handler (04-01): "We request a deposit from the client that is applied pro-rata to the
ORIGINAL job only. **It is NOT applied to change orders.**" This constrains how the deposit reduces
remaining-to-bill, and pairs with the existing rule that only released invoices reduce what is left
to bill.

## 7. Out of scope, deliberately

Lead-stage money is a different object and is not served by this design. It is a design or
pre-construction fee: non-refundable, usually outside the contract price, and often quoted before a
contract price exists at all.

- Chad White: pre-construction agreement signed during the pre-sale job, charges a pre-construction
  cost if signed ($1,500 on a job where $10,000 had already been collected).
- Jasmine Robinson: "Payment 1: Design agreement requested at the beginning of job. Fee.
  Non-refundable," separate from her material deposit.
- Ryan Knibbe: separate contract for the design fee. "Request a deposit. If customer moves forward,
  it's applied to the job. If they don't move forward with job its a fee taken by builder."
- Andrea Weig: non-refundable deposit to create a plan or quote, and on the pre-sale job, "won't have
  contract price yet because they need to send out quotes. Only have TBD price."

If this control is ever placed on a lead proposal it needs different behavior: flat fee only, since
there is no contract price to take a percent of; and it must not net against remaining-to-bill unless
the builder says it applies to the contract. Ryan Knibbe's "applied to the job if they move forward,
kept as a fee if not" is exactly that toggle.

## 8. Disconfirming evidence and risks

- **Andrea Weig takes no money at proposal signing.** Her $10,000 lands at the pre-con meeting
  instead. The control must stay optional.
- **Hilda Garcia's company ignores the proposal's payment terms** and invoices at owner discretion
  based on payroll needs. Structure set at proposal time will be overridden by some builders.
- **Jared Glick does not want invoices generated before he is ready to send them**, for clutter and
  staleness reasons. Review-then-send, not fire-and-forget.
- **A percent default is not universally safe.** David Huck: "Cali law doesn't allow deposits."
  Percent-of-contract deposits face statutory caps in some states, so the flat option is not just a
  convenience.
- **Existing deposit friction may follow the number downstream.** Andre Ruegg: "The Deposit tab and
  function does not appear." Sarah Gracida (support): requesting a deposit requires a due date that
  is not marked mandatory. Gisele Nedeau: deleting a payment destroys the whole deposit request,
  notes and title lost. Lisa Fratepietro: cannot backdate or edit a deposit once out of draft.
  Erin Coole: deposits cannot be directed to the right QBO account. Connecting the proposal to a
  deposit object with these problems inherits them.

## 9. Open question to resolve before this ships as a proposal

David Huck (05-12), on a proposal that failed to capture a signature, wrote: "I'm not sure why
C409 - Vicente Garage was **able to pay the deposit but not able to sign**." That may mean proposals
can already collect a deposit payment today. If so the framing changes from "add payment to
proposals" to "connect the proposal's agreed amount to the deposit that already exists." Worth
confirming in code before presenting.

## 10. Coordination

There is an active EnjoyHQ project named **"Deposit Discovery and Release Feedback"** (plus an older
"2024Q1 - Deposits Feedback"). The active one is collecting Zane Bennett, Alex Dorfman, Demetri
Milles, Billy Anderson, Harley Goedhart, and Ryan Schwarz. Someone is running deposit discovery in
parallel. Find the owner before this becomes two overlapping proposals.

## 11. Method and limits

- **EnjoyHQ:** documents from 2026-01-01 to 2026-08-13, keyword `deposit`. 141 of 13,906 documents
  matched. Every deposit mention in those 141 was read in context; the ones cited are those where
  the surrounding text also referenced a proposal, signing, or approval. Sources include recorded
  interviews, in-app product feedback, Salesforce cases, and product-idea emails.
- **Not searched:** 2025 and earlier in EnjoyHQ, and any keyword other than `deposit`. Additional
  supporting evidence very likely exists under terms like retainer, down payment, or draw 1.
- **2025 research:** local Confluence exports under
  `OneDrive/Desktop/Frictionless invoicing/` (Fixed price interviews, Link draw schedule research,
  Openbook interviews, Client visibility). Dates are Mar to May 2025, roughly 15 months stale.
  Confirm each participant is still a customer before recruiting.
- **Not verified in code:** the current shipped behavior of proposals and the Deposit tab. Statements
  about today's flow describe what builders report, not a verified click path.
