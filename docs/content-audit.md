# Mark Central Pro content audit

Audit source: `https://markcentralpro.com/`, reviewed September 8, 2026. This document is an internal pre-launch checklist, not public copy.

## Phase 1 inventory

| New page | Source URL | Preserved material |
| --- | --- | --- |
| Home | `/` | services, three-step process, homepage pricing, benefits, three unique testimonials, statistics |
| About | `/about.php` and `/about` | company introduction, expert guidance, support, service philosophy, registration overview |
| Services | `/services.php` and `/services` | three services and application process |
| Trademark | `/trademark-registration-detail.php` and extensionless equivalent | package names/prices/features, benefits, process, FAQs |
| Copyright | `/copyright-registration-detail.php` and extensionless equivalent | package prices/features, eligible-work categories, overview |
| Amazon Brand Registry | `/amazon-brand-registry.php` and extensionless equivalent | benefits, search/report capabilities, service-charge note |
| Contact | `/contact.php` and `/contact` | phone, email, weekday hours, contact fields |
| FAQ | `/frequently-asked-question.php` and extensionless equivalent | trademark and copyright questions |
| Privacy | `/privacy-policy.php` and `/privacy-policy` | information collection/use, disclosure, security, rights, children, SMS, changes/contact |
| Terms | `/terms-of-service.php` and `/terms-of-service` | service terms, fees, dispute provisions, IP, notices, authorization, refunds |

The source logo is retained. Its dominant source red is `#EB001B`; the redesigned interface uses the refined `#E60023` token with navy and neutral supporting colors. Source typography (Baloo Thambi 2 and Mulish) is replaced by self-hosted Manrope and Newsreader.

## Content treatment

### Preserve

- Public contact: `support@markcentralpro.com` and `+1 754 547-6430`.
- Homepage packages: Basic `$39`, Professional `$99`, Premium `$149`.
- Trademark-detail packages: Basic `$45`, Standard `$99`, Deluxe `$199`.
- Copyright packages: Basic `$99`, Deluxe `$198`.
- Trademark government fee: `$350` base application fee per class, with possible additional fees.
- Copyright government charge is separate; the source does not state an amount and the redesign does not invent one.
- Core service descriptions, application steps, Amazon feature names, testimonial identities, and legal-policy subject matter.

### Light cleanup

- Corrected obvious substitutions where “Mark Central Pro” incorrectly replaced “trademark.”
- Repaired grammar, capitalization, punctuation, duplicated copy, and inaccurate descriptions such as filing “on” an agency.
- Clarified that expedited package timing refers to Mark Central Pro preparation, not government examination.
- Reduced repetition while retaining the intended meaning.

### Manual review required

- Verify `100,000+ Clients`, `5 Star Ratings`, and `180+ Countries` with evidence and confirm whether the claims can be dated.
- Verify every testimonial, the customer’s permission to publish it, and whether edited grammar remains approved.
- Verify all “attorney,” “lawyer,” “legal representation,” “expert advisor,” and legal-advice statements. The redesigned public copy avoids expanding those claims.
- Verify `24/7 support`, “lifetime support,” satisfaction/guarantee statements, service turnaround times, monitoring scope, shipping, founder kits, and notebooks.
- Resolve the intentional price discrepancy between homepage packages (`$39/$99/$149`) and trademark-detail packages (`$45/$99/$199`). The stakeholder explicitly chose to preserve both.
- Confirm all package inclusions and whether “starting at” is still required.
- Confirm the current USPTO base fee before each deployment. As audited, it is `$350 per class`; additional application fees may apply.
- Confirm U.S. Copyright Office filing fees and do not imply inclusion.
- Confirm whether Mark Central Pro is a law firm, document-preparation service, referral service, or another category; update all public and schema language accordingly.

## Legal and identity conflicts

- Footer identifies `Mark Consultant LLC`; terms also reference `Mark Central Pro, LLC`. Confirm the correct contracting and copyright entity.
- The source refund policy uses `1 (929) 396-1991`, while the public header and contact page use `+1 754 547-6430`.
- The source contact page shows both `support@markcentralpro.com` and malformed `support@markcentral.com`; the redesign uses the consistent public address `support@markcentralpro.com`.
- The About page’s “100% Satisfaction Guarantee” and “no questions asked” refund language conflicts with source terms describing service and government fees as non-refundable after work begins.
- The source terms contain binding arbitration, class waiver, California governing-law language, an opt-out process, and user-content licensing. Qualified counsel must approve the complete operative text before launch. The formatted Phase 1 page is not a substitute for legal review.
- Add and verify an effective date for each legal policy.

## Security changes

The source Amazon form requested an Amazon-associated password and other sensitive account identifiers. Those fields are removed. The redesign explicitly states that Mark Central Pro will never ask for an Amazon account password. Do not add passwords, merchant tokens, or third-party credentials to future forms.

## Forms and third parties

- Get Started and Contact forms are frontend-only and intentionally disconnected.
- Marketing consent is optional and unchecked.
- No data is sent to email, storage, an API, Formspree, Google Sheets, analytics, or chat tools.
- Source GTM `GTM-N5P5SGND`, Analytics `G-9KP5T3BG3C`, and Zendesk are withheld pending approval and privacy review.

## Blog and redirects

Blog navigation and article migration are Phase 2. Phase 1 redirects cover audited `.php` and extensionless URLs for the ten in-scope destinations only, with no blog redirects or placeholder pages.
