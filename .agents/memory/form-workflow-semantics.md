---
name: Form workflow semantics
description: Approved consent and questionnaire behavior, including the demo-to-production persistence boundary.
---

Present consent forms one at a time and associate a separate drawn signature with each form. Treat questionnaires completed in the portal as review-only: show their answers, but never ask or submit them again at the kiosk.

**Why:** The approved source workflow supports multiple named forms per encounter, and the user confirmed this behavior should replace the prior combined consent and single questionnaire experience.

**How to apply:** Preserve form ordering and per-form identity across UI and server changes. The in-memory adapter may retain submissions only for its demo session; a production clinical-system adapter must durably deliver each form/signature association downstream.