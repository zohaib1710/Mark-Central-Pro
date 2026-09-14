# Mark Central Pro website

A Mark Central Pro marketing site built with semantic HTML, compiled Tailwind CSS, vanilla JavaScript, local assets, and a small PHP/PHPMailer endpoint for secure form delivery.

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
- `send-form.php` and `lib/PHPMailer/`: same-origin form endpoint and vendored mail library.
- `smtp-config.example.php`: password-free template for the private server configuration.
- `assets/`: local logo, images, fonts, social preview, and favicon assets.
- `scripts/check.mjs`: static integrity check for the root site.
- `scripts/visual-check.mjs`: optional browser interaction and responsive check.
- `docs/content-audit.md`: source inventory and business/legal review notes.

The root files are the single source of truth. Edit HTML, CSS, and JavaScript in place; `npm run build` only recompiles CSS.

## Hostinger deployment

1. Run `npm ci`, `npm run build`, and `npm run check` locally.
2. In Hostinger, enable PHP 8.1 or newer with OpenSSL and JSON support.
3. Upload the public files into `public_html/`: the ten HTML files, `send-form.php`, `.htaccess`, `robots.txt`, `sitemap.xml`, `assets/`, `css/`, `js/`, and `lib/`.
4. Beside—not inside—`public_html/`, create `site-private/` and `site-private/rate-limits/`. Keep both private; the PHP user must be able to write only to `rate-limits/`.
5. Copy `smtp-config.example.php` to `site-private/smtp-config.php`. Replace only `YOUR_HOSTINGER_EMAIL_PASSWORD_HERE` with the real password for `formsubmission@rbdtrading.com`; never upload the real config into `public_html` or commit it.
6. Confirm hidden files are enabled so `.htaccess` is uploaded, clear Hostinger/browser caches, and verify the versioned `js/main.js` request is current.
7. Test both forms on the preview host, then on production after explicit approval. Check Hostinger Email delivery logs and verify SPF, DKIM, and DMARC for `rbdtrading.com` if delivery is delayed or filtered.

Node and npm are local development tools only. Hostinger needs PHP but does not need a Node runtime.

## Editing guide

- Update the relevant root HTML page for page-specific content or layout changes.
- Update `css/input.css` for shared styles, then run `npm run build`.
- Update the relevant script in `js/` for interaction changes.
- Replace assets under `assets/images/` while preserving dimensions and WebP/AVIF variants where supplied.

## Form email delivery

The Get Started and contact forms submit asynchronously to `send-form.php`, which validates the request again, applies origin, honeypot, timing, request-size, and locked hashed-IP rate-limit controls, and sends through authenticated Hostinger SMTP.

The authenticated From address is fixed in the private configuration. A validated visitor email is used only as Reply-To. Rate-limit records live in `site-private/rate-limits/`; submitted form content is not stored by the website endpoint.

## Integrations and pre-launch review

Google Tag Manager, Google Analytics, and Zendesk remain omitted pending approval. Before public lead collection, resolve the open items in `docs/content-audit.md`, especially legal, pricing, testimonial, claim, company-name, contact, and refund-language reviews.
