---
name: Form workflow semantics
description: Approved consent and questionnaire behavior, including the demo-to-production persistence boundary.
---

Present consent forms one at a time and associate a separate drawn signature with each form. Treat questionnaires completed in the portal as review-only: show their answers, but never ask or submit them again at the kiosk.

Derive Consent and Questions visibility from the selected encounter’s returned collections. Omit Consent when no unsigned form remains, omit Questions only when no questionnaires are linked, and finalize from Coverage when neither stage has work. Preserve encounter-returned signed and portal-completed statuses when upstream fields are resaved.

**Why:** The approved source workflow supports multiple named forms per encounter, and annual consents or portal questionnaires may already be satisfied. Resetting those statuses or rendering empty stages would ask students to repeat clinical-system work.

**How to apply:** Preserve form ordering and per-form identity across UI and server changes. Permit questionnaire submission after Coverage only when no unsigned consent remains. The in-memory adapter may retain submissions only for its demo session; a production clinical-system adapter must durably deliver each form/signature association downstream.