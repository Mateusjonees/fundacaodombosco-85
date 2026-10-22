# Architecture rules

- Stock authorization uses `stock_user_access` plus `useStockAccess`; roles remain only the automatic director/stockkeeper override so UI and RLS share one source of truth.
- Attendance completion treats patient summaries and mirrored reports as complementary writes so a saved evolution never appears to fail because of a secondary permission error.- The app never reloads the page automatically on new versions; it announces `app:update-available` and the user clicks Atualizar, because silent reloads erased in-progress clinical notes.
- AuthProvider keeps the `user` object reference stable across token refreshes and tab focus (only changes on real login/logout/USER_UPDATED), because dozens of effects depend on `[user]` and re-firing them made screens flicker and reset.
