# Mark Central Pro website

A static Mark Central Pro marketing site built with semantic HTML, compiled Tailwind CSS, vanilla JavaScript, local fonts, and optimized local assets. It requires no server-side runtime.

## Local setup

Install a current Node.js LTS release, then run:

```powershell
npm ci
npm run build
npm run check
```

Use `npm run dev` to watch and recompile `css/input.css` into `css/style.css` while you work.

## Project structure

- Root `*.html` files: the ten directly editable website pages.
- `.htaccess`, `robots.txt`, and `sitemap.xml`: deployment and search-engine files.
- `css/input.css`: Tailwind source, design tokens, components, and responsive rules.
- `css/style.css`: compiled production stylesheet.
- `js/`: navigation, modal, accordion, form validation, current-year, and motion scripts.
- `assets/`: local logo, images, fonts, social preview, and favicon assets.
- `scripts/check.mjs`: static integrity check for the root site.
- `scripts/visual-check.mjs`: optional browser interaction and responsive check.
- `docs/content-audit.md`: source inventory and business/legal review notes.

The root files are the single source of truth. Edit HTML, CSS, and JavaScript in place; `npm run build` only recompiles CSS.

## Hostinger deployment

1. Run `npm ci`, `npm run build`, and `npm run check` locally.
2. Upload the root website files and folders directly into `public_html/`: the ten HTML files, `.htaccess`, `robots.txt`, `sitemap.xml`, `assets/`, `css/`, and `js/`.
3. Confirm hidden files are enabled in Hostinger File Manager so `.htaccess` is uploaded.
4. Test pages, legacy redirects, navigation, accordions, and the Get Started dialog after deployment.

Node and npm are local development tools only; Hostinger does not need a Node runtime.

## Editing guide

- Update the relevant root HTML page for page-specific content or layout changes.
- Update `css/input.css` for shared styles, then run `npm run build`.
- Update the relevant script in `js/` for interaction changes.
- Replace assets under `assets/images/` while preserving dimensions and WebP/AVIF variants where supplied.

## Form backend not connected

The Get Started and contact forms validate only in the browser. They do not transmit or store personal information. `submitLeadForm(formData)` in `js/main.js` is the only intended backend integration boundary and is currently disconnected.

When a backend is approved, connect it in that function and add server-side validation, CSRF and abuse controls, rate limiting, privacy updates, and accessible status handling.

## Integrations and pre-launch review

Google Tag Manager, Google Analytics, and Zendesk remain omitted pending approval. Before public lead collection, resolve the open items in `docs/content-audit.md`, especially legal, pricing, testimonial, claim, company-name, contact, and refund-language reviews.
