<?php
if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); exit; }

$data = json_decode(file_get_contents('php://input'), true);
$html = $data['html'] ?? '';

if (!$html) { http_response_code(400); echo 'Nincs tartalom.'; exit; }

$tmpFile = tempnam(sys_get_temp_dir(), 'siteness_') . '.zip';
$zip = new ZipArchive();
$zip->open($tmpFile, ZipArchive::CREATE);
$zip->addFromString('index.html', $html);
$zip->close();

header('Content-Type: application/zip');
header('Content-Disposition: attachment; filename="weboldal.zip"');
header('Content-Length: ' . filesize($tmpFile));
readfile($tmpFile);
unlink($tmpFile);
