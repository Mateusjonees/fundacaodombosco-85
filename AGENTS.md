# Architecture rules

- Stock authorization uses `stock_user_access` plus `useStockAccess`; roles remain only the automatic director/stockkeeper override so UI and RLS share one source of truth.