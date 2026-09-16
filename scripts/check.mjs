import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve('.');
const files = (await readdir(root)).filter(file => file.endsWith('.html'));
const failures = [];

if (files.length !== 10) failures.push(`Expected 10 HTML pages, found ${files.length}`);

for (const file of files) {
  const html = await readFile(path.join(root, file), 'utf8');
  const h1Count = (html.match(/<h1\b/g) || []).length;
  if (h1Count !== 1) failures.push(`${file}: expected one H1, found ${h1Count}`);

  for (const token of [
    '<title>', 'name="description"', 'rel="canonical"', 'property="og:title"',
    'application/ld+json', 'class="skip-link"', 'id="lead-modal"',
    'href="css/style.css?v=20260916-sms1"', 'src="js/main.js?v=20260917-popup1"',
  ]) {
    if (!html.includes(token)) failures.push(`${file}: missing ${token}`);
  }

  if (/type=["']password/i.test(html)) failures.push(`${file}: contains a password input`);

  const leadForm = html.match(/<form class="dialog-form"[\s\S]*?<\/form>/)?.[0] || '';
  for (const token of [
    'action="send-form.php"', 'method="post"', 'enctype="multipart/form-data"',
    'name="website"', 'name="form_started_at"', 'name="form_source" value="lead-modal"',
    'name="source_page"', 'name="selected_service"', 'name="selected_package"',
    'id="lead-sms-consent" type="checkbox" name="marketing_consent" value="yes" required',
    'id="lead-sms-consent-error"', 'href="privacy-policy.html"', 'href="terms-of-service.html"',
  ]) {
    if (!leadForm.includes(token)) failures.push(`${file}: lead form missing ${token}`);
  }

  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map(match => match[1]);
  const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
  if (duplicates.length) failures.push(`${file}: duplicate IDs ${[...new Set(duplicates)].join(', ')}`);

  for (const match of html.matchAll(/href="([^"#]+\.html)"/g)) {
    if (/^https?:/.test(match[1])) continue;
    try {
      await stat(path.join(root, match[1]));
    } catch {
      failures.push(`${file}: broken link ${match[1]}`);
    }
  }
}

const contactHtml = await readFile(path.join(root, 'contact.html'), 'utf8');
const contactForm = contactHtml.match(/<form class="form-card"[\s\S]*?<\/form>/)?.[0] || '';
for (const token of [
  'action="send-form.php"', 'method="post"', 'enctype="multipart/form-data"',
  'name="website"', 'name="form_started_at"', 'name="form_source" value="contact-page"',
  'name="source_page" value="/contact.html"',
  'id="contact-phone" name="phone" type="tel" inputmode="tel" autocomplete="tel" maxlength="20" pattern="[+()0-9\\s-]{7,20}" required',
  'id="contact-sms-consent" type="checkbox" name="marketing_consent" value="yes" required',
  'id="contact-sms-consent-error"', 'href="privacy-policy.html"', 'href="terms-of-service.html"',
]) {
  if (!contactForm.includes(token)) failures.push(`contact.html: contact form missing ${token}`);
}

const homeHtml = await readFile(path.join(root, 'index.html'), 'utf8');
if (homeHtml.includes('status-card') || homeHtml.includes('APPLICATION PATH')) failures.push('Homepage still contains the removed application-path card');
for (const token of [
  'data-count-to="100000" data-count-suffix="+">100,000+',
  'data-count-to="180" data-count-suffix="+">180+',
  '<strong>5-star</strong>', '<strong>3 steps</strong>',
]) {
  if (!homeHtml.includes(token)) failures.push(`Homepage statistic missing ${token}`);
}
if ((homeHtml.match(/data-count-to=/g) || []).length !== 2) failures.push('Homepage must contain exactly two animated statistics');

const termsHtml = await readFile(path.join(root, 'terms-of-service.html'), 'utf8');
for (const token of ['Last updated September 16, 2026', 'href="#legal-16">Text Messaging', 'href="#legal-17">Changes and contact', 'id="legal-16" class="sms-terms"', 'replying STOP', 'reply START', 'reply HELP']) {
  if (!termsHtml.includes(token)) failures.push(`Terms of Service missing ${token}`);
}

for (const required of [
  '.htaccess', 'robots.txt', 'sitemap.xml', 'css/style.css', 'send-form.php',
  'smtp-config.example.php', 'lib/PHPMailer/LICENSE', 'lib/PHPMailer/src/Exception.php',
  'lib/PHPMailer/src/PHPMailer.php', 'lib/PHPMailer/src/SMTP.php',
]) {
  try {
    await stat(path.join(root, required));
  } catch {
    failures.push(`Missing deployment file ${required}`);
  }
}

const js = await readFile(path.join(root, 'js', 'main.js'), 'utf8');
for (const token of ['fetch(', 'new FormData(form)', "credentials:'same-origin'", "form.dataset.submitting==='true'", 'setFormStartedAt(form)', 'form.reset()', 'const AUTO_OPEN_DELAY=20000', 'function cancelAutoOpen()', 'openModal(null,true)', 'trigger?.dataset.service', 'trigger?.dataset.package', 'cancelAutoOpen();form.reset()', "$$('[data-count-to]')", "new Intl.NumberFormat('en-US')", 'duration=5000', 'const startTime=performance.now()', 'const elapsed=now-startTime', 'Math.min(elapsed/duration,1)', 'Math.floor(target*progress)', "counter.textContent='0'", "counter.dataset.countState='waiting'", "const statsSection=$('.stats-section')", "classList.add('is-visible')", 'startCounters()', 'observer.observe(statsSection)', 'requestAnimationFrame(update)', 'else showFinalValues()']) {
  if (!js.includes(token)) failures.push(`Form script missing ${token}`);
}
for (const forbidden of ['triggerPosition', 'onCounterScroll', 'counterObserver', 'onStatsScroll', 'lastScrollY', 'getBoundingClientRect()', 'window.innerHeight', "window.addEventListener('scroll'", "window.addEventListener('resize'", 'if(reduceMotion)', 'Math.round(target*progress)', 'data-count-to="5"', 'data-count-to="3"']) {
  if (js.includes(forbidden)) failures.push(`Counter script still contains obsolete trigger ${forbidden}`);
}
for (const debugMessage of ['COUNTER SCRIPT LOADED', 'COUNTER INITIALIZED', 'COUNTER ENTRANCE TRIGGERED', 'COUNTER ANIMATION STARTED']) {
  if (js.includes(debugMessage)) failures.push(`Temporary counter debug logging remains: ${debugMessage}`);
}
for (const forbidden of ['sessionStorage', 'localStorage']) {
  if (js.includes(forbidden)) failures.push(`Automatic modal must not persist through ${forbidden}`);
}
if (js.includes("const revealGroups=['.trust-grid'")) failures.push('Stats grid is still controlled by the generic reveal observer');

const css = await readFile(path.join(root, 'css', 'input.css'), 'utf8');
for (const token of ['status-card', 'status-top', 'status-row', 'status-pill']) {
  if (css.includes(token)) failures.push(`Stylesheet still contains obsolete ${token} rules`);
}
for (const token of ['.stats-section:not(.is-visible) .trust-grid', 'translateY(15px)', '.stats-section.is-visible .trust-grid']) {
  if (!css.includes(token)) failures.push(`Stats entrance style missing ${token}`);
}

const php = await readFile(path.join(root, 'send-form.php'), 'utf8');
for (const token of [
  'REQUEST_METHOD', 'MAX_REQUEST_BYTES', 'multipart/form-data', '$_FILES', 'HTTP_ORIGIN', 'HTTP_REFERER',
  'form_started_at', 'MINIMUM_COMPLETION_SECONDS', "hash('sha256'", 'flock(',
  'RATE_LIMIT_ATTEMPTS', 'RATE_LIMIT_WINDOW', "'lead-modal'", "'contact-page'",
  "$consent !== 'yes'", "'SMS consent' => 'Yes'",
  'htmlspecialchars(', 'addReplyTo(', 'setFrom(', 'AltBody', 'dirname(__DIR__)',
]) {
  if (!php.includes(token)) failures.push(`PHP endpoint missing ${token}`);
}
if (/SMTPDebug\s*=\s*[1-9]/.test(php)) failures.push('PHP endpoint enables SMTP debug output');

const config = await readFile(path.join(root, 'smtp-config.example.php'), 'utf8');
const configKeys = [...config.matchAll(/^\s{4}'([^']+)'\s*=>/gm)].map(match => match[1]);
const expectedConfigKeys = [
  'smtp_host', 'smtp_port', 'smtp_encryption', 'smtp_username', 'smtp_password',
  'smtp_from_email', 'smtp_to_email', 'allowed_hosts',
];
if (JSON.stringify(configKeys) !== JSON.stringify(expectedConfigKeys)) {
  failures.push(`SMTP example keys are not canonical: ${configKeys.join(', ')}`);
}
for (const token of [
  "'smtp_host' => 'smtp.hostinger.com'", "'smtp_port' => 465", "'smtp_encryption' => 'smtps'",
  "'smtp_username' => 'formsubmission@rbdtrading.com'", "'smtp_password' => 'YOUR_HOSTINGER_EMAIL_PASSWORD_HERE'",
  "'smtp_from_email' => 'formsubmission@rbdtrading.com'", "'smtp_to_email' => 'xyedzohaibtirmizi@gmail.com'",
  "'lightslategray-penguin-587111.hostingersite.com'", "'markcentralpro.com'", "'www.markcentralpro.com'",
  "'localhost'", "'127.0.0.1'",
]) {
  if (!config.includes(token)) failures.push(`SMTP example missing ${token}`);
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log(`Checked ${files.length} pages: metadata, links, both email workflows, endpoint protections, PHPMailer, and canonical SMTP configuration look good.`);
