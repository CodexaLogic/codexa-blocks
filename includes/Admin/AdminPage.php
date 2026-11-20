<?php
/**
 * The plugin's admin pages, Overview and Colors.
 *
 * @package CodexaBlocks
 */

namespace CodexaBlocks\Admin;

use CodexaBlocks\Blocks\BlockRegistrar;
use CodexaBlocks\Settings\BackdropSettings;
use CodexaBlocks\Settings\ColorSettings;

if (!defined('ABSPATH')) {
	exit;
}

/**
 * Adds the Codexa Blocks menu with two pages.
 *
 * - Overview lists the blocks, help links, what's new and a system check
 *   to copy into a support request.
 * - Colors sets the site's default block colors (ColorSettings) and
 *   backdrops (BackdropSettings) in a React app (src/admin), beside a live
 *   preview.
 *
 * Add-ons add their own pages on the codexa_blocks/admin_menu action.
 */
final class AdminPage {

	/**
	 * Menu slug, also the Overview page's.
	 *
	 * @var string
	 */
	public const SLUG = 'codexa-blocks';

	/**
	 * The Colors page's slug.
	 *
	 * @var string
	 */
	public const COLORS_SLUG = 'codexa-blocks-colors';

	/**
	 * Script and style handle of the admin bundle (build/admin).
	 *
	 * @var string
	 */
	private const HANDLE = 'codexa-blocks-admin';

	/**
	 * The plugin's icon, the Row block's three columns, as an SVG path on a
	 * 24 by 24 grid. Used by the menu and the pages' top bar until the
	 * plugin has a logo.
	 *
	 * @var string
	 */
	private const ICON_PATH = 'M2.5 4h3A1.5 1.5 0 0 1 7 5.5v9A1.5 1.5 0 0 1 5.5 16h-3A1.5 1.5 0 0 1 1 14.5v-9A1.5 1.5 0 0 1 2.5 4ZM10.5 4h3A1.5 1.5 0 0 1 15 5.5v9a1.5 1.5 0 0 1-1.5 1.5h-3A1.5 1.5 0 0 1 9 14.5v-9A1.5 1.5 0 0 1 10.5 4ZM18.5 4h3A1.5 1.5 0 0 1 23 5.5v9a1.5 1.5 0 0 1-1.5 1.5h-3A1.5 1.5 0 0 1 17 14.5v-9A1.5 1.5 0 0 1 18.5 4ZM1 18.25h22v1.5H1Z';

	/**
	 * Who sees the pages, people who can change the site's settings.
	 *
	 * @var string
	 */
	private const CAPABILITY = 'manage_options';

	/**
	 * Where the menu sits, right after Settings (80), the last WordPress menu.
	 *
	 * @var int
	 */
	private const MENU_POSITION = 81;

	/**
	 * Lowest versions the plugin supports, from its header.
	 *
	 * @return array{wp: string, php: string} The WordPress and PHP versions.
	 */
	private static function requires(): array {
		return get_file_data(CODEXA_BLOCKS_FILE, ['wp' => 'Requires at least', 'php' => 'Requires PHP']);
	}

	/**
	 * Hook suffixes of the plugin's pages, set when the menu is added. An
	 * add-on's page is keyed by its slug.
	 *
	 * @var array<string, string>
	 */
	private array $pages = [];

	/**
	 * Pages add-ons add with the codexa_blocks/admin_pages filter, read
	 * once when the menu is added.
	 *
	 * @var array<string, array{label: string, render: callable, capability: string}>
	 */
	private array $addOnPages = [];

	/**
	 * Adds the menu and its pages, after WordPress's own menus. Runs on
	 * admin_menu.
	 *
	 * @return void
	 */
	public function addMenu(): void {
		$this->pages['overview'] = (string) add_menu_page(
			__('Codexa Blocks', 'codexa-blocks'),
			__('Codexa Blocks', 'codexa-blocks'),
			self::CAPABILITY,
			self::SLUG,
			[$this, 'renderOverview'],
			self::menuIcon(),
			self::MENU_POSITION
		);

		// The first submenu item renames the menu's own link from "Codexa Blocks".
		add_submenu_page(self::SLUG, __('Overview', 'codexa-blocks'), __('Overview', 'codexa-blocks'), self::CAPABILITY, self::SLUG, [$this, 'renderOverview']);

		$this->pages['colors'] = (string) add_submenu_page(
			self::SLUG,
			__('Colors', 'codexa-blocks'),
			__('Colors', 'codexa-blocks'),
			self::CAPABILITY,
			self::COLORS_SLUG,
			[$this, 'renderColors']
		);

		foreach ($this->addOnPages() as $slug => $page) {
			$this->pages[$slug] = (string) add_submenu_page(
				self::SLUG,
				$page['label'],
				$page['label'],
				$page['capability'],
				$slug,
				fn() => $this->renderAddOnPage($slug)
			);
		}

		/**
		 * Fires after the Codexa Blocks menu is added, for add-ons to add
		 * pages of their own design to it. A page that should look like the
		 * plugin's own, with its top bar and tabs, uses the
		 * codexa_blocks/admin_pages filter instead.
		 *
		 *     add_action('codexa_blocks/admin_menu', function (string $parent) {
		 *         add_submenu_page($parent, 'Pro', 'Pro', 'manage_options', 'my-add-on', 'my_add_on_page');
		 *     });
		 *
		 * @since 1.0.0
		 *
		 * @param string $parent The menu's slug, for add_submenu_page().
		 */
		do_action('codexa_blocks/admin_menu', self::SLUG);
	}

	/**
	 * Adds a body class on the plugin's pages for the admin stylesheet. Runs on
	 * admin_body_class.
	 *
	 * @param  string $classes Space-separated body classes.
	 * @return string The classes, with "codexa-admin-screen" on the plugin's pages.
	 */
	public function addBodyClass(string $classes): string {
		return $this->isOwnScreen() ? $classes . ' codexa-admin-screen' : $classes;
	}

	/**
	 * Prints the top bar on the plugin's pages, with the icon, the plugin's
	 * name and its version, above WordPress's notices. Runs on in_admin_header.
	 *
	 * @return void
	 */
	public function renderTopbar(): void {
		if (!$this->isOwnScreen()) {
			return;
		}

		?>
		<div class="codexa-admin-topbar">
			<svg class="codexa-admin-topbar__logo" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false"><path fill="currentColor" d="<?php echo esc_attr(self::ICON_PATH); ?>"/></svg>
			<span class="codexa-admin-topbar__brand"><?php esc_html_e('Codexa Blocks', 'codexa-blocks'); ?></span>
			<span class="codexa-admin-topbar__version">
				<?php
				/* translators: %s: Plugin version, e.g. "1.0.0". */
				echo esc_html(sprintf(__('v%s', 'codexa-blocks'), CODEXA_BLOCKS_VERSION));
				?>
			</span>
		</div>
		<?php
	}

	/**
	 * Loads the pages' styles, and on the Colors page its app and preview. Runs
	 * on admin_enqueue_scripts, only on the plugin's pages.
	 *
	 * @param  string $hook The current admin page's hook suffix.
	 * @return void
	 */
	public function enqueue(string $hook): void {
		if (!in_array($hook, $this->pages, true)) {
			return;
		}

		$assetFile = CODEXA_BLOCKS_DIR . 'build/admin/index.asset.php';

		if (!is_file($assetFile)) {
			return;
		}

		$asset   = require $assetFile;
		$version = $asset['version'] ?? CODEXA_BLOCKS_VERSION;

		wp_enqueue_style(self::HANDLE, CODEXA_BLOCKS_URL . 'build/admin/index.css', ['wp-components'], $version);
		wp_style_add_data(self::HANDLE, 'rtl', 'replace');

		if ($hook !== ($this->pages['colors'] ?? '')) {
			return;
		}

		wp_enqueue_script(self::HANDLE, CODEXA_BLOCKS_URL . 'build/admin/index.js', $asset['dependencies'] ?? [], $version, ['in_footer' => true]);
		wp_set_script_translations(self::HANDLE, 'codexa-blocks', CODEXA_BLOCKS_DIR . 'languages');

		wp_add_inline_script(
			self::HANDLE,
			// JSON_HEX_TAG and JSON_HEX_AMP keep theme text, such as the CSS in
			// themeStyles, from closing the script tag.
			'window.codexaBlocksColors = ' . wp_json_encode(
				[
					'fields'         => array_values(ColorSettings::fields()),
					'saved'          => ColorSettings::sanitize(get_option(ColorSettings::OPTION, [])),
					'option'         => ColorSettings::OPTION,
					'backdrops'      => array_values(BackdropSettings::backdrops()),
					'savedBackdrops' => (object) BackdropSettings::sanitize(get_option(BackdropSettings::OPTION, [])),
					'backdropOption' => BackdropSettings::OPTION,
					'palette'        => self::palette(),
					'themeStyles'    => self::themeStyles(),
					'theme'          => self::themeColors(),
				],
				JSON_HEX_TAG | JSON_HEX_AMP
			) . ';',
			'before'
		);

		// The preview needs the blocks' styles and the theme's palette variables
		// (--wp--preset--color--*), which the admin doesn't print.
		foreach (self::blockTypes() as $type) {
			foreach ($type->style_handles as $handle) {
				wp_enqueue_style($handle);
			}

			foreach ($type->view_script_handles as $handle) {
				wp_enqueue_script($handle);
			}
		}

		wp_add_inline_style(BlockRegistrar::COMMON_STYLE, wp_get_global_stylesheet(['variables']));
	}

	/**
	 * Prints the Overview page.
	 *
	 * @return void
	 */
	public function renderOverview(): void {
		$blocks = array_filter(self::blockTypes(), static fn(\WP_Block_Type $type): bool => empty($type->parent));
		$links  = self::links();

		?>
		<div class="wrap codexa-admin">
			<?php $this->renderToolbar(self::SLUG); ?>

			<section class="codexa-admin__card" aria-labelledby="codexa-start">
				<h2 id="codexa-start"><?php esc_html_e('Get started', 'codexa-blocks'); ?></h2>
				<ol class="codexa-admin__steps">
					<li><?php esc_html_e('Open a page or post in the block editor.', 'codexa-blocks'); ?></li>
					<li><?php esc_html_e('Click the + button (Toggle block inserter) and open the Codexa Blocks category, or type a block\'s name.', 'codexa-blocks'); ?></li>
					<li><?php esc_html_e('Switch the editor\'s preview to Desktop, Tablet or Mobile to set spacing, layout and visibility for that device alone.', 'codexa-blocks'); ?></li>
				</ol>
				<p class="codexa-admin__actions">
					<a class="button button-primary" href="<?php echo esc_url(admin_url('post-new.php?post_type=page')); ?>"><?php esc_html_e('Create a page', 'codexa-blocks'); ?></a>
					<a class="button" href="<?php echo esc_url(admin_url('admin.php?page=' . self::COLORS_SLUG)); ?>"><?php esc_html_e('Set your colors', 'codexa-blocks'); ?></a>
				</p>
			</section>

			<section class="codexa-admin__card" aria-labelledby="codexa-blocks">
				<h2 id="codexa-blocks"><?php esc_html_e('Blocks', 'codexa-blocks'); ?></h2>
				<ul class="codexa-admin__blocks">
					<?php foreach ($blocks as $type) : ?>
						<li>
							<h3><?php echo esc_html($type->title); ?></h3>
							<p><?php echo esc_html($type->description); ?></p>
						</li>
					<?php endforeach; ?>
				</ul>
			</section>

			<div class="codexa-admin__columns">
				<section class="codexa-admin__card" aria-labelledby="codexa-help">
					<h2 id="codexa-help"><?php esc_html_e('Help', 'codexa-blocks'); ?></h2>
					<ul class="codexa-admin__links">
						<?php foreach ($links as $link) : ?>
							<li>
								<a href="<?php echo esc_url($link['url']); ?>" target="_blank" rel="noopener">
									<?php echo esc_html($link['label']); ?>
									<span class="screen-reader-text"><?php esc_html_e('(opens in a new tab)', 'codexa-blocks'); ?></span>
								</a>
								<?php if ($link['description'] !== '') : ?>
									<p><?php echo esc_html($link['description']); ?></p>
								<?php endif; ?>
							</li>
						<?php endforeach; ?>
					</ul>
				</section>

				<section class="codexa-admin__card" aria-labelledby="codexa-new">
					<h2 id="codexa-new">
						<?php
						/* translators: %s: Plugin version, e.g. "1.0.0". */
						echo esc_html(sprintf(__('What\'s new in %s', 'codexa-blocks'), CODEXA_BLOCKS_VERSION));
						?>
					</h2>
					<?php $changes = self::changes(); ?>
					<?php if ($changes) : ?>
						<ul class="codexa-admin__changes">
							<?php foreach ($changes as $change) : ?>
								<li><?php echo esc_html($change); ?></li>
							<?php endforeach; ?>
						</ul>
					<?php else : ?>
						<p><?php esc_html_e('No changes listed for this version.', 'codexa-blocks'); ?></p>
					<?php endif; ?>
				</section>
			</div>

			<?php $this->renderSystemCheck(); ?>
		</div>
		<?php
	}

	/**
	 * Prints the Colors page, with the app's container beside a preview the
	 * blocks render on the theme's background. The app recolors it live.
	 *
	 * @return void
	 */
	public function renderColors(): void {
		$background = self::themeColors()['background'];

		?>
		<div class="wrap codexa-admin">
			<?php $this->renderToolbar(self::COLORS_SLUG); ?>
			<div class="codexa-admin__colors">
				<div id="codexa-colors-app" class="codexa-admin__colors-app">
					<p><?php esc_html_e('Loading…', 'codexa-blocks'); ?></p>
				</div>
				<aside class="codexa-admin__preview" aria-labelledby="codexa-preview-title">
					<h2 id="codexa-preview-title"><?php esc_html_e('Preview', 'codexa-blocks'); ?></h2>
					<div id="codexa-colors-preview" class="codexa-admin__preview-blocks" style="--codexa-preview-background: <?php echo esc_attr($background); ?>">
						<?php
						// Rendered by the blocks, so the preview is the real markup.
						echo do_blocks(self::previewContent()); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Block output, escaped by each block's renderer.
						?>
					</div>
				</aside>
			</div>
		</div>
		<?php
	}

	/**
	 * Prints an add-on's page, the plugin's frame (heading, tabs, styles and
	 * top bar), with the add-on's content inside.
	 *
	 * @param  string $slug The page's slug.
	 * @return void
	 */
	private function renderAddOnPage(string $slug): void {
		$page = $this->addOnPages[$slug] ?? null;

		if ($page === null || !current_user_can($page['capability'])) {
			return;
		}

		?>
		<div class="wrap codexa-admin">
			<?php $this->renderToolbar($slug); ?>
			<?php call_user_func($page['render']); ?>
		</div>
		<?php
	}

	/**
	 * The pages add-ons add, from the codexa_blocks/admin_pages filter.
	 * A page with an invalid slug, label or render function is left out, as
	 * is one that would replace Overview or Colors.
	 *
	 * @return array<string, array{label: string, render: callable, capability: string}> Slug => page.
	 */
	private function addOnPages(): array {
		/**
		 * Filters the pages add-ons add to the Codexa Blocks menu. Each gets the
		 * plugin's frame (top bar, a tab and the admin styles), so it can use the
		 * same cards (codexa-admin__card) and buttons. The render function prints
		 * only the content, escaped.
		 *
		 *     add_filter('codexa_blocks/admin_pages', function (array $pages): array {
		 *         $pages['my-add-on'] = [
		 *             'label'      => __('My add-on', 'my-add-on'),
		 *             'render'     => 'my_add_on_page_content',
		 *             'capability' => 'manage_options',
		 *         ];
		 *         return $pages;
		 *     });
		 *
		 * @since 1.0.0
		 *
		 * @param array<string, array{label: string, render: callable, capability?: string}> $pages Slug => page. The capability defaults to manage_options.
		 */
		$pages = apply_filters('codexa_blocks/admin_pages', []);

		$this->addOnPages = [];

		foreach (is_array($pages) ? $pages : [] as $slug => $page) {
			if (
				is_string($slug)
				&& preg_match('/^[a-z0-9-]+$/', $slug)
				&& !in_array($slug, [self::SLUG, self::COLORS_SLUG], true)
				&& is_string($page['label'] ?? null)
				&& is_callable($page['render'] ?? null)
			) {
				$this->addOnPages[$slug] = [
					'label'      => $page['label'],
					'render'     => $page['render'],
					'capability' => is_string($page['capability'] ?? null) ? $page['capability'] : self::CAPABILITY,
				];
			}
		}

		return $this->addOnPages;
	}

	/**
	 * Prints the screen-reader heading and the tab bar, which on the Colors
	 * page also holds the Save button. WordPress prints notices after the <hr>.
	 *
	 * @param  string $current The current page's slug.
	 * @return void
	 */
	private function renderToolbar(string $current): void {
		$tabs = [
			self::SLUG        => __('Overview', 'codexa-blocks'),
			self::COLORS_SLUG => __('Colors', 'codexa-blocks'),
		];

		foreach ($this->addOnPages as $slug => $page) {
			if (current_user_can($page['capability'])) {
				$tabs[$slug] = $page['label'];
			}
		}

		?>
		<h1 class="screen-reader-text"><?php echo esc_html($tabs[$current] ?? get_admin_page_title()); ?></h1>
		<div class="codexa-admin__toolbar">
			<nav class="codexa-admin__tabs" aria-label="<?php esc_attr_e('Codexa Blocks pages', 'codexa-blocks'); ?>">
				<?php foreach ($tabs as $slug => $label) : ?>
					<a class="codexa-admin__tab" href="<?php echo esc_url(admin_url('admin.php?page=' . $slug)); ?>"<?php echo $slug === $current ? ' aria-current="page"' : ''; ?>><?php echo esc_html($label); ?></a>
				<?php endforeach; ?>
			</nav>
			<?php if ($current === self::COLORS_SLUG) : ?>
				<div id="codexa-colors-toolbar" class="codexa-admin__toolbar-actions"></div>
			<?php endif; ?>
		</div>
		<hr class="wp-header-end">
		<?php
	}

	/**
	 * Whether the current admin screen is one of the plugin's pages.
	 *
	 * @return bool True on Overview, Colors and add-ons' pages.
	 */
	private function isOwnScreen(): bool {
		$screen = get_current_screen();

		return $screen !== null && in_array($screen->id, $this->pages, true);
	}

	/**
	 * Prints the system check that a support request needs, as a table and
	 * as text to copy.
	 *
	 * @return void
	 */
	private function renderSystemCheck(): void {
		global $wp_version;

		$theme    = wp_get_theme();
		$requires = self::requires();
		$checks   = [
			[
				'label' => __('WordPress', 'codexa-blocks'),
				'value' => (string) $wp_version,
				/* translators: %s: A version number, e.g. "6.7" or "8.0". */
				'note'   => sprintf(__('%s or later required', 'codexa-blocks'), $requires['wp']),
				'passes' => version_compare((string) $wp_version, $requires['wp'], '>='),
			],
			[
				'label' => __('PHP', 'codexa-blocks'),
				'value' => PHP_VERSION,
				/* translators: %s: A version number, e.g. "6.7" or "8.0". */
				'note'   => sprintf(__('%s or later required', 'codexa-blocks'), $requires['php']),
				'passes' => version_compare(PHP_VERSION, $requires['php'], '>='),
			],
			[
				'label'  => __('Theme', 'codexa-blocks'),
				'value'  => sprintf('%s %s', $theme->get('Name'), $theme->get('Version')),
				'note'   => wp_is_block_theme() ? __('Block theme', 'codexa-blocks') : __('Classic theme', 'codexa-blocks'),
				'passes' => true,
			],
		];

		foreach (self::buildFiles() as $label => $file) {
			$exists   = is_file(CODEXA_BLOCKS_DIR . $file);
			$checks[] = [
				'label'  => $label,
				'value'  => $file,
				'note'   => $exists ? __('Found', 'codexa-blocks') : __('Missing: run npm run build, or reinstall the plugin', 'codexa-blocks'),
				'passes' => $exists,
			];
		}

		$customized = count(ColorSettings::sanitize(get_option(ColorSettings::OPTION, [])));
		$checks[]   = [
			'label'  => __('Custom colors', 'codexa-blocks'),
			'value'  => (string) $customized,
			'note'   => $customized ? __('Set on the Colors page', 'codexa-blocks') : __('Using the plugin\'s colors', 'codexa-blocks'),
			'passes' => true,
		];

		$text = sprintf('Codexa Blocks %s', CODEXA_BLOCKS_VERSION) . "\n";

		foreach ($checks as $check) {
			$text .= sprintf('%s: %s (%s)', $check['label'], $check['value'], $check['note']) . "\n";
		}

		?>
		<section class="codexa-admin__card" aria-labelledby="codexa-system">
			<h2 id="codexa-system"><?php esc_html_e('System check', 'codexa-blocks'); ?></h2>
			<table class="widefat striped codexa-admin__system">
				<tbody>
					<?php foreach ($checks as $check) : ?>
						<tr>
							<th scope="row"><?php echo esc_html($check['label']); ?></th>
							<td><?php echo esc_html($check['value']); ?></td>
							<td>
								<span class="codexa-admin__status <?php echo $check['passes'] ? 'is-ok' : 'is-error'; ?>">
									<span class="screen-reader-text"><?php echo $check['passes'] ? esc_html__('OK:', 'codexa-blocks') : esc_html__('Problem:', 'codexa-blocks'); ?></span>
									<?php echo esc_html($check['note']); ?>
								</span>
							</td>
						</tr>
					<?php endforeach; ?>
				</tbody>
			</table>
			<p>
				<label for="codexa-system-text"><?php esc_html_e('To include in a support request:', 'codexa-blocks'); ?></label>
				<textarea id="codexa-system-text" class="large-text code" rows="<?php echo (int) count($checks) + 1; ?>" readonly><?php echo esc_textarea($text); ?></textarea>
			</p>
		</section>
		<?php
	}

	/**
	 * The plugin's block types, its own and any an add-on registers in the
	 * same namespace.
	 *
	 * @return \WP_Block_Type[] The block types.
	 */
	private static function blockTypes(): array {
		return array_filter(
			\WP_Block_Type_Registry::get_instance()->get_all_registered(),
			static fn(\WP_Block_Type $type): bool => str_starts_with($type->name, 'codexa-blocks/')
		);
	}

	/**
	 * The help links.
	 *
	 * @return array<int, array{label: string, url: string, description: string}> The links.
	 */
	private static function links(): array {
		$links = [
			[
				'label'       => __('Documentation', 'codexa-blocks'),
				'url'         => 'https://codexalogic.com/documentation/',
				'description' => __('Guides for each block and setting.', 'codexa-blocks'),
			],
			[
				'label'       => __('Support forum', 'codexa-blocks'),
				'url'         => 'https://wordpress.org/support/plugin/codexa-blocks/',
				'description' => __('Ask a question or report a bug. Include the system check below.', 'codexa-blocks'),
			],
		];

		/**
		 * Filters the help links on the Overview page.
		 *
		 * @since 1.0.0
		 *
		 * @param array<int, array{label: string, url: string, description: string}> $links The links.
		 */
		$filtered = apply_filters('codexa_blocks/admin_links', $links);

		return is_array($filtered)
			? array_values(
				array_filter(
					$filtered,
					static fn($link): bool => is_array($link) && is_string($link['label'] ?? null) && is_string($link['url'] ?? null)
				)
			)
			: $links;
	}

	/**
	 * This version's changes, from the Changelog in readme.txt.
	 *
	 * @return string[] One entry per change, e.g. "New: First release…".
	 */
	private static function changes(): array {
		$file = CODEXA_BLOCKS_DIR . 'readme.txt';

		if (!is_readable($file)) {
			return [];
		}

		$readme  = (string) file_get_contents($file); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents -- A local file in the plugin.
		$pattern = '/^= ' . preg_quote(CODEXA_BLOCKS_VERSION, '/') . ' =\s*$(.*?)(?=^=|\z)/ms';

		if (!preg_match($pattern, $readme, $section)) {
			return [];
		}

		preg_match_all('/^\*\s+(.+)$/m', $section[1], $items);

		return array_map('trim', $items[1]);
	}

	/**
	 * The build files the plugin needs, by what they are.
	 *
	 * @return array<string, string> Label => path inside the plugin.
	 */
	private static function buildFiles(): array {
		return [
			__('Blocks', 'codexa-blocks')            => 'build/blocks/blocks-manifest.php',
			__('Shared stylesheet', 'codexa-blocks') => 'build/assets/common/css/common.css',
			__('Editor script', 'codexa-blocks')     => 'build/editor/index.js',
			__('Icons', 'codexa-blocks')             => 'build/icons/codexa.json',
		];
	}

	/**
	 * The theme's color palette (theme, then WordPress's defaults when the
	 * theme keeps them, then the site's custom colors), for the Colors page.
	 *
	 * @return array<int, array{name: string, slug: string, color: string}> The colors.
	 */
	private static function palette(): array {
		$settings = wp_get_global_settings(['color']);
		$origins  = $settings['palette'] ?? [];
		$colors   = array_merge(
			$origins['theme'] ?? [],
			($settings['defaultPalette'] ?? true) ? ($origins['default'] ?? []) : [],
			$origins['custom'] ?? []
		);
		$seen    = [];
		$palette = [];

		foreach ($colors as $color) {
			$slug = (string) ($color['slug'] ?? '');

			if ($slug === '' || isset($seen[$slug]) || !is_string($color['color'] ?? null)) {
				continue;
			}

			$seen[$slug] = true;
			$palette[]   = [
				'name'  => (string) ($color['name'] ?? $slug),
				'slug'  => $slug,
				'color' => $color['color'],
			];
		}

		return $palette;
	}

	/**
	 * The CSS that gives the theme's palette colors their values, for the
	 * Colors page's hidden frame (resolvePalette() in theme-palette.js). Reads
	 * only the theme's own .css files.
	 *
	 * @return string[] Stylesheets, as CSS.
	 */
	private static function themeStyles(): array {
		global $editor_styles;

		$styles = [wp_get_global_stylesheet(['variables'])];

		if (current_theme_supports('editor-styles') && is_array($editor_styles)) {
			foreach ($editor_styles as $style) {
				if (!is_string($style) || preg_match('~^(https?:)?//~', $style) || !str_ends_with(strtolower($style), '.css')) {
					continue;
				}

				$file = get_theme_file_path($style);

				if (is_file($file) && is_readable($file)) {
					$styles[] = (string) file_get_contents($file); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents -- A local theme file, as WordPress's get_block_editor_theme_styles() reads it.
				}
			}
		}

		return array_values(array_filter($styles));
	}

	/**
	 * The theme's background and brand colors for the Colors page, from its
	 * global styles (theme.json themes only), then from commonly named palette
	 * colors.
	 *
	 * @return array{background: string, roles: array<string, array{slug?: string, color?: string}>} The background as CSS, and each role as a palette slug or a hex color.
	 */
	private static function themeColors(): array {
		static $colors = null;

		if ($colors !== null) {
			return $colors;
		}

		$palette   = array_column(self::palette(), 'color', 'slug');
		$hasStyles = wp_theme_has_theme_json();

		// The first global styles value, at one of $paths, that is a palette
		// color ("var:preset|color|slug" or "var(--wp--preset--color--slug)")
		// or a hex color.
		$fromStyles = static function (array $paths) use ($palette, $hasStyles): ?array {
			foreach ($hasStyles ? $paths : [] as $path) {
				$value = wp_get_global_styles($path);

				if (!is_string($value)) {
					continue;
				}

				if (preg_match('/^var(?::preset\|color\||\(--wp--preset--color--)([a-z0-9-]+)\)?$/', $value, $match) && isset($palette[$match[1]])) {
					return ['slug' => $match[1]];
				}

				if (preg_match('/^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i', $value)) {
					return ['color' => strtolower($value)];
				}
			}

			return null;
		};

		// The first of $slugs in the palette.
		$fromPalette = static function (array $slugs) use ($palette): ?array {
			foreach ($slugs as $slug) {
				if (isset($palette[$slug])) {
					return ['slug' => $slug];
				}
			}

			return null;
		};

		$roles = array_filter(
			[
				'primary' => $fromStyles([['elements', 'button', 'color', 'background'], ['elements', 'link', 'color', 'text']]) ?? $fromPalette(['primary', 'brand', 'accent']),
				'text'    => $fromStyles([['color', 'text']]) ?? $fromPalette(['text', 'foreground', 'contrast']),
				'surface' => $fromPalette(['surface', 'base-2', 'tertiary']),
				'border'  => $fromPalette(['border']),
			]
		);

		// The theme's background, then a classic theme's Background Color
		// (Appearance > Customize), then white.
		$background = $fromStyles([['color', 'background']]) ?? $fromPalette(['background', 'base']);
		$classic    = sanitize_hex_color_no_hash((string) get_background_color());

		$colors = [
			'background' => match (true) {
				isset($background['slug'])  => 'var(--wp--preset--color--' . $background['slug'] . ')',
				isset($background['color']) => $background['color'],
				!empty($classic)            => '#' . $classic,
				default                     => '#ffffff',
			},
			'roles' => $roles,
		];

		return $colors;
	}

	/**
	 * The blocks the Colors page previews, with their default look.
	 *
	 * Built with WordPress's own block serializer, which escapes what a
	 * block comment can't hold, such as "--" in a translated title.
	 *
	 * @return string Block markup.
	 */
	private static function previewContent(): string {
		$block = static fn(string $name, array $attributes, string $inner = ''): string => get_comment_delimited_block_content('codexa-blocks/' . $name, $attributes, $inner);
		$text  = static fn(string $words): string => '<!-- wp:paragraph --><p>' . esc_html($words) . '</p><!-- /wp:paragraph -->';

		$buttons = '';

		foreach (['fill' => __('Fill', 'codexa-blocks'), 'outline' => __('Outline', 'codexa-blocks'), 'link' => __('Text link', 'codexa-blocks'), 'underline' => __('Underline', 'codexa-blocks')] as $style => $label) {
			$buttons .= $block('button', ['text' => $label, 'linkUrl' => '#codexa-preview', 'className' => 'is-style-' . $style]);
		}

		return $block('buttons', [], $buttons)
			. $block(
				'accordion',
				[],
				$block('accordion-item', ['title' => __('An open item', 'codexa-blocks'), 'isOpen' => true], $text(__('The content of an accordion item.', 'codexa-blocks')))
				. $block('accordion-item', ['title' => __('A closed item', 'codexa-blocks')], $text(__('The content of an accordion item.', 'codexa-blocks')))
			)
			. $block(
				'tabs',
				[],
				$block('tab', ['label' => __('Active tab', 'codexa-blocks')], $text(__('The content of the active tab.', 'codexa-blocks')))
				. $block('tab', ['label' => __('Another tab', 'codexa-blocks')], $text(__('The content of another tab.', 'codexa-blocks')))
			)
			. $block('count-up', ['end' => 250, 'suffix' => '+', 'title' => __('Happy customers', 'codexa-blocks')]);
	}

	/**
	 * The menu icon (ICON_PATH) as an SVG data URI, which WordPress colors
	 * to match the admin color scheme.
	 *
	 * @return string The data URI.
	 */
	private static function menuIcon(): string {
		$svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="black" d="' . self::ICON_PATH . '"/></svg>';

		return 'data:image/svg+xml;base64,' . base64_encode($svg); // phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_encode -- An SVG menu icon, as WordPress expects.
	}
}
