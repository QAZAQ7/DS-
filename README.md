# Friends Included Ltd — FINAL BEST VERSION

This is the compact full version for the Day 4 homework.

## Folder structure
Only one main folder is visible:
- `pages`
  - `index.tsx`
  - `api/index.ts`
  - `api/telegram.ts`

Everything else is a normal root file.

## What is implemented
- Vercel / Next.js website
- Supabase as source of truth
- demonstration role selector
- server-side permissions
- sales and expense forms
- pending sales excluded from income
- commission pool = 10%
- commission split validation
- rounding rule
- manager approval/correction
- original proposal + final decision stored separately
- company overhead auto allocation
- awaiting project allocation logic
- duplicate-reference protection
- zero/missing amount rejection
- idempotent approvals
- project and company dashboards
- salesperson / Kevin own-record visibility
- manager all-record visibility
- Telegram user linking
- real Telegram webhook submissions
- original Telegram chat retained on each submission
- approval/allocation notifications
- Google Sheets Sales + Expenses sync
- row UPDATE by reference, not duplicate append
- sync status and retry
- Telegram notification status and retry
- submission links on Vercel page

## 1. GitHub
Upload the CONTENTS of this ZIP directly into the root of your GitHub repository.

You should immediately see:
- `package.json`
- `schema.sql`
- `README.md`
- `pages`

Do not create another outer project folder.

## 2. Supabase
Create a Supabase project.
Open SQL Editor.
Paste and run all of `schema.sql`.

Then copy:
- Project URL -> `NEXT_PUBLIC_SUPABASE_URL`
- service_role key -> `SUPABASE_SERVICE_ROLE_KEY`

## 3. Google Sheets
Create one spreadsheet with exactly two tabs:
- Sales
- Expenses

Create a Google Cloud service account.
Enable Google Sheets API.
Share the spreadsheet with the service-account email as Editor.

Add:
- `GOOGLE_SERVICE_ACCOUNT_EMAIL`
- `GOOGLE_PRIVATE_KEY`
- `GOOGLE_SHEETS_ID`

The application creates/updates rows automatically.

## 4. Telegram
Create a bot with BotFather.

Add:
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_WEBHOOK_SECRET`

After Vercel deployment set webhook:

`https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook?url=https://YOUR-VERCEL-DOMAIN/api/telegram&secret_token=<YOUR_SECRET>`

Do not put bot tokens in GitHub.

## 5. Public submission links
Add:
- `NEXT_PUBLIC_TELEGRAM_BOT_URL`
- `NEXT_PUBLIC_GOOGLE_SHEET_URL`
- `NEXT_PUBLIC_GITHUB_URL`

These appear on the final Vercel page.

## 6. Telegram Test 1 setup
Open the website.
Choose Svetlana.
Link your Telegram user ID/chat ID to Richard.
Send:

`/sale | S01 | Olivia Rose | A | One proud uncle and an emotional grandmother | 1000 | 50 | 30 | 20`

Then relink the same Telegram account to Kevin and send:

`/expense | E01 | Rented suit and fake pearl necklace for the relatives | Materials | 120 | A`

The already-created S01 retains the original submitting chat ID.

## 7. Test 1 website entries
Anastasia:
- S02
- Daniel King
- Project B
- University friends, dancing, and the stripping performance
- 2000
- split 0 / 50 / 50

Kevin:
- E02, Taxi for the grandmother; Kevin selected the wrong project, Travel, 80, B
- E03, Monthly company website subscription, Other, 100, Company overhead

Before manager decisions:
- approved income = 0
- commissions = 0
- project results = 0
- company result = -300

Svetlana:
- S01 approve 50/30/20
- S02 change to 20/40/40
- E01 confirm A
- E02 change B -> A

Correct Test 1:
- Project A = 700
- Project B = 1800
- Company = 2400
- Richard commission = 90
- Anastasia = 110
- Jean-Claude = 100

## 8. Test 2
Keep Test 1 records.

Sales:
- S03 Jean-Claude / Emma Stonebridge / A / Premium relatives, including an uncle presented as a surgeon / 1500 / 40 40 20
- S04 Richard / Lucas Green / B / Small group of loud university friends / 800 / 25 25 50
- S05 Richard / Mia Brooks / B / Extra guests and an embarrassing speech / 600 / 100 0 0

Expenses:
- E04 Replacement costumes after an enthusiastic dance performance / Materials / 250 / B
- E05 Minibus for university friends; Kevin selected the wrong project again / Travel / 90 / A
- E06 Company telephone subscription / Other / 60 / Company overhead
- E07 Emergency replacement clothing; project allocation still needs checking / Materials / 140 / A

Svetlana:
- S03 change to 20/30/50 and approve
- S04 approve
- S05 leave pending
- E04 approve B
- E05 change A -> B
- E07 leave awaiting allocation

Correct cumulative result:
- Project A = 2050
- Project B = 2180
- Company = 3930
- Richard commission = 140
- Anastasia = 175
- Jean-Claude = 215
- S05 still pending
- E07 still awaiting allocation

## 9. Required control tests
Check all:
- 60/30/20 split -> rejected
- Richard attempts approval -> permission denied
- Kevin attempts sale -> permission denied
- zero/missing expense amount -> rejected
- repeated approval -> no duplicate
- duplicate reference -> rejected

## 10. Final submission
The Vercel page must show:
- Denis Shuvayev
- working app
- demonstration role selector
- transaction forms
- manager controls
- financial dashboard
- Telegram bot link
- Google Sheet link
- GitHub repository link
- short instructions

Submit the final Vercel URL.
