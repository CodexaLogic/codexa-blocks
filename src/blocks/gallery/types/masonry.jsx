/**
 * The Masonry gallery type in the editor, columns of images that keep their
 * shape, each in the shortest column. Its page twin is Gallery\Types\Masonry.
 * Both print GalleryList and place it with CSS masonry where available,
 * otherwise with masonry-layout.js.
 */
import { useRefEffect } from "@wordpress/compose";
import { Path, SVG } from "@wordpress/primitives";
import { __ } from "@wordpress/i18n";

import { registerGalleryType } from "@codexa-blocks/editor";

import { layoutMasonry } from "../../../common/js/masonry-layout.js";
import { GalleryList } from "../GalleryList.jsx";

/** Three columns of tiles of different heights, as the type picker's picture. */
const picture = (
	<SVG xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 32">
		<Path d="M2 2h12a1 1 0 0 1 1 1V17a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1ZM2 20h12a1 1 0 0 1 1 1V29a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V21a1 1 0 0 1 1-1ZM18 2h12a1 1 0 0 1 1 1V10a1 1 0 0 1-1 1H18a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1ZM18 13h12a1 1 0 0 1 1 1V29a1 1 0 0 1-1 1H18a1 1 0 0 1-1-1V14a1 1 0 0 1 1-1ZM34 2h12a1 1 0 0 1 1 1V13a1 1 0 0 1-1 1H34a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1ZM34 16h12a1 1 0 0 1 1 1V29a1 1 0 0 1-1 1H34a1 1 0 0 1-1-1V17a1 1 0 0 1 1-1Z" />
	</SVG>
);

/**
 * The images as a list, placed in columns by masonry-layout.js.
 *
 * @param {Object}   props       Component props.
 * @param {Object[]} props.items The images, each with its figure, from the Gallery block.
 * @return {Element} The list.
 */
function MasonryPreview({ items }) {
	const order = items.map(({ key }) => key).join(" ");
	const ref = useRefEffect(layoutMasonry, [order]);

	return <GalleryList ref={ref} items={items} />;
}

registerGalleryType({
	name: "masonry",
	title: __("Masonry", "codexa-blocks"),
	picture,
	Preview: MasonryPreview,
	usesImageShape: false,
});
