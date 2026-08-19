<?php
//
// File generated for Dolibarr
//
$dolibarr_main_document_root = str_replace('\\', '/', dirname(__DIR__));
$dolibarr_main_url_root_alt = '/custom';
$dolibarr_main_document_root_alt = $dolibarr_main_document_root . '/custom';

if (isset($_ENV['VERCEL']) || isset($_SERVER['VERCEL']) || isset($_SERVER['HTTP_X_VERCEL_ID']) || (isset($_SERVER['DOCUMENT_ROOT']) && strpos($_SERVER['DOCUMENT_ROOT'], '/var/task') !== false) || (isset($_SERVER['PWD']) && strpos($_SERVER['PWD'], '/var/task') !== false)) {
	$dolibarr_main_url_root = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https" : "http") . "://" . ($_SERVER['HTTP_HOST'] ?? 'localhost');
	$dolibarr_main_data_root = '/tmp';
} elseif (stristr(PHP_OS, 'WIN') || (isset($_SERVER['HTTP_HOST']) && strpos($_SERVER['HTTP_HOST'], 'localhost') !== false)) {
	$dolibarr_main_url_root = 'http://localhost:8000';
	$dolibarr_main_data_root = $dolibarr_main_document_root . '/documents';
} else {
	$dolibarr_main_url_root = 'https://gestion.akablishop.ma';
	$dolibarr_main_data_root = "/home/u134104531/domains/akablishop.ma/public_html/gestion_app_akabli/documents";
}

$dolibarr_main_db_host = 'localhost';
$dolibarr_main_db_port = '0';
$dolibarr_main_db_name = 'u134104531_akabligest';
$dolibarr_main_db_prefix = 'llx_';
$dolibarr_main_db_user = 'u134104531_akabligest';
$dolibarr_main_db_pass = 'ElafConsult@123456';
$dolibarr_main_db_type = 'mysqli';
$dolibarr_main_db_character_set = 'utf8';
$dolibarr_main_db_collation = 'utf8_unicode_ci';
$dolibarr_main_authentication = 'dolibarr';

$dolibarr_main_prod = '0';
$dolibarr_main_force_https = '0';
$dolibarr_main_restrict_os_commands = 'mariadb-dump, mariadb, mysqldump, mysql, pg_dump, pg_restore, clamdscan, clamdscan.exe';
$dolibarr_nocsrfcheck = '0';
$dolibarr_main_instance_unique_id = '7121fc42feb10b11bc1c726162f1e100';
$dolibarr_mailing_limit_sendbyweb = '0';
$dolibarr_mailing_limit_sendbycli = '0';
