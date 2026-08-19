<?php
ini_set('display_errors', '1');
ini_set('display_startup_errors', '1');
error_reporting(E_ALL & ~E_DEPRECATED & ~E_NOTICE);

try {
    // Set working directory to project root
    $rootDir = str_replace('\\', '/', dirname(__DIR__));
    chdir($rootDir);

    $uri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);

    // Setup SERVER variables for Dolibarr routing
    $_SERVER['DOCUMENT_ROOT'] = $rootDir;
    $script = ($uri === '/' || empty($uri)) ? '/index.php' : $uri;
    $_SERVER['SCRIPT_FILENAME'] = $rootDir . $script;
    $_SERVER['SCRIPT_NAME'] = $script;
    $_SERVER['PHP_SELF'] = $script;

    if ($uri === '/' || $uri === '' || empty($uri)) {
        require $rootDir . '/index.php';
        exit;
    }

    $file = $rootDir . $uri;

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
    require $rootDir . '/index.php';
} catch (\Throwable $e) {
    http_response_code(500);
    echo "<h1>PHP Exception on Vercel</h1>";
    echo "<p><strong>Message:</strong> " . htmlspecialchars($e->getMessage()) . "</p>";
    echo "<p><strong>File:</strong> " . htmlspecialchars($e->getFile()) . ":" . $e->getLine() . "</p>";
    echo "<pre>" . htmlspecialchars($e->getTraceAsString()) . "</pre>";
}
