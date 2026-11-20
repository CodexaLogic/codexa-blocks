/**
 * The Carousel gallery type in the editor, a row of images that scrolls
 * sideways, as many in view as the gallery's columns, through the shared
 * carousel (CarouselFrame). Its page twin is Gallery\Types\Carousel.
 */
import { Path, SVG } from "@wordpress/primitives";
import { __ } from "@wordpress/i18n";

import {
	CAROUSEL_TRACK,
	CarouselFields,
	CarouselFrame,
	registerGalleryType,
} from "@codexa-blocks/editor";

import { GalleryList } from "../GalleryList.jsx";

const BLOCK = "codexa-blocks/gallery";

/** One image in view with the edges of its neighbors, and dots, as the type picker's picture. */
const picture = (
	<SVG xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 32">
		<Path d="M10 2h28a1 1 0 0 1 1 1v20a1 1 0 0 1-1 1H10a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1ZM1 5h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H1ZM43 5h4v16h-4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1ZM19 27.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM24 27.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM29 27.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Z" />
	</SVG>
);

/**
 * @param {Object}   props          Component props.
 * @param {Object[]} props.items    The images, each with its figure, from the Gallery block.
 * @param {Object}   props.settings The carousel's settings.
 * @return {Element} The carousel.
 */
function CarouselPreview({ items, settings }) {
	return (
		<CarouselFrame
			blockName={BLOCK}
			settings={settings}
			label={__("Images", "codexa-blocks")}
		>
			<GalleryList items={items} className={CAROUSEL_TRACK} />
		</CarouselFrame>
	);
}

/**
 * @param {Object}                 props             Component props.
 * @param {Object}                 props.attributes  The Gallery block's attributes.
 * @param {Object}                 props.settings    The carousel's settings.
 * @param {(next: Object) => void} props.setSettings Saves changed settings.
 * @return {Element} The controls.
 */
function CarouselSettings({ attributes, settings, setSettings }) {
	return (
		<CarouselFields
			blockName={BLOCK}
			attributes={attributes}
			settings={settings}
			setSettings={setSettings}
			proNote={__(
				"Play the slides on their own, fade between them, or add thumbnails.",
				"codexa-blocks"
			)}
		/>
	);
}

registerGalleryType({
	name: "carousel",
	title: __("Carousel", "codexa-blocks"),
	picture,
	Preview: CarouselPreview,
	Settings: CarouselSettings,
	defaults: { arrows: true, dots: true },
	columnsLabel: __("Images in view", "codexa-blocks"),
});
