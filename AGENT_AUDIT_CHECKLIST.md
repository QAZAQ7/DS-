# Independent Agent Audit Checklist

Audit this project against the original Day 4 assignment.

Confirm:
1. Supabase is the source of truth.
2. Website and Telegram share the same financial rules.
3. S01 and E01 can be entered through the real Telegram bot.
4. Role permissions are enforced server-side.
5. Pending sales do not affect income or commission.
6. Commission pool is exactly 10%.
7. Split must total 100%.
8. Rounding difference goes to the largest share; tie priority Richard, Anastasia, Jean-Claude.
9. Expenses reduce company result immediately.
10. A/B expenses await allocation; overhead auto-allocates.
11. Approval does not deduct expense twice.
12. Original proposals and final decisions are preserved.
13. Duplicate references are rejected.
14. Re-approval is idempotent.
15. Google Sheets has Sales and Expenses tabs.
16. Later decisions update the existing row by reference.
17. Failed Sheets sync is visible and retryable.
18. Failed Telegram notification is visible and retryable.
19. Notification uses original submitting Telegram chat.
20. Test 1 totals: A 700, B 1800, company 2400; commissions 90/110/100.
21. Test 2 cumulative totals: A 2050, B 2180, company 3930; commissions 140/175/215.
22. S05 stays pending.
23. E07 stays awaiting allocation.
24. Final Vercel page contains student name and required links.
25. No secrets are committed to GitHub.
