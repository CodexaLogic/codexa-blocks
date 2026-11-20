/**
 * The Grid gallery type in the editor, rows and columns of images in one
 * shape. Its page twin is Gallery\Types\Grid, and both print GalleryList,
 * so the preview matches.
 */
import { Path, SVG } from "@wordpress/primitives";
import { __ } from "@wordpress/i18n";

import { registerGalleryType } from "@codexa-blocks/editor";
import { GalleryList } from "../GalleryList.jsx";
/** Six even tiles, three to a row, as the type picker's picture. */
const picture = (
	<SVG xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 32">
		<Path d="M2 2h12a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1ZM18 2h12a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H18a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1ZM34 2h12a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H34a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1ZM2 17h12a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V18a1 1 0 0 1 1-1ZM18 17h12a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H18a1 1 0 0 1-1-1V18a1 1 0 0 1 1-1ZM34 17h12a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H34a1 1 0 0 1-1-1V18a1 1 0 0 1 1-1Z" />
	</SVG>
);

/**
 * The images as a list, laid out by the Gallery's stylesheet.
 *
 * @param {Object}   props       Component props.
 * @param {Object[]} props.items The images, each with its figure, from the Gallery block.
 * @return {Element} The list.
 */
function GridPreview({ items }) {
	return <GalleryList items={items} />;
}

registerGalleryType({
	name: "grid",
	title: __("Grid", "codexa-blocks"),
	picture,
	Preview: GridPreview,
});
