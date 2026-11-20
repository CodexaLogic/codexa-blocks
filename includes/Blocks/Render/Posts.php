<?php
/**
 * Renders the Posts block.
 *
 * @package CodexaBlocks
 */

namespace CodexaBlocks\Blocks\Render;

use CodexaBlocks\Utilities\Anchor;
use CodexaBlocks\Utilities\Carousel;
use CodexaBlocks\Utilities\DesignStyles;
use CodexaBlocks\Utilities\ResponsiveImages;
use CodexaBlocks\Utilities\ResponsiveStyles;
use CodexaBlocks\Utilities\Style;
use CodexaBlocks\Utilities\TypographyStyles;

if (!defined('ABSPATH')) {
	exit;
}

/**
 * Builds a grid or carousel of the latest posts or pages, each with its
 * featured image, title, date, excerpt and Read more link, any of which
 * can be hidden. The carousel is the shared one (Utilities\Carousel), with
 * as many posts in view as the columns.
 *
 * Only published posts a visitor can read are shown, from the post types
 * and taxonomies in sources(). Free offers Posts (by category or tag) and
 * Pages. The codexa_blocks/posts/sources filter adds others and is the
 * list every query is checked against.
 *
 * Hooks for add-ons
 * - codexa_blocks/posts/sources     post types and their taxonomies.
 * - codexa_blocks/posts/query_args  the WP_Query arguments.
 * - codexa_blocks/posts/before_items HTML before the list, e.g. filter buttons.
 * - codexa_blocks/posts/after_items HTML after the list, e.g. a Load more button.
 * queryArgs(), items() and currentPostId() are public, so an add-on can
 * load more posts with the same checks and markup. LIST_ATTRIBUTES names
 * the settings they read.
 */
final class Posts {

	/**
	 * Most posts shown at once. Must match COUNT in posts-styles.js.
	 *
	 * @var array{min: int, max: int}
	 */
	public const COUNT = ['min' => 1, 'max' => 24];

	/**
	 * The attributes queryArgs() and items() read. An add-on that loads
	 * more posts later, in another request, needs only these to build the
	 * same list.
	 *
	 * @var string[]
	 */
	public const LIST_ATTRIBUTES = [
		'postType',
		'taxonomy',
		'terms',
		'count',
		'orderBy',
		'order',
		'excludeCurrent',
		'columns',
		'showImage',
		'imageSize',
		'fallbackImageId',
		'showTitle',
		'titleLevel',
		'showDate',
		'showExcerpt',
		'excerptLength',
		'showReadMore',
		'readMoreText',
	];

	/**
	 * Most posts side by side. Must match COLUMNS in posts-styles.js.
	 *
	 * @var int
	 */
	public const MAX_COLUMNS = 6;

	/**
	 * Ways to lay out the posts. Must match block.json.
	 *
	 * @var string[]
	 */
	private const LAYOUTS = ['grid', 'carousel'];

	/**
	 * Sort orders. "menu_order" (page order) only for post types with it.
	 * Must match ORDER_BY in posts-styles.js and block.json.
	 *
	 * @var string[]
	 */
	private const ORDER_BY = ['date', 'modified', 'title', 'menu_order'];

	/**
	 * Heading levels for the titles. Must match block.json.
	 *
	 * @var string[]
	 */
	private const TITLE_LEVELS = ['h2', 'h3', 'h4', 'h5', 'h6'];

	/**
	 * Shortest and longest excerpt, in words. Must match EXCERPT in posts-styles.js.
	 *
	 * @var array{min: int, max: int}
	 */
	private const EXCERPT = ['min' => 5, 'max' => 100];

	/**
	 * The REST field with a post's excerpt as the block shows it, for the
	 * editor's preview. Must match EXCERPT_FIELD in use-posts.js.
	 *
	 * @var string
	 */
	public const EXCERPT_FIELD = 'codexa_blocks_excerpt';

	/**
	 * Most terms one block can filter by.
	 *
	 * @var int
	 */
	private const MAX_TERMS = 50;

	/**
	 * The checked sources, once per request.
	 *
	 * @var array<string, string[]>|null
	 */
	private static ?array $sources = null;

	/**
	 * Renders the block.
	 *
	 * @param  array      $attributes Block attributes.
	 * @param  string     $content    Unused, since the block saves no markup.
	 * @param  ?\WP_Block $block      The block, for the post it's shown in.
	 * @return string     Block HTML, or '' when no post matches.
	 */
	public function render(array $attributes, string $content = '', ?\WP_Block $block = null): string {
		$args = self::queryArgs($attributes, 1, self::currentPostId($block));

		if ($args === null) {
			return '';
		}

		$query = new \WP_Query($args);

		if (!$query->have_posts()) {
			return '';
		}

		// Every featured image in one query, instead of one per post.
		update_post_thumbnail_cache($query);

		$styles = (new ResponsiveStyles())
			->box('padding', $attributes['padding'] ?? [], [Style::class, 'length'])
			->box('margin', $attributes['margin'] ?? [], [Style::class, 'length'], ['top', 'bottom']);

		$classes = self::styles($styles, $attributes);
		$hidden  = DesignStyles::apply($styles, $attributes);

		$wrapper = get_block_wrapper_attributes([
			'class' => trim(implode(' ', [$styles->classNames(), ...$classes, ...$hidden])),
			'style' => $styles->style(),
		] + Anchor::wrapperAttributes($attributes));

		/**
		 * Filters the HTML printed before the list of posts, inside the
		 * block, for example filter buttons. Return escaped HTML.
		 *
		 * @since 1.0.0
		 *
		 * @param string     $html       HTML before the list. Default ''.
		 * @param \WP_Query  $query      The block's query.
		 * @param array      $attributes Block attributes.
		 * @param ?\WP_Block $block      The block.
		 */
		$before = apply_filters('codexa_blocks/posts/before_items', '', $query, $attributes, $block);

		/**
		 * Filters the HTML printed after the list of posts, inside the block,
		 * for example a Load more button. Return escaped HTML.
		 *
		 * @since 1.0.0
		 *
		 * @param string     $html       HTML after the list. Default ''.
		 * @param \WP_Query  $query      The block's query.
		 * @param array      $attributes Block attributes.
		 * @param ?\WP_Block $block      The block.
		 */
		$after = apply_filters('codexa_blocks/posts/after_items', '', $query, $attributes, $block);

		$items = self::items($query->posts, $attributes);

		if (self::isCarousel($attributes)) {
			$items = Carousel::markup($items, $attributes['carousel'] ?? [], 'codexa-blocks/posts', __('Posts', 'codexa-blocks'));
		}

		return sprintf(
			'<div %1$s>%2$s%3$s%4$s</div>',
			$wrapper,
			is_string($before) ? $before : '',
			$items,
			is_string($after) ? $after : ''
		);
	}

	/**
	 * Whether the posts show as a carousel. An add-on that loads more posts
	 * leaves a carousel alone, as it shows only the posts it has.
	 *
	 * @param  array $attributes Block attributes.
	 * @return bool
	 */
	public static function isCarousel(array $attributes): bool {
		return Style::oneOf($attributes['layout'] ?? '', self::LAYOUTS) === 'carousel';
	}

	/**
	 * The post types the block can show, each with the taxonomies it can filter
	 * by, after the codexa_blocks/posts/sources filter. Only public types and
	 * taxonomies in the REST API are kept.
	 *
	 * @return array<string, string[]> Post type => taxonomies.
	 */
	public static function sources(): array {
		if (self::$sources !== null) {
			return self::$sources;
		}

		/**
		 * Filters the post types the Posts block can show, and the taxonomies
		 * each can be filtered by. Post types must be public and in the REST
		 * API; taxonomies must be public, in the REST API and registered for
		 * the post type.
		 *
		 *     add_filter('codexa_blocks/posts/sources', function (array $sources) {
		 *         $sources['event'] = ['event_category'];
		 *         return $sources;
		 *     });
		 *
		 * @since 1.0.0
		 *
		 * @param array<string, string[]> $sources Post type => taxonomies.
		 *                                         By default, posts by category or tag, and pages.
		 */
		$filtered = apply_filters(
			'codexa_blocks/posts/sources',
			[
				'post' => ['category', 'post_tag'],
				'page' => [],
			]
		);

		$sources = [];

		foreach (is_array($filtered) ? $filtered : [] as $postType => $taxonomies) {
			$type = is_string($postType) ? get_post_type_object($postType) : null;

			if (!$type || $type->name === 'attachment' || !is_post_type_viewable($type) || !$type->show_in_rest) {
				continue;
			}

			$sources[$type->name] = array_values(array_filter(
				is_array($taxonomies) ? $taxonomies : [],
				static function ($name) use ($type): bool {
					$taxonomy = is_string($name) ? get_taxonomy($name) : false;

					return $taxonomy
						&& $taxonomy->show_in_rest
						&& is_taxonomy_viewable($taxonomy)
						&& is_object_in_taxonomy($type->name, $taxonomy->name);
				}
			));
		}

		self::$sources = $sources;

		return $sources;
	}

	/**
	 * Whether Pro or other code adds to the sources, so the editor can hide
	 * its Pro note under Show. Printed for the editor by EditorAssets.
	 *
	 * @return bool
	 */
	public static function sourcesExtended(): bool {
		return has_filter('codexa_blocks/posts/sources');
	}

	/**
	 * The sources as the editor needs them, with names, REST routes and whether
	 * a post type has a page order. Printed for the editor by EditorAssets.
	 *
	 * @return array<int, array{slug: string, label: string, restBase: string, hasOrder: bool, taxonomies: array<int, array{slug: string, label: string, restBase: string}>}> The sources.
	 */
	public static function editorSources(): array {
		$list = [];

		foreach (self::sources() as $postType => $taxonomies) {
			$type   = get_post_type_object($postType);
			$list[] = [
				'slug'       => $postType,
				'label'      => (string) $type->labels->name,
				'restBase'   => (string) ($type->rest_base ?: $postType),
				'hasOrder'   => post_type_supports($postType, 'page-attributes'),
				'taxonomies' => array_map(
					static function (string $name): array {
						$taxonomy = get_taxonomy($name);

						return [
							'slug'     => $name,
							'label'    => (string) $taxonomy->labels->name,
							'restBase' => (string) ($taxonomy->rest_base ?: $name),
						];
					},
					$taxonomies
				),
			];
		}

		return $list;
	}

	/**
	 * The block's query, checked. Published posts a visitor can read, of an
	 * allowed post type and taxonomy, at most COUNT['max'] at a time. Mirrors
	 * postsQuery() in posts-styles.js.
	 *
	 * @param  array                     $attributes    Block attributes.
	 * @param  int                       $page          Page of results, from 1.
	 * @param  int                       $currentPostId Post to leave out when the block asks to, or 0.
	 * @return array<string, mixed>|null WP_Query arguments, or null when the post type isn't allowed.
	 */
	public static function queryArgs(array $attributes, int $page = 1, int $currentPostId = 0): ?array {
		$sources  = self::sources();
		$postType = is_string($attributes['postType'] ?? null) ? $attributes['postType'] : 'post';

		if (!isset($sources[$postType])) {
			return null;
		}

		$orderBy = Style::oneOf($attributes['orderBy'] ?? '', self::ORDER_BY) ?: 'date';

		if ($orderBy === 'menu_order' && !post_type_supports($postType, 'page-attributes')) {
			$orderBy = 'date';
		}

		$args = [
			'post_type'           => $postType,
			'post_status'         => 'publish',
			'perm'                => 'readable',
			'posts_per_page'      => self::number($attributes['count'] ?? null, self::COUNT, 6),
			'paged'               => max(1, $page),
			'orderby'             => $orderBy,
			'order'               => ($attributes['order'] ?? '') === 'asc' ? 'ASC' : 'DESC',
			'ignore_sticky_posts' => true,
			// No page count unless an add-on needs one (see the filter below).
			'no_found_rows' => true,
			// Terms aren't shown, so they aren't loaded.
			'update_post_term_cache' => false,
		];

		$taxonomy = is_string($attributes['taxonomy'] ?? null) ? $attributes['taxonomy'] : '';
		$terms    = self::termIds($attributes['terms'] ?? []);

		if ($terms && in_array($taxonomy, $sources[$postType], true)) {
			// Only posts in the chosen terms themselves, like the editor's
			// preview (the REST API leaves out child terms too).
			$args['tax_query'] = [ // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_tax_query -- The block's own term filter.
				[
					'taxonomy'         => $taxonomy,
					'field'            => 'term_id',
					'terms'            => $terms,
					'include_children' => false,
				],
			];
		}

		if (($attributes['excludeCurrent'] ?? true) !== false && $currentPostId > 0) {
			$args['post__not_in'] = [$currentPostId]; // phpcs:ignore WordPressVIPMinimum.Performance.WPQueryParams.PostNotIn_post__not_in -- One ID, the post being viewed.
		}

		/**
		 * Filters the Posts block's query arguments, e.g. to count pages for
		 * Load more ('no_found_rows' => false). The post type, published
		 * status and readable check are set again afterwards, so they can't
		 * be loosened here.
		 *
		 * @since 1.0.0
		 *
		 * @param array<string, mixed> $args       WP_Query arguments.
		 * @param array                $attributes Block attributes.
		 * @param int                  $page       Page of results, from 1.
		 */
		$filtered = apply_filters('codexa_blocks/posts/query_args', $args, $attributes, $page);

		return array_merge(
			is_array($filtered) ? $filtered : $args,
			[
				'post_type'   => $postType,
				'post_status' => 'publish',
				'perm'        => 'readable',
			]
		);
	}

	/**
	 * The list of posts.
	 *
	 * @param  \WP_Post[] $posts      The posts, in order.
	 * @param  array      $attributes Block attributes.
	 * @return string     The list, safe to print.
	 */
	public static function items(array $posts, array $attributes): string {
		$show = static fn(string $name, bool $fallback): bool => is_bool($attributes[$name] ?? null) ? $attributes[$name] : $fallback;

		$settings = [
			'image'      => $show('showImage', true),
			'title'      => $show('showTitle', true),
			'date'       => $show('showDate', true),
			'excerpt'    => $show('showExcerpt', true),
			'more'       => $show('showReadMore', false),
			'level'      => Style::oneOf($attributes['titleLevel'] ?? '', self::TITLE_LEVELS) ?: 'h3',
			'words'      => self::number($attributes['excerptLength'] ?? null, self::EXCERPT, 20),
			'size'       => is_string($attributes['imageSize'] ?? null) && $attributes['imageSize'] !== '' ? $attributes['imageSize'] : 'medium_large',
			'sizes'      => ResponsiveImages::sizes($attributes['columns'] ?? [], 3, self::MAX_COLUMNS),
			'fallbackId' => absint($attributes['fallbackImageId'] ?? 0),
			'moreText'   => is_string($attributes['readMoreText'] ?? null) && trim($attributes['readMoreText']) !== ''
				? trim($attributes['readMoreText'])
				: __('Read more', 'codexa-blocks'),
		];

		$html = '';

		foreach ($posts as $post) {
			if ($post instanceof \WP_Post) {
				$html .= '<li class="wp-block-codexa-blocks-posts__item">' . self::item($post, $settings) . '</li>';
			}
		}

		// role="list" because Safari stops announcing a list once its
		// markers are removed unless the role is set.
		return '<ul class="wp-block-codexa-blocks-posts__items" role="list">' . $html . '</ul>';
	}

	/**
	 * One post.
	 *
	 * @param  \WP_Post $post     The post.
	 * @param  array    $settings What to show, from items().
	 * @return string   The post, safe to print.
	 */
	private static function item(\WP_Post $post, array $settings): string {
		$url   = esc_url(get_permalink($post));
		$title = trim(wp_strip_all_tags(get_the_title($post))) ?: __('(no title)', 'codexa-blocks');
		$parts = [];

		if ($settings['image']) {
			$parts[] = self::image($post, $url, $title, $settings);
		}

		$body = [];

		if ($settings['title']) {
			$body[] = sprintf(
				'<%1$s class="wp-block-codexa-blocks-posts__title"><a href="%2$s">%3$s</a></%1$s>',
				$settings['level'],
				$url,
				esc_html($title)
			);
		}

		if ($settings['date']) {
			$body[] = sprintf(
				'<time class="wp-block-codexa-blocks-posts__date" datetime="%1$s">%2$s</time>',
				esc_attr((string) get_the_date('c', $post)),
				esc_html((string) get_the_date('', $post))
			);
		}

		if ($settings['excerpt']) {
			$excerpt = self::excerpt($post, $settings['words']);

			if ($excerpt !== '') {
				$body[] = '<p class="wp-block-codexa-blocks-posts__excerpt">' . esc_html($excerpt) . '</p>';
			}
		}

		if ($settings['more']) {
			// The title is read out with the link text, so every Read more
			// link has its own name.
			$body[] = sprintf(
				'<a class="wp-block-codexa-blocks-posts__more" href="%1$s">%2$s<span class="wp-block-codexa-blocks-posts__hidden">: %3$s</span></a>',
				$url,
				esc_html($settings['moreText']),
				esc_html($title)
			);
		}

		if ($body) {
			$parts[] = '<div class="wp-block-codexa-blocks-posts__body">' . implode('', $body) . '</div>';
		}

		return '<article class="wp-block-codexa-blocks-posts__post">' . implode('', $parts) . '</article>';
	}

	/**
	 * The post's featured image, or the fallback image, linked to the post.
	 * With a title shown, the image link is hidden from the keyboard and screen
	 * readers, since the title links to the same place.
	 *
	 * @param  \WP_Post $post     The post.
	 * @param  string   $url      Its address, escaped.
	 * @param  string   $title    Its title, as text.
	 * @param  array    $settings What to show, from items().
	 * @return string   The linked image, or '' when there is none.
	 */
	private static function image(\WP_Post $post, string $url, string $title, array $settings): string {
		$id = (int) get_post_thumbnail_id($post) ?: $settings['fallbackId'];

		if (!$id) {
			return '';
		}

		$img = wp_get_attachment_image($id, $settings['size'], false, [
			'class' => 'wp-block-codexa-blocks-posts__image',
			'alt'   => '',
			'sizes' => $settings['sizes'],
		]);

		if ($img === '') {
			return '';
		}

		$link = $settings['title']
			? 'tabindex="-1" aria-hidden="true"'
			: 'aria-label="' . esc_attr($title) . '"';

		return sprintf('<a class="wp-block-codexa-blocks-posts__image-link" href="%1$s" %2$s>%3$s</a>', $url, $link, $img);
	}

	/**
	 * The post's excerpt as plain text, at most $words words. Built from the
	 * text blocks instead of get_the_excerpt(), which renders the whole post,
	 * and still runs its filter.
	 *
	 * @param  \WP_Post $post  The post.
	 * @param  int      $words Most words.
	 * @return string   The excerpt, unescaped, or ''.
	 */
	private static function excerpt(\WP_Post $post, int $words): string {
		if (post_password_required($post)) {
			return '';
		}

		$text = trim(wp_strip_all_tags(
			has_excerpt($post)
				? $post->post_excerpt
				: strip_shortcodes(excerpt_remove_blocks($post->post_content))
		));

		if ($text === '') {
			return '';
		}

		$text = apply_filters('get_the_excerpt', $text, $post); // phpcs:ignore WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedHooknameFound -- WordPress's own filter, applied as core does.

		// Trimmed after the filter, which may return a longer text or HTML.
		return is_string($text) ? trim(html_entity_decode(wp_trim_words($text, $words), ENT_QUOTES, 'UTF-8')) : '';
	}

	/**
	 * Adds the read-only EXCERPT_FIELD to the REST API, so the editor's preview
	 * shows the page's excerpt.
	 *
	 * @return void
	 */
	public static function registerRestFields(): void {
		register_rest_field(
			array_keys(self::sources()),
			self::EXCERPT_FIELD,
			[
				'get_callback' => [self::class, 'restExcerpt'],
				'schema'       => [
					'description' => __('The excerpt as the Posts block shows it, at most 100 words.', 'codexa-blocks'),
					'type'        => ['string', 'null'],
					'context'     => ['view', 'edit'],
					'readonly'    => true,
				],
			]
		);
	}

	/**
	 * A post's excerpt for EXCERPT_FIELD, built only when a request names the
	 * field in _fields.
	 *
	 * @param  array            $post    The post as prepared for the response.
	 * @param  string           $field   The field's name.
	 * @param  \WP_REST_Request $request The request.
	 * @return string|null      The excerpt, or null when it wasn't asked for.
	 */
	public static function restExcerpt(array $post, string $field, \WP_REST_Request $request): ?string {
		$fields = wp_parse_list($request->get_param('_fields') ?? []);
		$object = in_array($field, $fields, true) ? get_post((int) ($post['id'] ?? 0)) : null;

		return $object instanceof \WP_Post ? self::excerpt($object, self::EXCERPT['max']) : null;
	}

	/**
	 * The post the block is shown in, to leave out of its list. That's the
	 * post of a surrounding Query Loop or the post being viewed, and 0 on
	 * archives, search results and the like.
	 *
	 * @param  ?\WP_Block $block The block.
	 * @return int        The post's ID, or 0.
	 */
	public static function currentPostId(?\WP_Block $block): int {
		$fromContext = absint($block->context['postId'] ?? 0);

		if ($fromContext) {
			return $fromContext;
		}

		return is_singular() ? (int) get_queried_object_id() : 0;
	}

	/**
	 * The saved term IDs, positive, unique and at most MAX_TERMS.
	 *
	 * @param  mixed $value The terms attribute.
	 * @return int[] The IDs.
	 */
	private static function termIds(mixed $value): array {
		if (!is_array($value)) {
			return [];
		}

		return array_slice(array_values(array_unique(array_filter(array_map('absint', $value)))), 0, self::MAX_TERMS);
	}

	/**
	 * A whole number brought into range, where one too large or small becomes
	 * the nearest end. Anything else gives the fallback. Mirrors numberIn() in
	 * posts-styles.js.
	 *
	 * @param  mixed                     $value    Saved value.
	 * @param  array{min: int, max: int} $range    Allowed range.
	 * @param  int                       $fallback Value when it isn't a whole number.
	 * @return int
	 */
	private static function number(mixed $value, array $range, int $fallback): int {
		$number = filter_var($value, FILTER_VALIDATE_INT);

		return $number === false ? $fallback : max($range['min'], min($range['max'], $number));
	}

	/**
	 * Adds the block's own settings to its styles. Mirrors postsStyles() in
	 * posts-styles.js.
	 *
	 * @param  ResponsiveStyles $styles     The block's styles, to add to.
	 * @param  array            $attributes Block attributes.
	 * @return string[]         The block's classes, e.g. ["is-shape-3-2", "is-more-button"].
	 */
	private static function styles(ResponsiveStyles $styles, array $attributes): array {
		$single = static fn(string $name): array => ['desktop' => $attributes[$name] ?? ''];
		$color  = [Style::class, 'color'];
		$length = [Style::class, 'length'];

		// The hover shadow follows the normal shadow's color unless it has its own.
		$shadowColor      = $attributes['cardShadowColor'] ?? '';
		$hoverShadowColor = ($attributes['cardHoverShadowColor'] ?? '') ?: $shadowColor;

		$styles
			->add('posts-columns', $attributes['columns'] ?? [], static fn($value): string => ResponsiveImages::columns($value, self::MAX_COLUMNS))
			->add('posts-gap', $attributes['gap'] ?? [], $length)
			->box('posts-image-radius', $attributes['imageRadius'] ?? [], $length, ResponsiveStyles::CORNERS)
			->add('card-background', $single('cardBackground'), $color)
			->box('card-radius', $attributes['cardRadius'] ?? [], $length, ResponsiveStyles::CORNERS)
			->box('card-padding', $attributes['cardPadding'] ?? [], $length)
			->add('card-shadow', $single('cardShadow'), static fn(mixed $value): string => Style::shadow($value, $shadowColor))
			->add('card-hover-shadow', $single('cardHoverShadow'), static fn(mixed $value): string => Style::shadow($value, $hoverShadowColor))
			->box('posts-content-padding', $attributes['contentPadding'] ?? [], $length)
			->add('title-color', $single('titleColor'), $color)
			->add('title-hover-color', $single('titleHoverColor'), $color)
			->add('date-color', $single('dateColor'), $color)
			->add('excerpt-color', $single('excerptColor'), $color)
			->add('more-color', $single('readMoreColor'), $color)
			->add('more-hover-color', $single('readMoreHoverColor'), $color)
			->add('more-background', $single('readMoreBackground'), $color)
			->add('more-hover-background', $single('readMoreHoverBackground'), $color)
			->box('more-padding', $attributes['readMorePadding'] ?? [], $length)
			->box('more-radius', $attributes['readMoreRadius'] ?? [], $length, ResponsiveStyles::CORNERS);

		TypographyStyles::apply($styles, 'title', $attributes['titleTypography'] ?? null);
		TypographyStyles::apply($styles, 'date', $attributes['dateTypography'] ?? null);
		TypographyStyles::apply($styles, 'excerpt', $attributes['excerptTypography'] ?? null);
		TypographyStyles::apply($styles, 'more', $attributes['readMoreTypography'] ?? null);

		return array_filter([
			'is-shape-' . ResponsiveImages::shape($attributes['imageShape'] ?? ''),
			($attributes['readMoreStyle'] ?? '') === 'button' ? 'is-more-button' : '',
		]);
	}
}
