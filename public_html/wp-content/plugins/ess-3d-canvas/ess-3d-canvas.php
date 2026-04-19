<?php
/**
 * Plugin Name: ESS 3D Canvas
 * Description: Lightweight Elementor widget that renders a 3D logo canvas using Three.js
 * Version: 1.0.0
 * Requires PHP: 8.0
 * Requires at least: 6.0
 * Author: ESS
 */

defined('ABSPATH') || exit;

define('ESS_3D_CANVAS_VERSION', '1.0.6');
define('ESS_3D_CANVAS_PATH', plugin_dir_path(__FILE__));
define('ESS_3D_CANVAS_URL', plugin_dir_url(__FILE__));

require_once ESS_3D_CANVAS_PATH . 'includes/class-plugin.php';

ESS_3D_Canvas\Plugin::instance();
