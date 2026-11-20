<?php
/**
 * Removes the plugin's settings when it's deleted from the Plugins screen.
 *
 * On a multisite network every site keeps its own settings, so they're
 * removed from each site.
 *
 * @package CodexaBlocks
 */

if (!defined('WP_UNINSTALL_PLUGIN')) {
	exit;
}

// ColorSettings::OPTION and BackdropSettings::OPTION. The plugin's classes
// aren't loaded here.
$codexa_blocks_options = ['codexa_blocks_colors', 'codexa_blocks_backdrops'];

if (is_multisite()) {
	foreach (get_sites(['fields' => 'ids', 'number' => 0]) as $codexa_blocks_site) {
		switch_to_blog($codexa_blocks_site);
		array_map('delete_option', $codexa_blocks_options);
		restore_current_blog();
	}
} else {
	array_map('delete_option', $codexa_blocks_options);
}
