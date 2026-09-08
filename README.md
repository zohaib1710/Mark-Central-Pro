# Mark Central Pro — Phase 1 redesign

A premium static redesign of the Mark Central Pro marketing site. The generated site uses semantic HTML, compiled Tailwind CSS, vanilla JavaScript, local fonts, and optimized image assets. It requires no server runtime.

## Local setup

Install a current Node.js LTS release, then run:

```powershell
npm install
npm run build
npm run check
```

For CSS watch mode, run `npm run dev`. The custom generator in `scripts/build.mjs` creates the ten HTML pages and shared interface markup. Tailwind compiles and minifies `css/input.css` into `dist/css/style.css`.

For browser checks, serve `dist/` at `http://127.0.0.1:8000` and run `npm run check:visual`. This checks every page at the configured responsive widths plus the menu, dialog, disconnected form, and accordion interactions. Lighthouse is included as a development dependency for performance audits.

## Project structure

- `scripts/build.mjs`: page content, shared header/footer/modal, metadata, schema, sitemap, robots, and redirects
- `css/input.css`: design tokens, Tailwind import, components, and responsive rules
- `js/main.js`: navigation, dialog, accordion, validation, current year, and restrained reveals
- `assets/`: local logo, generated hero artwork, optimized derivatives, social preview, favicon, and fonts
- `docs/content-audit.md`: source inventory and required business/legal review
- `dist/`: deployable output; upload its contents, not the folder itself

## Hostinger deployment

1. Run `npm ci`, `npm run build`, and `npm run check` locally.
2. Upload everything inside `dist/` to `public_html/`, including `.htaccess`.
3. Confirm that hidden files are visible in the file manager and `.htaccess` was uploaded.
4. Test every page, the PHP and extensionless redirects, mobile menu, service dropdown, accordions, and Get Started dialog.
5. Confirm forms display the disconnected-backend notice and do not generate a network request.

Node and npm are build-time tools only. Nothing must be installed or executed on Hostinger.

## Editing guide

- Brand colors and spacing tokens are at the top of `css/input.css`.
- Homepage and service-detail pricing live in `homePrices`, `trademarkPrices`, and the copyright page data in `scripts/build.mjs`.
- Replace or add images under `assets/images/`; preserve explicit dimensions and generate WebP/AVIF variants.
- Blog navigation is intentionally absent. The shared navigation generator is the integration point for Phase 2.

## Form backend not connected

The Get Started form and contact form validate only in the browser. They do not transmit or store personal information. `submitLeadForm(formData)` in `js/main.js` is the sole backend integration boundary and currently throws `FORM_BACKEND_NOT_CONNECTED` by design.

When a backend is approved, connect it inside that function, add server-side validation, CSRF and abuse controls, rate limiting, logging/redaction, consent records, privacy updates, and an accessible success/error response. Do not connect a third-party form service without explicit approval.

## Integrations withheld

The source site’s Google Tag Manager (`GTM-N5P5SGND`), Google Analytics (`G-9KP5T3BG3C`), and Zendesk widget are documented but intentionally omitted. Obtain privacy and business approval before restoring them.

## Pre-launch review

Resolve every item in `docs/content-audit.md`, especially price inconsistencies, attorney/legal claims, testimonials, statistics, company naming, contact details, refund language, and legal text. The website is not ready for public lead collection until a secure backend and approved privacy disclosures are in place.
