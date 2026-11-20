<?php
/**
 * The gallery types the Gallery block can use.
 *
 * @package CodexaBlocks
 */

namespace CodexaBlocks\Blocks\Gallery;

use CodexaBlocks\Blocks\Gallery\Types\Carousel;
use CodexaBlocks\Blocks\Gallery\Types\Grid;
use CodexaBlocks\Blocks\Gallery\Types\Masonry;

if (!defined('ABSPATH')) {
	exit;
}

/**
 * Holds the gallery types, filled the first time a gallery renders with
 * this plugin's own and any added on the
 * `codexa_blocks/gallery/register_types` action. The action fires once
 * per request, however many galleries a page has.
 */
final class GalleryTypes {

	/**
	 * A type's name, in lowercase letters, digits and hyphens.
	 *
	 * @var string
	 */
	private const NAME = '/^[a-z][a-z0-9-]*$/';

	/**
	 * The list, once filled.
	 *
	 * @var self|null
	 */
	private static ?self $instance = null;

	/**
	 * Registered types, keyed by name.
	 *
	 * @var array<string, GalleryType>
	 */
	private array $types = [];

	/**
	 * The list, filled on first use.
	 *
	 * @return self The list.
	 */
	public static function instance(): self {
		if (self::$instance === null) {
			self::$instance = new self();
			self::$instance->add(new Grid());
			self::$instance->add(new Masonry());
			self::$instance->add(new Carousel());

			/**
			 * Fires when the Gallery block first needs its types. Add a type
			 * here; the editor needs the same type, under the same name,
			 * registered with registerGalleryType().
			 *
			 *     add_action('codexa_blocks/gallery/register_types', function ($types) {
			 *         $types->add(new My_Stacked_Type());
			 *     });
			 *
			 * @since 1.0.0
			 *
			 * @param GalleryTypes $types The list to add to.
			 */
			do_action('codexa_blocks/gallery/register_types', self::$instance);
		}

		return self::$instance;
	}

	/**
	 * Adds a type.
	 *
	 * @param  GalleryType $type The type.
	 * @return bool        False when its name is invalid or already taken.
	 */
	public function add(GalleryType $type): bool {
		$name = $type->name();

		if (!preg_match(self::NAME, $name) || isset($this->types[$name])) {
			_doing_it_wrong(__METHOD__, esc_html(sprintf('Gallery type "%s" has an invalid name or is already registered.', $name)), '1.0.0');
			return false;
		}

		$this->types[$name] = $type;

		return true;
	}

	/**
	 * Finds a type by name.
	 *
	 * @param  string           $name The name the gallery saved.
	 * @return GalleryType|null The type, or null when none has that name.
	 */
	public function get(string $name): ?GalleryType {
		return $this->types[$name] ?? null;
	}
}
