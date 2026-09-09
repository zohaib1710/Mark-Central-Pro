import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';

const pages = ['index.html','about.html','services.html','trademark-registration.html','copyright-registration.html','amazon-brand-registry.html','contact.html','faq.html','privacy-policy.html','terms-of-service.html'];
const failures = [];

for (const file of pages) {
  const html = await readFile(file, 'utf8');
  const h1 = (html.match(/<h1\b/g) || []).length;
  if (h1 !== 1) failures.push(`${file}: expected one H1, found ${h1}`);
  for (const token of ['<title>','name="description"','rel="canonical"','property="og:title"','application/ld+json','class="skip-link"','id="lead-modal"']) {
    if (!html.includes(token)) failures.push(`${file}: missing ${token}`);
  }
  if (/type=["']password/i.test(html)) failures.push(`${file}: contains a password field`);
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
  const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
  if (duplicates.length) failures.push(`${file}: duplicate IDs ${[...new Set(duplicates)].join(', ')}`);
  for (const match of html.matchAll(/href="([^"#]+\.html)"/g)) {
    if (/^https?:/.test(match[1])) continue;
    try { await stat(path.resolve(match[1])); } catch { failures.push(`${file}: broken link ${match[1]}`); }
  }
}

for (const required of ['css/style.css','js/main.js','js/navigation.js','js/modal.js','js/accordion.js','js/forms.js','.htaccess','robots.txt','sitemap.xml']) {
  try { await stat(required); } catch { failures.push(`Missing ${required}`); }
}
const forms = await readFile('js/forms.js', 'utf8');
if (/fetch\(|XMLHttpRequest|localStorage|sessionStorage/.test(forms)) failures.push('Forms contain a network or storage API');
if (failures.length) { console.error(failures.join('\n')); process.exit(1); }
console.log(`Checked ${pages.length} canonical pages, metadata, links, assets, and disconnected forms.`);
