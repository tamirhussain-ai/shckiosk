---
name: GitHub project publishing
description: Reliable authentication and transfer approach for full-repository GitHub synchronization from Replit.
---

For full-repository synchronization, use native Git transfer with temporary repository-scoped authentication and remove that authentication immediately afterward. Do not use hundreds of connector blob or contents requests for a workspace snapshot.

**Why:** GitHub rejects low-level blob creation before an empty repository has an initial commit, and high-volume connector uploads can trigger Replit request limits or GitHub Cloudflare blocking even with client-side throttling.

**How to apply:** Use the connector API for repository inspection and narrowly scoped setup or cleanup. Transfer the actual Git history through Git, verify the remote branch matches the local commit, and remove temporary repository credentials after the push.