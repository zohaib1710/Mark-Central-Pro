# Mark Central Pro

Production-ready static website for Mark Central Pro. The ten HTML files in the project root are the canonical source and are edited directly; there is no HTML generator or application runtime.

## Local setup

Install a current Node.js LTS release, then run:

```powershell
npm install
npm run build
npm run check
```

`npm run build` only compiles and minifies `css/input.css` to `css/style.css`. Use `npm run dev` while editing styles. HTML and JavaScript do not require compilation.

## Project structure

- Root `*.html`: canonical page content, metadata, structured data, shared navigation, footer, and modal markup
- `css/input.css`: Tailwind import, design tokens, components, page compositions, motion, and responsive rules
- `css/style.css`: compiled production stylesheet
- `js/`: small classic deferred scripts for navigation, accordions, forms, modal behavior, reveals, parallax, and service exploration
- `assets/`: optimized local images, logo, favicon, and self-hosted fonts
- `scripts/check.mjs`: lightweight static integrity check
- `docs/content-audit.md`: internal content, claim, pricing, and legal review notes

## Editing workflow

1. Edit only the relevant root HTML page or shared CSS/JavaScript file.
2. Run `npm run build` only when `css/input.css` changes.
3. Run `npm run check` before deployment.
4. Do not recreate HTML from templates or regenerate unrelated pages.

Shared navigation, footer, and modal markup is intentionally present in each static page. When changing one of those shared interfaces, update all ten pages carefully and run the integrity check.

## Design system

Core colors are brand red `#E60023`, dark red `#B4001B`, navy `#0B1220`, white `#FFFFFF`, and soft gray `#F6F7F9`. Manrope is used for interface and body copy; Newsreader is reserved for editorial emphasis. Motion uses CSS transitions and IntersectionObserver and respects `prefers-reduced-motion`.

The About hero uses the rights-safe local `about-founders-editorial` AVIF/WebP/PNG asset set. The homepage hero uses the local `hero-brand-protection` responsive asset set with code-native interface overlays.

## Forms

`window.submitLeadForm(formData)` in `js/forms.js` is the sole backend integration boundary. It is intentionally disconnected and must not perform network or storage operations until a backend is approved. Valid attempts retain entered data and show the direct phone/email fallback.

Pricing appears directly in `index.html`, `trademark-registration.html`, and `copyright-registration.html`. Homepage and trademark-detail prices intentionally differ and remain listed in `docs/content-audit.md` for business review.

## Hostinger deployment

1. Run `npm ci`, `npm run build`, and `npm run check` locally.
2. Upload the root HTML files, `.htaccess`, `robots.txt`, `sitemap.xml`, and the `css`, `js`, and `assets` directories to `public_html`.
3. Do not upload Node, `node_modules`, `.tools`, `scripts`, or internal documentation.
4. Confirm redirects, navigation, service dropdown, accordions, modal, and form failure state after deployment.

Node and npm are development tools only. The deployed website needs no Node runtime. Blog pages remain outside the current site release.
