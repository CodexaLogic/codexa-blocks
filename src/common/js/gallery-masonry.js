/**
 * Places the images of every masonry gallery on the page, in browsers
 * without CSS masonry (see masonry-layout.js). Loaded only on pages with
 * a masonry gallery (CodexaBlocks\Blocks\Gallery\Types\Masonry).
 */
import { layoutMasonry } from "./masonry-layout.js";

document
	.querySelectorAll(
		".wp-block-codexa-blocks-gallery.is-type-masonry > .wp-block-codexa-blocks-gallery__items"
	)
	.forEach((list) => layoutMasonry(list));
