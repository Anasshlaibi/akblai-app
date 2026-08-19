<?php
// Set working directory to project root
chdir(dirname(__DIR__));

// Get requested URI path
$uri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);

// Normalize path
if ($uri === '/' || $uri === '' || empty($uri)) {
    require dirname(__DIR__) . '/index.php';
    exit;
}

$file = dirname(__DIR__) . $uri;

if (is_file($file)) {
    $ext = pathinfo($file, PATHINFO_EXTENSION);
    if ($ext === 'php') {
        require $file;
    } else {
        $mimes = [
            'css' => 'text/css',
            'js' => 'application/javascript',
            'png' => 'image/png',
            'jpg' => 'image/jpeg',
            'jpeg' => 'image/jpeg',
            'gif' => 'image/gif',
            'svg' => 'image/svg+xml',
            'ico' => 'image/x-icon',
            'woff' => 'font/woff',
            'woff2' => 'font/woff2',
            'ttf' => 'font/ttf'
        ];
        if (isset($mimes[$ext])) {
            header("Content-Type: " . $mimes[$ext]);
        }
        readfile($file);
    }
    exit;
}

if (is_dir($file) && is_file($file . '/index.php')) {
    require $file . '/index.php';
    exit;
}

// Default fallback
require dirname(__DIR__) . '/index.php';
