---
name: Kiosk API client sync
description: Non-obvious workflow requirement for keeping the IU kiosk client aligned with its OpenAPI content contract
---

After changing or merging kiosk content endpoints and schemas, regenerate the OpenAPI clients before frontend verification. A stale generated client can report missing hooks and fields even when the source contract and app code are correct, and Vite may briefly show missing generated-source errors during hot reload.

**Why:** The kiosk frontend imports generated client source directly, while generated output can lag behind merged API contract changes.

**How to apply:** Run the API-spec code generation workflow before frontend typecheck/build verification whenever the kiosk content API or related schemas change.