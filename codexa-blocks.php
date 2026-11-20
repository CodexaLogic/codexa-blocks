<?php
/**
 * Plugin Name:       Codexa Blocks
 * Description:       Create beautiful, cohesive pages with accessible blocks, flexible layouts, engaging content and effortless styling for desktop, tablet and mobile.
 * Version:           1.0.0
 * Requires at least: 6.7
 * Requires PHP:      8.0
 * Author:            Codexa
 * Author URI:        https://codexalogic.com
 * License:           GPLv2 or later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       codexa-blocks
 * Domain Path:       /languages
 *
 * @package CodexaBlocks
 */

if (!defined('ABSPATH')) {
	exit;
}

// Define plugin constants before registering the autoloader.
if (!defined('CODEXA_BLOCKS_VERSION')) {
	define('CODEXA_BLOCKS_VERSION', '1.0.0');
}
if (!defined('CODEXA_BLOCKS_FILE')) {
	define('CODEXA_BLOCKS_FILE', __FILE__);
}
if (!defined('CODEXA_BLOCKS_DIR')) {
	define('CODEXA_BLOCKS_DIR', plugin_dir_path(__FILE__));
}
if (!defined('CODEXA_BLOCKS_URL')) {
	define('CODEXA_BLOCKS_URL', plugin_dir_url(__FILE__));
}

require_once CODEXA_BLOCKS_DIR . 'includes/Core/Autoloader.php';
CodexaBlocks\Core\Autoloader::register();

(new CodexaBlocks\Core\CodexaBlocks())->run();

register_activation_hook(__FILE__, [CodexaBlocks\Settings\ColorSettings::class, 'activate']);
register_activation_hook(__FILE__, [CodexaBlocks\Settings\BackdropSettings::class, 'activate']);
