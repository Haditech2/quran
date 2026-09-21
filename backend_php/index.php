<?php
// Root entry point: forwards cleanly to public/index.php
// This allows seamless hosting whether cPanel document root points to root or public/

require_once __DIR__ . '/public/index.php';
