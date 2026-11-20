/**
 * The images as a list, one item per figure, in the gallery's order. The
 * Grid, Masonry and Carousel previews draw it; the gallery's stylesheet (and, for
 * Masonry, its placement script) arranges it. Mirrors GalleryList in PHP
 * (CodexaBlocks\Blocks\Gallery\GalleryList), so the preview matches the
 * page.
 */
import { forwardRef } from "@wordpress/element";

/**
 * @param {Object}   props             Component props.
 * @param {Object[]} props.items       The images, each with a key and its figure, from the Gallery block.
 * @param {string}   [props.className] More classes, such as the carousel's track.
 * @param {Object}   ref               Receives the list element.
 * @return {Element} The list.
 */
function List({ items, className }, ref) {
	return (
		// Safari stops announcing a list once its markers are removed, unless
		// the role is set; GalleryList.php does the same.
		// eslint-disable-next-line jsx-a11y/no-redundant-roles -- See above.
		<ul
			ref={ref}
			className={["wp-block-codexa-blocks-gallery__items", className]
				.filter(Boolean)
				.join(" ")}
			role="list"
		>
			{items.map((item) => (
				<li
					key={item.key}
					className="wp-block-codexa-blocks-gallery__item"
				>
					{item.figure}
				</li>
			))}
		</ul>
	);
}

export const GalleryList = forwardRef(List);
