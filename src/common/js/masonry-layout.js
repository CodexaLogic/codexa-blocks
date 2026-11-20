/**
 * Masonry placement for browsers without CSS masonry (display: grid-lanes),
 * shared by gallery-masonry.js and the editor (types/masonry.jsx) so both
 * place images alike. Where grid-lanes exists this does nothing.
 *
 * It follows grid-lanes' rule. In list order, each item goes in the shortest
 * column. Columns within about 1em of the shortest count as equal, and the
 * first in reading order wins, so items run across instead of jumping.
 *
 * Only placement happens here. The list gets "is-masonry-placed" and its
 * height, and each item its column (--codexa-masonry-column) and top
 * (--codexa-masonry-top). Widths and offsets come from the stylesheet, so
 * they follow the page's direction. Items keep their order in the page for
 * the keyboard, screen readers and the lightbox. A hidden item, such as one
 * an add-on's filter hides, takes no place.
 */

/** Class on a list this has placed. */
export const PLACED = "is-masonry-placed";

/**
 * Whether the browser lays masonry out itself.
 *
 * @param {Window} view The window the list is in (the editor's canvas is a frame).
 * @return {boolean} True when display: grid-lanes is supported.
 */
const hasGridLanes = (view) =>
	Boolean(view.CSS?.supports?.("display", "grid-lanes"));

/**
 * Places a list's items, and again whenever the list's width or an item's
 * height changes, such as a new column count, a loaded image or font, or a
 * caption being edited.
 *
 * @param {HTMLElement} list The gallery's list (.wp-block-codexa-blocks-gallery__items).
 * @return {() => void} Stops, and removes everything it set.
 */
export function layoutMasonry(list) {
	const view = list.ownerDocument.defaultView;

	if (!view || hasGridLanes(view)) {
		return () => {};
	}

	let frame = 0;

	const place = () => {
		frame = 0;

		const items = [...list.children].filter((item) => !item.hidden);

		// A hidden gallery (Hide on this device) has no width, so there's nothing to place.
		if (!items.length || list.clientWidth === 0) {
			return;
		}

		const style = view.getComputedStyle(list);
		const count = Math.max(
			1,
			Math.round(
				Number(style.getPropertyValue("--codexa-gallery-column-count"))
			) || 1
		);

		// The class first, so each item has its column's width; then every
		// height in one pass, and every position in another, so the page
		// is laid out once instead of once per item.
		list.classList.add(PLACED);

		const gap = parseFloat(style.rowGap) || 0;
		const tolerance = parseFloat(style.fontSize) || 16;
		const heights = items.map(
			(item) => item.getBoundingClientRect().height
		);
		const columns = new Array(count).fill(0);

		const positions = heights.map((height) => {
			const lowest = Math.min(...columns);
			const column = columns.findIndex(
				(top) => top <= lowest + tolerance
			);
			const top = columns[column];

			columns[column] = top + height + gap;

			return { column, top };
		});

		items.forEach((item, index) => {
			item.style.setProperty(
				"--codexa-masonry-column",
				String(positions[index].column)
			);
			item.style.setProperty(
				"--codexa-masonry-top",
				`${positions[index].top}px`
			);
		});

		list.style.setProperty(
			"--codexa-masonry-height",
			`${Math.max(0, Math.max(...columns) - gap)}px`
		);
	};

	const schedule = () => {
		if (!frame) {
			frame = view.requestAnimationFrame(place);
		}
	};

	// Watching the list catches a change of width (and so of column count);
	// watching each item catches a change of its height, including an item
	// being hidden or shown. Placing sets the list's height, which runs it
	// once more; that gives the same result, so it stops there.
	const observer = new view.ResizeObserver(schedule);

	observer.observe(list);
	[...list.children].forEach((item) => observer.observe(item));

	return () => {
		observer.disconnect();
		view.cancelAnimationFrame(frame);
		list.classList.remove(PLACED);
		list.style.removeProperty("--codexa-masonry-height");
		[...list.children].forEach((item) => {
			item.style.removeProperty("--codexa-masonry-column");
			item.style.removeProperty("--codexa-masonry-top");
		});
	};
}
