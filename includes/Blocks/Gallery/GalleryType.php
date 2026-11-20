<?php
/**
 * The contract a gallery type implements.
 *
 * @package CodexaBlocks
 */

namespace CodexaBlocks\Blocks\Gallery;

if (!defined('ABSPATH')) {
	exit;
}

/**
 * One way the Gallery block can arrange its images on the page, such as
 * Grid. The editor previews the same type under the same name (see
 * registerGalleryType() in the editor package).
 *
 * The Gallery block builds the wrapper and every image's figure (image,
 * link and caption); a type only arranges the figures, and loads whatever
 * script or stylesheet that arrangement needs. Register one with
 * GalleryTypes::add() on the `codexa_blocks/gallery/register_types`
 * action.
 */
interface GalleryType {

	/**
	 * The type's name as the block saves it, in lowercase letters, digits and
	 * hyphens, e.g. "grid". The wrapper gets the class "is-type-{name}".
	 *
	 * @return string The name.
	 */
	public function name(): string;

	/**
	 * Whether the gallery's Image shape crops the images. When it doesn't,
	 * as in Masonry, every image keeps its own shape and the wrapper gets
	 * "is-shape-original", whatever the gallery saved.
	 *
	 * @return bool
	 */
	public function usesImageShape(): bool;

	/**
	 * The arranged images, placed inside the gallery's wrapper. Enqueue the
	 * type's own script or stylesheet here, so only pages that use it load
	 * them.
	 *
	 * @param  GalleryItem[] $items    The images, in order, each with its figure.
	 * @param  array         $settings The type's own settings as the gallery saved them, unvalidated.
	 * @return string        HTML. The figures are already escaped; anything the type adds must be escaped by it.
	 */
	public function render(array $items, array $settings): string;
}
