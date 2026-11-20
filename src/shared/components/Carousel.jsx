/**
 * The carousel in the editor, for any block that shows its list as one.
 * Mirrors CodexaBlocks\Utilities\Carousel, so the preview matches the
 * page, and runs the same script (carousel.js), so the arrows and dots
 * work here too.
 *
 * - CarouselFrame wraps the block's list, which must have CAROUSEL_TRACK
 *   among its classes.
 * - CarouselFields holds the Arrows and Dots settings, then an add-on's
 *   (CarouselSettings).
 */
import { ToggleControl } from "@wordpress/components";
import { useRefEffect } from "@wordpress/compose";
import { applyFilters } from "@wordpress/hooks";
import { __ } from "@wordpress/i18n";

import { setupCarousel } from "../../common/js/carousel.js";
import { CarouselSettingsSlot } from "./CarouselSettings.jsx";
import { ProNote } from "./ProNote.jsx";

/** Class the carousel's list needs. */
export const CAROUSEL_TRACK = "codexa-carousel__track";

/** The arrows' and dots' names, as Carousel::registerAssets() gives the page. */
const LABELS = {
	previous: __("Previous slide", "codexa-blocks"),
	next: __("Next slide", "codexa-blocks"),
	/* translators: 1: The slide's position, e.g. 2. 2: The number of slides, e.g. 4. */
	slide: __("Slide %1$d of %2$d", "codexa-blocks"),
};

/**
 * The carousel element around a block's list, with its arrows and dots.
 *
 * @param {Object}  props           Component props.
 * @param {string}  props.blockName The block's name, for add-ons.
 * @param {Object}  props.settings  The carousel's settings.
 * @param {string}  props.label     Its accessible name, e.g. "Images".
 * @param {Element} props.children  The list.
 * @return {Element} The carousel.
 */
export function CarouselFrame({ blockName, settings = {}, label, children }) {
	const arrows = settings.arrows !== false;
	const dots = settings.dots !== false;

	/**
	 * Filters the classes added to a carousel element in the editor.
	 * Mirrors the PHP filter codexa_blocks/carousel/classes.
	 *
	 * @param {string[]} classes Classes. Default [].
	 * @param {Object}   context The block's name and the carousel's settings.
	 */
	const added = applyFilters("codexaBlocks.carouselClassNames", [], {
		blockName,
		settings,
	});
	const className = [
		"codexa-carousel",
		...(Array.isArray(added)
			? added.filter((name) => typeof name === "string")
			: []),
	].join(" ");

	// Set up again when the classes change, as React then replaces the
	// ready class the script adds.
	const ref = useRefEffect(
		(carousel) =>
			setupCarousel(carousel, {
				arrows,
				dots,
				labels: LABELS,
				static: true,
			}),
		[arrows, dots, className]
	);

	return (
		<div
			ref={ref}
			className={className}
			role="group"
			aria-roledescription={__("carousel", "codexa-blocks")}
			aria-label={label}
		>
			{children}
			<div className="codexa-carousel__controls" />
		</div>
	);
}

/**
 * The Arrows and Dots settings, then an add-on's (CarouselSettings), or a
 * Pro note without one.
 *
 * @param {Object}                 props             Component props.
 * @param {string}                 props.blockName   The block's name.
 * @param {Object}                 props.attributes  The block's attributes.
 * @param {Object}                 props.settings    The carousel's settings.
 * @param {(next: Object) => void} props.setSettings Saves changed settings.
 * @param {string}                 [props.proNote]   What Pro adds here, when the block offers more than the default.
 * @return {Element} The controls.
 */
export function CarouselFields({
	blockName,
	attributes,
	settings = {},
	setSettings,
	proNote,
}) {
	return (
		<>
			<ToggleControl
				__nextHasNoMarginBottom
				label={__("Arrows", "codexa-blocks")}
				help={__(
					"Buttons that move to the previous and next slide.",
					"codexa-blocks"
				)}
				checked={settings.arrows !== false}
				onChange={(arrows) => setSettings({ arrows })}
			/>
			<ToggleControl
				__nextHasNoMarginBottom
				label={__("Dots", "codexa-blocks")}
				help={__(
					"One for each slide, the items in view at once, to jump to it.",
					"codexa-blocks"
				)}
				checked={settings.dots !== false}
				onChange={(dots) => setSettings({ dots })}
			/>
			<CarouselSettingsSlot
				fillProps={{ blockName, attributes, settings, setSettings }}
			>
				{(fills) =>
					fills.length ? (
						fills
					) : (
						<ProNote
							description={
								proNote ??
								__(
									"Play the slides on their own or fade between them.",
									"codexa-blocks"
								)
							}
						/>
					)
				}
			</CarouselSettingsSlot>
		</>
	);
}
