# Folioframe — Personal Portfolio

React / Express / tRPC / Drizzle starter, adapted from the Sandbox web-db-user template.

- `pnpm dev`: development server; honors `PORT` (default 3000).
- `pnpm build` / `pnpm start`: build and serve `dist/index.js` and `dist/public/`.
- `pnpm db:migrate`: apply checked-in migrations. `pnpm db:push`: generate and apply new schema changes.
- `pnpm check` / `pnpm test`: types and application tests.

Start with the Webdev skill's default-template guide. Platform login, storage, payments and service contracts live in its shared references; read the relevant capability before extending its helper.

`server/_core/publicConfig.ts` exposes only named public runtime values. Private keys stay server-side. The platform serves managed `/manus-storage/` assets; the application does not register a second proxy.

Platform configuration is readable and editable through `webdev.config`. Default settings are initial values, not enforced constraints. The agent may modify the files, commands and configuration or follow the flexible guide for another stack.

## Contact form (Vercel + Gmail)

The form posts to `api/contact.ts`, a Vercel serverless function that emails you through Gmail (no custom domain needed).

1. Enable 2-Step Verification on your Google account, then create an App password at https://myaccount.google.com/apppasswords.
2. In Vercel: Project → Settings → Environment Variables, add `GMAIL_USER`, `GMAIL_APP_PASSWORD` (and optionally `CONTACT_TO_EMAIL`). Redeploy.
3. Locally, copy `.env.example` to `.env` and run `pnpm dev`; the same handler is mounted on the dev server.
