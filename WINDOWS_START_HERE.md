# WINDOWS — START HERE

This is the full Windows package for the Day 4 homework.

## 1. Extract the ZIP
Extract it to a normal folder. Do **not** upload the ZIP itself to GitHub.

## 2. Test locally
Install Node.js 20 LTS if needed, then double-click:

`1_SETUP_AND_TEST_WINDOWS.bat`

Wait for `BUILD PASSED`.

## 3. Supabase
Create a project, open SQL Editor, paste all of `schema.sql`, and run it.

In Vercel add exactly:
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Use the Supabase project URL like `https://xxxxx.supabase.co`, without `/rest/v1/`.

## 4. GitHub
Install Git for Windows if needed. Create an empty GitHub repo.
Double-click `2_UPLOAD_TO_GITHUB_WINDOWS.bat` and paste the repo URL.

The repo root must show:
```
pages/
package.json
schema.sql
README.md
```

## 5. Vercel
Import the GitHub repo as a Next.js project. Leave Root Directory at repository root.
Add all variables from `.env.example`, then redeploy.

## 6. Google Sheets
Create one spreadsheet with tabs exactly:
- Sales
- Expenses

Enable Google Sheets API, create a service account, share the sheet with that service-account email as Editor, and add these Vercel variables:
- `GOOGLE_SERVICE_ACCOUNT_EMAIL`
- `GOOGLE_PRIVATE_KEY`
- `GOOGLE_SHEETS_ID`
- `NEXT_PUBLIC_GOOGLE_SHEET_URL`

## 7. Telegram
Create a bot with BotFather and add:
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_WEBHOOK_SECRET`
- `NEXT_PUBLIC_TELEGRAM_BOT_URL`

Set webhook after deployment:
`https://api.telegram.org/bot<BOT_TOKEN>/setWebhook?url=https://<YOUR-VERCEL-DOMAIN>/api/telegram&secret_token=<YOUR_SECRET>`

## 8. Tests
Use the exact Test 1 and Test 2 data in `README.md`.
Final cumulative expected results:
- Project A: €2,050
- Project B: €2,180
- Company: €3,930
- Richard: €140
- Anastasia: €175
- Jean-Claude: €215
- S05 pending
- E07 awaiting allocation

## 9. Final check
Run `3_VERIFY_BEFORE_SUBMISSION.bat` and review `AGENT_AUDIT_CHECKLIST.md`.

Never commit real passwords, bot tokens, service-role keys, or Google private keys to GitHub.
