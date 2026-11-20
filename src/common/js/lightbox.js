/**
 * The lightbox, a larger view of an image over the page, with arrows through
 * the other images of its group.
 *
 * Utilities\Lightbox loads it only where needed. A link opens in it when it
 * has the image's data attributes and sits inside a has-lightbox element,
 * which is the group (the gallery, for the Gallery block). A group of one
 * shows no arrows or counter. Images inside a hidden element, such as those
 * an add-on's filter hides, are left out. Without the script, a click opens
 * the file.
 *
 * - The viewer is the browser's <dialog>, opened with showModal(), so the
 *   page behind can't be reached and Escape closes it. Focus returns to the
 *   image that opened it.
 * - Arrow keys, the on-screen arrows or a swipe move between images
 *   (reversed on right-to-left pages), Home and End jump to the ends, and
 *   moving past the last starts again.
 * - Images load with their other sizes so the browser picks one that fits,
 *   and neighbors preload so moving is instant.
 * - Captions are plain text, never HTML.
 * - The background is the group's backdrop, its own or the site's default.
 *
 * Image data comes from Lightbox::attributes() and translated labels from
 * window.codexaBlocksLightbox. The styles are imported here, so Vite
 * builds build/assets/common/css/lightbox.css, which PHP loads with it.
 */
import "../scss/lightbox.scss";

const GROUP = ".has-lightbox";
const LINK = "a[data-lightbox-src]";

/** The background's variables (lightbox.scss), copied from the group. */
const BACKDROP = [
	"--codexa-lightbox-backdrop-color",
	"--codexa-lightbox-backdrop-opacity",
];

/** How far a finger must move sideways, in pixels, to count as a swipe. */
const SWIPE = 50;

/** The buttons' icons, a cross and chevrons pointing left and right. */
const ICONS = {
	close: "M6.4 5 5 6.4 10.6 12 5 17.6 6.4 19l5.6-5.6 5.6 5.6 1.4-1.4-5.6-5.6L19 6.4 17.6 5 12 10.6z",
	previous: "M15.4 5 8.4 12l7 7 1.4-1.4-5.6-5.6 5.6-5.6z",
	next: "m8.6 5-1.4 1.4 5.6 5.6-5.6 5.6L8.6 19l7-7z",
};

const labels = {
	dialog: "Image viewer",
	close: "Close",
	previous: "Previous image",
	next: "Next image",
	position: "%1$d of %2$d",
	...window.codexaBlocksLightbox,
};

/** The viewer's elements, built the first time it opens. */
let viewer = null;

/** The links of the group being viewed, the one showing, and the one that opened it. */
let links = [];
let index = 0;
let opener = null;

/**
 * An icon button.
 *
 * @param {string} name  "close", "previous" or "next".
 * @param {string} label Its accessible name.
 * @return {HTMLButtonElement} The button.
 */
function iconButton(name, label) {
	const button = document.createElement("button");
	const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
	const path = document.createElementNS("http://www.w3.org/2000/svg", "path");

	button.type = "button";
	button.className = `codexa-lightbox__${name}`;
	button.setAttribute("aria-label", label);
	svg.setAttribute("viewBox", "0 0 24 24");
	svg.setAttribute("aria-hidden", "true");
	svg.setAttribute("focusable", "false");
	path.setAttribute("d", ICONS[name]);
	svg.append(path);
	button.append(svg);

	return button;
}

/**
 * Whether the page reads right to left, where "next" is on the left.
 *
 * @return {boolean} True on a right-to-left page.
 */
const isRtl = () => document.documentElement.dir === "rtl";

/**
 * Builds the viewer and its controls.
 *
 * @return {Object} Its elements.
 */
function build() {
	const dialog = document.createElement("dialog");
	const stage = document.createElement("div");
	const figure = document.createElement("figure");
	const image = document.createElement("img");
	const caption = document.createElement("figcaption");
	const counter = document.createElement("p");
	const close = iconButton("close", labels.close);
	const previous = iconButton("previous", labels.previous);
	const next = iconButton("next", labels.next);

	dialog.className = "codexa-lightbox";
	dialog.setAttribute("aria-label", labels.dialog);
	stage.className = "codexa-lightbox__stage";
	figure.className = "codexa-lightbox__figure";
	image.className = "codexa-lightbox__image";
	image.decoding = "async";
	// Dragging an image would start the browser's drag and drop, not a swipe.
	image.draggable = false;
	image.sizes = "100vw";
	caption.className = "codexa-lightbox__caption";
	counter.className = "codexa-lightbox__counter";
	counter.setAttribute("aria-live", "polite");

	figure.append(image, caption);
	stage.append(figure);
	// Close comes first, so it's what has focus when the viewer opens.
	dialog.append(close, stage, previous, next, counter);
	document.body.append(dialog);

	close.addEventListener("click", () => dialog.close());
	previous.addEventListener("click", () => step(-1));
	next.addEventListener("click", () => step(1));

	// A swipe is a sideways move further than SWIPE, more sideways than down.
	// The browser follows a mouse drag with a click, which mustn't close the
	// viewer, so a swipe sets swiped until that click.
	let start = null;
	let swiped = false;

	// A click on the dark space around the image closes the viewer.
	dialog.addEventListener("click", (event) => {
		if (swiped) {
			swiped = false;
		} else if (event.target === dialog || event.target === stage) {
			dialog.close();
		}
	});

	dialog.addEventListener("keydown", (event) => {
		const forward = isRtl() ? "ArrowLeft" : "ArrowRight";
		const back = isRtl() ? "ArrowRight" : "ArrowLeft";
		const moves = { [forward]: 1, [back]: -1 };

		if (event.key in moves) {
			event.preventDefault();
			step(moves[event.key]);
		} else if (event.key === "Home" || event.key === "End") {
			event.preventDefault();
			show(event.key === "Home" ? 0 : links.length - 1);
		}
	});

	stage.addEventListener("pointerdown", (event) => {
		start = { x: event.clientX, y: event.clientY };
		swiped = false;
	});
	stage.addEventListener("pointercancel", () => {
		start = null;
	});
	stage.addEventListener("pointerup", (event) => {
		if (!start) {
			return;
		}

		const dx = event.clientX - start.x;
		const dy = event.clientY - start.y;

		start = null;

		if (Math.abs(dx) > SWIPE && Math.abs(dx) > Math.abs(dy)) {
			swiped = true;
			// Swiping left shows the next image, or the previous one right to left.
			step(dx < 0 !== isRtl() ? 1 : -1);
		}
	});

	dialog.addEventListener("close", () => {
		image.removeAttribute("src");
		image.removeAttribute("srcset");
		opener?.focus();
		opener = null;
	});

	return { dialog, image, caption, counter, previous, next };
}

/**
 * Starts loading an image in the background.
 *
 * @param {HTMLAnchorElement|undefined} link The image's link.
 */
function preload(link) {
	if (!link) {
		return;
	}

	const image = new window.Image();

	image.sizes = "100vw";
	image.srcset = link.dataset.lightboxSrcset ?? "";
	image.src = link.dataset.lightboxSrc;
}

/**
 * Shows one image of the group.
 *
 * @param {number} position Its index in the group's links.
 */
function show(position) {
	const { image, caption, counter, previous, next } = viewer;
	const link = links[position];
	const {
		lightboxSrc: src,
		lightboxSrcset: srcset = "",
		lightboxWidth: width,
		lightboxHeight: height,
		lightboxCaption: text = "",
	} = link.dataset;

	index = position;

	// The size keeps the image's space while it loads.
	if (width && height) {
		image.setAttribute("width", width);
		image.setAttribute("height", height);
	} else {
		image.removeAttribute("width");
		image.removeAttribute("height");
	}

	image.alt = link.querySelector("img")?.alt ?? "";
	image.srcset = srcset;
	image.src = src;

	caption.textContent = text;
	caption.hidden = text === "";

	const many = links.length > 1;

	previous.hidden = !many;
	next.hidden = !many;
	counter.hidden = !many;
	counter.textContent = labels.position
		.replace("%1$d", String(position + 1))
		.replace("%2$d", String(links.length));

	if (many) {
		preload(links[(position + 1) % links.length]);
		preload(links[(position - 1 + links.length) % links.length]);
	}
}

/**
 * Moves to the next or previous image, wrapping around at either end.
 * A group of one has nowhere to move.
 *
 * @param {number} direction 1 for next, -1 for previous.
 */
function step(direction) {
	if (links.length < 2) {
		return;
	}

	show((index + direction + links.length) % links.length);
}

/**
 * Gives the viewer its group's background. The viewer sits at the end of
 * the body, so it doesn't inherit the variables a gallery sets for its own
 * backdrop (Utilities\Backdrop). What the group has, its own or the site's
 * default, is copied over, and nothing set leaves the stylesheet's default.
 *
 * @param {HTMLElement} group The group the image is in.
 */
function applyBackdrop(group) {
	const styles = window.getComputedStyle(group);

	BACKDROP.forEach((variable) => {
		const value = styles.getPropertyValue(variable).trim();

		if (value) {
			viewer.dialog.style.setProperty(variable, value);
		} else {
			viewer.dialog.style.removeProperty(variable);
		}
	});
}

/**
 * Opens the viewer at an image.
 *
 * @param {HTMLAnchorElement} link The image's link.
 */
function open(link) {
	viewer ??= build();

	const group = link.closest(GROUP);

	links = [...group.querySelectorAll(LINK)].filter(
		(each) => !each.closest("[hidden]")
	);
	applyBackdrop(group);
	opener = link;
	show(links.indexOf(link));
	viewer.dialog.showModal();
}

// The links say they open a dialog.
document.querySelectorAll(`${GROUP} ${LINK}`).forEach((link) => {
	link.setAttribute("aria-haspopup", "dialog");
});

// One listener for every group. A click with a modifier key, or the
// middle button, still opens the file as the browser normally would.
document.addEventListener("click", (event) => {
	const link = event.target.closest?.(`${GROUP} ${LINK}`);

	if (
		!link ||
		event.defaultPrevented ||
		event.button !== 0 ||
		event.metaKey ||
		event.ctrlKey ||
		event.shiftKey ||
		event.altKey
	) {
		return;
	}

	event.preventDefault();
	open(link);
});
