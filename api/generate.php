<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }
if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); echo json_encode(['error' => 'Method not allowed']); exit; }

require_once dirname(__DIR__) . '/config.php';

$data    = json_decode(file_get_contents('php://input'), true);
$prompt  = trim($data['prompt']  ?? '');
$history = $data['history'] ?? [];

if (!$prompt) { http_response_code(400); echo json_encode(['error' => 'Hiányzó prompt.']); exit; }

$system = <<<SYSTEM
You are an elite web developer who creates stunning, production-ready websites.

RULES:
- Return ONLY the complete HTML file — no explanation, no markdown, no code fences
- All CSS goes inside a <style> tag in <head>
- All JavaScript goes inside a <script> tag before </body>
- Use modern design: clean typography, good spacing, beautiful color palettes
- Use real placeholder images from https://picsum.photos (e.g. https://picsum.photos/seed/food/800/500)
- Make it fully responsive (mobile-first)
- Use Google Fonts (Plus Jakarta Sans or Inter are great choices)
- Include smooth animations and hover effects
- Add real, meaningful content (not Lorem Ipsum) based on what the user describes
- If the user writes in Hungarian, generate the site in Hungarian
- Include all standard sections relevant to the business type
- Make the design feel premium and modern — not generic or template-like
- Use CSS variables for colors, consistent design tokens
- Hero section must have a strong headline, subheading, and CTA buttons
SYSTEM;

$messages = [];
foreach ($history as $msg) {
    if (isset($msg['role'], $msg['content'])) {
        $messages[] = ['role' => $msg['role'], 'content' => $msg['content']];
    }
}
$messages[] = ['role' => 'user', 'content' => $prompt];

$payload = [
    'model'      => 'claude-sonnet-4-6',
    'max_tokens' => 8000,
    'system'     => $system,
    'messages'   => $messages,
];

$ch = curl_init();
curl_setopt_array($ch, [
    CURLOPT_URL            => 'https://api.anthropic.com/v1/messages',
    CURLOPT_POST           => true,
    CURLOPT_HTTPHEADER     => [
        'x-api-key: '         . ANTHROPIC_API_KEY,
        'anthropic-version: 2023-06-01',
        'content-type: application/json',
    ],
    CURLOPT_POSTFIELDS     => json_encode($payload),
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT        => 120,
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if (!$response || $httpCode !== 200) {
    http_response_code(500);
    echo json_encode(['error' => 'API hiba. Ellenőrizd az API kulcsot.']);
    exit;
}

$result = json_decode($response, true);
$html   = $result['content'][0]['text'] ?? '';

// Strip accidental markdown fences if Claude adds them
$html = preg_replace('/^```html\s*/i', '', trim($html));
$html = preg_replace('/```\s*$/', '', $html);

echo json_encode(['html' => trim($html)]);
