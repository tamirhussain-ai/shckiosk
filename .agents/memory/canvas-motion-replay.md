---
name: Canvas motion replay
description: How one-time motion variants should behave when previewed on the Canvas.
---

One-time animation mockups shown in Canvas frames should include an explicit, visible replay control.

**Why:** Selecting or focusing a Canvas frame does not reload its iframe. An arrival animation may already be finished before the user opens or compares the frame, making the variant appear static.

**How to apply:** For future motion comparisons, remount or otherwise restart the animated element from a labeled replay button inside every variant. Keep reduced-motion behavior intact and verify the animation is running immediately after the replay action.