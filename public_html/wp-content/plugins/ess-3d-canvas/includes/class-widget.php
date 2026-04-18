<?php
namespace ESS_3D_Canvas;

use Elementor\Widget_Base;
use Elementor\Controls_Manager;

defined('ABSPATH') || exit;

class Widget extends Widget_Base {

    public function __construct($data = [], $args = null) {
        parent::__construct($data, $args);
        Plugin::enqueue_widget_assets();
    }

    public function get_name(): string { return 'ess_3d_canvas'; }
    public function get_title(): string { return 'ESS 3D Canvas'; }
    public function get_icon(): string { return 'eicon-globe'; }
    public function get_categories(): array { return ['general']; }
    public function get_keywords(): array { return ['3d', 'logo', 'ess', 'canvas']; }
    public function get_style_depends(): array { return ['ess-3d-canvas']; }
    public function get_script_depends(): array { return ['ess-3d-canvas']; }

    protected function register_controls(): void {
        $this->start_controls_section('section_canvas', [
            'label' => '3D Canvas',
            'tab'   => Controls_Manager::TAB_CONTENT,
        ]);

        $this->add_control('mode', [
            'label'   => 'Mode',
            'type'    => Controls_Manager::SELECT,
            'default' => 'auto',
            'options' => [
                'auto'   => 'Auto (detect IP)',
                'manual' => 'Manual (fixed coordinates)',
            ],
        ]);

        $this->add_control('latitude', [
            'label'       => 'Latitude',
            'type'        => Controls_Manager::NUMBER,
            'default'     => 0,
            'min'         => -90,
            'max'         => 90,
            'step'        => 0.01,
            'condition'   => ['mode' => 'manual'],
        ]);

        $this->add_control('longitude', [
            'label'       => 'Longitude',
            'type'        => Controls_Manager::NUMBER,
            'default'     => 0,
            'min'         => -180,
            'max'         => 180,
            'step'        => 0.01,
            'condition'   => ['mode' => 'manual'],
        ]);

        $this->add_control('update_coords', [
            'label'        => 'Update header coordinates',
            'type'         => Controls_Manager::SWITCHER,
            'description'  => 'Update the Dec/AR/Lat/Long text in the header based on detected location',
            'default'      => '',
            'label_on'     => 'Yes',
            'label_off'    => 'No',
            'return_value' => 'yes',
            'condition'    => ['mode' => 'auto'],
        ]);

        $this->add_responsive_control('canvas_width', [
            'label'      => 'Width',
            'type'       => Controls_Manager::SLIDER,
            'size_units' => ['px', '%', 'vw'],
            'range'      => [
                'px' => ['min' => 50, 'max' => 800],
                '%'  => ['min' => 10, 'max' => 100],
                'vw' => ['min' => 5,  'max' => 100],
            ],
            'default'    => ['unit' => 'px', 'size' => 156],
            'selectors'  => [
                '{{WRAPPER}} .ess-3d-canvas' => 'width: {{SIZE}}{{UNIT}};',
            ],
        ]);

        $this->add_responsive_control('canvas_height', [
            'label'      => 'Height',
            'type'       => Controls_Manager::SLIDER,
            'size_units' => ['px', '%', 'vh'],
            'range'      => [
                'px' => ['min' => 50, 'max' => 800],
                '%'  => ['min' => 10, 'max' => 100],
                'vh' => ['min' => 5,  'max' => 100],
            ],
            'default'    => ['unit' => 'px', 'size' => 156],
            'selectors'  => [
                '{{WRAPPER}} .ess-3d-canvas' => 'height: {{SIZE}}{{UNIT}};',
            ],
        ]);

        $this->end_controls_section();
    }

    protected function render(): void {
        $s = $this->get_settings_for_display();
        $mode = esc_attr($s['mode']);
        $lat  = floatval($s['latitude'] ?? 0);
        $lng  = floatval($s['longitude'] ?? 0);
        $update_coords = ($s['update_coords'] ?? '') === 'yes' ? 'true' : 'false';
        ?>
        <div class="ess-3d-canvas"
             data-mode="<?php echo $mode; ?>"
             data-lat="<?php echo $lat; ?>"
             data-lng="<?php echo $lng; ?>"
             data-update-coords="<?php echo $update_coords; ?>">
        </div>
        <?php
    }
}
