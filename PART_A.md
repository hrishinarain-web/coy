# Part A: Two core features Coy should have

> DRAFT: written from the assignment brief, before using the app. Walk through
> phone OTP, adding a crush, email verification, the invite link and the
> extra-slots screen at https://app.getcoy.com, then edit this so each feature
> is tied to something you actually hit.

## 1. A "reveal timing" / gentle-nudge flow for crushes who haven't joined

**What:** When someone adds a crush who isn't on Coy yet, let them send an anonymous, privacy-safe nudge ("Someone you know is on Coy") with a shareable invite, and show the sender a clear status (invited → joined → mutual). Reminders are capped and stop after the crush opts out.

**Why it's needed:** Coy's value only exists when *both* people are on it. A crush who isn't on the app makes the added crush a dead end, and the invite link is the only growth loop. Without a clear status and a nudge, users add a crush, see nothing happen and churn. It must also be built so the nudge never reveals who added whom, which is the core promise.

## 2. Safety and privacy controls: block, hide, and "undo" a crush

**What:** Let a user block specific phone numbers or contacts so they can never be added by or matched with them, and allow removing or undoing a crush within a short window (and afterwards, with the slot handling made clear). Include a one-tap report.

**Why it's needed:** Coy handles very sensitive information (who likes whom) tied to phone numbers. Users need control over their own exposure: an ex, a colleague, or a harasser should not be able to use the app against someone. Easy undo also reduces regret from adding the wrong person, which matters more when slots are limited and paid.

## Alternatives worth considering

- Notifications when a mutual match happens, so matches are not missed.
- Discover with the same mutual-only privacy model (Part B).
