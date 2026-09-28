# PERSONALIZED FOR DENIS SHUVAYEV

Git name: `Denis Shuvayev`  
Git email: `denisshuvayev48@gmail.com`  
GitHub repo: `https://github.com/QAZAQ7/DS4.git`

These are already configured in the Windows upload script. You do not need to enter them manually.

---

# READ THIS FIRST — WINDOWS FINAL

You do not need to type Git commands manually.

Use these files in order:

1. `0_INSTALL_GIT_AND_NODE_WINDOWS.bat`
   Only if Git or Node.js is missing.

2. `1_SETUP_AND_TEST_WINDOWS.bat`
   Wait for `BUILD PASSED`.

3. `2_UPLOAD_TO_GITHUB_WINDOWS.bat`
   The repository URL and Git identity are already configured.
   You only may need to sign into GitHub in the browser.

4. Wait for Vercel to deploy.

5. Add the environment variables listed in:
   `VERCEL_ENV_VARIABLES.txt`

6. Redeploy Vercel.

7. Complete Google Sheets + Telegram setup.

8. Run Test 1 and Test 2 from `README.md`.

9. Run `3_VERIFY_BEFORE_SUBMISSION.bat`.

The GitHub repository must visibly contain:

```text
pages/
  index.tsx
  api/
    index.ts
    telegram.ts
package.json
schema.sql
README.md
```

If Vercel says it cannot find `pages` or `app`, do not upload files manually in the GitHub browser. Run `2_UPLOAD_TO_GITHUB_WINDOWS.bat` again.
