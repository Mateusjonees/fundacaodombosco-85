# Architecture rules

- Stock authorization uses `stock_user_access` plus `useStockAccess`; roles remain only the automatic director/stockkeeper override so UI and RLS share one source of truth.
- Attendance completion treats patient summaries and mirrored reports as complementary writes so a saved evolution never appears to fail because of a secondary permission error.