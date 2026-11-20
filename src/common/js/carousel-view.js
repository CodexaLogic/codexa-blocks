/**
 * Sets up every carousel on the page (see carousel.js). Loaded only on
 * pages with one (CodexaBlocks\Utilities\Carousel), which prints each
 * carousel's settings in data-carousel and the translated labels in
 * window.codexaBlocksCarousel.
 */
import "../scss/carousel.scss";

import { setupCarousel } from "./carousel.js";

const labels = {
	previous: "Previous slide",
	next: "Next slide",
	slide: "Slide %1$d of %2$d",
	...window.codexaBlocksCarousel,
};

document.querySelectorAll(".codexa-carousel").forEach((carousel) => {
	let options = {};

	try {
		options = JSON.parse(carousel.dataset.carousel ?? "{}") ?? {};
	} catch {
		// Unreadable settings show both.
	}

	setupCarousel(carousel, {
		arrows: options.arrows !== false,
		dots: options.dots !== false,
		labels,
	});
});
