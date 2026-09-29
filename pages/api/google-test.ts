import type { NextApiRequest, NextApiResponse } from "next";
import { google } from "googleapis";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const rawKey = process.env.GOOGLE_PRIVATE_KEY;
    const spreadsheetId = process.env.GOOGLE_SHEETS_ID;

    if (!email || !rawKey || !spreadsheetId) {
      return res.status(500).json({
        ok: false,
        error: "Missing Google environment variable",
        env: {
          email: Boolean(email),
          privateKey: Boolean(rawKey),
          spreadsheetId: Boolean(spreadsheetId),
        },
      });
    }

    let key = rawKey.trim();

    // Tolerate a key accidentally pasted with surrounding quotes.
    if (
      (key.startsWith('"') && key.endsWith('"')) ||
      (key.startsWith("'") && key.endsWith("'"))
    ) {
      key = key.slice(1, -1);
    }

    // Works whether Vercel stores literal \n or real line breaks.
    key = key.replace(/\\n/g, "\n");

    const auth = new google.auth.JWT({
      email: email.trim().replace(/\\@/g, "@"),
      key,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    const metadata = await sheets.spreadsheets.get({
      spreadsheetId,
      fields: "properties.title,sheets.properties.title",
    });

    const sales = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "Sales!A1:Z5",
    });

    return res.status(200).json({
      ok: true,
      message: "Google Sheets connection works.",
      spreadsheetTitle: metadata.data.properties?.title ?? null,
      tabs:
        metadata.data.sheets?.map((s) => s.properties?.title).filter(Boolean) ??
        [],
      salesRowsRead: sales.data.values?.length ?? 0,
      safeChecks: {
        emailPresent: true,
        privateKeyPresent: true,
        privateKeyStartsCorrectly: key.startsWith(
          "-----BEGIN PRIVATE KEY-----"
        ),
        privateKeyEndsCorrectly: key.includes("-----END PRIVATE KEY-----"),
        spreadsheetIdPresent: true,
      },
    });
  } catch (e: any) {
    console.error("GOOGLE_TEST_ERROR", e?.response?.data || e);

    return res.status(500).json({
      ok: false,
      error: e?.message || String(e),
      googleError: e?.response?.data?.error ?? null,
    });
  }
}
