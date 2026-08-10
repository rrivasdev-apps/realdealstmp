<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# This app is bilingual — every new string ships in English *and* Spanish

There is no "English for now, translate later" in this repo. Any user-facing
string you add — page, form, button, empty state, confirm dialog, client-side
validation — goes into **both** `src/messages/en.json` and
`src/messages/es.json` in the same change, read via `getTranslations()` (Server
Components) or `useTranslations()` (Client Components).

Run `npm run check:i18n` before you call UI work done; it fails on a key that
exists in only one catalog and on hardcoded English left in a component. See
the "Localization" section of [CLAUDE.md](CLAUDE.md) for namespace choice,
interpolation, and what deliberately stays untranslated (lookup data, DB enum
values, server-side API error strings).
