---
name: Check-in verification boundary
description: Why the demo omits the OTP screen while retaining server-side authorization and API compatibility.
---

The demo flow treats a successful University ID plus date-of-birth match, last-name plus date-of-birth match, or valid QR token as sufficient identification, so it must not show an additional OTP screen. Keep a server-side verified session state and retain the secure-code endpoint for backward compatibility.

**Why:** Removing the UI step must not also remove authorization checks or break existing API clients. A completion review identified that coupling as a serious access-control regression.

**How to apply:** Future changes may alter how a session becomes verified, but every protected stage must continue to require server-authorized session state. Do not restore the OTP UI unless the product requirement changes.