---
name: Kiosk form grids
description: Responsive layout guidance for dense kiosk forms that must fit without scrolling.
---

Use a flat grid with explicit landscape column widths when a dense kiosk form must fit in a 1024×768 viewport. Avoid combining nested grids with responsive `display: contents`.

**Why:** The nested approach collapsed city and phone columns in the rendered kiosk preview even though the generated classes compiled, causing overlapping labels and unreadable inputs.

**How to apply:** For compact landscape-only layouts, keep fields as direct children of one grid, preserve at least 44px control height, and verify full field values plus the action button at 1024×768.