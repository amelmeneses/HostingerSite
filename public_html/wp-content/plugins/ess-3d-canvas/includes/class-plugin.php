<?php
namespace ESS_3D_Canvas;

defined('ABSPATH') || exit;

class Plugin {
    private static ?self $instance = null;

    public static function instance(): self {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function __construct() {
        add_action('elementor/widgets/register', [$this, 'register_widgets']);
    }

    public function register_widgets($widgets_manager): void {
        require_once ESS_3D_CANVAS_PATH . 'includes/class-widget.php';
        $widgets_manager->register(new Widget());
    }

    public static function enqueue_widget_assets(): void {
        if (!wp_script_is('ess-3d-canvas', 'registered')) {
            wp_register_script(
                'ess-3d-canvas',
                ESS_3D_CANVAS_URL . 'assets/dist/ess-3d-canvas.js',
                [],
                ESS_3D_CANVAS_VERSION,
                true
            );
            wp_localize_script('ess-3d-canvas', 'ess3dCanvasConfig', [
                'modelPath' => ESS_3D_CANVAS_URL . 'assets/models/logo.glb',
            ]);
        }
        if (!wp_style_is('ess-3d-canvas', 'registered')) {
            wp_register_style(
                'ess-3d-canvas',
                ESS_3D_CANVAS_URL . 'assets/dist/ess-3d-canvas.css',
                [],
                ESS_3D_CANVAS_VERSION
            );
        }
    }
}
