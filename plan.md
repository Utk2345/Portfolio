# Folioframe — implementation plan

## Product scope

A personal portfolio homepage where the owner can showcase a collection of projects. Each project includes a title, description, visual thumbnail treatment, category, tags, and optional live/source links. The owner can add, edit, and remove project entries from the page. Projects persist in the browser via localStorage so the static site remains lightweight and usable without a backend.

## Design direction

- **Design movement:** Swiss editorial design with a warm neo-grotesk interface and a hint of indie product studio energy.
- **Core principles:** clear hierarchy, purposeful asymmetry, tactile borders, and restrained but confident color.
- **Color philosophy:** warm paper and ink create an archival/editorial base; electric lime is the signature accent for focus states, action buttons, and the cursor-like motif; muted sand and blue-gray support project metadata without competing with the work.
- **Layout paradigm:** an asymmetrical split hero with a large typographic statement, followed by a two-column project gallery that feels like a printed contact sheet rather than a generic centered grid. A fixed utility rail on desktop becomes a compact top nav on mobile.
- **Signature elements:** a lime “available” beacon, monospaced metadata labels, and oversized index numerals/arrow marks that give the page a recognizable studio-system feel.
- **Interaction philosophy:** editing should feel direct and forgiving. A single prominent “Add project” action opens an in-context modal, project cards expose edit/delete controls without hiding them behind a dashboard, and links use clear external-link affordances.
- **Animation:** subtle rise/fade on page load, gentle card lift on hover, and quick modal transitions. Avoid noisy motion; movement should clarify hierarchy and focus.
- **Typography system:** Space Grotesk for display and UI hierarchy; IBM Plex Mono for labels, indexes, URLs, and technical metadata. Oversized headline at desktop, fluidly reduced on mobile.
- **Brand essence:** an honest, flexible home for work-in-progress and finished work — for an independent maker who wants projects to speak clearly. Personality: curious, precise, alive.
- **Brand voice:** concise, observant, and quietly confident. Example lines: “Selected work, still in motion.” and “Make the good stuff easier to find.”
- **Wordmark & logo:** the Folioframe mark is a compact “F/” monogram inside a rounded square with a lime offset dot, paired with the wordmark in a tight uppercase lockup.
- **Signature brand color:** electric lime `#d7f36b`, used sparingly as the ownable visual signal.

## Implementation approach

- Use the initialized React + Vite static template; keep Server and Database disabled.
- Replace the starter Home page with a responsive, single-page portfolio experience.
- Keep project data typed and local to the page; seed three representative projects and merge user edits into localStorage under a stable key.
- Provide add/edit modal form fields for title, category, description, year, tags, thumbnail theme, live URL, and source URL.
- Provide filters for All, Product, Brand, and Experiments; preserve empty state messaging when a filter has no results.
- Provide a persisted light/dark theme toggle in the header, honoring the browser preference when no choice is saved.
- Provide a contact form section with name, email, and message fields; route every Contact, Let’s talk, and Start a conversation CTA to the form, and prepare a mailto enquiry on submit.
- Use existing lucide-react icons for navigation, project actions, and link affordances.
- Serve `/manus-routes.json` from `client/public/` with the single `/` route before starting the dev server.
- Set `app.config.ts` logo metadata to a durable inline data URL for the lightweight monogram so the managed project has a custom identity without adding an external asset.

## Project structure

- `client/src/pages/Home.tsx` — portfolio shell, seeded data, localStorage CRUD, filters, responsive navigation, and project modal.
- `client/src/index.css` — editorial visual system, layout primitives, responsive behavior, modal, and motion.
- `client/index.html` — document title, font loading, and viewport metadata.
- `client/public/manus-routes.json` — declared page route manifest for the managed preview.
- `app.config.ts` — platform project logo metadata.
