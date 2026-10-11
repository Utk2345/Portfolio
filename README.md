# Portfolio

Personal portfolio website for **Utkarsha**, a full stack developer. It's a single-page site with a hero, an about section, featured and archived projects, light and dark themes, and a working contact form that emails me directly.

**Live site:** https://portfolio-hackerzzz.vercel.app/

## Features

- Responsive single-page layout with light and dark mode 
- Featured project plus a filterable project archive 
- Contact form that sends enquiries to my inbox through Gmail, with validation, a spam trap and rate limiting
- Deployed on Vercel: static front end plus one serverless function

## Tech stack

- **Front end:** React 19, TypeScript, Vite, Tailwind CSS 4, Lucide icons
- **Contact endpoint:** Vercel serverless function using Nodemailer and Zod
- **Tooling:** pnpm, Vitest

The project started from a React / Express / tRPC / Drizzle template. Parts of that template (login, database, tRPC) are still in the repo but aren't used by the portfolio. See [Notes](#notes).

## Getting started

You need [Node.js](https://nodejs.org) 20 or newer and [pnpm](https://pnpm.io).

```bash
npm install -g pnpm     # once, if pnpm isn't installed
pnpm install
cp .env.example .env    # then fill in your Gmail details (see below)
pnpm dev
```

Open **http://localhost:3000**. If port 3000 is busy, the server uses the next free one and prints it.

On Windows, `cp` doesn't exist in PowerShell. Use `copy .env.example .env` instead.

### Scripts

| Command | What it does |
| --- | --- |
| `pnpm dev` | Local dev server, including the contact endpoint and the project editor |
| `pnpm dev:static` | Front end only (the contact form won't work) |
| `pnpm build:static` | Production build into `dist/public` (what Vercel runs) |
| `pnpm check` | Type-check the project |
| `pnpm test` | Run the tests |
| `pnpm format` | Format the code with Prettier |

## Editing the content

Most of the site's text lives in `client/src/pages/Home.tsx`.

## Contact form setup

The form posts to `api/contact.ts`, which emails the enquiry to you through Gmail.The visitor's address is set as the reply-to, so you can answer straight from your inbox.

1. Turn on 2-Step Verification for your Google account.
2. Create an **App password** at <https://myaccount.google.com/apppasswords>. It's a 16-character code, separate from your normal password.
3. Set these environment variables:

| Variable | Required | Description |
| --- | --- | --- |
| `GMAIL_USER` | Yes | The Gmail address that sends the email |
| `GMAIL_APP_PASSWORD` | Yes | The 16-character app password |
| `CONTACT_TO_EMAIL` | No | Where enquiries are delivered (defaults to `GMAIL_USER`) |


## Project structure

```
api/contact.ts        Contact endpoint (Vercel serverless function)
client/index.html     HTML entry point
client/public/        Static files (images, favicon)
client/src/pages/     Home.tsx holds the whole portfolio page
client/src/index.css  Styles and theme variables
server/               Local dev server (Express) and tests
vercel.json           Vercel build and routing settings
.env.example          Template for environment variables
```

## Notes

- The repo still contains template code that this portfolio doesn't use: login (you'll see an `[OAuth] ERROR` line when running `pnpm dev`, which is harmless), a Drizzle/MySQL setup with `db:*` scripts, and tRPC. None of it is needed for the site or the contact form, and it can be deleted if you want a smaller repo.
- Vercel runs only the static build and `api/contact.ts`. The Express server is for local development.
