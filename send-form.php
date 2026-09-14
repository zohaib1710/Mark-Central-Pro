<?php

declare(strict_types=1);

use PHPMailer\PHPMailer\PHPMailer;

header('Content-Type: application/json; charset=UTF-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('X-Content-Type-Options: nosniff');

const MAX_REQUEST_BYTES = 65536;
const RATE_LIMIT_ATTEMPTS = 5;
const RATE_LIMIT_WINDOW = 900;
const MINIMUM_COMPLETION_SECONDS = 3;

function respond(int $status, bool $success, string $message): void
{
    http_response_code($status);
    echo json_encode(
        ['success' => $success, 'message' => $message],
        JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE
    );
    exit;
}

function text_length(string $value): int
{
    return function_exists('mb_strlen') ? mb_strlen($value, 'UTF-8') : strlen($value);
}

function escape_html(string $value): string
{
    return htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

function contains_forbidden_controls(string $value): bool
{
    return preg_match('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/', $value) === 1;
}

function request_host_is_allowed(string $url, array $allowedHosts): bool
{
    $host = parse_url($url, PHP_URL_HOST);
    if (!is_string($host) || $host === '') {
        return false;
    }

    return in_array(strtolower(rtrim($host, '.')), $allowedHosts, true);
}

function consume_rate_limit(string $directory, string $clientIp): bool
{
    if (!is_dir($directory) && !@mkdir($directory, 0700, true) && !is_dir($directory)) {
        throw new RuntimeException('rate-directory');
    }

    $path = $directory . DIRECTORY_SEPARATOR . hash('sha256', $clientIp) . '.json';
    $handle = @fopen($path, 'c+');
    if ($handle === false) {
        throw new RuntimeException('rate-open');
    }

    try {
        if (!flock($handle, LOCK_EX)) {
            throw new RuntimeException('rate-lock');
        }

        $contents = stream_get_contents($handle);
        if ($contents === false) {
            throw new RuntimeException('rate-read');
        }

        $timestamps = [];
        if ($contents !== '') {
            $decoded = json_decode($contents, true);
            if (!is_array($decoded)) {
                throw new RuntimeException('rate-data');
            }
            $timestamps = $decoded;
        }

        $now = time();
        $timestamps = array_values(array_filter(
            $timestamps,
            static fn ($timestamp): bool => is_int($timestamp) && $timestamp > ($now - RATE_LIMIT_WINDOW)
        ));

        $allowed = count($timestamps) < RATE_LIMIT_ATTEMPTS;
        if ($allowed) {
            $timestamps[] = $now;
        }

        $encoded = json_encode($timestamps);
        if ($encoded === false || rewind($handle) === false || !ftruncate($handle, 0)) {
            throw new RuntimeException('rate-write');
        }
        $written = fwrite($handle, $encoded);
        if ($written === false || $written !== strlen($encoded) || !fflush($handle)) {
            throw new RuntimeException('rate-write');
        }

        return $allowed;
    } finally {
        @flock($handle, LOCK_UN);
        fclose($handle);
    }
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    respond(405, false, 'This endpoint accepts form submissions only.');
}

$contentLength = isset($_SERVER['CONTENT_LENGTH']) ? (int) $_SERVER['CONTENT_LENGTH'] : 0;
if ($contentLength > MAX_REQUEST_BYTES) {
    respond(413, false, 'This request is too large. Please shorten your message and try again.');
}

$contentType = strtolower((string) ($_SERVER['CONTENT_TYPE'] ?? ''));
if ($contentType !== '' && !str_starts_with($contentType, 'multipart/form-data')) {
    respond(422, false, 'Please refresh the page and submit the form again.');
}

if ($_FILES !== []) {
    respond(422, false, 'File uploads are not accepted by this form.');
}

$scalarFields = [
    'name', 'email', 'phone', 'business_description', 'message', 'marketing_consent',
    'selected_service', 'selected_package', 'website', 'form_started_at', 'form_source', 'source_page',
];
foreach ($scalarFields as $field) {
    if (isset($_POST[$field]) && !is_string($_POST[$field])) {
        respond(422, false, 'Please check the form fields and try again.');
    }
}

$honeypot = trim((string) ($_POST['website'] ?? ''));
if ($honeypot !== '') {
    respond(200, true, 'Thank you. Your request has been sent successfully.');
}

$configOverride = getenv('FORM_SMTP_CONFIG');
$configPath = is_string($configOverride) && trim($configOverride) !== ''
    ? trim($configOverride)
    : dirname(__DIR__) . DIRECTORY_SEPARATOR . 'site-private' . DIRECTORY_SEPARATOR . 'smtp-config.php';
if (!is_file($configPath)) {
    error_log('Form delivery unavailable: configuration missing.');
    respond(500, false, "We couldn't send your request. Please contact our support team directly.");
}

$config = require $configPath;
if (!is_array($config)) {
    error_log('Form delivery unavailable: configuration invalid.');
    respond(500, false, "We couldn't send your request. Please contact our support team directly.");
}

$expectedConfigKeys = [
    'smtp_host', 'smtp_port', 'smtp_encryption', 'smtp_username', 'smtp_password',
    'smtp_from_email', 'smtp_to_email', 'allowed_hosts',
];
if (array_keys($config) !== $expectedConfigKeys) {
    error_log('Form delivery unavailable: configuration schema invalid.');
    respond(500, false, "We couldn't send your request. Please contact our support team directly.");
}

foreach (array_slice($expectedConfigKeys, 0, 7) as $key) {
    if ((!is_string($config[$key]) && !is_int($config[$key])) || trim((string) $config[$key]) === '') {
        error_log('Form delivery unavailable: configuration incomplete.');
        respond(500, false, "We couldn't send your request. Please contact our support team directly.");
    }
}
if (!is_array($config['allowed_hosts']) || $config['allowed_hosts'] === [] ||
    (string) $config['smtp_password'] === 'YOUR_HOSTINGER_EMAIL_PASSWORD_HERE' ||
    filter_var($config['smtp_username'], FILTER_VALIDATE_EMAIL) === false ||
    filter_var($config['smtp_from_email'], FILTER_VALIDATE_EMAIL) === false ||
    filter_var($config['smtp_to_email'], FILTER_VALIDATE_EMAIL) === false ||
    strcasecmp((string) $config['smtp_username'], (string) $config['smtp_from_email']) !== 0 ||
    (int) $config['smtp_port'] !== 465 || strtolower((string) $config['smtp_encryption']) !== 'smtps') {
    error_log('Form delivery unavailable: configuration values invalid.');
    respond(500, false, "We couldn't send your request. Please contact our support team directly.");
}

$allowedHosts = array_values(array_filter(array_map(
    static fn ($host): string => is_string($host) ? strtolower(rtrim(trim($host), '.')) : '',
    $config['allowed_hosts']
)));
if ($allowedHosts === []) {
    error_log('Form delivery unavailable: allowed hosts invalid.');
    respond(500, false, "We couldn't send your request. Please contact our support team directly.");
}

$origin = trim((string) ($_SERVER['HTTP_ORIGIN'] ?? ''));
$referer = trim((string) ($_SERVER['HTTP_REFERER'] ?? ''));
if (($origin !== '' && !request_host_is_allowed($origin, $allowedHosts)) ||
    ($origin === '' && $referer !== '' && !request_host_is_allowed($referer, $allowedHosts))) {
    respond(403, false, 'This form submission could not be verified. Please refresh the page and try again.');
}

$sourceLabels = [
    'lead-modal' => 'Get Started form',
    'contact-page' => 'Contact page form',
];
$formSource = trim((string) ($_POST['form_source'] ?? ''));
if (!array_key_exists($formSource, $sourceLabels)) {
    respond(422, false, 'This form submission could not be verified. Please refresh the page and try again.');
}

$allowedFields = $formSource === 'lead-modal'
    ? ['name', 'email', 'phone', 'business_description', 'marketing_consent', 'selected_service', 'selected_package', 'website', 'form_started_at', 'form_source', 'source_page']
    : ['name', 'email', 'phone', 'message', 'website', 'form_started_at', 'form_source', 'source_page'];
if (array_diff(array_keys($_POST), $allowedFields) !== []) {
    respond(422, false, 'Please check the form fields and try again.');
}

$allowedPages = [
    '/', '/index.html', '/about.html', '/services.html', '/trademark-registration.html',
    '/copyright-registration.html', '/amazon-brand-registry.html', '/contact.html',
    '/faq.html', '/privacy-policy.html', '/terms-of-service.html',
];
$sourcePage = trim((string) ($_POST['source_page'] ?? ''));
if (!in_array($sourcePage, $allowedPages, true) ||
    ($formSource === 'contact-page' && $sourcePage !== '/contact.html')) {
    respond(422, false, 'This form submission could not be verified. Please refresh the page and try again.');
}

$startedAt = filter_var($_POST['form_started_at'] ?? null, FILTER_VALIDATE_INT);
if ($startedAt === false || (time() - (int) $startedAt) < MINIMUM_COMPLETION_SECONDS) {
    respond(422, false, 'Please take a moment to review the form, then submit it again.');
}

$clientIp = (string) ($_SERVER['REMOTE_ADDR'] ?? 'unknown');
$rateLimitDirectory = dirname($configPath) . DIRECTORY_SEPARATOR . 'rate-limits';
try {
    if (!consume_rate_limit($rateLimitDirectory, $clientIp)) {
        respond(429, false, 'Too many submissions were received. Please wait a few minutes and try again.');
    }
} catch (Throwable $exception) {
    error_log('Form delivery unavailable: rate limiting failed.');
    respond(500, false, "We couldn't send your request. Please contact our support team directly.");
}

$name = trim((string) ($_POST['name'] ?? ''));
$email = trim((string) ($_POST['email'] ?? ''));
$phone = preg_replace('/\s+/', ' ', trim((string) ($_POST['phone'] ?? '')));
$phone = is_string($phone) ? $phone : '';

if (text_length($name) < 2 || text_length($name) > 100 || contains_forbidden_controls($name)) {
    respond(422, false, 'Please enter a valid name.');
}
if (text_length($email) > 254 || preg_match('/[\r\n]/', $email) === 1 ||
    filter_var($email, FILTER_VALIDATE_EMAIL) === false) {
    respond(422, false, 'Please enter a valid email address.');
}

$phoneDigits = preg_replace('/\D+/', '', $phone);
$phoneRequired = $formSource === 'lead-modal';
if (($phoneRequired && $phone === '') || ($phone !== '' && (
    text_length($phone) > 20 || preg_match('/^[+()\-\s\d]{7,20}$/', $phone) !== 1 ||
    !is_string($phoneDigits) || strlen($phoneDigits) < 7 || strlen($phoneDigits) > 15
))) {
    respond(422, false, 'Please enter a valid phone number.');
}

$details = [];
if ($formSource === 'lead-modal') {
    $description = trim((string) ($_POST['business_description'] ?? ''));
    $consent = trim((string) ($_POST['marketing_consent'] ?? ''));
    $service = trim((string) ($_POST['selected_service'] ?? ''));
    $package = trim((string) ($_POST['selected_package'] ?? ''));

    if ($description === '' || text_length($description) > 2000 || contains_forbidden_controls($description)) {
        respond(422, false, 'Please enter a valid business description of 2,000 characters or fewer.');
    }
    if (!in_array($consent, ['', 'yes'], true)) {
        respond(422, false, 'Please check the marketing consent field and try again.');
    }

    $validSelections = [
        '|' ,
        'trademark|Basic', 'trademark|Professional', 'trademark|Premium',
        'trademark|Trademark Basic', 'trademark|Trademark Standard', 'trademark|Trademark Deluxe',
        'copyright|Copyright Basic', 'copyright|Copyright Deluxe',
        'Amazon Brand Registry|',
    ];
    if (!in_array($service . '|' . $package, $validSelections, true)) {
        respond(422, false, 'Please choose a valid service package and try again.');
    }

    $details = [
        'Business description' => $description,
        'Selected service' => $service !== '' ? $service : 'Not specified',
        'Selected package' => $package !== '' ? $package : 'Not specified',
        'Marketing consent' => $consent === 'yes' ? 'Yes' : 'No',
    ];
} else {
    $message = trim((string) ($_POST['message'] ?? ''));
    if ($message === '' || text_length($message) > 3000 || contains_forbidden_controls($message)) {
        respond(422, false, 'Please enter a valid message of 3,000 characters or fewer.');
    }
    $details = ['Message' => $message];
}

$sourceLabel = $sourceLabels[$formSource];
$submittedAt = gmdate('F j, Y \a\t g:i A') . ' UTC';
$subjectType = $formSource === 'lead-modal' ? 'Lead Request' : 'Contact Enquiry';

$plainLines = [
    'NEW MARK CENTRAL PRO ' . strtoupper($subjectType),
    '========================================',
    '',
    'CONTACT DETAILS',
    '---------------',
    'Name: ' . $name,
    'Email: ' . $email,
    'Phone: ' . ($phone !== '' ? $phone : 'Not provided'),
    '',
    'REQUEST DETAILS',
    '---------------',
];
foreach ($details as $label => $value) {
    $plainLines[] = $label . ':';
    $plainLines[] = $value;
}
$plainLines = array_merge($plainLines, [
    '',
    'SUBMISSION DETAILS',
    '------------------',
    'Form: ' . $sourceLabel,
    'Source page: ' . $sourcePage,
    'Submitted: ' . $submittedAt,
    '',
    'Reply to this email to respond directly to ' . $name . '.',
]);
$plainTextBody = implode("\r\n", $plainLines);

$contactRows = [
    'Name' => $name,
    'Email' => $email,
    'Phone' => $phone !== '' ? $phone : 'Not provided',
];
$renderRows = static function (array $rows): string {
    $html = '';
    $index = 0;
    foreach ($rows as $label => $value) {
        $background = $index % 2 === 0 ? '#f6f8fb' : '#ffffff';
        $safeValue = nl2br(escape_html((string) $value), false);
        $html .= '<tr><td valign="top" style="width:34%;padding:10px 12px;background:' . $background . ';border-bottom:1px solid #e2e7ee;font-size:13px;font-weight:700;">' . escape_html((string) $label) . '</td><td style="padding:10px 12px;background:' . $background . ';border-bottom:1px solid #e2e7ee;font-size:14px;line-height:1.55;word-break:break-word;">' . $safeValue . '</td></tr>';
        $index++;
    }
    return $html;
};

$htmlContactRows = $renderRows($contactRows);
$htmlDetailRows = $renderRows($details);
$htmlSubmissionRows = $renderRows([
    'Form' => $sourceLabel,
    'Source page' => $sourcePage,
    'Submitted' => $submittedAt,
]);
$htmlSubjectType = escape_html($subjectType);
$htmlName = escape_html($name);
$htmlSourceLabel = escape_html($sourceLabel);

$htmlBody = <<<HTML
<!doctype html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>New {$htmlSubjectType}</title></head>
<body style="margin:0;padding:0;background:#f2f4f7;color:#172033;font-family:Arial,Helvetica,sans-serif;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;background:#f2f4f7;">
<tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="640" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:640px;background:#ffffff;border-radius:16px;overflow:hidden;">
<tr><td style="background:#0b1220;padding:30px 32px;color:#ffffff;"><div style="width:42px;height:4px;background:#e60023;border-radius:4px;margin-bottom:18px;"></div><div style="font-size:14px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#d7dee9;">Mark Central Pro</div><h1 style="margin:16px 0 12px;font-size:27px;line-height:1.25;color:#ffffff;">New {$htmlSubjectType}</h1><span style="display:inline-block;background:#e60023;color:#ffffff;border-radius:999px;padding:7px 12px;font-size:12px;font-weight:700;">{$htmlSourceLabel}</span></td></tr>
<tr><td style="padding:28px 32px 8px;"><h2 style="margin:0 0 14px;font-size:18px;color:#0b1220;">Contact details</h2><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;border-collapse:collapse;">{$htmlContactRows}</table></td></tr>
<tr><td style="padding:22px 32px 8px;"><h2 style="margin:0 0 14px;font-size:18px;color:#0b1220;">Request details</h2><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;border-collapse:collapse;">{$htmlDetailRows}</table></td></tr>
<tr><td style="padding:22px 32px 12px;"><h2 style="margin:0 0 14px;font-size:18px;color:#0b1220;">Submission details</h2><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;border-collapse:collapse;">{$htmlSubmissionRows}</table></td></tr>
<tr><td style="padding:14px 32px 28px;"><div style="background:#fff1f3;border-left:4px solid #e60023;border-radius:8px;padding:14px 16px;color:#4a1720;font-size:14px;line-height:1.5;">Reply to this email to respond directly to <strong>{$htmlName}</strong>.</div></td></tr>
<tr><td style="background:#0b1220;padding:18px 32px;color:#aeb8c5;font-size:12px;line-height:1.5;text-align:center;">Sent securely from markcentralpro.com.</td></tr>
</table>
</td></tr>
</table>
</body>
</html>
HTML;

$libraryRoot = __DIR__ . DIRECTORY_SEPARATOR . 'lib' . DIRECTORY_SEPARATOR . 'PHPMailer' . DIRECTORY_SEPARATOR . 'src';
require_once $libraryRoot . DIRECTORY_SEPARATOR . 'Exception.php';
require_once $libraryRoot . DIRECTORY_SEPARATOR . 'PHPMailer.php';
require_once $libraryRoot . DIRECTORY_SEPARATOR . 'SMTP.php';

$mailer = new PHPMailer(true);
try {
    $mailer->isSMTP();
    $mailer->Host = (string) $config['smtp_host'];
    $mailer->SMTPAuth = true;
    $mailer->Username = (string) $config['smtp_username'];
    $mailer->Password = (string) $config['smtp_password'];
    $mailer->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
    $mailer->Port = (int) $config['smtp_port'];
    $mailer->SMTPAutoTLS = true;
    $mailer->Timeout = 20;
    $mailer->CharSet = PHPMailer::CHARSET_UTF8;
    $mailer->setFrom((string) $config['smtp_from_email'], 'Mark Central Pro Website');
    $mailer->addAddress((string) $config['smtp_to_email']);
    $mailer->addReplyTo($email, $name);
    $mailer->Subject = 'New Mark Central Pro ' . $subjectType . ' - ' . $name;
    $mailer->isHTML(true);
    $mailer->Body = $htmlBody;
    $mailer->AltBody = $plainTextBody;
    $mailer->send();
} catch (Throwable $exception) {
    error_log('Form delivery failed during SMTP submission.');
    respond(500, false, "We couldn't send your request. Please contact our support team directly.");
}

respond(200, true, 'Thank you. Your request has been sent successfully.');
