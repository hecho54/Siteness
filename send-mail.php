<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

$fname   = trim($data['fname']   ?? '');
$lname   = trim($data['lname']   ?? '');
$email   = trim($data['email']   ?? '');
$phone   = trim($data['phone']   ?? '');
$website = trim($data['website'] ?? '');
$service = trim($data['service'] ?? '');
$message = trim($data['message'] ?? '');

if (!$fname || !$lname || !$email || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['error' => 'Hiányzó vagy hibás mezők.']);
    exit;
}

$to      = 'info@siteness.hu';
$subject = '=?UTF-8?B?' . base64_encode("Új üzenet: $fname $lname") . '?=';
$headers = implode("\r\n", [
    'From: Siteness Kapcsolat <info@siteness.hu>',
    'Reply-To: ' . $email,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=UTF-8',
]);

$rows = "
    <tr><td style='padding:8px 0;color:#666;width:140px'>Név</td><td style='padding:8px 0;font-weight:600'>$fname $lname</td></tr>
    <tr><td style='padding:8px 0;color:#666'>Email</td><td style='padding:8px 0'><a href='mailto:$email'>$email</a></td></tr>
";
if ($phone)   $rows .= "<tr><td style='padding:8px 0;color:#666'>Telefon</td><td style='padding:8px 0'>$phone</td></tr>";
if ($website) $rows .= "<tr><td style='padding:8px 0;color:#666'>Weboldal</td><td style='padding:8px 0'><a href='$website'>$website</a></td></tr>";
if ($service) $rows .= "<tr><td style='padding:8px 0;color:#666'>Csomag</td><td style='padding:8px 0'>$service</td></tr>";

$msgBlock = $message
    ? "<div style='margin-top:16px'><p style='color:#666;margin-bottom:6px'>Üzenet:</p><p style='background:#f5f5f5;padding:16px;border-radius:8px;white-space:pre-wrap'>" . nl2br(htmlspecialchars($message)) . "</p></div>"
    : '';

$body = "
<div style='font-family:sans-serif;max-width:600px;margin:0 auto'>
  <h2 style='color:#00B4D8'>Új kapcsolatfelvétel – Siteness</h2>
  <table style='width:100%;border-collapse:collapse'>$rows</table>
  $msgBlock
</div>
";

$sent = mail($to, $subject, $body, $headers);

if ($sent) {
    echo json_encode(['ok' => true]);
} else {
    http_response_code(500);
    echo json_encode(['error' => 'Email küldési hiba.']);
}
