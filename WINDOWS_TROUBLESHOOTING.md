# WINDOWS TROUBLESHOOTING

## Vercel cannot find pages/app
Your GitHub structure is wrong. `pages` must be a folder in the repo root, beside `package.json`.

## Dashboard says Connect Supabase environment variables
In Vercel check these exact names:
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
Then redeploy.

## Google Sheets sync fails
Check API enabled, service account, sheet shared as Editor, tab names Sales/Expenses, environment variables, then redeploy.

## Telegram does not work
Check bot token, webhook, secret token, and that your Telegram user/chat is linked to an employee through the manager section.
